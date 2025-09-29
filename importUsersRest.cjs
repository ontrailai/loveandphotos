#!/usr/bin/env node

/**
 * Alternative User Import Script using Supabase REST API
 * This version uses direct REST API calls for better compatibility
 */

const fs = require('fs');
const { parse } = require('csv-parse');
const crypto = require('crypto');

// Load environment variables - using the service role key
const SUPABASE_URL = 'https://ldxscjxoakqrmkgqwwhr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeHNjanhvYWtxcm1rZ3F3d2hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ2Nzc0OCwiZXhwIjoyMDczMDQzNzQ4fQ.jnnrsLJeB6B43_N-aaMIbn-9dyaOgQYtIIq308yOVI8';

/**
 * Generate a strong random password
 */
function generateStrongPassword() {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(16);

  for (let i = 0; i < 16; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

/**
 * Create user via REST API
 */
async function createUserViaRest(userData) {
  const fetch = (await import('node-fetch')).default;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || result.msg || 'Failed to create user');
  }

  return result;
}

/**
 * Import users from CSV
 */
async function importUsers() {
  console.log('🚀 Starting user import process via REST API...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const csvFilePath = './user_import.csv';

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
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  // Collect all users from CSV
  for await (const row of parser) {
    users.push(row);
  }

  console.log(`📊 Found ${users.length} users to import\n`);

  // Process only first 5 users as a test
  const testUsers = users.slice(0, 5);
  console.log(`🧪 Testing with first 5 users...\n`);

  for (const user of testUsers) {
    try {
      const tempPassword = generateStrongPassword();

      const authUserData = {
        email: user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name || '',
          role: user.role || 'customer',
          phone: user.phone || null,
          avatar_url: user.avatar_url || null
        }
      };

      if (user.id && user.id.trim() !== '') {
        authUserData.id = user.id;
      }

      const result = await createUserViaRest(authUserData);

      successCount++;
      console.log(`✅ Successfully created user: ${user.email}`);
      if (result.id) {
        console.log(`   User ID: ${result.id}`);
      }
    } catch (err) {
      errorCount++;
      console.error(`❌ Failed to create user: ${user.email}`);
      console.error(`   Error: ${err.message}`);
      errors.push({ email: user.email, error: err.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 TEST IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount} users`);
  console.log(`❌ Failed to import: ${errorCount} users`);
  console.log(`📊 Total processed: ${testUsers.length} users (test run)`);

  if (errors.length > 0) {
    const errorLogPath = './import_errors_test.json';
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`\n⚠️  Error details saved to: ${errorLogPath}`);
  }

  if (successCount > 0) {
    console.log('\n✨ Test import successful! Run full import by modifying the script.');
  }
}

// Run the import
importUsers().catch(err => {
  console.error('💥 Fatal error during import:', err);
  process.exit(1);
});