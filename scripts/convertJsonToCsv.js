import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  
  // Convert arrays to PostgreSQL array format
  if (Array.isArray(value)) {
    const arrayStr = '{' + value.map(v => `"${v.replace(/"/g, '""')}"`).join(',') + '}'
    return `"${arrayStr}"`
  }
  
  // Convert to string and escape
  const str = String(value)
  
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

async function convertJsonToCsv() {
  console.log('Converting JSON to CSV...')
  
  // Read the JSON data
  const jsonPath = path.join(__dirname, '..', 'photographers-data.json')
  const photographers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  
  // CSV headers matching the table structure
  const headers = [
    'display_name',
    'contact_email',
    'contact_phone',
    'bio',
    'specialties',
    'languages',
    'years_experience',
    'hourly_rate',
    'location_city',
    'location_state',
    'is_available',
    'is_verified',
    'average_rating',
    'total_reviews',
    'total_bookings',
    'portfolio_images'
  ]
  
  // Create CSV content
  let csv = headers.join(',') + '\n'
  
  photographers.forEach(p => {
    const row = [
      escapeCsvValue(p.display_name),
      escapeCsvValue(p.contact_email),
      escapeCsvValue(p.contact_phone),
      escapeCsvValue(p.bio),
      escapeCsvValue(p.specialties),
      escapeCsvValue(p.languages),
      escapeCsvValue(p.years_experience),
      escapeCsvValue(p.hourly_rate),
      escapeCsvValue(p.location_city),
      escapeCsvValue(p.location_state),
      escapeCsvValue(p.is_available),
      escapeCsvValue(p.is_verified),
      escapeCsvValue(p.average_rating),
      escapeCsvValue(p.total_reviews),
      escapeCsvValue(p.total_bookings),
      escapeCsvValue(p.portfolio_images)
    ]
    
    csv += row.join(',') + '\n'
  })
  
  // Write CSV file
  const csvPath = path.join(__dirname, '..', 'photographers-import.csv')
  fs.writeFileSync(csvPath, csv)
  
  console.log(`✅ Created photographers-import.csv with ${photographers.length} photographers`)
  console.log('\nThis CSV file can be imported directly into Supabase Table Editor by:')
  console.log('1. Going to Table Editor')
  console.log('2. Selecting the photographer_preview_profiles table')
  console.log('3. Clicking "Import data from CSV"')
  console.log('4. Dragging and dropping photographers-import.csv')
  
  // Also create a simpler CSV without arrays for easier import
  console.log('\nCreating simplified CSV without arrays...')
  
  let simpleCsv = 'display_name,contact_email,contact_phone,bio,years_experience,hourly_rate,location_city,location_state,is_available,is_verified,average_rating,total_reviews,total_bookings\n'
  
  photographers.forEach(p => {
    const row = [
      escapeCsvValue(p.display_name),
      escapeCsvValue(p.contact_email),
      escapeCsvValue(p.contact_phone),
      escapeCsvValue(p.bio),
      escapeCsvValue(p.years_experience),
      escapeCsvValue(p.hourly_rate),
      escapeCsvValue(p.location_city),
      escapeCsvValue(p.location_state),
      escapeCsvValue(p.is_available),
      escapeCsvValue(p.is_verified),
      escapeCsvValue(p.average_rating),
      escapeCsvValue(p.total_reviews),
      escapeCsvValue(p.total_bookings)
    ]
    
    simpleCsv += row.join(',') + '\n'
  })
  
  const simpleCsvPath = path.join(__dirname, '..', 'photographers-simple.csv')
  fs.writeFileSync(simpleCsvPath, simpleCsv)
  
  console.log(`✅ Created photographers-simple.csv (without array columns for easier import)`)
}

convertJsonToCsv()
  .then(() => {
    console.log('\n✅ CSV files created successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })