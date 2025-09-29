#!/usr/bin/env node

/**
 * Populate Remaining Tables Script
 *
 * This script populates bookings, job_queue, messages, and reviews tables
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

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

// Helper function to get random date
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to get future date
function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * 1. Populate Bookings Table
 */
async function populateBookings() {
  console.log('\n📚 Populating bookings table...');

  const { data: photographers } = await supabase
    .from('photographers')
    .select('id')
    .limit(100);

  const { data: customers } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'customer')
    .limit(200);

  const { data: packages } = await supabase
    .from('packages')
    .select('id, photographer_id, base_price')
    .limit(300);

  if (!customers || customers.length === 0) {
    console.log('⚠️  No customers found, skipping bookings');
    return;
  }

  if (!packages || packages.length === 0) {
    console.log('⚠️  No packages found, skipping bookings');
    return;
  }

  const bookings = [];
  const bookingStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  const paymentStatuses = ['pending', 'deposit_paid', 'paid_in_full', 'refunded'];
  const eventTypes = ['wedding', 'engagement', 'portrait', 'corporate', 'birthday', 'graduation', 'maternity', 'newborn'];

  // Create 300-500 bookings
  const numBookings = Math.floor(Math.random() * 200) + 300;

  for (let i = 0; i < numBookings; i++) {
    const photographer = photographers[Math.floor(Math.random() * photographers.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const photographerPackages = packages.filter(p => p.photographer_id === photographer.id);

    if (photographerPackages.length === 0) continue;

    const packageData = photographerPackages[Math.floor(Math.random() * photographerPackages.length)];
    const bookingStatus = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
    const paymentStatus = bookingStatus === 'completed' ? 'paid_in_full' :
                          bookingStatus === 'cancelled' ? 'refunded' :
                          paymentStatuses[Math.floor(Math.random() * 3)];

    const eventDate = getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31));
    const totalAmount = packageData.base_price || 1000;
    const depositAmount = totalAmount * 0.3;

    bookings.push({
      id: uuidv4(),
      customer_id: customer.id,
      photographer_id: photographer.id,
      package_id: packageData.id,
      event_date: eventDate.toISOString().split('T')[0],
      event_time: '14:00:00',
      event_end_time: '18:00:00',
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      venue_name: `Venue ${Math.floor(Math.random() * 100)}`,
      venue_address: {
        street: `${Math.floor(Math.random() * 999) + 100} Main St`,
        city: 'City',
        state: 'State',
        zip: '12345',
        country: 'USA'
      },
      guest_count: Math.floor(Math.random() * 200) + 20,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      payment_status: paymentStatus,
      booking_status: bookingStatus,
      personalization_data: {
        theme: 'classic',
        color_scheme: 'neutral',
        style_preference: 'natural'
      },
      special_requests: Math.random() > 0.7 ? 'Special dietary requirements for photographer' : null,
      overtime_hours: bookingStatus === 'completed' && Math.random() > 0.7 ? Math.random() * 3 : 0,
      final_amount: bookingStatus === 'completed' ? totalAmount + (Math.random() * 500) : null,
      created_at: getRandomDate(new Date(2024, 0, 1), eventDate).toISOString()
    });
  }

  // Insert in batches
  const batchSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < bookings.length; i += batchSize) {
    const batch = bookings.slice(i, Math.min(i + batchSize, bookings.length));
    const { error } = await supabase.from('bookings').insert(batch);

    if (error) {
      console.error('❌ Error inserting bookings:', error.message);
    } else {
      insertedCount += batch.length;
    }
  }

  console.log(`✅ Inserted ${insertedCount} bookings`);
  return bookings;
}

/**
 * 2. Populate Job Queue Table
 */
