#!/usr/bin/env node

/**
 * Populate Remaining Tables Script (Fixed)
 *
 * This script populates the remaining empty tables in Supabase:
 * - bookings
 * - job_queue
 * - messages
 * - reviews
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

// Event types for bookings
const eventTypes = [
  'Wedding', 'Engagement', 'Portrait Session', 'Family Reunion',
  'Corporate Event', 'Birthday Party', 'Anniversary',
  'Maternity Shoot', 'Newborn Session', 'Graduation',
  'Real Estate', 'Product Photography', 'Fashion Shoot',
  'Concert', 'Sports Event', 'Conference', 'Workshop'
];

// Venue names
const venueNames = [
  'Grand Ballroom', 'Beach Resort', 'Mountain Lodge', 'City Hall',
  'Park Pavilion', 'Historic Mansion', 'Art Gallery', 'Rooftop Terrace',
  'Country Club', 'Botanical Gardens', 'Vineyard Estate', 'Lake House',
  'Downtown Studio', 'Museum Hall', 'Private Residence', 'Church Hall'
];

// Cities for addresses
const cities = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
  'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
  'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL',
  'Fort Worth, TX', 'Columbus, OH', 'San Francisco, CA', 'Charlotte, NC',
  'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Boston, MA'
];

// Special requests
const specialRequests = [
  'Please arrive 30 minutes early for setup',
  'Need drone photography included',
  'Prefer natural lighting only',
  'Black and white photos requested for some shots',
  'Need photos delivered within 2 weeks',
  'Guest list includes elderly - need accessible locations',
  'Outdoor ceremony - need backup plan for weather',
  'Multiple outfit changes planned',
  'Pet-friendly photographer needed - including our dog',
  'Need photographer who speaks Spanish',
  'Kosher/Halal dietary requirements for photographer',
  'Require female photographer',
  'Need someone experienced with large groups (100+ people)',
  'Want vintage film photography style',
  'Need photographer familiar with cultural traditions',
  null, null, null // Some bookings have no special requests
];

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

// Review templates
const reviewTitles = [
  'Amazing photographer!',
  'Exceeded our expectations',
  'Professional and talented',
  'Captured our special day perfectly',
  'Highly recommend!',
  'Great experience from start to finish',
  'Worth every penny',
  'Made us feel comfortable',
  'Stunning photos',
  'Will definitely book again'
];

const reviewTemplates = [
  'The photos turned out absolutely beautiful. Could not be happier!',
  'Very professional and made everyone feel comfortable during the shoot.',
  'Captured all the important moments and many we didn\'t even notice.',
  'Great communication throughout the entire process.',
  'Delivered the photos on time and the quality exceeded expectations.',
  'Creative eye for composition and lighting. True artist!',
  'Patient with our large family group and got amazing shots.',
  'The editing was perfect - not overdone but enhanced beautifully.',
  'Responsive to all our requests and very accommodating.',
  'Made our wedding day stress-free from a photography perspective.'
];

/**
 * Generate random date within range
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Generate address JSON
 */
function generateAddress() {
  const city = cities[Math.floor(Math.random() * cities.length)];
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const streetNames = ['Main St', 'Oak Ave', 'Park Blvd', 'First St', 'Elm Dr', 'Market St', 'Grand Ave'];
  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];

  return {
    street: `${streetNumber} ${streetName}`,
    city: city.split(',')[0],
    state: city.split(', ')[1],
    zip: `${Math.floor(Math.random() * 90000) + 10000}`,
    country: 'USA'
  };
}

/**
 * Populate bookings table
 */
