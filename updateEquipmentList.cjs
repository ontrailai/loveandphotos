#!/usr/bin/env node

/**
 * Update Equipment List Script
 *
 * This script updates the equipment_list column in the photographers table
 * with realistic photography equipment based on camera type and experience
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

// Equipment pools by category
const equipment = {
  lenses: {
    professional: [
      '24-70mm f/2.8',
      '70-200mm f/2.8',
      '50mm f/1.2',
      '85mm f/1.4',
      '35mm f/1.4',
      '16-35mm f/2.8',
      '100mm f/2.8 Macro',
      '24mm f/1.4',
      '135mm f/2'
    ],
    prosumer: [
      '24-70mm f/4',
      '70-200mm f/4',
      '50mm f/1.8',
      '85mm f/1.8',
      '35mm f/2',
      '24-105mm f/4',
      '18-135mm f/3.5-5.6',
      '55-250mm f/4-5.6'
    ],
    enthusiast: [
      '18-55mm f/3.5-5.6',
      '50mm f/1.8',
      '55-250mm f/4-5.6',
      '35mm f/2.8',
      '24mm f/2.8'
    ]
  },

  lighting: {
    professional: [
      'Profoto B10 Plus Flash',
      'Godox AD600 Pro Strobe',
      'Profoto A2 Flash',
      'Godox V1 Speedlight',
      'Westcott FJ400 Strobe',
      'Aputure 300d II LED',
      'Profoto Softbox 3x4ft',
      'Octabox 48"',
      'Beauty Dish 20"'
    ],
    prosumer: [
      'Godox V860III Speedlight',
      'Godox AD200 Pro',
      'Neewer Vision 5 Strobe',
      'Softbox 24x36"',
      'Umbrella Kit',
      'LED Panel Light',
      'Reflector 5-in-1'
    ],
    enthusiast: [
      'Speedlight Flash',
      'LED Ring Light',
      'Reflector Kit',
      'Light Stand',
      'Softbox 20x28"'
    ]
  },

  accessories: {
    professional: [
      'Gitzo Carbon Fiber Tripod',
      'Really Right Stuff Ball Head',
      'Peak Design Camera Strap',
      'Think Tank Photo Backpack',
      'Pelican 1510 Case',
      'SanDisk 128GB CFexpress Cards (x6)',
      'Calibrite ColorChecker',
      'Wireless Trigger System',
      'Battery Grip',
      'Extra Batteries (x4)',
      'Lens Filters (CPL, ND, UV)',
      'Tether Tools Kit'
    ],
    prosumer: [
      'Manfrotto Tripod',
      'Peak Design Everyday Backpack',
      'SanDisk 64GB SD Cards (x4)',
      'Extra Batteries (x2)',
      'Lens Filters Set',
      'Camera Rain Cover',
      'Wireless Remote',
      'Memory Card Case',
      'Lens Cleaning Kit'
    ],
    enthusiast: [
      'Basic Tripod',
      'Camera Bag',
      'SD Cards 32GB (x2)',
      'Extra Battery',
      'UV Filter',
      'Lens Hood',
      'Camera Strap',
      'Cleaning Kit'
    ]
  },

  backup: {
    professional: [
      'Backup Camera Body',
      'Backup Lenses Set',
      'Portable SSD 2TB',
      'Laptop with Lightroom'
    ],
    prosumer: [
      'External Hard Drive 1TB',
      'Tablet for Previews'
    ],
    enthusiast: [
      'External Hard Drive 500GB'
    ]
  }
};

/**
 * Generate equipment list based on experience and camera type
 */
