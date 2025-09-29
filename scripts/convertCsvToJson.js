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
  
  for (const tag of tagArray) {
    if (stateMap[tag]) {
      state = stateMap[tag]
      break
    }
  }
  
  const stateIndex = tagArray.findIndex(tag => stateMap[tag])
  if (stateIndex !== -1 && stateIndex + 1 < tagArray.length) {
    const potentialCity = tagArray[stateIndex + 1]
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
  if (!tags) return ['Wedding Photography']
  
  const specialties = []
  const tagArray = tags.toLowerCase().split(',').map(t => t.trim())
  
  if (tagArray.includes('photo')) {
    specialties.push('Wedding Photography', 'Portrait Photography', 'Event Photography')
  }
  if (tagArray.includes('video')) {
    specialties.push('Videography', 'Wedding Films', 'Event Coverage')
  }
  
  return specialties.length > 0 ? specialties : ['Wedding Photography']
}

// Portfolio images
const portfolioImages = [
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92',
  'https://images.unsplash.com/photo-1519741497674-611481863552', 
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
  'https://images.unsplash.com/photo-1591604466107-ec97de577aff'
]

async function convertCsvToJson() {
  const photographers = []
  const csvPath = path.join(__dirname, '..', 'photographers.csv')
  
  console.log('Converting CSV to JSON...')
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (!row.Email || row.Email.trim() === '') return
        
        const { state, city } = parseLocation(row.Tags)
        const specialties = parseSpecialties(row.Tags)
        const trainingCompleted = row.Tags?.toLowerCase().includes('trainingcompleted') || false
        
        // Random data for demo
        const hourlyRate = [100, 125, 150, 175, 200, 250][Math.floor(Math.random() * 6)]
        const yearsExp = Math.floor(Math.random() * 10) + 1
        const rating = (4 + Math.random()).toFixed(1)
        const reviews = Math.floor(Math.random() * 30) + 1
        
        // Select 3-4 random images
        const numImages = Math.floor(Math.random() * 2) + 3
        const shuffled = [...portfolioImages].sort(() => 0.5 - Math.random())
        const portfolio = shuffled.slice(0, numImages)
        
        photographers.push({
          display_name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim() || 'Photographer',
          contact_email: row.Email.trim().toLowerCase(),
          contact_phone: row.Phone || null,
          bio: `Professional ${specialties.slice(0, 2).join(' and ')} services${city ? ` in ${city}` : ''}${state ? `, ${state}` : ''}. Available for weddings, events, and special occasions.`,
          specialties,
          languages: ['English'],
          years_experience: yearsExp,
          hourly_rate: hourlyRate,
          location_city: city,
          location_state: state,
          is_available: true,
          is_verified: trainingCompleted,
          average_rating: parseFloat(rating),
          total_reviews: reviews,
          total_bookings: Math.floor(Math.random() * 50) + reviews,
          portfolio_images: portfolio
        })
      })
      .on('end', resolve)
      .on('error', reject)
  })
  
  // Write to JSON file
  const outputPath = path.join(__dirname, '..', 'photographers-data.json')
  fs.writeFileSync(outputPath, JSON.stringify(photographers, null, 2))
  
  console.log(`✅ Converted ${photographers.length} photographers to JSON`)
  console.log(`📁 Output file: photographers-data.json`)
  console.log('\nNext steps:')
  console.log('1. Go to Supabase Dashboard > Table Editor')
  console.log('2. Create table "photographer_preview_profiles" using the SQL in photographers-import.sql')
  console.log('3. Import the photographers-data.json file')
  console.log('\nOr use the SQL INSERT statements being generated...')
  
  // Also generate SQL inserts
  const sqlPath = path.join(__dirname, '..', 'photographers-insert.sql')
  let sql = '-- Insert all photographers from CSV\n'
  sql += '-- Run this after creating the table with photographers-import.sql\n\n'
  sql += 'INSERT INTO photographer_preview_profiles (\n'
  sql += '  display_name, contact_email, contact_phone, bio, specialties,\n'
  sql += '  languages, years_experience, hourly_rate, location_city, location_state,\n'
  sql += '  is_available, is_verified, average_rating, total_reviews, total_bookings,\n'
  sql += '  portfolio_images\n'
  sql += ') VALUES\n'
  
  photographers.forEach((p, i) => {
    sql += `(\n`
    sql += `  '${p.display_name.replace(/'/g, "''")}',\n`
    sql += `  '${p.contact_email}',\n`
    sql += `  ${p.contact_phone ? `'${p.contact_phone}'` : 'NULL'},\n`
    sql += `  '${p.bio.replace(/'/g, "''")}',\n`
    sql += `  ARRAY[${p.specialties.map(s => `'${s}'`).join(', ')}],\n`
    sql += `  ARRAY['English'],\n`
    sql += `  ${p.years_experience},\n`
    sql += `  ${p.hourly_rate},\n`
    sql += `  ${p.location_city ? `'${p.location_city.replace(/'/g, "''")}'` : 'NULL'},\n`
    sql += `  ${p.location_state ? `'${p.location_state}'` : 'NULL'},\n`
    sql += `  true,\n`
    sql += `  ${p.is_verified},\n`
    sql += `  ${p.average_rating},\n`
    sql += `  ${p.total_reviews},\n`
    sql += `  ${p.total_bookings},\n`
    sql += `  ARRAY[${p.portfolio_images.map(img => `'${img}'`).join(', ')}]\n`
    sql += `)`
    sql += i < photographers.length - 1 ? ',\n' : '\n'
  })
  
  sql += 'ON CONFLICT (contact_email) DO UPDATE SET\n'
  sql += '  display_name = EXCLUDED.display_name,\n'
  sql += '  updated_at = NOW();\n'
  
  fs.writeFileSync(sqlPath, sql)
  
  console.log(`\n📁 SQL INSERT file: photographers-insert.sql`)
  console.log('This file contains INSERT statements for all photographers.')
  console.log('Run it in Supabase SQL Editor after creating the table.')
  
  return photographers
}

convertCsvToJson()
  .then((data) => {
    console.log(`\n✅ Successfully processed ${data.length} photographers!`)
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })