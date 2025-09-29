#!/usr/bin/env node

/**
 * Populate Remaining Tables Script (Corrected Version)
 *
 * This script populates the remaining empty tables in Supabase:
 * - job_queue (with correct structure)
 * - messages (with proper foreign keys)
 * - reviews (with correct columns)
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

// Message templates
const messageSubjects = [
  'Booking Confirmation',
  'Event Details Update',
  'Payment Received',
  'Contract for Review',
  'Schedule Change Request',
  'Photo Delivery Timeline',
  'Additional Services Available',
  'Weather Contingency Plan',
  'Final Details Confirmation',
  'Thank You for Your Booking'
];

const messageTemplates = [
  'Thank you for your booking! I\'m excited to work with you.',
  'I\'ve received your deposit payment. Looking forward to the event!',
  'Just wanted to confirm our meeting time for the consultation.',
  'I\'ve scouted the venue and have some great shot ideas.',
  'Please let me know if you have any specific shot requests.',
  'The weather looks perfect for your outdoor session!',
  'I\'m preparing my equipment for your event. Any last-minute changes?',
  'Your photos are being edited and will be ready soon.',
  'Here\'s the link to your online gallery. Password is included.',
  'It was a pleasure working with you! Please consider leaving a review.'
];

// Review comments
const reviewComments = [
  'The photos turned out absolutely beautiful. Could not be happier!',
  'Very professional and made everyone feel comfortable during the shoot.',
  'Captured all the important moments and many we didn\'t even notice.',
  'Great communication throughout the entire process.',
  'Delivered the photos on time and the quality exceeded expectations.',
  'Creative eye for composition and lighting. True artist!',
  'Patient with our large family group and got amazing shots.',
  'The editing was perfect - not overdone but enhanced beautifully.',
  'Responsive to all our requests and very accommodating.',
  'Made our wedding day stress-free from a photography perspective.',
  'Highly recommend! Will definitely book again for future events.',
  'Worth every penny. The quality of work is outstanding.',
  'Professional from start to finish. Great to work with.',
  'The photos captured the emotion of our day perfectly.',
  'Went above and beyond what we expected. Amazing service!'
];

/**
 * Generate random date within range
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Populate job_queue table
 */
async function populateJobQueue() {
  console.log('\n⚙️ Populating job_queue table...');

  // Fetch bookings with photographer IDs
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, photographer_id')
    .in('booking_status', ['confirmed', 'completed'])
    .limit(150);

  if (!bookings?.length) {
    console.log('⚠️  No bookings found, skipping job queue');
    return 0;
  }

  const jobs = [];
  const uploadStatuses = ['pending', 'in_progress', 'completed', 'approved'];

  for (const booking of bookings) {
    // Create one job per booking (50% chance)
    if (Math.random() > 0.5) {
      const uploadStatus = uploadStatuses[Math.floor(Math.random() * uploadStatuses.length)];
      const filesUploaded = uploadStatus === 'completed' ? Math.floor(Math.random() * 500) + 100 : 0;

      const job = {
        photographer_id: booking.photographer_id,
        booking_id: booking.id,
        upload_status: uploadStatus,
        files_uploaded: filesUploaded,
        overtime_logged: Math.random() > 0.7 ? Math.floor(Math.random() * 60) : 0, // 0-60 minutes (max 99.99 for numeric(4,2))
        overtime_approved: Math.random() > 0.5,
        deadline: randomDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 1 week from now
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 1 month from now
        ).toISOString()
      };

      // Add delivery details for completed jobs
      if (uploadStatus === 'completed') {
        job.delivery_url = `https://gallery.example.com/${booking.id}`;
        job.delivery_password = Math.random().toString(36).substring(2, 8).toUpperCase();
        job.delivered_at = new Date().toISOString();
        job.customer_approved = Math.random() > 0.2;
      }

      // Add notes for some jobs
      if (Math.random() > 0.7) {
        const notes = [
          'Additional editing requested',
          'Rush delivery needed',
          'Black and white versions requested',
          'Client requested specific filters',
          'Waiting for venue shots to complete'
        ];
        job.notes = notes[Math.floor(Math.random() * notes.length)];
      }

      jobs.push(job);
    }
  }

  // Insert jobs
  const { data, error } = await supabase
    .from('job_queue')
    .insert(jobs)
    .select();

  if (error) {
    console.error('❌ Error inserting job queue:', error.message);
    return 0;
  }

  console.log(`✅ Inserted ${data?.length || 0} jobs`);
  return data?.length || 0;
}

/**
 * Populate messages table
 */
