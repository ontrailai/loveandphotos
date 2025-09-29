#!/usr/bin/env node

/**
 * Update Camera Types Script
 *
 * This script updates the camera_type column in the photographers table
 * with realistic camera equipment based on their specialties and experience
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

// Camera types by category
const cameraTypes = {
  professional: [
    'Canon EOS R5',
    'Canon EOS R6 Mark II',
    'Canon EOS 5D Mark IV',
    'Nikon Z9',
    'Nikon Z7 II',
    'Nikon D850',
    'Sony A7R V',
    'Sony A7 IV',
    'Sony A1',
    'Fujifilm GFX100S',
    'Fujifilm X-T5'
  ],
  prosumer: [
    'Canon EOS R7',
    'Canon EOS R10',
    'Canon EOS 90D',
    'Nikon Z6 II',
    'Nikon Z5',
    'Nikon D780',
    'Sony A7 III',
    'Sony A7C',
    'Fujifilm X-T4',
    'Fujifilm X-S10',
    'Panasonic Lumix S5'
  ],
  enthusiast: [
    'Canon EOS R50',
    'Canon EOS Rebel T8i',
    'Nikon Z50',
    'Nikon D7500',
    'Sony A6600',
    'Sony A6400',
    'Fujifilm X-T30 II',
    'Olympus OM-D E-M1 Mark III',
    'Panasonic Lumix G9'
  ]
};

// Determine camera type based on experience and specialty
function selectCameraType(yearsExperience, specialties, isVerified) {
  let category;

  // Determine category based on experience and verification
  if (yearsExperience >= 5 || isVerified) {
    category = 'professional';
  } else if (yearsExperience >= 2) {
    category = 'prosumer';
  } else {
    category = 'enthusiast';
  }

  // Wedding photographers tend to use Canon or Nikon
  if (specialties?.includes('wedding')) {
    const weddingCameras = cameraTypes[category].filter(cam =>
      cam.includes('Canon') || cam.includes('Nikon')
    );
    return weddingCameras[Math.floor(Math.random() * weddingCameras.length)] ||
           cameraTypes[category][0];
  }

  // Portrait photographers often prefer Sony or Fujifilm for colors
  if (specialties?.includes('portrait')) {
    const portraitCameras = cameraTypes[category].filter(cam =>
      cam.includes('Sony') || cam.includes('Fujifilm')
    );
    if (portraitCameras.length > 0) {
      return portraitCameras[Math.floor(Math.random() * portraitCameras.length)];
    }
  }

  // Random selection from category
  return cameraTypes[category][Math.floor(Math.random() * cameraTypes[category].length)];
}

/**
 * Update camera types in photographers table
 */
async function updateCameraTypes() {
  console.log('🚀 Starting camera type update process...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  // Fetch all photographers
  console.log('📊 Fetching photographers from database...');
  const { data: photographers, error: fetchError } = await supabase
    .from('photographers')
    .select('id, experience_years, specialties, is_verified');

  if (fetchError) {
    console.error('❌ Failed to fetch photographers:', fetchError.message);
    process.exit(1);
  }

  console.log(`✅ Found ${photographers.length} photographers to update\n`);
  console.log('🔄 Updating camera types...\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process each photographer
  for (const photographer of photographers) {
    const cameraType = selectCameraType(
      photographer.experience_years || 1,
      photographer.specialties,
      photographer.is_verified
    );

    try {
      // camera_type is an array column, so wrap the single camera in an array
      const { error } = await supabase
        .from('photographers')
        .update({ camera_type: [cameraType] })
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
  console.log('📈 CAMERA TYPE UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully updated: ${successCount} photographers`);
  console.log(`❌ Failed to update: ${errorCount} photographers`);
  console.log(`📊 Total processed: ${photographers.length} photographers`);

  // Save error details if any
  if (errors.length > 0) {
    const fs = require('fs');
    const errorLogPath = './camera_type_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Camera type update completed!');
}

// Run the update
updateCameraTypes().catch(err => {
  console.error('💥 Fatal error during update:', err);
  process.exit(1);
});