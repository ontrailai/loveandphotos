#!/usr/bin/env node

/**
 * Populate All Tables Script
 *
 * This script populates availability, bookings, job_queue, messages,
 * packages, reviews, and training_status tables with test data
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
 * 1. Populate Packages Table
 */
async function populatePackages() {
  console.log('\n📦 Populating packages table...');

  const { data: photographers } = await supabase
    .from('photographers')
    .select('id, pay_tier_id')
    .limit(200);

  const packages = [];
  const packageTypes = [
    { name: 'Basic Photography', duration: 2, deliverables: 50 },
    { name: 'Standard Package', duration: 4, deliverables: 100 },
    { name: 'Premium Coverage', duration: 8, deliverables: 200 },
    { name: 'Full Day Package', duration: 10, deliverables: 300 },
    { name: 'Mini Session', duration: 1, deliverables: 25 },
    { name: 'Engagement Session', duration: 2, deliverables: 75 },
    { name: 'Wedding Package', duration: 8, deliverables: 400 },
    { name: 'Event Coverage', duration: 6, deliverables: 150 }
  ];

  for (const photographer of photographers) {
    // Each photographer gets 2-4 packages
    const numPackages = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numPackages; i++) {
      const packageType = packageTypes[Math.floor(Math.random() * packageTypes.length)];
      const basePrice = photographer.pay_tier_id * 150; // Base on tier

      packages.push({
        id: uuidv4(),
        photographer_id: photographer.id,
        name: packageType.name,
        description: `Professional ${packageType.name.toLowerCase()} with ${packageType.deliverables} edited photos`,
        price: basePrice * (packageType.duration / 2),
        duration_hours: packageType.duration,
        includes_items: [
          `${packageType.duration} hours of coverage`,
          `${packageType.deliverables} edited photos`,
          'Online gallery',
          'Print release',
          packageType.duration >= 4 ? 'Second shooter' : null,
          packageType.duration >= 8 ? 'Album included' : null
        ].filter(Boolean),
        max_revisions: Math.min(3, Math.floor(packageType.duration / 2)),
        delivery_time_days: Math.max(7, packageType.deliverables / 20),
        is_active: Math.random() > 0.1,
        created_at: getRandomDate(new Date(2024, 0, 1), new Date())
      });
    }
  }

  // Insert in batches
  const batchSize = 100;
  let insertedCount = 0;

  for (let i = 0; i < packages.length; i += batchSize) {
    const batch = packages.slice(i, Math.min(i + batchSize, packages.length));
    const { error } = await supabase.from('packages').insert(batch);

    if (error) {
      console.error('❌ Error inserting packages:', error.message);
    } else {
      insertedCount += batch.length;
    }
  }

  console.log(`✅ Inserted ${insertedCount} packages`);
  return packages;
}

/**
 * 2. Populate Availability Table
 */
async function populateAvailability() {
  console.log('\n📅 Populating availability table...');

  const { data: photographers } = await supabase
    .from('photographers')
    .select('id')
    .limit(200);

  const availability = [];
  const today = new Date();

  for (const photographer of photographers) {
    // Generate availability for next 3 months
    for (let dayOffset = 0; dayOffset < 90; dayOffset += Math.floor(Math.random() * 3) + 1) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // 70% chance of being available on any given day
      if (Math.random() < 0.7) {
        const startHour = Math.floor(Math.random() * 4) + 8; // 8-11 AM start
        const endHour = Math.floor(Math.random() * 4) + 17; // 5-8 PM end

        availability.push({
          id: uuidv4(),
          photographer_id: photographer.id,
          date: date.toISOString().split('T')[0],
          start_time: `${startHour.toString().padStart(2, '0')}:00:00`,
          end_time: `${endHour.toString().padStart(2, '0')}:00:00`,
          is_available: true,
          notes: Math.random() > 0.8 ? 'Preferred time slot' : null,
          created_at: today.toISOString()
        });
      }
    }
  }

  // Insert in batches
  const batchSize = 500;
  let insertedCount = 0;

  for (let i = 0; i < availability.length; i += batchSize) {
    const batch = availability.slice(i, Math.min(i + batchSize, availability.length));
    const { error } = await supabase.from('availability').insert(batch);

    if (error) {
      console.error('❌ Error inserting availability:', error.message);
    } else {
      insertedCount += batch.length;
    }
  }

  console.log(`✅ Inserted ${insertedCount} availability slots`);
}

/**
 * 3. Populate Bookings Table
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
    .select('id, photographer_id, price')
    .limit(300);

  if (!customers || customers.length === 0) {
    console.log('⚠️  No customers found, skipping bookings');
    return;
  }

  const bookings = [];
  const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  const eventTypes = ['wedding', 'engagement', 'portrait', 'corporate', 'birthday', 'graduation'];

  // Create 200-500 bookings
  const numBookings = Math.floor(Math.random() * 300) + 200;

  for (let i = 0; i < numBookings; i++) {
    const photographer = photographers[Math.floor(Math.random() * photographers.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const photographerPackages = packages.filter(p => p.photographer_id === photographer.id);

    if (photographerPackages.length === 0) continue;

    const package = photographerPackages[Math.floor(Math.random() * photographerPackages.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const eventDate = getRandomDate(new Date(2024, 0, 1), new Date(2025, 11, 31));

    bookings.push({
      id: uuidv4(),
      photographer_id: photographer.id,
      customer_id: customer.id,
      package_id: package.id,
      event_date: eventDate.toISOString().split('T')[0],
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      location: `${Math.floor(Math.random() * 999) + 100} Main St, City, State`,
      status: status,
      total_price: package.price,
      deposit_paid: status !== 'pending' ? package.price * 0.3 : 0,
      is_paid_full: status === 'completed',
      notes: Math.random() > 0.7 ? 'Special requirements noted' : null,
      created_at: getRandomDate(new Date(2024, 0, 1), eventDate).toISOString()
    });
  }

  // Insert in batches
  const batchSize = 100;
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
 * 4. Populate Reviews Table
 */
async function populateReviews() {
  console.log('\n⭐ Populating reviews table...');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, photographer_id, customer_id')
    .eq('status', 'completed')
    .limit(150);

  if (!bookings || bookings.length === 0) {
    console.log('⚠️  No completed bookings found, creating standalone reviews');

    // Create standalone reviews
    const { data: photographers } = await supabase
      .from('photographers')
      .select('id')
      .limit(100);

    const { data: customers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'customer')
      .limit(100);

    if (!customers || customers.length === 0) {
      console.log('⚠️  No customers found, skipping reviews');
      return;
    }

    bookings = [];
    for (let i = 0; i < 150; i++) {
      bookings.push({
        id: null,
        photographer_id: photographers[Math.floor(Math.random() * photographers.length)].id,
        customer_id: customers[Math.floor(Math.random() * customers.length)].id
      });
    }
  }

  const reviews = [];
  const reviewTexts = [
    "Amazing photographer! Captured our special day perfectly.",
    "Very professional and creative. Highly recommend!",
    "Great attention to detail and wonderful to work with.",
    "The photos exceeded our expectations. Beautiful work!",
    "Friendly, professional, and delivered stunning photos.",
    "Made everyone feel comfortable and the results were fantastic.",
    "Incredible eye for composition and lighting.",
    "Went above and beyond to get the perfect shots.",
    "Absolutely loved working with this photographer!",
    "The best investment we made for our event."
  ];

  for (const booking of bookings) {
    const rating = Math.random() > 0.2 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 2) + 3; // Mostly 4-5 stars

    reviews.push({
      id: uuidv4(),
      photographer_id: booking.photographer_id,
      customer_id: booking.customer_id,
      booking_id: booking.id,
      rating: rating,
      comment: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      is_verified: Math.random() > 0.2,
      helpful_count: Math.floor(Math.random() * 50),
      created_at: getRandomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }

  // Insert in batches
  const batchSize = 100;
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
 * 5. Populate Messages Table
 */
async function populateMessages() {
  console.log('\n💬 Populating messages table...');

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(100);

  if (!users || users.length < 2) {
    console.log('⚠️  Not enough users for messages, skipping');
    return;
  }

  const messages = [];
  const messageTemplates = [
    "Hi, I'm interested in your photography services.",
    "What are your rates for a wedding?",
    "Are you available on [date]?",
    "Thank you for the quick response!",
    "Can we schedule a consultation?",
    "I love your portfolio! Can we discuss packages?",
    "What's included in your standard package?",
    "Do you travel for events?",
    "How far in advance should I book?",
    "Can you send me more samples of your work?"
  ];

  // Create 100-200 message threads
  const numThreads = Math.floor(Math.random() * 100) + 100;

  for (let i = 0; i < numThreads; i++) {
    const sender = users[Math.floor(Math.random() * users.length)];
    const receiver = users[Math.floor(Math.random() * users.length)];

    if (sender.id === receiver.id) continue;

    // Create 1-5 messages in thread
    const numMessages = Math.floor(Math.random() * 5) + 1;
    let threadId = uuidv4();

    for (let j = 0; j < numMessages; j++) {
      const isReply = j > 0;
      messages.push({
        id: uuidv4(),
        sender_id: j % 2 === 0 ? sender.id : receiver.id,
        receiver_id: j % 2 === 0 ? receiver.id : sender.id,
        thread_id: threadId,
        subject: !isReply ? "Photography Inquiry" : null,
        message: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
        is_read: Math.random() > 0.3,
        is_archived: Math.random() > 0.9,
        created_at: getRandomDate(new Date(2024, 0, 1), new Date()).toISOString()
      });
    }
  }

  // Insert in batches
  const batchSize = 100;
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
 * 6. Populate Job Queue Table
 */
async function populateJobQueue() {
  console.log('\n⚙️ Populating job_queue table...');

  const jobs = [];
  const jobTypes = ['email_notification', 'image_processing', 'backup_photos', 'generate_report', 'send_reminder'];
  const statuses = ['pending', 'processing', 'completed', 'failed'];

  // Create 50-100 jobs
  const numJobs = Math.floor(Math.random() * 50) + 50;

  for (let i = 0; i < numJobs; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = getRandomDate(new Date(2024, 0, 1), new Date());

    jobs.push({
      id: uuidv4(),
      job_type: jobTypes[Math.floor(Math.random() * jobTypes.length)],
      status: status,
      payload: JSON.stringify({
        user_id: uuidv4(),
        action: 'process',
        timestamp: createdAt.toISOString()
      }),
      attempts: status === 'failed' ? 3 : status === 'completed' ? 1 : 0,
      error_message: status === 'failed' ? 'Connection timeout' : null,
      scheduled_for: getFutureDate(Math.floor(Math.random() * 7)).toISOString(),
      created_at: createdAt.toISOString(),
      updated_at: status !== 'pending' ? new Date().toISOString() : createdAt.toISOString()
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

  console.log(`✅ Inserted ${insertedCount} jobs`);
}

/**
 * 7. Populate Training Status Table
 */
async function populateTrainingStatus() {
  console.log('\n🎓 Populating training_status table...');

  const { data: photographers } = await supabase
    .from('photographers')
    .select('id, user_id')
    .limit(150);

  const { data: modules } = await supabase
    .from('training_modules')
    .select('id');

  if (!modules || modules.length === 0) {
    console.log('⚠️  No training modules found, creating default modules first');

    // Create default training modules
    const defaultModules = [
      { id: uuidv4(), title: 'Platform Basics', description: 'Getting started with the platform', category: 'onboarding', difficulty_level: 'beginner', duration_minutes: 30, is_required: true },
      { id: uuidv4(), title: 'Client Communication', description: 'Best practices for client interaction', category: 'professional', difficulty_level: 'intermediate', duration_minutes: 45, is_required: true },
      { id: uuidv4(), title: 'Portfolio Optimization', description: 'Creating a stunning portfolio', category: 'marketing', difficulty_level: 'intermediate', duration_minutes: 60, is_required: false },
      { id: uuidv4(), title: 'Pricing Strategies', description: 'How to price your services', category: 'business', difficulty_level: 'advanced', duration_minutes: 90, is_required: false },
      { id: uuidv4(), title: 'Legal & Contracts', description: 'Understanding photography contracts', category: 'legal', difficulty_level: 'advanced', duration_minutes: 120, is_required: true }
    ];

    const { data: insertedModules, error } = await supabase
      .from('training_modules')
      .insert(defaultModules)
      .select();

    if (error) {
      console.error('❌ Error creating training modules:', error.message);
      return;
    }

    modules = insertedModules;
  }

  const trainingStatuses = [];

  for (const photographer of photographers) {
    // Each photographer completes 1-5 modules
    const numModules = Math.floor(Math.random() * modules.length) + 1;
    const selectedModules = [...modules].sort(() => 0.5 - Math.random()).slice(0, numModules);

    for (const module of selectedModules) {
      const startedAt = getRandomDate(new Date(2024, 0, 1), new Date());
      const isCompleted = Math.random() > 0.3;

      trainingStatuses.push({
        id: uuidv4(),
        user_id: photographer.user_id,
        module_id: module.id,
        status: isCompleted ? 'completed' : Math.random() > 0.5 ? 'in_progress' : 'not_started',
        progress_percentage: isCompleted ? 100 : Math.floor(Math.random() * 80),
        quiz_score: isCompleted ? Math.floor(Math.random() * 30) + 70 : null,
        time_spent_minutes: Math.floor(Math.random() * 120) + 10,
        started_at: startedAt.toISOString(),
        completed_at: isCompleted ? getRandomDate(startedAt, new Date()).toISOString() : null,
        created_at: startedAt.toISOString()
      });
    }
  }

  // Insert in batches
  const batchSize = 100;
  let insertedCount = 0;

  for (let i = 0; i < trainingStatuses.length; i += batchSize) {
    const batch = trainingStatuses.slice(i, Math.min(i + batchSize, trainingStatuses.length));
    const { error } = await supabase.from('training_status').insert(batch);

    if (error) {
      console.error('❌ Error inserting training status:', error.message);
    } else {
      insertedCount += batch.length;
    }
  }

  console.log(`✅ Inserted ${insertedCount} training status records`);
}

/**
 * Main function to run all population scripts
 */
async function populateAllTables() {
  console.log('🚀 Starting comprehensive table population...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  try {
    await populatePackages();
    await populateAvailability();
    await populateBookings();
    await populateReviews();
    await populateMessages();
    await populateJobQueue();
    await populateTrainingStatus();

    console.log('\n' + '='.repeat(60));
    console.log('✨ ALL TABLES POPULATED SUCCESSFULLY!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('💥 Fatal error during population:', error);
    process.exit(1);
  }
}

// Run the population
populateAllTables().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});