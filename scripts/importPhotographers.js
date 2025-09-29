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

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
  if (!tags) return []
  
  const specialties = []
  const tagArray = tags.toLowerCase().split(',').map(t => t.trim())
  
  if (tagArray.includes('photo')) {
    specialties.push('photography')
  }
  if (tagArray.includes('video')) {
    specialties.push('videography')
  }
  
  return specialties
}

// Check if training is completed
function isTrainingCompleted(tags) {
  if (!tags) return false
  return tags.toLowerCase().includes('trainingcompleted')
}

// Generate a temporary password (they'll need to reset it)
function generateTempPassword() {
  return 'TempPass' + Math.random().toString(36).substring(2, 15) + '!'
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
          tags: row.Tags || ''
        })
      })
      .on('end', resolve)
      .on('error', reject)
  })
  
  console.log(`Found ${photographers.length} photographers to import`)
  
  let successCount = 0
  let errorCount = 0
  const errors = []
  
  // Import each photographer
  for (const photographer of photographers) {
    try {
      console.log(`\nImporting: ${photographer.email}`)
      
      // Step 1: Create auth user
      const tempPassword = generateTempPassword()
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: photographer.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: photographer.fullName,
          role: 'photographer'
        }
      })
      
      if (authError) {
        // Check if user already exists
        if (authError.message.includes('already registered')) {
          console.log(`  User already exists: ${photographer.email}`)
          // Try to get existing user
          const { data: users } = await supabase.auth.admin.listUsers()
          const existingUser = users?.users?.find(u => u.email === photographer.email)
          
          if (existingUser) {
            // Update existing user profile
            const { error: updateError } = await supabase
              .from('users')
              .upsert({
                id: existingUser.id,
                email: photographer.email,
                full_name: photographer.fullName,
                phone: photographer.phone,
                role: 'photographer',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              })
            
            if (!updateError) {
              console.log(`  Updated existing user profile`)
              successCount++
            }
          }
        } else {
          throw authError
        }
        continue
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user')
      }
      
      // Step 2: Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: photographer.email,
          full_name: photographer.fullName,
          phone: photographer.phone,
          role: 'photographer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError && !profileError.message.includes('duplicate')) {
        throw profileError
      }
      
      // Step 3: Create photographer profile
      const { error: photographerError } = await supabase
        .from('photographers')
        .insert({
          user_id: authData.user.id,
          bio: `Professional ${photographer.specialties.join(' and ')} services${photographer.city ? ` in ${photographer.city}` : ''}${photographer.state ? `, ${photographer.state}` : ''}`,
          specialties: photographer.specialties,
          languages: ['English'],
          years_experience: Math.floor(Math.random() * 5) + 1, // Random 1-5 years
          hourly_rate: Math.floor(Math.random() * 100) + 100, // Random $100-200
          location_city: photographer.city,
          location_state: photographer.state,
          is_available: true,
          is_public: true,
          average_rating: 0,
          total_reviews: 0,
          total_bookings: 0,
          onboarding_completed: photographer.trainingCompleted,
          created_at: new Date().toISOString()
        })
      
      if (photographerError && !photographerError.message.includes('duplicate')) {
        throw photographerError
      }
      
      console.log(`  ✓ Successfully imported: ${photographer.fullName}`)
      successCount++
      
    } catch (error) {
      console.error(`  ✗ Error importing ${photographer.email}:`, error.message)
      errors.push({ email: photographer.email, error: error.message })
      errorCount++
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('IMPORT SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total photographers in CSV: ${photographers.length}`)
  console.log(`Successfully imported: ${successCount}`)
  console.log(`Errors: ${errorCount}`)
  
  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach(e => {
      console.log(`  - ${e.email}: ${e.error}`)
    })
  }
  
  console.log('\nNOTE: All imported photographers have been given temporary passwords.')
  console.log('They will need to use the "Forgot Password" feature to set their own passwords.')
}

// Run the import
importPhotographers()
  .then(() => {
    console.log('\nImport completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nFatal error during import:', error)
    process.exit(1)
  })