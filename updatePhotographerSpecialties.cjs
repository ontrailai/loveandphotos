#!/usr/bin/env node

/**
 * Update Photographer Specialties Script
 *
 * This script reads specialties from import_photographers.csv
 * and updates the photographer_preview_profiles table
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
 * Parse and clean specialties from CSV format
 */
function parseSpecialties(specialtiesStr) {
  if (!specialtiesStr || specialtiesStr === '' || specialtiesStr === 'null') {
    // Default specialties if none provided
    return ['wedding', 'portrait', 'event'];
  }

  // Handle PostgreSQL array format: ["item1", "item2"]
  if (specialtiesStr.startsWith('[') && specialtiesStr.endsWith(']')) {
    try {
      return JSON.parse(specialtiesStr);
    } catch (e) {
      // If JSON parse fails, try manual parsing
      const cleaned = specialtiesStr.slice(1, -1);
      if (cleaned === '') return ['wedding', 'portrait'];
      return cleaned.split('","').map(s => s.replace(/^"|"$/g, '').trim());
    }
  }

  // Convert common specialty patterns
  const specialtyMap = {
    'portrait': ['portrait', 'headshot', 'family'],
    'wedding': ['wedding', 'engagement', 'bridal'],
    'event': ['event', 'corporate', 'party'],
    'events': ['event', 'corporate', 'party'],
    'family': ['family', 'maternity', 'newborn'],
    'commercial': ['commercial', 'product', 'brand'],
    'landscape': ['landscape', 'nature', 'travel'],
    'fashion': ['fashion', 'editorial', 'beauty'],
    'sports': ['sports', 'action', 'fitness'],
    'real estate': ['real estate', 'architecture', 'interior'],
    'food': ['food', 'restaurant', 'culinary'],
    'documentary': ['documentary', 'photojournalism', 'street']
  };

  // Clean and normalize the input
  const cleaned = specialtiesStr.toLowerCase().trim();

  // Check if it matches known specialty patterns
  for (const [key, values] of Object.entries(specialtyMap)) {
    if (cleaned.includes(key)) {
      return values;
    }
  }

  // Default for wedding photographers (most common in the data)
  if (cleaned.includes('wedding') || cleaned.includes('available')) {
    return ['wedding', 'engagement', 'portrait'];
  }

  // Default fallback
  return ['portrait', 'event', 'lifestyle'];
}

/**
 * Update specialties in photographer_preview_profiles
 */
async function updateSpecialties() {
  console.log('🚀 Starting specialties update process...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const csvFilePath = './import_photographers.csv';

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: CSV file not found at ${csvFilePath}`);
    process.exit(1);
  }

  const updates = [];
  let successCount = 0;
  let errorCount = 0;
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
    const specialties = parseSpecialties(row.specialties);
    updates.push({
      email: row.contact_email,
      display_name: row.display_name,
      specialties: specialties
    });
  }

  console.log(`📊 Found ${updates.length} photographers to update\n`);
  console.log('🔄 Updating specialties...\n');

  // Process updates in batches
  const batchSize = 50;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, Math.min(i + batchSize, updates.length));

    try {
      // Update each photographer in the batch
      for (const update of batch) {
        const { data, error } = await supabase
          .from('photographer_preview_profiles')
          .update({ specialties: update.specialties })
          .eq('contact_email', update.email);

        if (error) {
          errorCount++;
          console.error(`❌ Failed to update: ${update.display_name} (${update.email})`);
          console.error(`   Error: ${error.message}`);
          errors.push({
            name: update.display_name,
            email: update.email,
            error: error.message
          });
        } else {
          successCount++;
          console.log(`✅ Updated specialties for: ${update.display_name} - ${update.specialties.join(', ')}`);
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`❌ Batch error:`, err.message);
      errorCount += batch.length;
    }

    // Progress update
    if ((i + batchSize) % 200 === 0 || i + batchSize >= updates.length) {
      console.log(`\n📊 Progress: ${Math.min(i + batchSize, updates.length)}/${updates.length} processed\n`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 SPECIALTIES UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} photographers`);
  console.log(`❌ Failed to update: ${errorCount} photographers`);
  console.log(`📊 Total processed: ${updates.length} photographers`);

  // Save error details if any
  if (errors.length > 0) {
    const errorLogPath = './specialties_update_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Specialties update completed!');
}

// Run the update
updateSpecialties().catch(err => {
  console.error('💥 Fatal error during update:', err);
  process.exit(1);
});