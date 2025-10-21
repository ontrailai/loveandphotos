const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUser() {
  const userId = 'e9aa759f-6da0-4814-a3be-ab09838905b4';

  console.log('\n🔍 Checking user in auth.users...');
  const { data: authUser, error: authError } = await supabase.rpc('exec_sql', {
    sql: `SELECT id, email, created_at FROM auth.users WHERE id = '${userId}'`
  });

  if (authError) {
    console.log('❌ Error querying auth.users:', authError.message);
    // Try alternative method
    console.log('\n🔍 Trying direct auth query...');
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      console.log('❌ User not found in auth.users');
      console.log('Error:', error.message);
    } else {
      console.log('✅ User found:', data.user.email);
    }
  } else {
    console.log('Results:', authUser);
  }

  console.log('\n🔍 Checking user in public.users...');
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (publicError) {
    console.log('❌ User not found in public.users');
    console.log('Error:', publicError.message);
  } else {
    console.log('✅ User found:', publicUser.email);
  }
}

checkUser().catch(console.error);
