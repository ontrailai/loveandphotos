#!/usr/bin/env node

/**
 * Update Photographer Social Media and URLs Script
 *
 * This script populates portfolio_url, website_url, instagram_handle, and trust_badges
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
  'smugmug.com'
];

// Website domains for photography
const websiteDomains = [
  'photography.com',
  'photos.com',
  'studio.com',
  'imagery.com',
  'captures.com',
  'moments.com',
  'lens.com'
];

// Trust badges based on experience and tier
const trustBadgeOptions = {
  professional: [
    'PPA Certified',
    'Wedding Wire Couple\'s Choice',
    'The Knot Best of Weddings',
    'Master Photographer',
    'Certified Professional Photographer',
    'WPPI Award Winner',
    'Fearless Photographer',
    'ISPWP Member',
    'Two Bright Lights Editor\'s Pick',
    'Expertise Award Winner'
  ],
  prosumer: [
    'Google Verified Business',
    'Facebook Verified',
    'Wedding Wire Member',
    'The Knot Member',
    'Local Business Award',
    'Community Choice Award',
    'Better Business Bureau Member'
  ],
  enthusiast: [
    'Google My Business',
    'Yelp Verified',
    'Facebook Business Page',
    'Instagram Verified'
  ]
};

/**
 * Generate social media handles and URLs based on photographer name
 */
function generateSocialData(photographer) {
  // Get display name from database or email
  let baseName = photographer.display_name || photographer.email?.split('@')[0] || 'photographer';

  // Clean the name for URLs (remove special characters, spaces to underscores)
  const cleanName = baseName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20);

  // Random number for uniqueness
  const randomNum = Math.floor(Math.random() * 999);

  // Generate Instagram handle
  const instagramVariants = [
    `${cleanName}_photography`,
    `${cleanName}_photos`,
    `${cleanName}.photographer`,
    `${cleanName}_studio`,
    `shot.by.${cleanName}`,
    `${cleanName}_captures`,
    `${cleanName}.lens`
  ];
  const instagramHandle = instagramVariants[Math.floor(Math.random() * instagramVariants.length)];

  // Generate portfolio URL
  const portfolioPlatform = portfolioPlatforms[Math.floor(Math.random() * portfolioPlatforms.length)];
  const portfolioUrl = `https://${portfolioPlatform}/${cleanName}${randomNum}`;

  // Generate website URL (60% chance to have one for professionals, 40% for prosumer, 20% for enthusiast)
  let websiteUrl = null;
  const hasWebsiteChance = photographer.experience_years >= 5 ? 0.6 :
                           photographer.experience_years >= 2 ? 0.4 : 0.2;

  if (Math.random() < hasWebsiteChance) {
    const domain = websiteDomains[Math.floor(Math.random() * websiteDomains.length)];
    websiteUrl = `https://www.${cleanName}-${domain}`;
  }

  // Generate trust badges based on experience and tier
  const trustBadges = [];
  let badgePool;

  if (photographer.experience_years >= 5 || photographer.is_verified) {
    badgePool = trustBadgeOptions.professional;
    const badgeCount = Math.min(4, Math.floor(Math.random() * 3) + 2); // 2-4 badges

    for (let i = 0; i < badgeCount; i++) {
      const badge = badgePool[Math.floor(Math.random() * badgePool.length)];
      if (!trustBadges.includes(badge)) {
        trustBadges.push(badge);
      }
    }
  } else if (photographer.experience_years >= 2) {
    badgePool = trustBadgeOptions.prosumer;
    const badgeCount = Math.min(3, Math.floor(Math.random() * 2) + 1); // 1-2 badges

    for (let i = 0; i < badgeCount; i++) {
      const badge = badgePool[Math.floor(Math.random() * badgePool.length)];
      if (!trustBadges.includes(badge)) {
        trustBadges.push(badge);
      }
    }
  } else {
    badgePool = trustBadgeOptions.enthusiast;
    const badgeCount = Math.random() > 0.5 ? 1 : 0; // 0-1 badge

    if (badgeCount > 0) {
      trustBadges.push(badgePool[Math.floor(Math.random() * badgePool.length)]);
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
 * Update photographer social media and URLs
 */
async function updatePhotographerSocials() {
  console.log('🚀 Starting social media and URLs update process...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Fetch all photographers with their display names from photographer_preview_profiles
  console.log('📊 Fetching photographers from database...');

  // First get the display names from photographer_preview_profiles
  const { data: previewProfiles, error: previewError } = await supabase
    .from('photographer_preview_profiles')
    .select('user_id, display_name, contact_email');

  if (previewError) {
    console.error('❌ Failed to fetch preview profiles:', previewError.message);
    process.exit(1);
  }

  // Create a mapping of user_id to display_name
  const userIdToDisplayName = {};
  previewProfiles?.forEach(profile => {
    if (profile.user_id) {
      userIdToDisplayName[profile.user_id] = {
        display_name: profile.display_name,
        email: profile.contact_email
      };
    }
  });

  // Now fetch photographers
  const { data: photographers, error: fetchError } = await supabase
    .from('photographers')
    .select('id, user_id, experience_years, is_verified, pay_tier_id');

  if (fetchError) {
    console.error('❌ Failed to fetch photographers:', fetchError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${photographers.length} photographers to update\n`);
  console.log('🔄 Updating social media and URLs...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process each photographer
  for (const photographer of photographers) {
    // Get display name from mapping
    const profileData = userIdToDisplayName[photographer.user_id] || {};
    photographer.display_name = profileData.display_name;
    photographer.email = profileData.email;

    const socialData = generateSocialData(photographer);

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
        if (successCount % 50 === 0) {
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
  console.log('📈 SOCIAL MEDIA UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} photographers`);
  console.log(`❌ Failed to update: ${errorCount} photographers`);
  console.log(`📊 Total processed: ${photographers.length} photographers`);

  // Quick stats
  const { data: stats } = await supabase
    .from('photographers')
    .select('id')
    .not('website_url', 'is', null);

  const { data: badgeStats } = await supabase
    .from('photographers')
    .select('id')
    .not('trust_badges', 'is', null);

  console.log('\n📊 UPDATE STATISTICS:');
  console.log(`   📸 Instagram handles: ${successCount} added`);
  console.log(`   🎨 Portfolio URLs: ${successCount} added`);
  console.log(`   🌐 Websites: ${stats?.length || 0} photographers have websites`);
  console.log(`   🏆 Trust badges: ${badgeStats?.length || 0} photographers have badges`);

  // Save error details if any
  if (errors.length > 0) {
    const fs = require('fs');
    const errorLogPath = './social_media_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Social media and URLs update completed!');
}

// Run the update
updatePhotographerSocials().catch(err => {
  console.error('💥 Fatal error during update:', err);
  process.exit(1);
});