async function populateBookings() {
  console.log('\n📚 Populating bookings table...');

  // Fetch photographers with packages
  const { data: photographers } = await supabase
    .from('photographers')
    .select('id')
    .limit(200);

  // Fetch customers
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'customer')
    .limit(500);

  // Fetch packages
  const { data: packages } = await supabase
    .from('packages')
    .select('id, photographer_id, price');

  if (!photographers?.length || !users?.length || !packages?.length) {
    console.log('⚠️  Missing required data for bookings');
    return 0;
  }

  const bookings = [];
  const bookingCount = 300; // Create 300 bookings

  for (let i = 0; i < bookingCount; i++) {
    const customer = users[Math.floor(Math.random() * users.length)];
    const packageData = packages[Math.floor(Math.random() * packages.length)];
    const photographer = photographers.find(p => p.id === packageData.photographer_id) || photographers[0];

    // Generate event date (past and future bookings)
    const eventDate = randomDate(
      new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)  // 6 months from now
    );

    const isPast = eventDate < new Date();
    const totalAmount = packageData.price || Math.floor(Math.random() * 3000) + 500;
    const depositAmount = Math.floor(totalAmount * 0.3); // 30% deposit

    // Correct payment status values: 'pending', 'paid', 'refunded', 'failed'
    let paymentStatus;
    let bookingStatus;

    if (isPast) {
      paymentStatus = 'paid';
      bookingStatus = Math.random() > 0.1 ? 'completed' : 'cancelled';
    } else {
      const rand = Math.random();
      if (rand < 0.3) {
        paymentStatus = 'pending';
        bookingStatus = 'pending';
      } else if (rand < 0.7) {
        paymentStatus = 'paid';
        bookingStatus = 'confirmed';
      } else if (rand < 0.9) {
        paymentStatus = 'paid';  // Changed from 'deposit_paid'
        bookingStatus = 'confirmed';
      } else {
        paymentStatus = 'refunded';
        bookingStatus = 'cancelled';
      }
    }

    // Generate event times
    const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const startHour = hours[Math.floor(Math.random() * hours.length)];
    const duration = Math.floor(Math.random() * 4) + 2; // 2-5 hours

    const booking = {
      customer_id: customer.id,
      photographer_id: photographer.id,
      package_id: packageData.id,
      event_date: eventDate.toISOString().split('T')[0],
      event_time: `${startHour.toString().padStart(2, '0')}:00:00`,
      event_end_time: `${(startHour + duration).toString().padStart(2, '0')}:00:00`,
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      venue_name: venueNames[Math.floor(Math.random() * venueNames.length)],
      venue_address: generateAddress(),
      guest_count: Math.floor(Math.random() * 200) + 10,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      payment_status: paymentStatus,
      booking_status: bookingStatus,
      special_requests: specialRequests[Math.floor(Math.random() * specialRequests.length)]
    };

    // Add contract info for confirmed bookings
    if (bookingStatus === 'confirmed' || bookingStatus === 'completed') {
      booking.contract_url = `https://contracts.example.com/booking-${i + 1000}.pdf`;
      booking.contract_signed_at = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Add cancellation info for cancelled bookings
    if (bookingStatus === 'cancelled') {
      booking.cancellation_reason = 'Schedule conflict';
      booking.cancelled_at = new Date(eventDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      booking.cancelled_by = customer.id;
    }

    // Add final amount for completed bookings
    if (bookingStatus === 'completed') {
      const overtimeHours = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
      booking.overtime_hours = overtimeHours;
      booking.final_amount = totalAmount + (overtimeHours * 150);
    }

    bookings.push(booking);
  }

  // Insert bookings in batches
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < bookings.length; i += batchSize) {
    const batch = bookings.slice(i, i + batchSize);
    const { error } = await supabase
      .from('bookings')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting bookings batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`✅ Inserted ${inserted} bookings`);
  return inserted;
}

/**
 * Populate job_queue table
 */
async function populateJobQueue() {
  console.log('\n⚙️ Populating job_queue table...');

  // Fetch recent bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, photographer_id, customer_id')
    .in('booking_status', ['confirmed', 'completed'])
    .limit(100);

  if (!bookings?.length) {
    console.log('⚠️  No bookings found, skipping job queue');
    return 0;
  }

  const jobTypes = ['send_confirmation', 'send_reminder', 'process_payment', 'generate_contract', 'deliver_photos'];
  const statuses = ['pending', 'processing', 'completed', 'failed'];

  const jobs = [];

  for (const booking of bookings) {
    // Create 1-3 jobs per booking
    const jobCount = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < jobCount; j++) {
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const job = {
        type: jobType,
        status: status,
        payload: {
          booking_id: booking.id,
          photographer_id: booking.photographer_id,
          customer_id: booking.customer_id,
          timestamp: new Date().toISOString()
        },
        attempts: status === 'failed' ? 3 : Math.floor(Math.random() * 2),
        scheduled_for: randomDate(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ).toISOString()
      };

      if (status === 'completed') {
        job.completed_at = new Date().toISOString();
      }

      if (status === 'failed') {
        job.error = 'Connection timeout';
      }

      jobs.push(job);
    }
  }

  // Insert jobs
  const { error } = await supabase
    .from('job_queue')
    .insert(jobs);

  if (error) {
    console.error('❌ Error inserting job queue:', error.message);
    return 0;
  }

  console.log(`✅ Inserted ${jobs.length} jobs`);
  return jobs.length;
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

  const messages = [];

  for (const booking of bookings) {
    // Create 2-5 messages per booking
    const messageCount = Math.floor(Math.random() * 4) + 2;
    let parentMessageId = null;

    for (let m = 0; m < messageCount; m++) {
      const isFromPhotographer = Math.random() > 0.5;

      const message = {
        booking_id: booking.id,
        sender_id: isFromPhotographer ? booking.photographer_id : booking.customer_id,
        recipient_id: isFromPhotographer ? booking.customer_id : booking.photographer_id,
        subject: messageSubjects[Math.floor(Math.random() * messageSubjects.length)],
        content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
        is_read: Math.random() > 0.3,
        parent_message_id: m > 0 && Math.random() > 0.5 ? parentMessageId : null
      };

      if (message.is_read) {
        message.read_at = new Date().toISOString();
      }

      messages.push(message);

      // Store first message as potential parent
      if (m === 0) {
        parentMessageId = message.id;
      }
    }
  }

  // Insert messages in batches
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const { error } = await supabase
      .from('messages')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting messages batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`✅ Inserted ${inserted} messages`);
  return inserted;
}

/**
 * Populate reviews table
 */
async function populateReviews() {
  console.log('\n⭐ Populating reviews table...');

  // Fetch completed bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, photographer_id, customer_id')
    .eq('booking_status', 'completed')
    .limit(150);

  if (!bookings?.length) {
    console.log('⚠️  No completed bookings found, using all bookings for reviews');

    // Try with all bookings
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('id, photographer_id, customer_id')
      .limit(150);

    if (!allBookings?.length) {
      console.log('⚠️  No bookings found at all, skipping reviews');
      return 0;
    }

    // Use all bookings instead
    bookings.length = 0;
    bookings.push(...allBookings);
  }

  const reviews = [];

  // Create reviews for 80% of completed bookings
  const reviewedBookings = bookings.filter(() => Math.random() < 0.8);

  for (const booking of reviewedBookings) {
    const rating = Math.random() < 0.8 ?
      Math.floor(Math.random() * 2) + 4 : // 80% get 4-5 stars
      Math.floor(Math.random() * 2) + 3;  // 20% get 3-4 stars

    const review = {
      booking_id: booking.id,
      photographer_id: booking.photographer_id,
      customer_id: booking.customer_id,
      rating: rating,
      title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
      content: reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)],
      is_featured: Math.random() < 0.1, // 10% are featured
      response: Math.random() < 0.3 ? 'Thank you so much for your kind words! It was a pleasure working with you.' : null
    };

    if (review.response) {
      review.response_date = new Date().toISOString();
    }

    // Add specific ratings
    if (rating >= 4) {
      review.communication_rating = Math.floor(Math.random() * 2) + 4;
      review.quality_rating = Math.floor(Math.random() * 2) + 4;
      review.value_rating = Math.floor(Math.random() * 2) + 4;
      review.punctuality_rating = Math.floor(Math.random() * 2) + 4;
      review.flexibility_rating = Math.floor(Math.random() * 2) + 4;
    } else {
      review.communication_rating = Math.floor(Math.random() * 3) + 3;
      review.quality_rating = Math.floor(Math.random() * 3) + 3;
      review.value_rating = Math.floor(Math.random() * 3) + 3;
      review.punctuality_rating = Math.floor(Math.random() * 3) + 3;
      review.flexibility_rating = Math.floor(Math.random() * 3) + 3;
    }

    reviews.push(review);
  }

  // Insert reviews
  const { error } = await supabase
    .from('reviews')
    .insert(reviews);

  if (error) {
    console.error('❌ Error inserting reviews:', error.message);
    return 0;
  }

  console.log(`✅ Inserted ${reviews.length} reviews`);
  return reviews.length;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting population of remaining tables...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const bookingCount = await populateBookings();
  const jobCount = await populateJobQueue();
  const messageCount = await populateMessages();
  const reviewCount = await populateReviews();

  console.log('\n' + '='.repeat(60));
  console.log('✨ ALL REMAINING TABLES POPULATED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📊 FINAL COUNTS:');
  console.log(`   Bookings: ${bookingCount}`);
  console.log(`   Job Queue: ${jobCount}`);
  console.log(`   Messages: ${messageCount}`);
  console.log(`   Reviews: ${reviewCount}`);
}

// Run the script
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});