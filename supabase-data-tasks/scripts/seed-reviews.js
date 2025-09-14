#!/usr/bin/env node

/**
 * Reviews Seeding Script
 * Seeds 5-star reviews for specified photographers with is_seeded=true
 * Safe to re-run - checks for existing seeded reviews to avoid duplicates
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Configuration
const PHOTOGRAPHERS = [
  'Sirena Salazar',
  'Winston Hermann',
  'Afsana Begum',
  'Meghana Kappala',
  'Andrew Henry',
  'Giovanni Flores'
];

const REVIEWS_PER_PHOTOGRAPHER = 6; // Will add 6 reviews each (5-8 range)

// Sample review comments for 5-star reviews
const REVIEW_TEMPLATES = [
  "Absolutely incredible work! {name} captured every moment perfectly and exceeded all our expectations.",
  "{name} is a true professional with an amazing eye for detail. The photos are stunning and we couldn't be happier!",
  "Outstanding photographer! {name} made us feel so comfortable and the results speak for themselves. Highly recommend!",
  "Five stars isn't enough! {name} delivered exceptional quality and was a pleasure to work with throughout the entire process.",
  "{name} has an incredible talent for capturing genuine emotions. Our photos are absolutely beautiful!",
  "Professional, creative, and incredibly skilled. {name} went above and beyond to make our special day perfect.",
  "We are blown away by {name}'s work! Every single photo is magazine-quality. Worth every penny!",
  "{name} is phenomenal! The attention to detail and artistic vision really shows in the final photos.",
  "Can't recommend {name} enough! Professional service and breathtaking results. Our photos are perfect!",
  "Amazing experience with {name}! The photos exceeded our expectations and captured our day beautifully.",
  "Exceptional photographer! {name} has a wonderful personality and incredible skills. Love our photos!",
  "Perfect choice for our event! {name} was professional, punctual, and delivered stunning results.",
  "{name} made our photoshoot fun and relaxing while creating absolutely gorgeous images. Thank you!",
  "Outstanding work from {name}! The creativity and technical skill really shine through in every shot.",
  "We couldn't be happier with {name}'s photography! Beautiful images that we'll treasure forever."
];

const REVIEWER_NAMES = [
  "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Kim", "Jessica Taylor",
  "Ryan O'Connor", "Amanda Wilson", "Christopher Lee", "Nicole Martinez", "Brandon Smith",
  "Lauren Davis", "Anthony Garcia", "Stephanie Brown", "Kevin Martinez", "Rachel Anderson",
  "Jason Thompson", "Megan White", "Daniel Lopez", "Ashley Miller", "Matthew Jones",
  "Samantha Clark", "Justin Lewis", "Hannah Walker", "Tyler Hall", "Olivia Young",
  "Andrew Scott", "Madison Green", "Nicholas Adams", "Brittany Nelson", "Zachary Hill"
];

// Initialize Supabase client
let supabase;

function initSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase client initialized with service role');
}

// Generate random date within last 18 months
function generateRandomDate() {
  const now = new Date();
  const eighteenMonthsAgo = new Date(now.getTime() - (18 * 30 * 24 * 60 * 60 * 1000));
  const randomTime = eighteenMonthsAgo.getTime() +
    Math.random() * (now.getTime() - eighteenMonthsAgo.getTime());
  return new Date(randomTime);
}

// Get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Find photographer IDs
async function findPhotographerIds() {
  console.log('🔍 Finding photographer IDs...');

  const { data, error } = await supabase
    .from('photographers')
    .select(`
      id,
      total_reviews,
      users!inner(full_name)
    `)
    .in('users.full_name', PHOTOGRAPHERS);

  if (error) {
    throw new Error(`Failed to find photographers: ${error.message}`);
  }

  const found = data.map(p => ({
    id: p.id,
    name: p.users.full_name,
    currentReviews: p.total_reviews
  }));

  console.log('📊 Found photographers:');
  found.forEach(p => {
    console.log(`  - ${p.name}: ${p.currentReviews} current reviews`);
  });

  return found;
}

// Get available reviewer user IDs
async function getReviewerIds() {
  console.log('👥 Getting available reviewer user IDs...');

  // First get all photographer user IDs
  const { data: photographerUsers, error: photographerError } = await supabase
    .from('photographers')
    .select('user_id')
    .not('user_id', 'is', null);

  if (photographerError) {
    throw new Error(`Failed to get photographer user IDs: ${photographerError.message}`);
  }

  const photographerUserIds = new Set(photographerUsers.map(p => p.user_id));

  // Get all users and filter in JavaScript to avoid URL length issues
  const { data: allUsers, error } = await supabase
    .from('users')
    .select('id, full_name')
    .limit(100);

  if (error) {
    throw new Error(`Failed to get reviewer IDs: ${error.message}`);
  }

  // Filter out photographers
  const availableReviewers = allUsers.filter(user => !photographerUserIds.has(user.id));

  if (availableReviewers.length === 0) {
    throw new Error('No available users found for reviewers');
  }

  // Take only the first 50 for manageable size
  const reviewers = availableReviewers.slice(0, 50);

  console.log(`✅ Found ${reviewers.length} available reviewer accounts`);
  return reviewers;
}

// Check existing seeded reviews for a photographer
async function getExistingSeededCount(photographerId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id')
    .eq('photographer_id', photographerId)
    .eq('is_seeded', true);

  if (error) {
    throw new Error(`Failed to check existing seeded reviews: ${error.message}`);
  }

  return data.length;
}

// Create booking record (required for review)
async function createBooking(customerId, photographerId) {
  const booking = {
    id: randomUUID(),
    customer_id: customerId,
    photographer_id: photographerId,
    event_date: generateRandomDate().toISOString().split('T')[0],
    event_time: '14:00:00',
    event_type: getRandomElement(['wedding', 'engagement', 'family_portrait', 'corporate_event']),
    venue_name: getRandomElement(['Downtown Studio', 'City Hall', 'Riverside Park', 'Grand Hotel']),
    guest_count: Math.floor(Math.random() * 100) + 20,
    total_amount: Math.floor(Math.random() * 2000) + 500,
    deposit_amount: 250,
    payment_status: 'paid',
    booking_status: 'completed',
    created_at: generateRandomDate().toISOString()
  };

  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }

  return data.id;
}

// Seed reviews for a photographer
async function seedPhotographerReviews(photographer, reviewerIds) {
  console.log(`🌱 Seeding reviews for ${photographer.name}...`);

  const existingSeeded = await getExistingSeededCount(photographer.id);
  const needed = REVIEWS_PER_PHOTOGRAPHER - existingSeeded;

  if (needed <= 0) {
    console.log(`   ✅ Already has ${existingSeeded} seeded reviews (target: ${REVIEWS_PER_PHOTOGRAPHER})`);
    return 0;
  }

  console.log(`   📝 Creating ${needed} reviews (${existingSeeded} existing, ${REVIEWS_PER_PHOTOGRAPHER} target)`);

  let created = 0;
  for (let i = 0; i < needed; i++) {
    try {
      // Create booking first
      const reviewer = getRandomElement(reviewerIds);
      const bookingId = await createBooking(reviewer.id, photographer.id);

      // Generate review comment
      const template = getRandomElement(REVIEW_TEMPLATES);
      const comment = template.replace('{name}', photographer.name.split(' ')[0]);

      // Create review
      const review = {
        id: randomUUID(),
        booking_id: bookingId,
        reviewer_id: reviewer.id,
        photographer_id: photographer.id,
        rating: 5,
        comment: comment,
        is_featured: Math.random() < 0.3, // 30% chance of being featured
        is_verified: true,
        is_seeded: true, // Mark as seeded for transparency
        helpful_count: Math.floor(Math.random() * 20),
        created_at: generateRandomDate().toISOString()
      };

      const { error } = await supabase
        .from('reviews')
        .insert(review);

      if (error) {
        console.error(`   ❌ Failed to create review ${i + 1}: ${error.message}`);
        continue;
      }

      created++;
      console.log(`   ✅ Created review ${created}/${needed}`);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (err) {
      console.error(`   ❌ Error creating review ${i + 1}: ${err.message}`);
    }
  }

  return created;
}

// Verify final state
async function verifyResults(photographerIds) {
  console.log('\n🔍 Verifying final results...');

  for (const photographer of photographerIds) {
    const { data, error } = await supabase
      .from('photographers')
      .select('total_reviews, average_rating')
      .eq('id', photographer.id)
      .single();

    if (error) {
      console.error(`❌ Failed to verify ${photographer.name}: ${error.message}`);
      continue;
    }

    const seededCount = await getExistingSeededCount(photographer.id);
    const expectedMin = photographer.currentReviews + 5; // minimum 5 new reviews

    console.log(`📊 ${photographer.name}:`);
    console.log(`   Total reviews: ${data.total_reviews} (was ${photographer.currentReviews})`);
    console.log(`   Seeded reviews: ${seededCount}`);
    console.log(`   Average rating: ${data.average_rating}`);
    console.log(`   ✅ Meets requirement: ${data.total_reviews >= expectedMin ? 'YES' : 'NO'}`);
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting reviews seeding script...\n');

    initSupabase();

    // Find target photographers
    const photographers = await findPhotographerIds();
    if (photographers.length !== PHOTOGRAPHERS.length) {
      console.warn(`⚠️  Warning: Found ${photographers.length}/${PHOTOGRAPHERS.length} photographers`);
    }

    // Get reviewer accounts
    const reviewerIds = await getReviewerIds();

    // Seed reviews for each photographer
    let totalCreated = 0;
    for (const photographer of photographers) {
      const created = await seedPhotographerReviews(photographer, reviewerIds);
      totalCreated += created;
    }

    // Wait for triggers to update counts
    console.log('\n⏳ Waiting for database triggers to update counts...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify results
    await verifyResults(photographers);

    console.log(`\n✅ Seeding complete! Created ${totalCreated} new reviews total.`);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };