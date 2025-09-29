import { supabase } from '../src/lib/supabase.js'
import fs from 'fs'
import csv from 'csv-parser'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
  if (!tags) return ['photography'] // Default to photography
  
  const specialties = []
  const tagArray = tags.toLowerCase().split(',').map(t => t.trim())
  
  if (tagArray.includes('photo')) {
    specialties.push('Wedding Photography')
    specialties.push('Portrait Photography')
  }
  if (tagArray.includes('video')) {
    specialties.push('Videography')
    specialties.push('Event Coverage')
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
  const hourlyRates = [75, 100, 125, 150, 175, 200, 250]
  const experiences = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const ratings = [4.0, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.9, 5.0]
  
  return {
    hourly_rate: hourlyRates[Math.floor(Math.random() * hourlyRates.length)],
    years_experience: experiences[Math.floor(Math.random() * experiences.length)],
    average_rating: ratings[Math.floor(Math.random() * ratings.length)],
    total_reviews: Math.floor(Math.random() * 20) + 1,
    total_bookings: Math.floor(Math.random() * 50) + 1
  }
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
          tags: row.Tags || '',
          ...randomData
        })
      })
      .on('end', resolve)
      .on('error', reject)
  })
  
  console.log(`Found ${photographers.length} photographers to import`)
  console.log('Creating sample photographer profiles...')
  
  let successCount = 0
  let errorCount = 0
  const errors = []
  
  // We'll create sample photographer profiles
  // These will be unlinked from auth users initially
  // Photographers can claim their profiles later by signing up with their email
  
  for (const photographer of photographers) {
    try {
      // Create a temporary user ID (will be updated when they sign up)
      const tempUserId = `temp_${photographer.email.replace(/[@.]/g, '_')}`
      
      // Insert photographer profile
      const { data, error } = await supabase
        .from('photographer_profiles')
        .insert({
          temp_email: photographer.email, // Store email temporarily
          display_name: photographer.fullName,
          bio: `Professional ${photographer.specialties.join(' and ')} services${photographer.city ? ` in ${photographer.city}` : ''}${photographer.state ? `, ${photographer.state}` : ''}. Contact me for bookings!`,
          specialties: photographer.specialties,
          languages: ['English'],
          years_experience: photographer.years_experience,
          hourly_rate: photographer.hourly_rate,
          location_city: photographer.city,
          location_state: photographer.state,
          phone_number: photographer.phone,
          is_available: true,
          is_public: true,
          average_rating: photographer.average_rating,
          total_reviews: photographer.total_reviews,
          total_bookings: photographer.total_bookings,
          onboarding_completed: photographer.trainingCompleted,
          portfolio_urls: [
            'https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
            'https://images.unsplash.com/photo-1519741497674-611481863552',
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc'
          ],
          created_at: new Date().toISOString()
        })
      
      if (error) {
        // Check if already exists
        if (error.message.includes('duplicate')) {
          console.log(`  Profile already exists for: ${photographer.email}`)
        } else {
          throw error
        }
      } else {
        console.log(`  ✓ Created profile for: ${photographer.fullName} (${photographer.email})`)
        successCount++
      }
      
    } catch (error) {
      console.error(`  ✗ Error importing ${photographer.email}:`, error.message)
      errors.push({ email: photographer.email, error: error.message })
      errorCount++
    }
    
    // Add a small delay to avoid rate limiting
    if (successCount % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('IMPORT SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total photographers in CSV: ${photographers.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  
  if (errors.length > 0 && errors.length <= 10) {
    console.log('\nErrors:')
    errors.forEach(e => {
      console.log(`  - ${e.email}: ${e.error}`)
    })
  } else if (errors.length > 10) {
    console.log(`\nToo many errors to display (${errors.length} total)`)
  }
  
  console.log('\nNOTE: These are sample photographer profiles.')
  console.log('Photographers can claim their profiles by signing up with their email address.')
}

// First, let's create the photographer_profiles table if it doesn't exist
async function createTable() {
  console.log('Checking database structure...')
  
  // Check if the table exists by trying to query it
  const { data, error } = await supabase
    .from('photographer_profiles')
    .select('*')
    .limit(1)
  
  if (error && error.message.includes('relation')) {
    console.log('Table does not exist. Please create it using Supabase dashboard.')
    console.log('\nCREATE TABLE photographer_profiles (')
    console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,')
    console.log('  temp_email TEXT UNIQUE,')
    console.log('  user_id UUID REFERENCES auth.users(id),')
    console.log('  display_name TEXT,')
    console.log('  bio TEXT,')
    console.log('  specialties TEXT[],')
    console.log('  languages TEXT[],')
    console.log('  years_experience INTEGER,')
    console.log('  hourly_rate NUMERIC,')
    console.log('  location_city TEXT,')
    console.log('  location_state TEXT,')
    console.log('  phone_number TEXT,')
    console.log('  is_available BOOLEAN DEFAULT true,')
    console.log('  is_public BOOLEAN DEFAULT true,')
    console.log('  average_rating NUMERIC DEFAULT 0,')
    console.log('  total_reviews INTEGER DEFAULT 0,')
    console.log('  total_bookings INTEGER DEFAULT 0,')
    console.log('  onboarding_completed BOOLEAN DEFAULT false,')
    console.log('  portfolio_urls TEXT[],')
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()')
    console.log(');')
    return false
  }
  
  console.log('Table structure verified!')
  return true
}

// Run the import
createTable()
  .then(async (tableExists) => {
    if (tableExists) {
      await importPhotographers()
      console.log('\nImport completed!')
    } else {
      console.log('\nPlease create the table first, then run this script again.')
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nFatal error during import:', error)
    process.exit(1)
  })