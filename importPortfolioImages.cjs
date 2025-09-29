#!/usr/bin/env node

/**
 * Import Portfolio Images Script
 *
 * This script reads portfolio_images from import_photographers.csv
 * and imports them into the portfolio_items table
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
 * Parse portfolio images from CSV format
 */
function parsePortfolioImages(portfolioStr) {
  if (!portfolioStr || portfolioStr === '' || portfolioStr === 'null') {
    return [];
  }

  // Handle PostgreSQL array format: ["url1", "url2"]
  if (portfolioStr.startsWith('[') && portfolioStr.endsWith(']')) {
    try {
      return JSON.parse(portfolioStr);
    } catch (e) {
      // If JSON parse fails, try manual parsing
      const cleaned = portfolioStr.slice(1, -1);
      if (cleaned === '') return [];
      // Split by comma but respect quoted strings
      const images = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        if (char === '"' && (i === 0 || cleaned[i-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          if (current.trim()) {
            images.push(current.trim().replace(/^"|"$/g, ''));
          }
          current = '';
        } else {
          current += char;
        }
      }
      if (current.trim()) {
        images.push(current.trim().replace(/^"|"$/g, ''));
      }
      return images;
    }
  }

  // Handle comma-separated format
  return portfolioStr.split(',').map(s => s.trim());
}

/**
 * Determine category based on image URL or index
 */
function determineCategory(index, total) {
  // Assign categories based on position
  if (index === 0) return 'featured';
  if (index < total * 0.3) return 'wedding';
  if (index < total * 0.5) return 'portrait';
  if (index < total * 0.7) return 'event';
  return 'lifestyle';
}

/**
 * Generate tags based on category
 */
function generateTags(category) {
  const tagMap = {
    'featured': ['featured', 'best work', 'portfolio'],
    'wedding': ['wedding', 'ceremony', 'bride', 'groom', 'love'],
    'portrait': ['portrait', 'headshot', 'professional', 'individual'],
    'event': ['event', 'party', 'celebration', 'gathering'],
    'lifestyle': ['lifestyle', 'candid', 'natural', 'outdoor', 'family']
  };

  return tagMap[category] || ['photography'];
}

/**
 * Import portfolio images to portfolio_items table
 */
async function importPortfolioImages() {
  console.log('🚀 Starting portfolio images import process...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const csvFilePath = './import_photographers.csv';

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: CSV file not found at ${csvFilePath}`);
    process.exit(1);
  }

  // First, get photographer IDs mapping
  console.log('📊 Fetching photographer IDs from database...');
  const { data: photographers, error: fetchError } = await supabase
    .from('photographers')
    .select('id, user_id');

  if (fetchError) {
    console.error('❌ Failed to fetch photographers:', fetchError.message);
    process.exit(1);
  }

  // Get user email to photographer ID mapping
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, email, role');

  if (userError) {
    console.error('❌ Failed to fetch users:', userError.message);
    process.exit(1);
  }

  // Create email to photographer_id mapping
  const emailToPhotographerId = {};
  users?.forEach(user => {
    const photographer = photographers?.find(p => p.user_id === user.id);
    if (photographer && user.email) {
      emailToPhotographerId[user.email.toLowerCase()] = photographer.id;
    }
  });

  console.log(`✅ Found ${Object.keys(emailToPhotographerId).length} photographers with IDs\n`);

  const portfolioItems = [];
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
  console.log('📊 Reading CSV file...\n');
  for await (const row of parser) {
    const photographerId = emailToPhotographerId[row.contact_email?.toLowerCase()];

    if (!photographerId) {
      skippedCount++;
      console.log(`⏭️  Skipped: ${row.display_name} - No photographer ID found`);
      continue;
    }

    const images = parsePortfolioImages(row.portfolio_images);

    if (images.length === 0) {
      console.log(`⏭️  Skipped: ${row.display_name} - No portfolio images`);
      continue;
    }

    // Create portfolio items for each image
    images.forEach((imageUrl, index) => {
      const category = determineCategory(index, images.length);
      portfolioItems.push({
        photographer_id: photographerId,
        title: `${row.display_name} - ${category} ${index + 1}`,
        description: `Professional ${category} photography by ${row.display_name}`,
        image_url: imageUrl,
        thumbnail_url: imageUrl, // Using same URL for now
        category: category,
        tags: generateTags(category),
        is_featured: index === 0, // First image is featured
        order_index: index,
        metadata: {
          photographer_name: row.display_name,
          original_index: index,
          import_date: new Date().toISOString()
        }
      });
    });
  }

  console.log(`📊 Found ${portfolioItems.length} portfolio images to import from ${Object.keys(emailToPhotographerId).length} photographers\n`);
  console.log('🔄 Importing portfolio items...\n');

  // Process imports in batches
  const batchSize = 50;
  for (let i = 0; i < portfolioItems.length; i += batchSize) {
    const batch = portfolioItems.slice(i, Math.min(i + batchSize, portfolioItems.length));

    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .insert(batch)
        .select();

      if (error) {
        errorCount += batch.length;
        console.error(`❌ Batch import failed:`, error.message);
        errors.push({
          batch: `${i}-${i + batch.length}`,
          error: error.message
        });
      } else {
        successCount += batch.length;
        console.log(`✅ Imported batch ${i / batchSize + 1}: ${batch.length} items`);
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      errorCount += batch.length;
      console.error(`❌ Unexpected error in batch:`, err.message);
      errors.push({
        batch: `${i}-${i + batch.length}`,
        error: err.message
      });
    }

    // Progress update
    if ((i + batchSize) % 200 === 0 || i + batchSize >= portfolioItems.length) {
      console.log(`\n📊 Progress: ${Math.min(i + batchSize, portfolioItems.length)}/${portfolioItems.length} processed\n`);
    }
  }

  // Also update the portfolio_images column in photographer_preview_profiles
  console.log('\n🔄 Updating photographer_preview_profiles with portfolio URLs...\n');

  // Parse CSV again to update photographer_preview_profiles
  const parser2 = fs
    .createReadStream(csvFilePath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  let profileUpdateCount = 0;
  for await (const row of parser2) {
    const images = parsePortfolioImages(row.portfolio_images);

    if (images.length > 0) {
      const { error } = await supabase
        .from('photographer_preview_profiles')
        .update({ portfolio_images: images.slice(0, 4) }) // Store first 4 images for preview
        .eq('contact_email', row.contact_email);

      if (!error) {
        profileUpdateCount++;
      }
    }
  }

  console.log(`✅ Updated ${profileUpdateCount} photographer preview profiles with portfolio URLs`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 PORTFOLIO IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount} portfolio items`);
  console.log(`⏭️  Skipped (no photographer): ${skippedCount} records`);
  console.log(`❌ Failed to import: ${errorCount} items`);
  console.log(`📊 Total processed: ${portfolioItems.length} portfolio items`);
  console.log(`🖼️  Preview profiles updated: ${profileUpdateCount} photographers`);

  // Save error details if any
  if (errors.length > 0) {
    const errorLogPath = './portfolio_import_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Portfolio images import completed!');
}

// Run the import
importPortfolioImages().catch(err => {
  console.error('💥 Fatal error during import:', err);
  process.exit(1);
});