async function populateJobQueue() {
  console.log('\n⚙️ Populating job_queue table...');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, photographer_id')
    .limit(100);

  if (!bookings || bookings.length === 0) {
    console.log('⚠️  No bookings found, skipping job queue');
    return;
  }

  const jobs = [];
  const uploadStatuses = ['pending', 'processing', 'completed', 'failed'];

  for (const booking of bookings) {
    const uploadStatus = uploadStatuses[Math.floor(Math.random() * uploadStatuses.length)];
    const deadline = getFutureDate(Math.floor(Math.random() * 30));

    jobs.push({
      id: uuidv4(),
      photographer_id: booking.photographer_id,
      booking_id: booking.id,
      upload_status: uploadStatus,
      files_uploaded: uploadStatus === 'completed' ? {
        count: Math.floor(Math.random() * 300) + 50,
        size_mb: Math.floor(Math.random() * 5000) + 500,
        format: 'JPEG'
      } : null,
      overtime_logged: Math.random() > 0.8 ? Math.random() * 3 : 0,
      overtime_approved: Math.random() > 0.5,
      delivery_url: uploadStatus === 'completed' ? `https://gallery.example.com/${booking.id}` : null,
      delivery_password: uploadStatus === 'completed' ? Math.random().toString(36).substring(7) : null,
      deadline: deadline.toISOString().split('T')[0],
      delivered_at: uploadStatus === 'completed' ? getRandomDate(new Date(2024, 0, 1), new Date()).toISOString() : null,
      customer_approved: uploadStatus === 'completed' && Math.random() > 0.3,
      notes: Math.random() > 0.7 ? 'Processing notes here' : null,
      created_at: getRandomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }

  // Insert in batches
  const batchSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, Math.min(i + batchSize, jobs.length));
    const { error } = await supabase.from('job_queue').insert(batch);

    if (error) {
      console.error('❌ Error inserting jobs:', error.message);
    } else {
      insertedCount += batch.length;
    }
  }

  console.log(`✅ Inserted ${insertedCount} job queue items`);
}

/**
 * 3. Populate Messages Table
 */
async function populateMessages() {
  console.log('\n💬 Populating messages table...');

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(100);

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .limit(50);

  if (!users || users.length < 2) {
    console.log('⚠️  Not enough users for messages, skipping');
    return;
  }

  const messages = [];
  const topics = ['booking_inquiry', 'schedule_change', 'payment_question', 'general_question', 'follow_up'];
  const subjects = [
    "Question about your photography services",
    "Booking confirmation",
    "Schedule update request",
    "Payment inquiry",
    "Follow-up on our recent session",
    "Gallery access question",
    "Additional photos request",
    "Thank you for the amazing photos!"
  ];

  const contents = [
    "Hi, I'm interested in booking a session for next month.",
    "Can we discuss the package details?",
    "I need to reschedule our appointment.",
    "The photos look amazing! Thank you so much.",
    "How do I access the online gallery?",
    "Can we add an extra hour to our package?",
    "When will the final edits be ready?",
    "I'd like to order some prints.",
    "Do you travel for destination weddings?",
    "What's your availability for June?"
  ];

  // Create 200-400 messages
  const numMessages = Math.floor(Math.random() * 200) + 200;

  for (let i = 0; i < numMessages; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    const recipient = users[Math.floor(Math.random() * users.length)];

    if (sender.id === recipient.id) continue;

    const hasBooking = bookings && bookings.length > 0 && Math.random() > 0.5;
    const booking = hasBooking ? bookings[Math.floor(Math.random() * bookings.length)] : null;

    messages.push({
      id: uuidv4(),
      booking_id: booking ? booking.id : null,
      sender_id: sender.id,
      recipient_id: recipient.id,
      topic: topics[Math.floor(Math.random() * topics.length)],
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      content: contents[Math.floor(Math.random() * contents.length)],
      is_read: Math.random() > 0.3,
      private: Math.random() > 0.8,
      read_at: Math.random() > 0.3 ? getRandomDate(new Date(2024, 0, 1), new Date()).toISOString() : null,
      payload: {
        priority: Math.random() > 0.8 ? 'high' : 'normal',
        category: 'customer_service'
      },
      attachments: Math.random() > 0.9 ? {
        files: [{
          name: 'document.pdf',
          size: 1024 * Math.floor(Math.random() * 1000),
          type: 'application/pdf'
        }]
      } : null,
      inserted_at: getRandomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }

  // Insert in batches
  const batchSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, Math.min(i + batchSize, messages.length));
    const { error } = await supabase.from('messages').insert(batch);

    if (error) {
      console.error('❌ Error inserting messages:', error.message);
    } else {
      insertedCount += batch.length;
    }
  }

  console.log(`✅ Inserted ${insertedCount} messages`);
}

/**
 * 4. Populate Reviews Table
 */
