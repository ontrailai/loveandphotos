#!/usr/bin/env node

/**
 * Import Photographers Script for Supabase
 *
 * This script imports photographer profiles from import_photographers.csv
 * into the photographers table, matching them with existing users in auth.users
 */

const fs = require('fs');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://ldxscjxoakqrmkgqwwhr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeHNjanhvYWtxcm1rZ3F3d2hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ2Nzc0OCwiZXhwIjoyMDczMDQzNzQ4fQ.jnnrsLJeB6B43_N-aaMIbn-9dyaOgQYtIIq308yOVI8';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Parse array strings from CSV
 */
function parseArrayString(str) {
  if (!str || str === '' || str === 'null') return null;

  // Handle PostgreSQL array format: ["item1", "item2"]
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      return JSON.parse(str);
    } catch (e) {
      // If JSON parse fails, try manual parsing
      const cleaned = str.slice(1, -1); // Remove [ and ]
      if (cleaned === '') return [];
      return cleaned.split('","').map(s => s.replace(/^"|"$/g, ''));
    }
  }

  // Handle comma-separated format
  return str.split(',').map(s => s.trim());
}

/**
 * Import photographers from CSV
 */
async function importPhotographers() {
  console.log('🚀 Starting photographer import process...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const csvFilePath = './import_photographers.csv';

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: CSV file not found at ${csvFilePath}`);
    process.exit(1);
  }

  // First, get all users to match emails
  console.log('📊 Fetching existing users from auth.users...');
  const { data: authUsers, error: userError } = await supabase
    .from('auth.users')
    .select('id, email')
    .eq('raw_user_meta_data->>role', 'photographer');

  if (userError) {
    console.error('❌ Failed to fetch users:', userError.message);
    process.exit(1);
  }

  // Create email to user_id mapping
  const emailToUserId = {};
  authUsers?.forEach(user => {
    if (user.email) {
      emailToUserId[user.email.toLowerCase()] = user.id;
    }
  });

  console.log(`✅ Found ${Object.keys(emailToUserId).length} photographer users in auth.users\n`);

  const photographers = [];
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors = [];

  // Parse CSV file
  const parser = fs
    .createReadStream(csvFilePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  // Collect all photographers from CSV
  for await (const row of parser) {
    photographers.push(row);
  }

  console.log(`📊 Found ${photographers.length} photographers in CSV\n`);
  console.log('🔄 Processing photographers...\n');

  // Process each photographer
  for (const photographer of photographers) {
    try {
      // Find matching user_id from email
      const userId = emailToUserId[photographer.contact_email?.toLowerCase()];

      if (!userId) {
        skippedCount++;
        console.log(`⏭️  Skipped: ${photographer.display_name} - No matching user found for email: ${photographer.contact_email}`);
        continue;
      }

      // Prepare photographer data
      const photographerData = {
        id: photographer.id, // Use the UUID from CSV
        user_id: userId, // Link to auth.users
        bio: photographer.bio || null,
        languages: parseArrayString(photographer.languages),
        specialties: parseArrayString(photographer.specialties),
        experience_years: photographer.years_experience ? parseInt(photographer.years_experience) : null,
        is_public: photographer.is_available === 'TRUE' || photographer.is_available === true,
        is_verified: photographer.is_verified === 'TRUE' || photographer.is_verified === true,
        average_rating: photographer.average_rating ? parseFloat(photographer.average_rating) : null,
        total_reviews: photographer.total_reviews ? parseInt(photographer.total_reviews) : 0,
        completed_jobs_count: photographer.total_bookings ? parseInt(photographer.total_bookings) : 0,
        onboarding_completed: true, // Set as completed since they have profiles
        onboarding_step: 5, // Max step
        response_time_hours: 24, // Default to 24 hours
        travel_radius_miles: 50, // Default to 50 miles
        created_at: photographer.created_at || new Date().toISOString(),
        updated_at: photographer.updated_at || new Date().toISOString()
      };

      // Insert into photographers table
      const { data, error } = await supabase
        .from('photographers')
        .upsert(photographerData, {
          onConflict: 'user_id', // Update if user_id already exists
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        errorCount++;
        console.error(`❌ Failed to import photographer: ${photographer.display_name}`);
        console.error(`   Error: ${error.message}`);
        errors.push({
          name: photographer.display_name,
          email: photographer.contact_email,
          error: error.message
        });
      } else {
        successCount++;
        console.log(`✅ Successfully imported photographer: ${photographer.display_name} (${photographer.contact_email})`);
      }
    } catch (err) {
      errorCount++;
      console.error(`❌ Unexpected error for photographer: ${photographer.display_name}`);
      console.error(`   Error: ${err.message}`);
      errors.push({
        name: photographer.display_name,
        email: photographer.contact_email,
        error: err.message
      });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 PHOTOGRAPHER IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount} photographers`);
  console.log(`⏭️  Skipped (no user match): ${skippedCount} photographers`);
  console.log(`❌ Failed to import: ${errorCount} photographers`);
  console.log(`📊 Total processed: ${photographers.length} photographers`);

  // Save error details if any
  if (errors.length > 0) {
    const errorLogPath = './photographer_import_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  // If many were skipped due to no user match, suggest creating users first
  if (skippedCount > 10) {
    console.log('\n💡 Tip: Many photographers were skipped because no matching user exists.');
    console.log('   Make sure to run the user import script first to create auth.users entries.');
  }

  console.log('\n✨ Photographer import process completed!');
}

// Run the import
importPhotographers().catch(err => {
  console.error('💥 Fatal error during import:', err);
  process.exit(1);
});