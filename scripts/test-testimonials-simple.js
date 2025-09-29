#!/usr/bin/env node
/**
 * Simple test to verify testimonials data loading
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== SIMPLE TESTIMONIALS TEST ===\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('1. Environment check:');
console.log('   URL exists:', !!supabaseUrl);
console.log('   Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('\n2. Testing basic reviews query:');
try {
  // Test the exact same approach as our fixed function
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select('*')
    .not('comment', 'is', null)
    .gte('rating', 4)
    .order('created_at', { ascending: false })
    .limit(12);

  if (reviewsError) {
    console.error('❌ Reviews query failed:', reviewsError);
  } else {
    console.log(`✅ Reviews query successful: ${reviews?.length || 0} reviews`);

    if (reviews && reviews.length > 0) {
      // Get user data
      const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))];
      console.log(`   Found ${reviewerIds.length} unique reviewers`);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', reviewerIds);

      if (usersError) {
        console.error('❌ Users query failed:', usersError);
      } else {
        console.log(`✅ Users query successful: ${users?.length || 0} users`);

        // Create testimonials like the function does
        const usersMap = {};
        users.forEach(user => {
          usersMap[user.id] = user;
        });

        const testimonials = reviews
          .map(review => {
            const user = usersMap[review.reviewer_id];
            if (!user || !user.full_name) return null;
            return {
              name: user.full_name,
              rating: review.rating,
              comment: review.comment.substring(0, 50) + '...'
            };
          })
          .filter(item => item !== null);

        console.log(`\n3. Final testimonials: ${testimonials.length}`);
        if (testimonials.length > 0) {
          console.log('\nSample testimonial:');
          console.log(JSON.stringify(testimonials[0], null, 2));
        }
      }
    }
  }
} catch (error) {
  console.error('❌ Unexpected error:', error);
}

console.log('\n=== TEST COMPLETE ===');