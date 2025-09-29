#!/usr/bin/env node

/**
 * Fix Empty Website URLs Script
 *
 * This script populates all remaining empty website_url fields
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

// Website domains and TLDs
const websiteDomains = [
  'photography',
  'photos',
  'studio',
  'imagery',
  'captures',
  'moments',
  'lens',
  'visuals',
  'creative',
  'artistry',
  'weddings',
  'portraits',
  'media'
];

const tlds = ['.com', '.net', '.co', '.studio', '.photography', '.photos', '.art'];

/**
 * Generate unique website URL
 */
function generateWebsiteUrl(instagram_handle, id, index) {
  // Try to use Instagram handle as base if available
  let baseName;
  if (instagram_handle) {
    // Clean Instagram handle to use as website name
    baseName = instagram_handle
      .replace('@', '')
      .replace(/[._]/g, '-')
      .replace(/photography|photos|studio|captures|lens|visuals/gi, '')
      .trim();
  } else {
    // Use ID-based name as fallback
    baseName = `photo-pro-${index + 2000}`;
  }

  // Ensure base name is clean
  baseName = baseName.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  if (!baseName || baseName.length < 3) {
    baseName = `photographer-${index + 2000}`;
  }

  // Select domain and TLD
  const domain = websiteDomains[Math.floor(Math.random() * websiteDomains.length)];
  const tld = tlds[Math.floor(Math.random() * tlds.length)];

  // Create website URL variants
  const variants = [
    `https://www.${baseName}-${domain}${tld}`,
    `https://www.${baseName}${tld}`,
    `https://${baseName}-${domain}${tld}`,
    `https://www.${domain}-by-${baseName}.com`,
    `https://www.${baseName}-creative${tld}`
  ];

  return variants[Math.floor(Math.random() * variants.length)];
}

/**
 * Fix empty website URLs
 */
async function fixEmptyWebsites() {
  console.log('🚀 Starting empty website URLs fix...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Fetch photographers with empty website_url
  console.log('📊 Finding photographers without websites...');

  const { data: photographers, error: fetchError } = await supabase
    .from('photographers')
    .select('id, website_url, instagram_handle')
    .is('website_url', null);

  if (fetchError) {
    console.error('❌ Failed to fetch photographers:', fetchError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${photographers.length} photographers without websites\n`);

  if (photographers.length === 0) {
    console.log('✨ All photographers already have websites!');
    return;
  }

  console.log('🔄 Generating and updating website URLs...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process each photographer
  for (let i = 0; i < photographers.length; i++) {
    const photographer = photographers[i];
    const websiteUrl = generateWebsiteUrl(photographer.instagram_handle, photographer.id, i);

    try {
      const { error } = await supabase
        .from('photographers')
        .update({ website_url: websiteUrl })
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
    if (i % 100 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 WEBSITE URL FIX SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully added websites: ${successCount} photographers`);
  console.log(`❌ Failed to update: ${errorCount} photographers`);
  console.log(`📊 Total processed: ${photographers.length} photographers`);

  // Verify final state
  const { data: finalCheck } = await supabase
    .from('photographers')
    .select('id')
    .is('website_url', null);

  console.log(`\n📊 Remaining without websites: ${finalCheck?.length || 0}`);

  // Save error details if any
  if (errors.length > 0) {
    const fs = require('fs');
    const errorLogPath = './website_url_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Website URL fix completed!');
}

// Run the fix
fixEmptyWebsites().catch(err => {
  console.error('💥 Fatal error during fix:', err);
  process.exit(1);
});