import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Supabase client
const supabaseUrl = 'https://ldxscjxoakqrmkgqwwhr.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeHNjanhvYWtxcm1rZ3F3d2hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTU5Nzg1MCwiZXhwIjoyMDQ1MTczODUwfQ.lkqhWiNGvN2lY0pdD5vT5_rvSpEHvhEOZLNXsqSQVOs'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function importPhotographers() {
  console.log('Reading photographer data...')
  
  // Read the JSON data we created
  const dataPath = path.join(__dirname, '..', 'photographers-data.json')
  const photographers = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  
  console.log(`Found ${photographers.length} photographers to import`)
  
  // First, let's create the table if it doesn't exist
  console.log('Creating table if not exists...')
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS photographer_preview_profiles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      display_name TEXT NOT NULL,
      contact_email TEXT UNIQUE NOT NULL,
      contact_phone TEXT,
      bio TEXT,
      specialties TEXT[],
      languages TEXT[] DEFAULT ARRAY['English'],
      years_experience INTEGER DEFAULT 1,
      hourly_rate NUMERIC DEFAULT 150,
      location_city TEXT,
      location_state TEXT,
      is_available BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      average_rating NUMERIC DEFAULT 4.5,
      total_reviews INTEGER DEFAULT 0,
      total_bookings INTEGER DEFAULT 0,
      portfolio_images TEXT[],
      user_id UUID REFERENCES auth.users(id),
      claimed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_preview_email ON photographer_preview_profiles(contact_email);
    CREATE INDEX IF NOT EXISTS idx_preview_location ON photographer_preview_profiles(location_state, location_city);
    CREATE INDEX IF NOT EXISTS idx_preview_available ON photographer_preview_profiles(is_available);
  `
  
  // Skip table creation - assume it exists or will be created via dashboard
  console.log('Note: Make sure photographer_preview_profiles table exists')
  
  // Now insert the photographers in batches
  console.log('Importing photographers in batches...')
  
  const batchSize = 50
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < photographers.length; i += batchSize) {
    const batch = photographers.slice(i, Math.min(i + batchSize, photographers.length))
    
    try {
      const { data, error } = await supabase
        .from('photographer_preview_profiles')
        .upsert(batch, {
          onConflict: 'contact_email',
          ignoreDuplicates: false
        })
      
      if (error) {
        console.error(`Batch ${i}-${i+batch.length} error:`, error.message)
        errorCount += batch.length
      } else {
        successCount += batch.length
        console.log(`✓ Imported batch ${i}-${i+batch.length}`)
      }
    } catch (err) {
      console.error(`Batch ${i}-${i+batch.length} exception:`, err.message)
      errorCount += batch.length
    }
    
    // Progress indicator
    if ((i + batchSize) % 200 === 0 || i + batchSize >= photographers.length) {
      console.log(`Progress: ${Math.min(i + batchSize, photographers.length)}/${photographers.length}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('IMPORT COMPLETE')
  console.log('='.repeat(60))
  console.log(`Total photographers: ${photographers.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  
  // Verify by counting records
  const { count, error: countError } = await supabase
    .from('photographer_preview_profiles')
    .select('*', { count: 'exact', head: true })
  
  if (!countError) {
    console.log(`\nVerified: ${count} total photographers in database`)
  }
}

// Run the import
importPhotographers()
  .then(() => {
    console.log('\n✅ Import process completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })