#!/usr/bin/env node

/**
 * Create Test Customer Users
 *
 * This script creates test customer users in both auth.users and public.users tables
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://ldxscjxoakqrmkgqwwhr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkeHNjanhvYWtxcm1rZ3F3d2hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ2Nzc0OCwiZXhwIjoyMDczMDQzNzQ4fQ.jnnrsLJeB6B43_N-aaMIbn-9dyaOgQYtIIq308yOVI8';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// First names for test customers
const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Elijah', 'Elizabeth', 'Daniel', 'Sofia', 'Aiden', 'Avery',
  'Matthew', 'Ella', 'Jackson', 'Madison', 'Logan', 'Scarlett', 'David',
  'Victoria', 'Joseph', 'Aria', 'Samuel', 'Grace', 'Carter', 'Chloe',
  'Owen', 'Camila', 'Wyatt', 'Penelope', 'John', 'Riley', 'Jack', 'Layla'
];

// Last names for test customers
const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
  'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts'
];

// Area codes for phone numbers
const areaCodes = ['212', '310', '415', '713', '404', '305', '312', '617', '206', '503'];

/**
 * Generate random phone number
 */
function generatePhone() {
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `${areaCode}-${exchange}-${number}`;
}

/**
 * Create test customers
 */
async function createTestCustomers() {
  console.log('🚀 Creating test customer users...\n');

  const customerCount = 300; // Create 300 test customers
  const customers = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < customerCount; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const phone = generatePhone();

    // Create auth user
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'customer',
          phone: phone,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        }
      });

      if (authError) {
        console.error(`❌ Failed to create auth user ${email}:`, authError.message);
        errorCount++;
        continue;
      }

      // Create public user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          role: 'customer',
          metadata: {
            preferences: {
              notifications: true,
              newsletter: Math.random() > 0.3,
              theme: Math.random() > 0.5 ? 'light' : 'dark',
              language: 'en'
            }
          }
        });

      if (userError) {
        console.error(`❌ Failed to create user record for ${email}:`, userError.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 25 === 0) {
          console.log(`✅ Created ${successCount} customers...`);
        }
      }

    } catch (err) {
      console.error(`❌ Error creating customer ${email}:`, err.message);
      errorCount++;
    }

    // Small delay to avoid rate limiting
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Final count verification
  const { count: authCount } = await supabase.auth.admin.listUsers();
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer');

  console.log('\n' + '='.repeat(60));
  console.log('✨ TEST CUSTOMER CREATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Successfully created: ${successCount} customers`);
  console.log(`❌ Failed: ${errorCount} customers`);
  console.log(`📊 Total customer users in database: ${userCount}`);
}

// Run the script
createTestCustomers().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});