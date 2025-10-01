/**
 * Run Availability Migration Script
 * Executes the availability system database migration
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local')
  process.exit(1)
}

console.log('🔧 Initializing Supabase client...')
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('\n📄 Reading migration file...')
    const migrationPath = join(__dirname, '../supabase/migrations/20250930_availability_enhancement.sql')
    const sql = readFileSync(migrationPath, 'utf8')

    console.log('✅ Migration file loaded')
    console.log(`📊 SQL length: ${sql.length} characters\n`)

    console.log('🚀 Executing migration...')
    console.log('This may take a moment...\n')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql }).single()

    if (error) {
      // Try alternative method - execute via REST API
      console.log('Trying alternative execution method...')

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql_string: sql })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Migration failed: ${errorText}`)
      }

      console.log('✅ Migration executed successfully (via REST API)!')
    } else {
      console.log('✅ Migration executed successfully!')
    }

    console.log('\n📊 Verifying migration...')

    // Verify the new columns exist
    const { data: columns, error: verifyError } = await supabase
      .from('photographers')
      .select('available_dates, visible_in_search')
      .limit(1)

    if (verifyError) {
      console.warn('⚠️  Could not verify migration:', verifyError.message)
      console.log('Please check Supabase dashboard to confirm:')
      console.log('  - available_dates column exists')
      console.log('  - visible_in_search column exists')
    } else {
      console.log('✅ Migration verified! New columns are accessible.')
    }

    console.log('\n🎉 Migration complete!')
    console.log('\nNext steps:')
    console.log('  1. Restart your dev server: npm run dev')
    console.log('  2. Login as photographer')
    console.log('  3. Navigate to /talent/dashboard/availability')
    console.log('  4. Select some dates and click Save')
    console.log('  5. Test client search with date filter at /browse\n')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('\nManual migration steps:')
    console.error('  1. Go to Supabase Dashboard → SQL Editor')
    console.error('  2. Copy contents of: supabase/migrations/20250930_availability_enhancement.sql')
    console.error('  3. Paste and run in SQL Editor')
    console.error('  4. Verify no errors\n')
    process.exit(1)
  }
}

// Run the migration
runMigration()
