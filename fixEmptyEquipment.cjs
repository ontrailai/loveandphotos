#!/usr/bin/env node

/**
 * Fix Empty Equipment Lists Script
 *
 * This script updates photographers with empty equipment_list arrays
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

// Default equipment sets based on experience level
const defaultEquipment = {
  professional: [
    'Canon EOS R5',
    '24-70mm f/2.8',
    '70-200mm f/2.8',
    '50mm f/1.4',
    '85mm f/1.4',
    'Profoto B10 Plus Flash',
    'Godox V1 Speedlight',
    'Softbox 3x4ft',
    'Gitzo Carbon Fiber Tripod',
    'Peak Design Camera Strap',
    'Think Tank Photo Backpack',
    'SanDisk 128GB CFexpress Cards (x6)',
    'Extra Batteries (x4)',
    'Lens Filters (CPL, ND, UV)',
    'Backup Camera Body',
    'Portable SSD 2TB'
  ],
  prosumer: [
    'Canon EOS R7',
    '24-70mm f/4',
    '70-200mm f/4',
    '50mm f/1.8',
    'Godox V860III Speedlight',
    'Softbox 24x36"',
    'LED Panel Light',
    'Manfrotto Tripod',
    'Peak Design Everyday Backpack',
    'SanDisk 64GB SD Cards (x4)',
    'Extra Batteries (x2)',
    'Lens Filters Set',
    'External Hard Drive 1TB'
  ],
  enthusiast: [
    'Canon EOS R50',
    '18-55mm f/3.5-5.6',
    '50mm f/1.8',
    'Speedlight Flash',
    'LED Ring Light',
    'Basic Tripod',
    'Camera Bag',
    'SD Cards 32GB (x2)',
    'Extra Battery',
    'UV Filter',
    'Lens Cleaning Kit'
  ]
};

/**
 * Fix empty equipment lists
 */
async function fixEmptyEquipment() {
  console.log('🚀 Starting empty equipment list fix...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // First, get photographers with empty equipment lists
  console.log('📊 Finding photographers with empty equipment lists...');

  // Using raw SQL to find empty arrays
  const { data: emptyPhotographers, error: fetchError } = await supabase
    .rpc('get_empty_equipment_photographers');

  // If RPC doesn't exist, use a different approach
  if (fetchError) {
    console.log('Using alternative query method...');

    // Fetch all photographers and filter in JavaScript
    const { data: allPhotographers, error: allError } = await supabase
      .from('photographers')
      .select('id, experience_years, specialties, is_verified, equipment_list');

    if (allError) {
      console.error('❌ Failed to fetch photographers:', allError.message);
      process.exit(1);
    }

    // Filter for empty equipment lists
    const emptyPhotographers = allPhotographers.filter(p =>
      !p.equipment_list ||
      (Array.isArray(p.equipment_list) && p.equipment_list.length === 0) ||
      (typeof p.equipment_list === 'object' && Object.keys(p.equipment_list).length === 0)
    );

    console.log(`✅ Found ${emptyPhotographers.length} photographers with empty equipment\n`);
    console.log('🔄 Updating empty equipment lists...\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const photographer of emptyPhotographers) {
      // Determine tier based on experience
      let tier;
      if (photographer.experience_years >= 5 || photographer.is_verified) {
        tier = 'professional';
      } else if (photographer.experience_years >= 2) {
        tier = 'prosumer';
      } else {
        tier = 'enthusiast';
      }

      const equipment = [...defaultEquipment[tier]];

      try {
        const { error } = await supabase
          .from('photographers')
          .update({ equipment_list: equipment })
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
          console.log(`✅ Fixed equipment for photographer ${photographer.id} (${tier} tier)`);
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
    console.log('📈 EMPTY EQUIPMENT FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully fixed: ${successCount} photographers`);
    console.log(`❌ Failed to fix: ${errorCount} photographers`);
    console.log(`📊 Total processed: ${emptyPhotographers.length} photographers`);

    // Save error details if any
    if (errors.length > 0) {
      const fs = require('fs');
      const errorLogPath = './empty_equipment_errors.json';
      fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
      console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
    }

    console.log('\n✨ Empty equipment fix completed!');
  }
}

// Run the fix
fixEmptyEquipment().catch(err => {
  console.error('💥 Fatal error during fix:', err);
  process.exit(1);
});