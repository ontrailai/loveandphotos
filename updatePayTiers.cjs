#!/usr/bin/env node

/**
 * Update Pay Tiers Script
 *
 * This script distributes photographers across different pay tiers
 * based on their experience, completed jobs, and verification status
 */

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
 * Determine pay tier based on photographer attributes
 *
 * Pay Tiers:
 * 1 - Bronze: Basic listing ($150/hr)
 * 2 - Silver: Priority listing ($225/hr) - 10+ jobs
 * 3 - Gold: Top listing ($350/hr) - 25+ jobs
 * 4 - Platinum: VIP listing ($500/hr) - 50+ jobs
 */
function determinePayTier(photographer) {
  const {
    experience_years,
    completed_jobs_count,
    is_verified,
    average_rating,
    total_reviews
  } = photographer;

  // Platinum tier (4) - Elite photographers
  if (
    (completed_jobs_count >= 50 || experience_years >= 10) &&
    is_verified &&
    (average_rating >= 4.5 || !average_rating)
  ) {
    return 4;
  }

  // Gold tier (3) - Established professionals
  if (
    (completed_jobs_count >= 25 || experience_years >= 5) &&
    (is_verified || average_rating >= 4.0)
  ) {
    return 3;
  }

  // Silver tier (2) - Growing professionals
  if (
    completed_jobs_count >= 10 ||
    experience_years >= 2 ||
    (is_verified && experience_years >= 1)
  ) {
    return 2;
  }

  // Bronze tier (1) - Default/Entry level
  return 1;
}

/**
 * Update pay tiers for all photographers
 */
async function updatePayTiers() {
  console.log('🚀 Starting pay tier distribution process...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Fetch all photographers
  console.log('📊 Fetching photographers from database...');
  const { data: photographers, error: fetchError } = await supabase
    .from('photographers')
    .select('id, experience_years, completed_jobs_count, is_verified, average_rating, total_reviews');

  if (fetchError) {
    console.error('❌ Failed to fetch photographers:', fetchError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${photographers.length} photographers to update\n`);
  console.log('🔄 Distributing pay tiers...\n');

  let successCount = 0;
  let errorCount = 0;
  const tierCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const errors = [];

  // Process each photographer
  for (const photographer of photographers) {
    const payTierId = determinePayTier(photographer);
    tierCounts[payTierId]++;

    try {
      const { error } = await supabase
        .from('photographers')
        .update({ pay_tier_id: payTierId })
        .eq('id', photographer.id);

      if (error) {
        errorCount++;
        console.error(`❌ Failed to update photographer ${photographer.id}`);
        console.error(`   Error: ${error.message}`);
        errors.push({
          id: photographer.id,
          error: error.message
        });
      } else {
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`✅ Updated ${successCount} photographers...`);
        }
      }
    } catch (err) {
      errorCount++;
      console.error(`❌ Unexpected error for photographer ${photographer.id}`);
      console.error(`   Error: ${err.message}`);
      errors.push({
        id: photographer.id,
        error: err.message
      });
    }

    // Small delay to avoid rate limiting
    if (successCount % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 PAY TIER DISTRIBUTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} photographers`);
  console.log(`❌ Failed to update: ${errorCount} photographers`);
  console.log(`📊 Total processed: ${photographers.length} photographers`);

  console.log('\n📊 TIER DISTRIBUTION:');
  console.log(`   🥉 Bronze (Tier 1): ${tierCounts[1]} photographers ($150/hr)`);
  console.log(`   🥈 Silver (Tier 2): ${tierCounts[2]} photographers ($225/hr)`);
  console.log(`   🥇 Gold (Tier 3): ${tierCounts[3]} photographers ($350/hr)`);
  console.log(`   💎 Platinum (Tier 4): ${tierCounts[4]} photographers ($500/hr)`);

  // Calculate percentages
  const total = photographers.length;
  if (total > 0) {
    console.log('\n📊 TIER PERCENTAGES:');
    console.log(`   Bronze: ${((tierCounts[1] / total) * 100).toFixed(1)}%`);
    console.log(`   Silver: ${((tierCounts[2] / total) * 100).toFixed(1)}%`);
    console.log(`   Gold: ${((tierCounts[3] / total) * 100).toFixed(1)}%`);
    console.log(`   Platinum: ${((tierCounts[4] / total) * 100).toFixed(1)}%`);
  }

  // Save error details if any
  if (errors.length > 0) {
    const fs = require('fs');
    const errorLogPath = './pay_tier_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Pay tier distribution completed!');
}

// Run the update
updatePayTiers().catch(err => {
  console.error('💥 Fatal error during update:', err);
  process.exit(1);
});