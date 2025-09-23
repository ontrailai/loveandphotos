#!/usr/bin/env node

/**
 * EMERGENCY PHOTOGRAPHER DATA RESTORATION
 * 
 * This script restores the legitimate photographer data that was accidentally
 * deleted during the production cleanup process.
 * 
 * The data comes from the photographers-insert.sql backup file.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://ldxscjxoakqrmkgqwwhr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeHNjanhvYWtxcm1rZ3F3d2hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTkyMjIzNywiZXhwIjoyMDQxNDk4MjM3fQ.T_qaUQlQgJmm5wOwCDYCRQVr0Hhl9BwFn2pJr8hzU8k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function restorePhotographerData() {
  console.log('🚨 EMERGENCY DATA RESTORATION STARTING...');
  
  try {
    // First, clear any existing data
    console.log('📋 Clearing existing photographer_preview_profiles...');
    const { error: deleteError } = await supabase
      .from('photographer_preview_profiles')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('❌ Error clearing existing data:', deleteError);
    } else {
      console.log('✅ Existing data cleared');
    }

    // Read the SQL file
    const sqlFile = join(__dirname, 'complete_restore.sql');
    console.log('📖 Reading restoration data from:', sqlFile);
    
    const sqlContent = readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL restoration
    console.log('🔄 Executing data restoration...');
    console.log('⚠️  This may take a few minutes for large datasets...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Restoration failed:', error);
      
      // Try alternative approach with direct SQL execution
      console.log('🔄 Trying alternative restoration method...');
      
      // Parse the SQL and extract VALUES data
      const valuesMatch = sqlContent.match(/VALUES\s*([\s\S]*?)\s*ON CONFLICT/);
      if (valuesMatch) {
        const valuesContent = valuesMatch[1];
        console.log('📊 Found data values, processing...');
        
        // This would require more complex parsing - for now, just log the issue
        console.log('⚠️  Complex data restoration required. Manual intervention needed.');
        console.log('📁 Complete data available in: complete_restore.sql');
      }
    } else {
      console.log('✅ Data restoration completed successfully!');
      
      // Verify the restoration
      const { data: countData, error: countError } = await supabase
        .from('photographer_preview_profiles')
        .select('count(*)', { count: 'exact' });
      
      if (!countError) {
        console.log(`📊 Restored photographer count: ${countData.length || 'Unknown'}`);
      }
    }
    
  } catch (err) {
    console.error('💥 Critical error during restoration:', err);
    console.log('📋 Manual restoration may be required using the complete_restore.sql file');
  }
}

// Execute restoration
restorePhotographerData()
  .then(() => {
    console.log('🎉 Emergency restoration process completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });