#!/usr/bin/env node

/**
 * Data Verification Script
 * Verifies that the migration and seeding completed successfully
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const TARGET_PHOTOGRAPHERS = [
  'Sirena Salazar',
  'Winston Hermann',
  'Afsana Begum',
  'Meghana Kappala',
  'Andrew Henry',
  'Giovanni Flores'
];

const MIN_ADDITIONAL_REVIEWS = 5; // Each photographer should have at least 5 additional reviews

// Initialize Supabase client
let supabase;

function initSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase client initialized with service role');
}

// Verify photographer reviews
async function verifyPhotographerReviews() {
  console.log('\n🔍 Verifying photographer reviews...');

  const { data: photographers, error } = await supabase
    .from('photographers')
    .select(`
      id,
      total_reviews,
      average_rating,
      users!inner(full_name)
    `)
    .in('users.full_name', TARGET_PHOTOGRAPHERS);

  if (error) {
    throw new Error(`Failed to fetch photographers: ${error.message}`);
  }

  let allPassed = true;

  for (const photographer of photographers) {
    const name = photographer.users.full_name;
    const expectedMin = 1 + MIN_ADDITIONAL_REVIEWS; // Original 1 + 5 new minimum

    // Check seeded reviews count
    const { data: seededReviews, error: seededError } = await supabase
      .from('reviews')
      .select('id')
      .eq('photographer_id', photographer.id)
      .eq('is_seeded', true);

    if (seededError) {
      console.error(`❌ ${name}: Failed to check seeded reviews - ${seededError.message}`);
      allPassed = false;
      continue;
    }

    const passed = photographer.total_reviews >= expectedMin;
    const status = passed ? '✅' : '❌';

    console.log(`${status} ${name}:`);
    console.log(`   Total reviews: ${photographer.total_reviews} (expected ≥${expectedMin})`);
    console.log(`   Seeded reviews: ${seededReviews.length}`);
    console.log(`   Average rating: ${photographer.average_rating}`);

    if (!passed) {
      allPassed = false;
    }
  }

  return allPassed;
}

// Verify location data completeness
async function verifyLocationData() {
  console.log('\n🗺️  Verifying location data...');

  // Check photographer_preview_profiles for empty/null city or state
  const { data: emptyLocations, error } = await supabase
    .from('photographer_preview_profiles')
    .select('id, display_name, location_city, location_state')
    .or('location_city.is.null,location_city.eq.,location_state.is.null,location_state.eq.');

  if (error) {
    throw new Error(`Failed to check location data: ${error.message}`);
  }

  if (emptyLocations.length === 0) {
    console.log('✅ All location data is complete - no NULL or empty values found');
    return true;
  } else {
    console.log(`❌ Found ${emptyLocations.length} records with missing location data:`);
    emptyLocations.forEach(record => {
      console.log(`   - ${record.display_name}: city='${record.location_city}', state='${record.location_state}'`);
    });
    return false;
  }
}

// Verify database constraints
async function verifyConstraints() {
  console.log('\n🔒 Verifying database constraints...');

  try {
    // Test that is_seeded column exists and has proper default
    const { error: reviewsError } = await supabase
      .from('reviews')
      .select('is_seeded')
      .limit(1);

    if (reviewsError) {
      console.log('❌ is_seeded column missing or inaccessible');
      return false;
    }

    // Test that location constraints prevent empty strings (this should fail)
    const testId = 'test-' + Date.now();
    const { error: constraintError } = await supabase
      .from('photographer_preview_profiles')
      .insert({
        id: testId,
        display_name: 'Test Profile',
        contact_email: 'test@example.com',
        location_city: '', // This should fail due to CHECK constraint
        location_state: 'CA'
      });

    if (constraintError && constraintError.message.includes('check_location_city_not_empty')) {
      console.log('✅ Location constraints are working (empty string rejected)');
      return true;
    } else if (!constraintError) {
      // Clean up the test record if it was inserted
      await supabase
        .from('photographer_preview_profiles')
        .delete()
        .eq('id', testId);

      console.log('❌ Location constraints not working (empty string was allowed)');
      return false;
    } else {
      console.log(`❌ Unexpected error testing constraints: ${constraintError.message}`);
      return false;
    }

  } catch (error) {
    console.log(`❌ Error verifying constraints: ${error.message}`);
    return false;
  }
}

// Generate summary report
async function generateSummaryReport() {
  console.log('\n📊 Summary Report:');

  // Total reviews with seeded flag
  const { data: seededStats } = await supabase
    .from('reviews')
    .select('is_seeded')
    .eq('is_seeded', true);

  const totalSeeded = seededStats ? seededStats.length : 0;

  // Total photographers with reviews
  const { data: photographerStats } = await supabase
    .from('photographers')
    .select('total_reviews')
    .gt('total_reviews', 0);

  const totalWithReviews = photographerStats ? photographerStats.length : 0;
  const totalReviews = photographerStats ?
    photographerStats.reduce((sum, p) => sum + p.total_reviews, 0) : 0;

  // Location data completeness
  const { data: locationStats } = await supabase
    .from('photographer_preview_profiles')
    .select('id')
    .not('location_city', 'eq', 'Unknown')
    .not('location_state', 'eq', 'Unknown');

  const realLocations = locationStats ? locationStats.length : 0;

  console.log(`   📝 Total seeded reviews: ${totalSeeded}`);
  console.log(`   👥 Photographers with reviews: ${totalWithReviews}`);
  console.log(`   ⭐ Total reviews system-wide: ${totalReviews}`);
  console.log(`   🗺️  Profiles with real location data: ${realLocations}`);
}

// Main verification function
async function main() {
  try {
    console.log('🔍 Starting data verification...');

    initSupabase();

    // Run all verifications
    const reviewsPass = await verifyPhotographerReviews();
    const locationPass = await verifyLocationData();
    const constraintsPass = await verifyConstraints();

    await generateSummaryReport();

    // Final result
    const allPass = reviewsPass && locationPass && constraintsPass;

    console.log('\n' + '='.repeat(50));
    if (allPass) {
      console.log('✅ ALL VERIFICATIONS PASSED!');
      console.log('The migration and seeding completed successfully.');
    } else {
      console.log('❌ SOME VERIFICATIONS FAILED!');
      console.log('Please review the issues above and re-run the migration/seeding.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };