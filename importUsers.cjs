#!/usr/bin/env node

/**
 * Bulk User Import Script for Supabase
 *
 * This script reads users from user_import.csv and creates them in Supabase Auth
 * with proper metadata that will populate the public.users table.
 */

const fs = require('fs');
const { parse } = require('csv-parse');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ldxscjxoakqrmkgqwwhr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeHNjanhvYWtxcm1rZ3F3d2hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ2Nzc0OCwiZXhwIjoyMDczMDQzNzQ4fQ.jnnrsLJeB6B43_N-aaMIbn-9dyaOgQYtIIq308yOVI8';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Initialize Supabase admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Generate a strong random password
 * @returns {string} A 16-character random password
 */
function generateStrongPassword() {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  const randomBytes = crypto.randomBytes(16);

  for (let i = 0; i < 16; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  // Ensure the password has at least one of each required character type
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
    // Recursively generate a new password if requirements aren't met
    return generateStrongPassword();
  }

  return password;
}

/**
 * Import users from CSV file to Supabase Auth
 */
async function importUsers() {
  console.log('🚀 Starting user import process...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const csvFilePath = './user_import.csv';

  // Check if CSV file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: CSV file not found at ${csvFilePath}`);
    process.exit(1);
  }

  const users = [];
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Parse CSV file
  const parser = fs
    .createReadStream(csvFilePath)
    .pipe(parse({
      columns: true, // Use first row as column headers
      skip_empty_lines: true,
      trim: true
    }));

  // Collect all users from CSV
  for await (const row of parser) {
    users.push(row);
  }

  console.log(`📊 Found ${users.length} users to import\n`);

  // Process each user
  for (const user of users) {
    try {
      // Generate a strong random password
      const tempPassword = generateStrongPassword();

      // Prepare user data for Supabase Auth
      const authUserData = {
        email: user.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email to avoid sending confirmation emails
        user_metadata: {
          full_name: user.full_name || '',
          role: user.role || 'customer',
          phone: user.phone || null,
          avatar_url: user.avatar_url || null
        }
      };

      // If an ID is provided in CSV, use it
      if (user.id && user.id.trim() !== '') {
        authUserData.id = user.id;
      }

      // Create user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser(authUserData);

      if (error) {
        errorCount++;
        console.error(`❌ Failed to create user: ${user.email}`);
        console.error(`   Error: ${error.message}`);
        errors.push({ email: user.email, error: error.message });
      } else {
        successCount++;
        console.log(`✅ Successfully created user: ${user.email}`);

        // Log the generated user ID if it was auto-generated
        if (!user.id || user.id.trim() === '') {
          console.log(`   Generated ID: ${data.user.id}`);
        }
      }
    } catch (err) {
      errorCount++;
      console.error(`❌ Unexpected error for user: ${user.email}`);
      console.error(`   Error: ${err.message}`);
      errors.push({ email: user.email, error: err.message });
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount} users`);
  console.log(`❌ Failed to import: ${errorCount} users`);
  console.log(`📊 Total processed: ${users.length} users`);

  // If there were errors, save them to a file for review
  if (errors.length > 0) {
    const errorLogPath = './import_errors.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  console.log('\n✨ Import process completed!');

  // Note about passwords
  console.log('\n📝 Important Notes:');
  console.log('- Temporary passwords were generated for each user');
  console.log('- Users will need to reset their passwords on first login');
  console.log('- User metadata (full_name, role, phone, avatar_url) has been set');
  console.log('- This metadata will populate the public.users table via triggers');
}

// Run the import
importUsers().catch(err => {
  console.error('💥 Fatal error during import:', err);
  process.exit(1);
});