function generateEquipmentList(yearsExperience, cameraType, specialties, isVerified) {
  const equipmentList = [];

  // Determine tier
  let tier;
  if (yearsExperience >= 5 || isVerified) {
    tier = 'professional';
  } else if (yearsExperience >= 2) {
    tier = 'prosumer';
  } else {
    tier = 'enthusiast';
  }

  // Add camera (already in camera_type, but including for completeness)
  if (cameraType && cameraType.length > 0) {
    equipmentList.push(cameraType[0]);
  }

  // Add lenses based on tier
  const lensCount = tier === 'professional' ? 5 : tier === 'prosumer' ? 3 : 2;
  const availableLenses = [...equipment.lenses[tier]];

  // For wedding photographers, ensure zoom lenses
  if (specialties?.includes('wedding')) {
    const zoomLenses = availableLenses.filter(lens =>
      lens.includes('24-70') || lens.includes('70-200') || lens.includes('16-35')
    );
    zoomLenses.forEach(lens => {
      if (equipmentList.length < lensCount + 1) {
        equipmentList.push(lens);
      }
    });
  }

  // Add remaining lenses randomly
  while (equipmentList.length < lensCount + 1 && availableLenses.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableLenses.length);
    const lens = availableLenses.splice(randomIndex, 1)[0];
    if (!equipmentList.includes(lens)) {
      equipmentList.push(lens);
    }
  }

  // Add lighting equipment
  const lightingCount = tier === 'professional' ? 4 : tier === 'prosumer' ? 2 : 1;
  const availableLighting = [...equipment.lighting[tier]];

  for (let i = 0; i < lightingCount && availableLighting.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableLighting.length);
    equipmentList.push(availableLighting.splice(randomIndex, 1)[0]);
  }

  // Add accessories
  const accessoryCount = tier === 'professional' ? 6 : tier === 'prosumer' ? 4 : 3;
  const availableAccessories = [...equipment.accessories[tier]];

  // Always add tripod and memory cards
  const essentials = availableAccessories.filter(item =>
    item.toLowerCase().includes('tripod') ||
    item.toLowerCase().includes('card') ||
    item.toLowerCase().includes('bag') ||
    item.toLowerCase().includes('backpack')
  );

  essentials.forEach(item => {
    if (!equipmentList.includes(item)) {
      equipmentList.push(item);
      const index = availableAccessories.indexOf(item);
      if (index > -1) availableAccessories.splice(index, 1);
    }
  });

  // Add remaining accessories
  while (equipmentList.length < lensCount + lightingCount + accessoryCount + 1 && availableAccessories.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableAccessories.length);
    equipmentList.push(availableAccessories.splice(randomIndex, 1)[0]);
  }

  // Add backup equipment for professionals
  if (tier === 'professional' || (tier === 'prosumer' && yearsExperience >= 3)) {
    const backupItems = equipment.backup[tier] || equipment.backup.prosumer;
    backupItems.forEach(item => {
      if (Math.random() > 0.5) { // 50% chance to have each backup item
        equipmentList.push(item);
      }
    });
  }

  return equipmentList;
}

/**
 * Update equipment lists in photographers table
 */
async function updateEquipmentLists() {
  console.log('🚀 Starting equipment list update process...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Fetch all photographers with their current data
  console.log('📊 Fetching photographers from database...');
  const { data: photographers, error: fetchError } = await supabase
    .from('photographers')
    .select('id, experience_years, camera_type, specialties, is_verified');

  if (fetchError) {
    console.error('❌ Failed to fetch photographers:', fetchError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${photographers.length} photographers to update\n`);
  console.log('🔄 Updating equipment lists...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process each photographer
  for (const photographer of photographers) {
    const equipmentList = generateEquipmentList(
      photographer.experience_years || 1,
      photographer.camera_type,
      photographer.specialties,
      photographer.is_verified
    );

    try {
      const { error } = await supabase
        .from('photographers')
        .update({ equipment_list: equipmentList })
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
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 EQUIPMENT LIST UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} photographers`);
  console.log(`❌ Failed to update: ${errorCount} photographers`);
  console.log(`📊 Total processed: ${photographers.length} photographers`);

  // Save error details if any
  if (errors.length > 0) {
    const fs = require('fs');
    const errorLogPath = './equipment_list_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Equipment list update completed!');
}

// Run the update
updateEquipmentLists().catch(err => {
  console.error('💥 Fatal error during update:', err);
  process.exit(1);
});