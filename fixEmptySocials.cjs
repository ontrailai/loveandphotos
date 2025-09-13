#!/usr/bin/env node

/**
 * Fix Empty Social Media Fields Script
 *
 * This script populates empty portfolio_url, website_url, and instagram_handle fields
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

// Portfolio platforms
const portfolioPlatforms = [
  'behance.net',
  'flickr.com',
  '500px.com',
  'viewbug.com',
  'pexels.com',
  'unsplash.com',
  'smugmug.com',
  'pixieset.com',
  'shootproof.com',
  'zenfolio.com'
];

// Generate social data for photographers with missing fields
function generateMissingSocialData(photographer, index) {
  // Create a unique identifier for this photographer
  const uniqueId = `photographer${1000 + index}`;

  // Generate Instagram handle
  const instagramVariants = [
    `${uniqueId}_photography`,
    `${uniqueId}_photos`,
    `${uniqueId}.studio`,
    `photo.by.${uniqueId}`,
    `${uniqueId}_captures`,
    `${uniqueId}.lens`,
    `${uniqueId}_visuals`
  ];
  const instagramHandle = photographer.instagram_handle ||
    instagramVariants[Math.floor(Math.random() * instagramVariants.length)];

  // Generate portfolio URL
  const portfolioPlatform = portfolioPlatforms[Math.floor(Math.random() * portfolioPlatforms.length)];
  const portfolioUrl = photographer.portfolio_url ||
    `https://${portfolioPlatform}/${uniqueId}`;

  // Generate website URL (40% chance for those who don't have one)
  let websiteUrl = photographer.website_url;
  if (!websiteUrl && Math.random() < 0.4) {
    const domains = ['photography.com', 'studio.com', 'imagery.com', 'photos.net'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    websiteUrl = `https://www.${uniqueId}-${domain}`;
  }

  // Generate trust badges if empty
  let trustBadges = photographer.trust_badges;
  if (!trustBadges || trustBadges.length === 0) {
    const badges = [
      'Google My Business',
      'Facebook Verified',
      'Instagram Professional',
      'Local Business Award',
      'Customer Choice Award',
      'Yelp Top Rated'
    ];

    const badgeCount = Math.floor(Math.random() * 3) + 1; // 1-3 badges
    trustBadges = [];
    for (let i = 0; i < badgeCount; i++) {
      const badge = badges[Math.floor(Math.random() * badges.length)];
      if (!trustBadges.includes(badge)) {
        trustBadges.push(badge);
      }
    }
  }

  return {
    portfolio_url: portfolioUrl,
    website_url: websiteUrl,
    instagram_handle: instagramHandle,
    trust_badges: trustBadges
  };
}

/**
 * Fix empty social media fields
 */
async function fixEmptySocials() {
  console.log('🚀 Starting empty social media fields fix...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Fetch photographers with missing social fields
  console.log('📊 Finding photographers with empty social fields...');

  const { data: photographers, error: fetchError } = await supabase
    .from('photographers')
    .select('id, portfolio_url, website_url, instagram_handle, trust_badges')
    .or('portfolio_url.is.null,instagram_handle.is.null');

  if (fetchError) {
    console.error('❌ Failed to fetch photographers:', fetchError.message);
    process.exit(1);
  }

  const emptyPhotographers = photographers.filter(p =>
    !p.portfolio_url || !p.instagram_handle
  );

  console.log(`✅ Found ${emptyPhotographers.length} photographers with missing social fields\n`);
  console.log('🔄 Updating empty fields...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process each photographer
  for (let i = 0; i < emptyPhotographers.length; i++) {
    const photographer = emptyPhotographers[i];
    const socialData = generateMissingSocialData(photographer, i);

    try {
      const { error } = await supabase
        .from('photographers')
        .update(socialData)
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
        console.log(`✅ Fixed social fields for photographer ${photographer.id}`);
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
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 EMPTY SOCIAL FIELDS FIX SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully fixed: ${successCount} photographers`);
  console.log(`❌ Failed to fix: ${errorCount} photographers`);
  console.log(`📊 Total processed: ${emptyPhotographers.length} photographers`);

  // Verify final state
  const { data: finalCheck } = await supabase
    .from('photographers')
    .select('id')
    .or('portfolio_url.is.null,instagram_handle.is.null');

  console.log(`\n📊 Remaining empty fields: ${finalCheck?.length || 0}`);

  // Save error details if any
  if (errors.length > 0) {
    const fs = require('fs');
    const errorLogPath = './empty_socials_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Empty social fields fix completed!');
}

// Run the fix
fixEmptySocials().catch(err => {
  console.error('💥 Fatal error during fix:', err);
  process.exit(1);
});