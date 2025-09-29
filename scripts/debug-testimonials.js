#!/usr/bin/env node
/**
 * Debug script to identify why testimonials aren't loading
 * Tests each step: env vars, connection, schema, data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== TESTIMONIALS DEBUG SCRIPT ===\n');

// A) Check environment variables
console.log('A) Environment Variables Check:');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('  VITE_SUPABASE_URL present:', !!supabaseUrl);
console.log('  VITE_SUPABASE_ANON_KEY present:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables. Cannot proceed.');
  process.exit(1);
}

console.log('✅ Environment variables found\n');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// B) Check if reviews table has data
console.log('B) Reviews Table Data Check:');
try {
  // First, get table schema
  const { data: schemaCheck, error: schemaError } = await supabase
    .from('reviews')
    .select('*')
    .limit(1);

  if (schemaError) {
    console.error('❌ Error accessing reviews table:', schemaError.message);
    if (schemaError.message.includes('permission')) {
      console.log('  → RLS issue detected. Need to check policies.');
    }
  } else {
    console.log('✅ Can access reviews table');
    if (schemaCheck && schemaCheck[0]) {
      console.log('  Columns found:', Object.keys(schemaCheck[0]));
    }
  }

  // Count total reviews
  const { count: totalCount, error: countError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`  Total reviews in database: ${totalCount}`);
  }

  // Count reviews with comments (for testimonials)
  const { count: withComments, error: commentError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .not('comment', 'is', null);

  if (!commentError) {
    console.log(`  Reviews with comments: ${withComments}`);
  }

  // Check for is_featured column
  const { data: featuredCheck, error: featuredError } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_featured', true)
    .limit(1);

  if (featuredError) {
    if (featuredError.message.includes('column "is_featured" does not exist')) {
      console.log('⚠️  Column "is_featured" does not exist - this is the problem!');
    } else {
      console.log('⚠️  Error checking is_featured:', featuredError.message);
    }
  } else {
    console.log(`  Featured reviews found: ${featuredCheck?.length || 0}`);
  }

} catch (error) {
  console.error('❌ Unexpected error:', error);
}

console.log('\nC) Testing actual query from getFeaturedTestimonials:');

// Test the exact query from the code
try {
  // First try WITH is_featured (current broken query)
  console.log('  Testing WITH is_featured filter:');
  const { data: withFeatured, error: featuredError } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      reviewer_id,
      photographer_id,
      users!inner (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('is_featured', true)
    .not('comment', 'is', null)
    .not('users.full_name', 'is', null)
    .gte('rating', 4)
    .order('created_at', { ascending: false })
    .limit(12);

  if (featuredError) {
    console.log('  ❌ Query WITH is_featured failed:', featuredError.message);
  } else {
    console.log(`  ✅ Query WITH is_featured returned: ${withFeatured?.length || 0} rows`);
  }

  // Now try WITHOUT is_featured (fixed query)
  console.log('\n  Testing WITHOUT is_featured filter:');
  const { data: withoutFeatured, error: noFeaturedError } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      reviewer_id,
      photographer_id,
      users!inner (
        id,
        full_name,
        avatar_url
      )
    `)
    .not('comment', 'is', null)
    .not('users.full_name', 'is', null)
    .gte('rating', 4)
    .order('created_at', { ascending: false })
    .limit(12);

  if (noFeaturedError) {
    console.log('  ❌ Query WITHOUT is_featured failed:', noFeaturedError.message);
  } else {
    console.log(`  ✅ Query WITHOUT is_featured returned: ${withoutFeatured?.length || 0} rows`);

    if (withoutFeatured && withoutFeatured.length > 0) {
      console.log('\n  Sample review data:');
      const sample = withoutFeatured[0];
      console.log('    - id:', sample.id);
      console.log('    - rating:', sample.rating);
      console.log('    - comment:', sample.comment?.substring(0, 50) + '...');
      console.log('    - reviewer name:', sample.users?.full_name);
      console.log('    - avatar_url:', !!sample.users?.avatar_url);
    }
  }

  // Alternative: Try simpler query
  console.log('\n  Testing SIMPLE query (no joins):');
  const { data: simple, error: simpleError } = await supabase
    .from('reviews')
    .select('*')
    .not('comment', 'is', null)
    .gte('rating', 4)
    .limit(5);

  if (simpleError) {
    console.log('  ❌ Simple query failed:', simpleError.message);
  } else {
    console.log(`  ✅ Simple query returned: ${simple?.length || 0} rows`);
    if (simple && simple[0]) {
      console.log('    Columns in reviews table:', Object.keys(simple[0]));
    }
  }

} catch (error) {
  console.error('❌ Unexpected error in query test:', error);
}

console.log('\n=== DIAGNOSIS ===');
console.log('The issue is likely:');
console.log('1. The query uses .eq("is_featured", true) but this column doesn\'t exist');
console.log('2. TestimonialsSection has return null statements that hide the section');
console.log('3. Fix: Remove is_featured filter and return null guards');
console.log('\n=== END DEBUG ===');