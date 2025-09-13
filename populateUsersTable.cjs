#!/usr/bin/env node

/**
 * Populate Users Table from Auth.Users
 *
 * This script syncs the auth.users table with the public.users table
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

async function populateUsersTable() {
  console.log('🚀 Populating users table from auth.users...\n');

  // Fetch all auth users
  const { data: authUsers, error: fetchError } = await supabase.auth.admin.listUsers();

  if (fetchError) {
    console.error('❌ Failed to fetch auth users:', fetchError.message);
    return;
  }

  console.log(`📊 Found ${authUsers.users.length} auth users\n`);

  // Prepare user records
  const userRecords = [];

  for (const authUser of authUsers.users) {
    // Skip if this is a photographer (they have their own table)
    if (authUser.user_metadata?.role === 'photographer') {
      continue;
    }

    const userRecord = {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      phone: authUser.user_metadata?.phone || null,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      role: authUser.user_metadata?.role || 'customer',
      preferences: {
        notifications: true,
        newsletter: true,
        theme: 'light'
      }
    };

    userRecords.push(userRecord);
  }

  console.log(`📝 Prepared ${userRecords.length} customer records\n`);

  // Insert users in batches (upsert to avoid duplicates)
  const batchSize = 50;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < userRecords.length; i += batchSize) {
    const batch = userRecords.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('users')
      .upsert(batch, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    } else if (data) {
      inserted += data.length;
      console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}: ${data.length} records`);
    }
  }

  // Final count
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(60));
  console.log('✨ USERS TABLE POPULATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`📊 Total users in table: ${count}`);
  console.log(`✅ Successfully processed: ${inserted} users`);
}

// Run the script
populateUsersTable().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});