async function populateMessages() {
  console.log('\n💬 Populating messages table...');

  // Fetch bookings with photographer and customer IDs
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, photographer_id, customer_id')
    .limit(100);

  if (!bookings?.length) {
    console.log('⚠️  No bookings found, skipping messages');
    return 0;
  }

  // Get all users from users table (they are all valid auth users)
  const { data: allUsers } = await supabase
    .from('users')
    .select('id')
    .limit(500);

  const validUserIds = new Set(allUsers.map(u => u.id));

  const messages = [];

  for (const booking of bookings) {
    // Create 2-5 messages per booking using valid user IDs
    const messageCount = Math.floor(Math.random() * 4) + 2;

    // Pick two random users from the valid users list for sender/recipient
    const userArray = Array.from(validUserIds);
    if (userArray.length < 2) continue;

    const sender = userArray[Math.floor(Math.random() * userArray.length)];
    let recipient = userArray[Math.floor(Math.random() * userArray.length)];

    // Make sure sender and recipient are different
    while (recipient === sender && userArray.length > 1) {
      recipient = userArray[Math.floor(Math.random() * userArray.length)];
    }

    for (let m = 0; m < messageCount; m++) {
      const isFromPhotographer = Math.random() > 0.5;

      const message = {
        booking_id: booking.id,
        sender_id: isFromPhotographer ? sender : recipient,
        recipient_id: isFromPhotographer ? recipient : sender,
        subject: messageSubjects[Math.floor(Math.random() * messageSubjects.length)],
        content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
        is_read: Math.random() > 0.3
      };

      if (message.is_read) {
        message.read_at = new Date().toISOString();
      }

      messages.push(message);
    }
  }

  if (messages.length === 0) {
    console.log('⚠️  No valid messages to insert');
    return 0;
  }

  // Insert messages in batches
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('messages')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Error inserting messages batch ${i / batchSize + 1}:`, error.message);
    } else if (data) {
      inserted += data.length;
      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: ${data.length} messages`);
    }
  }

  console.log(`✅ Total inserted: ${inserted} messages`);
  return inserted;
}

/**
 * Populate reviews table
 */
async function populateReviews() {
  console.log('\n⭐ Populating reviews table...');

  // First check which bookings already have reviews
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('booking_id');

  const reviewedBookingIds = new Set(existingReviews?.map(r => r.booking_id) || []);

  // Fetch completed bookings that don't have reviews yet
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, photographer_id, customer_id')
    .eq('booking_status', 'completed')
    .limit(150);

  let bookingsToReview = bookings?.filter(b => !reviewedBookingIds.has(b.id)) || [];

  if (!bookingsToReview.length) {
    console.log('⚠️  No completed bookings without reviews found, using all unreviewed bookings');

    // Try with all bookings that don't have reviews
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('id, photographer_id, customer_id')
      .limit(150);

    bookingsToReview = allBookings?.filter(b => !reviewedBookingIds.has(b.id)) || [];

    if (!bookingsToReview.length) {
      console.log('⚠️  All bookings already have reviews or no bookings found');
      return 0;
    }
  }

  const reviews = [];

  // Create reviews for 80% of bookings
  const reviewedBookings = bookingsToReview.filter(() => Math.random() < 0.8);

  for (const booking of reviewedBookings) {
    const rating = Math.random() < 0.8 ?
      Math.floor(Math.random() * 2) + 4 : // 80% get 4-5 stars
      Math.floor(Math.random() * 2) + 3;  // 20% get 3-4 stars

    const review = {
      booking_id: booking.id,
      reviewer_id: booking.customer_id,
      photographer_id: booking.photographer_id,
      rating: rating,
      comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
      is_featured: Math.random() < 0.1, // 10% are featured
      is_verified: true, // All from actual bookings are verified
      helpful_count: Math.floor(Math.random() * 50),
      response: Math.random() < 0.3 ? 'Thank you so much for your kind words! It was a pleasure working with you.' : null
    };

    if (review.response) {
      review.response_at = new Date().toISOString();
    }

    // Add sample photos for some reviews
    if (Math.random() > 0.7) {
      review.photos = [
        `https://example.com/review-photos/${booking.id}-1.jpg`,
        `https://example.com/review-photos/${booking.id}-2.jpg`
      ];
    }

    reviews.push(review);
  }

  // Insert reviews
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviews)
    .select();

  if (error) {
    console.error('❌ Error inserting reviews:', error.message);
    return 0;
  }

  console.log(`✅ Inserted ${data?.length || 0} reviews`);
  return data?.length || 0;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting population of remaining tables (corrected)...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const jobCount = await populateJobQueue();
  const messageCount = await populateMessages();
  const reviewCount = await populateReviews();

  console.log('\n' + '='.repeat(60));
  console.log('✨ REMAINING TABLES POPULATED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📊 FINAL COUNTS:');
  console.log(`   Job Queue: ${jobCount}`);
  console.log(`   Messages: ${messageCount}`);
  console.log(`   Reviews: ${reviewCount}`);
}

// Run the script
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});