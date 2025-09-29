#!/usr/bin/env node
/**
 * Comprehensive test script for auth improvements and testimonials
 * Tests phone formatting, dark mode, and Supabase data loading
 */

import { createClient } from '@supabase/supabase-js';
import { formatUSPhone } from '../src/utils/formatPhone.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== AUTH & TESTIMONIALS TEST SUITE ===\n');

// Create Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Phone Formatting
console.log('1. PHONE FORMATTING TESTS:');
console.log('================================');

const phoneTestCases = [
  { input: '5551234567', expected: '(555) 123-4567' },
  { input: '555-123-4567', expected: '(555) 123-4567' },
  { input: '(555) 123-4567', expected: '(555) 123-4567' },
  { input: '15551234567', expected: '(155) 512-3456' }, // Should cap at 10
  { input: '555', expected: '(555' },
  { input: '5551', expected: '(555) 1' },
  { input: '55512', expected: '(555) 12' },
  { input: '555123', expected: '(555) 123' },
  { input: '5551234', expected: '(555) 123-4' },
  { input: 'abc123def4567', expected: '(123) 456-7' },
];

let phoneTestsPassed = 0;
phoneTestCases.forEach(({ input, expected }) => {
  const result = formatUSPhone(input);
  const passed = result.formatted === expected;
  console.log(`  Input: "${input}"`);
  console.log(`  Expected: "${expected}"`);
  console.log(`  Got: "${result.formatted}"`);
  console.log(`  Raw digits: "${result.digits}"`);
  console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
  if (passed) phoneTestsPassed++;
});

console.log(`Phone Tests: ${phoneTestsPassed}/${phoneTestCases.length} passed\n`);

// Test 2: Testimonials Data Loading
console.log('2. TESTIMONIALS DATA LOADING:');
console.log('================================');

try {
  // Test getFeaturedTestimonials function logic
  const { data: testimonials, error } = await supabase
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

  if (error) {
    console.log('  ❌ Query failed:', error.message);
  } else {
    console.log(`  ✅ Query successful: ${testimonials?.length || 0} testimonials loaded`);

    if (testimonials && testimonials.length > 0) {
      console.log('\n  Sample testimonial:');
      const sample = testimonials[0];
      console.log(`    - Reviewer: ${sample.users?.full_name}`);
      console.log(`    - Rating: ${sample.rating}/5`);
      console.log(`    - Comment: "${sample.comment?.substring(0, 60)}..."`);
      console.log(`    - Has avatar URL: ${!!sample.users?.avatar_url}`);
    }
  }

  // Test getTestimonialsStats function logic
  const { data: reviewStats, error: statsError } = await supabase
    .from('reviews')
    .select('rating')
    .not('rating', 'is', null);

  if (!statsError && reviewStats) {
    const totalReviews = reviewStats.length;
    const totalRating = reviewStats.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / totalReviews;
    const fiveStarReviews = reviewStats.filter(review => review.rating === 5).length;
    const fiveStarPercentage = (fiveStarReviews / totalReviews) * 100;

    console.log('\n  Testimonials Stats:');
    console.log(`    - Total reviews: ${totalReviews}`);
    console.log(`    - Average rating: ${averageRating.toFixed(1)}/5`);
    console.log(`    - 5-star percentage: ${Math.round(fiveStarPercentage)}%`);
  }
} catch (error) {
  console.log('  ❌ Unexpected error:', error);
}

// Test 3: Check Component Structure
console.log('\n3. COMPONENT STRUCTURE CHECKS:');
console.log('================================');

import { readFileSync } from 'fs';

// Check TestimonialsSection doesn't have return null statements
const testimonialsContent = readFileSync('src/components/TestimonialsSection.jsx', 'utf-8');
const hasReturnNull = testimonialsContent.includes('return null');
const linesWithReturnNull = testimonialsContent
  .split('\n')
  .map((line, i) => ({ line, num: i + 1 }))
  .filter(({ line }) => line.includes('return null'))
  .map(({ num }) => num);

if (hasReturnNull) {
  console.log(`  ⚠️ WARNING: Found 'return null' statements on lines: ${linesWithReturnNull.join(', ')}`);
  console.log('     This could cause the section to unmount!');
} else {
  console.log('  ✅ No problematic return null statements found');
}

// Check if always renders something
const alwaysRenders = testimonialsContent.includes('TestimonialsSkeleton') &&
                      testimonialsContent.includes('// ALWAYS render the section');
console.log(`  ${alwaysRenders ? '✅' : '❌'} Component always renders (has skeleton fallback)`);

// Check SignUp for PhoneInput usage
const signupContent = readFileSync('src/pages/SignUp.jsx', 'utf-8');
const usesPhoneInput = signupContent.includes('PhoneInput');
const hasNoTextOverlay = !signupContent.includes('Capture your love story') &&
                         !signupContent.includes('Professional photographers');
console.log(`  ${usesPhoneInput ? '✅' : '❌'} SignUp uses PhoneInput component`);
console.log(`  ${hasNoTextOverlay ? '✅' : '❌'} Text overlay removed from Get Started page`);

// Check for dark mode tokens
const hasOriginTokens = signupContent.includes('bg-background') &&
                        signupContent.includes('text-foreground') &&
                        signupContent.includes('border-border');
console.log(`  ${hasOriginTokens ? '✅' : '❌'} Auth pages use Origin UI tokens for dark mode`);

console.log('\n=== TEST SUITE COMPLETE ===');

// Summary
const allPhoneTestsPassed = phoneTestsPassed === phoneTestCases.length;
const testimonialsWorking = testimonials && testimonials.length > 0;
const componentStructureGood = !hasReturnNull && alwaysRenders && usesPhoneInput && hasNoTextOverlay && hasOriginTokens;

if (allPhoneTestsPassed && testimonialsWorking && componentStructureGood) {
  console.log('\n🎉 ALL TESTS PASSED! Auth improvements and testimonials are working correctly.');
} else {
  console.log('\n⚠️ Some tests failed. Review the output above for details.');
}