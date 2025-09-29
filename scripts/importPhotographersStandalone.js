import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import csv from 'csv-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Supabase client
const supabaseUrl = 'https://ldxscjxoakqrmkgqwwhr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeHNjanhvYWtxcm1rZ3F3d2hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk1OTc4NTAsImV4cCI6MjA0NTE3Mzg1MH0.q0h7FhJb8BnCGP7PdBiwqg0shgNmYqRv5LkqAYxGzOs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Parse location from tags
function parseLocation(tags) {
  if (!tags) return { state: null, city: null }
  
  const tagArray = tags.toLowerCase().split(',').map(t => t.trim())
  
  // State mappings
  const stateMap = {
    'ca': 'California',
    'california': 'California',
    'nc': 'North Carolina',
    'north carolina': 'North Carolina',
    'ar': 'Arkansas',
    'arkansas': 'Arkansas',
    'al': 'Alabama',
    'alabama': 'Alabama',
    'ks': 'Kansas',
    'kansas': 'Kansas',
    'kansas city': 'Kansas',
    'tx': 'Texas',
    'texas': 'Texas',
    'mi': 'Michigan',
    'michigan': 'Michigan',
    'ia': 'Iowa',
    'iowa': 'Iowa',
    'ky': 'Kentucky',
    'kentucky': 'Kentucky',
    'tn': 'Tennessee',
    'tennessee': 'Tennessee',
    'south carolina': 'South Carolina',
    'sc': 'South Carolina'
  }
  
  let state = null
  let city = null
  
  // Find state
  for (const tag of tagArray) {
    if (stateMap[tag]) {
      state = stateMap[tag]
      break
    }
  }
  
  // Find city (usually comes after state in tags)
  const stateIndex = tagArray.findIndex(tag => stateMap[tag])
  if (stateIndex !== -1 && stateIndex + 1 < tagArray.length) {
    const potentialCity = tagArray[stateIndex + 1]
    // Check if it's not another tag type
    if (!['photo', 'video', 'trainingcompleted'].includes(potentialCity)) {
      city = potentialCity.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }
  }
  
  return { state, city }
}

// Parse specialties from tags
function parseSpecialties(tags) {
  if (!tags) return ['Wedding Photography'] // Default to photography
  
  const specialties = []
  const tagArray = tags.toLowerCase().split(',').map(t => t.trim())
  
  if (tagArray.includes('photo')) {
    specialties.push('Wedding Photography')
    specialties.push('Portrait Photography')
    specialties.push('Event Photography')
  }
  if (tagArray.includes('video')) {
    specialties.push('Videography')
    specialties.push('Event Coverage')
    specialties.push('Wedding Films')
  }
  
  return specialties.length > 0 ? specialties : ['Wedding Photography']
}

// Check if training is completed
function isTrainingCompleted(tags) {
  if (!tags) return false
  return tags.toLowerCase().includes('trainingcompleted')
}

// Generate random data for demo purposes
function generateRandomData() {
  const hourlyRates = [75, 100, 125, 150, 175, 200, 250, 300]
  const experiences = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const ratings = [4.0, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0]
  
  return {
    hourly_rate: hourlyRates[Math.floor(Math.random() * hourlyRates.length)],
    years_experience: experiences[Math.floor(Math.random() * experiences.length)],
    average_rating: ratings[Math.floor(Math.random() * ratings.length)],
    total_reviews: Math.floor(Math.random() * 30) + 1,
    total_bookings: Math.floor(Math.random() * 100) + 1
  }
}

// Generate sample portfolio images
function generatePortfolioImages() {
  const images = [
    'https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
    'https://images.unsplash.com/photo-1519741497674-611481863552',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
    'https://images.unsplash.com/photo-1537633552985-df8429e8048b',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
    'https://images.unsplash.com/photo-1591604466107-ec97de577aff'
  ]
  
  // Return 3-6 random images
  const numImages = Math.floor(Math.random() * 4) + 3
  const shuffled = images.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, numImages)
}