async function populateReviews() {
  console.log('\n⭐ Populating reviews table...');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, photographer_id, customer_id')
    .eq('booking_status', 'completed')
    .limit(200);

  let reviewBookings = bookings;

  if (!bookings || bookings.length === 0) {
    console.log('⚠️  No completed bookings found, using all bookings for reviews');

    const { data: allBookings } = await supabase
      .from('bookings')
      .select('id, photographer_id, customer_id')
      .limit(200);

    if (!allBookings || allBookings.length === 0) {
      console.log('⚠️  No bookings found at all, skipping reviews');
      return;
    }

    reviewBookings = allBookings;
  }

  const reviews = [];
  const reviewComments = [
    "Absolutely amazing photographer! Captured every special moment perfectly.",
    "Professional, creative, and a joy to work with. Highly recommend!",
    "The photos exceeded our expectations. Beautiful work!",
    "Made everyone feel comfortable and the results were stunning.",
    "Incredible attention to detail and wonderful communication throughout.",
    "Our photos are absolutely beautiful. Thank you so much!",
    "Very professional and delivered exactly what we wanted.",
    "Great eye for composition and lighting. Love our photos!",
    "Went above and beyond to capture perfect shots.",
    "The best photographer we could have asked for!",
    "Friendly, punctual, and incredibly talented.",
    "Made our special day even more memorable with these photos.",
    "Creative vision and flawless execution. 5 stars!",
    "Patient with our large group and got amazing shots.",
    "The photos tell our story perfectly. So grateful!",
    "Professional equipment and expertise really showed.",
    "Captured emotions and moments we'll treasure forever.",
    "Excellent communication before, during, and after the event.",
    "The editing and final delivery exceeded expectations.",
    "Would book again in a heartbeat! Fantastic experience."
  ];

  const photoUrls = [
    'https://images.unsplash.com/photo-wedding-1',
    'https://images.unsplash.com/photo-wedding-2',
    'https://images.unsplash.com/photo-portrait-1',
    'https://images.unsplash.com/photo-portrait-2',
    'https://images.unsplash.com/photo-event-1'
  ];

  // Create reviews for 80% of completed bookings
  for (const booking of reviewBookings) {
    if (Math.random() > 0.2) { // 80% chance of review
      const rating = Math.random() > 0.1 ? Math.floor(Math.random() * 2) + 4 : 3; // Mostly 4-5 stars
      const hasPhotos = Math.random() > 0.6; // 40% chance of including photos

      reviews.push({
        id: uuidv4(),
        booking_id: booking.id,
        reviewer_id: booking.customer_id,
        photographer_id: booking.photographer_id,
        rating: rating,
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
        is_featured: rating === 5 && Math.random() > 0.8,
        is_verified: true,
        helpful_count: Math.floor(Math.random() * 100),
        response: Math.random() > 0.7 ? "Thank you so much for your kind words! It was a pleasure working with you." : null,
        response_at: Math.random() > 0.7 ? getRandomDate(new Date(2024, 0, 1), new Date()).toISOString() : null,
        photos: hasPhotos ? [
          photoUrls[Math.floor(Math.random() * photoUrls.length)],
          photoUrls[Math.floor(Math.random() * photoUrls.length)]
        ] : [],
        created_at: getRandomDate(new Date(2024, 0, 1), new Date()).toISOString()
      });
    }
  }

  // Insert in batches
  const batchSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, Math.min(i + batchSize, reviews.length));
    const { error } = await supabase.from('reviews').insert(batch);

    if (error) {
      console.error('❌ Error inserting reviews:', error.message);
    } else {
      insertedCount += batch.length;
    }
  }

  console.log(`✅ Inserted ${insertedCount} reviews`);
}

/**
 * Main function to run all population scripts
 */
async function populateRemainingTables() {
  console.log('🚀 Starting population of remaining tables...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  try {
    await populateBookings();
    await populateJobQueue();
    await populateMessages();
    await populateReviews();

    console.log('\n' + '='.repeat(60));
    console.log('✨ ALL REMAINING TABLES POPULATED SUCCESSFULLY!');
    console.log('='.repeat(60));

    // Verify the data
    const { data: bookingCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    const { data: jobCount } = await supabase
      .from('job_queue')
      .select('id', { count: 'exact', head: true });

    const { data: messageCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true });

    const { data: reviewCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true });

    console.log('\n📊 FINAL COUNTS:');
    console.log(`   Bookings: ${bookingCount || 0}`);
    console.log(`   Job Queue: ${jobCount || 0}`);
    console.log(`   Messages: ${messageCount || 0}`);
    console.log(`   Reviews: ${reviewCount || 0}`);

  } catch (error) {
    console.error('💥 Fatal error during population:', error);
    process.exit(1);
  }
}

// Run the population
populateRemainingTables().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});