async function importPhotographers() {
  const photographers = []
  const csvPath = path.join(__dirname, '..', 'photographers.csv')
  
  console.log('Reading CSV file...')
  
  // Read and parse CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Skip rows without email
        if (!row.Email || row.Email.trim() === '') {
          return
        }
        
        const { state, city } = parseLocation(row.Tags)
        const specialties = parseSpecialties(row.Tags)
        const trainingCompleted = isTrainingCompleted(row.Tags)
        const randomData = generateRandomData()
        const portfolio = generatePortfolioImages()
        
        photographers.push({
          firstName: row['First Name'] || '',
          lastName: row['Last Name'] || '',
          fullName: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || 'Photographer',
          email: row.Email.trim().toLowerCase(),
          phone: row.Phone || '',
          state,
          city,
          specialties,
          trainingCompleted,
          portfolio,
          ...randomData
        })
      })
      .on('end', resolve)
      .on('error', reject)
  })
  
  console.log(`Found ${photographers.length} photographers to import`)
  console.log('Creating photographer preview profiles...')
  console.log('These will be visible in browse but need to be claimed by signing up.\n')
  
  let successCount = 0
  let skipCount = 0
  let errorCount = 0
  const errors = []
  
  // Process in batches to avoid overwhelming the database
  const batchSize = 10
  for (let i = 0; i < photographers.length; i += batchSize) {
    const batch = photographers.slice(i, Math.min(i + batchSize, photographers.length))
    
    const batchPromises = batch.map(async (photographer) => {
      try {
        // Check if profile already exists with this email
        const { data: existing } = await supabase
          .from('photographer_preview_profiles')
          .select('id')
          .eq('contact_email', photographer.email)
          .single()
        
        if (existing) {
          console.log(`  ⊘ Skipping (already exists): ${photographer.email}`)
          skipCount++
          return
        }
        
        // Create preview profile
        const { error } = await supabase
          .from('photographer_preview_profiles')
          .insert({
            display_name: photographer.fullName,
            contact_email: photographer.email,
            contact_phone: photographer.phone,
            bio: `Professional ${photographer.specialties.slice(0, 2).join(' and ')} services${photographer.city ? ` in ${photographer.city}` : ''}${photographer.state ? `, ${photographer.state}` : ''}. Available for weddings, events, and special occasions.`,
            specialties: photographer.specialties,
            languages: ['English'],
            years_experience: photographer.years_experience,
            hourly_rate: photographer.hourly_rate,
            location_city: photographer.city,
            location_state: photographer.state,
            is_available: true,
            is_verified: photographer.trainingCompleted,
            average_rating: photographer.average_rating,
            total_reviews: photographer.total_reviews,
            total_bookings: photographer.total_bookings,
            portfolio_images: photographer.portfolio,
            created_at: new Date().toISOString()
          })
        
        if (error) {
          throw error
        }
        
        console.log(`  ✓ Created preview for: ${photographer.fullName}`)
        successCount++
        
      } catch (error) {
        console.error(`  ✗ Error with ${photographer.email}: ${error.message}`)
        errors.push({ email: photographer.email, error: error.message })
        errorCount++
      }
    })
    
    await Promise.all(batchPromises)
    
    // Progress update
    if ((i + batchSize) % 50 === 0) {
      console.log(`\nProgress: ${Math.min(i + batchSize, photographers.length)}/${photographers.length} processed...`)
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('IMPORT SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total photographers in CSV: ${photographers.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Skipped (already exist): ${skipCount}`)
  console.log(`Errors: ${errorCount}`)
  
  if (errors.length > 0 && errors.length <= 10) {
    console.log('\nErrors:')
    errors.forEach(e => {
      console.log(`  - ${e.email}: ${e.error}`)
    })
  } else if (errors.length > 10) {
    console.log(`\nToo many errors to display (${errors.length} total)`)
    console.log('First 10 errors:')
    errors.slice(0, 10).forEach(e => {
      console.log(`  - ${e.email}: ${e.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('NEXT STEPS:')
  console.log('='.repeat(60))
  console.log('1. These profiles are now visible in the browse section')
  console.log('2. Photographers can claim their profile by signing up with their email')
  console.log('3. After signup, their profile will be linked to their account')
  console.log('4. They can then edit and manage their profile from the dashboard')
}

// First create the table if it doesn't exist
async function ensureTableExists() {
  console.log('Checking database structure...')
  
  // Try to query the table
  const { error } = await supabase
    .from('photographer_preview_profiles')
    .select('id')
    .limit(1)
  
  if (error && error.message.includes('relation')) {
    console.log('\nTable does not exist. Creating photographer_preview_profiles table...')
    
    // Note: In production, you'd run this SQL in Supabase dashboard
    console.log('\nPlease run this SQL in your Supabase SQL editor:')
    console.log('=' * 60)
    console.log(`
CREATE TABLE IF NOT EXISTS photographer_preview_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name TEXT NOT NULL,
  contact_email TEXT UNIQUE NOT NULL,
  contact_phone TEXT,
  bio TEXT,
  specialties TEXT[],
  languages TEXT[],
  years_experience INTEGER DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 100,
  location_city TEXT,
  location_state TEXT,
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  average_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  portfolio_images TEXT[],
  user_id UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_preview_email ON photographer_preview_profiles(contact_email);
CREATE INDEX idx_preview_location ON photographer_preview_profiles(location_state, location_city);
CREATE INDEX idx_preview_available ON photographer_preview_profiles(is_available);
    `)
    console.log('=' * 60)
    console.log('\nAfter creating the table, run this script again.')
    return false
  }
  
  console.log('✓ Table structure verified!')
  return true
}

// Run the import
ensureTableExists()
  .then(async (tableExists) => {
    if (tableExists) {
      await importPhotographers()
      console.log('\n✅ Import completed successfully!')
    } else {
      console.log('\n⚠️  Please create the table first, then run this script again.')
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error during import:', error)
    process.exit(1)
  })