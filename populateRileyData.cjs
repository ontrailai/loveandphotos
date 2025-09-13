#!/usr/bin/env node

/**
 * Populate Test Data for Riley's Users
 *
 * This script creates test data for the two specific users:
 * - Customer: rileympasha@gmail.com
 * - Photographer: rileypashajrb@gmail.com
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

// User IDs
const CUSTOMER_ID = 'b508d330-e320-45bb-a0c9-954505a52d85'; // rileympasha@gmail.com
const PHOTOGRAPHER_ID = '9000e0f6-646c-4f1f-9e02-33e1b0f8c8a0'; // rileypashajrb@gmail.com

/**
 * Create/Update photographer profile
 */
async function createPhotographerProfile() {
  console.log('\n📸 Creating photographer profile for rileypashajrb@gmail.com...');

  // Check if photographer already exists
  const { data: existing } = await supabase
    .from('photographers')
    .select('id')
    .eq('id', PHOTOGRAPHER_ID)
    .single();

  const photographerData = {
    id: PHOTOGRAPHER_ID,
    user_id: PHOTOGRAPHER_ID, // Add user_id field
    experience_years: 8,
    camera_type: ['Canon R5', 'Sony A7R IV'],
    equipment_list: [
      'Canon R5 Body',
      'Sony A7R IV Body',
      'Canon RF 24-70mm f/2.8L',
      'Canon RF 70-200mm f/2.8L',
      'Sony FE 85mm f/1.4 GM',
      'Profoto B10 Plus (2x)',
      'DJI Ronin-S Gimbal',
      'Adobe Creative Suite'
    ],
    pay_tier_id: 3, // Gold tier
    portfolio_url: 'https://500px.com/rileypasha',
    website_url: 'https://www.rileypashaphotography.com',
    instagram_handle: '@rileypashaphoto',
    trust_badges: ['Google Verified', 'Instagram Professional', 'Top Rated 2024']
  };

  if (existing) {
    const { error } = await supabase
      .from('photographers')
      .update(photographerData)
      .eq('id', PHOTOGRAPHER_ID);

    if (error) {
      console.error('❌ Failed to update photographer:', error.message);
    } else {
      console.log('✅ Updated photographer profile');
    }
  } else {
    const { error } = await supabase
      .from('photographers')
      .insert(photographerData);

    if (error) {
      console.error('❌ Failed to create photographer:', error.message);
    } else {
      console.log('✅ Created photographer profile');
    }
  }

  // Update photographer_preview_profiles
  const { error: previewError } = await supabase
    .from('photographer_preview_profiles')
    .upsert({
      id: PHOTOGRAPHER_ID,
      user_id: PHOTOGRAPHER_ID,
      display_name: 'Riley Pasha Photography',
      bio: 'Professional photographer specializing in weddings, portraits, and events. 8+ years of experience capturing life\'s most precious moments.',
      location: 'Los Angeles, CA',
      specialties: ['Wedding', 'Portrait', 'Event', 'Fashion', 'Commercial'],
      profile_image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rileypasha',
      portfolio_images: [
        'https://images.unsplash.com/photo-1606216265946-61bb0cfc1e10',
        'https://images.unsplash.com/photo-1519741497674-611481863552',
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc',
        'https://images.unsplash.com/photo-1465495976277-4387d53b9b14'
      ],
      rating: 4.9,
      review_count: 127,
      verified: true,
      claimed_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (previewError) {
    console.error('❌ Failed to update preview profile:', previewError.message);
  } else {
    console.log('✅ Updated photographer preview profile');
  }
}

/**
 * Create packages for photographer
 */
async function createPackages() {
  console.log('\n📦 Creating packages for photographer...');

  const packages = [
    {
      photographer_id: PHOTOGRAPHER_ID,
      title: 'Essential Wedding Package',
      description: '6 hours of coverage, perfect for intimate weddings',
      base_price: 2500,
      duration_minutes: 360,
      deliverables: {
        edited_photos: 300,
        prints: '20 8x10 prints',
        digital_gallery: true,
        usb_drive: true
      },
      includes: [
        '6 hours of photography',
        '1 photographer',
        '300+ edited images',
        'Online gallery for 1 year',
        'Print release'
      ],
      max_guests: 100,
      is_active: true,
      is_featured: false
    },
    {
      photographer_id: PHOTOGRAPHER_ID,
      title: 'Premium Wedding Package',
      description: 'Full day coverage with second shooter',
      base_price: 4500,
      duration_minutes: 600,
      deliverables: {
        edited_photos: 600,
        prints: '40 8x10 prints',
        album: '12x12 premium album',
        digital_gallery: true,
        usb_drive: true
      },
      includes: [
        '10 hours of photography',
        '2 photographers',
        '600+ edited images',
        'Engagement session included',
        'Premium leather album',
        'Online gallery for 2 years'
      ],
      max_guests: 250,
      is_active: true,
      is_featured: true
    },
    {
      photographer_id: PHOTOGRAPHER_ID,
      title: 'Portrait Session',
      description: 'Professional portrait session for individuals or families',
      base_price: 450,
      duration_minutes: 90,
      deliverables: {
        edited_photos: 50,
        prints: '5 8x10 prints',
        digital_gallery: true
      },
      includes: [
        '90 minute session',
        '2 locations',
        '50+ edited images',
        'Online gallery',
        'Print release'
      ],
      max_guests: 10,
      is_active: true,
      is_featured: false
    }
  ];

  for (const pkg of packages) {
    const { error } = await supabase
      .from('packages')
      .insert(pkg);

    if (error) {
      console.error(`❌ Failed to create package ${pkg.title}:`, error.message);
    } else {
      console.log(`✅ Created package: ${pkg.title}`);
    }
  }
}

/**
 * Create portfolio items
 */
async function createPortfolioItems() {
  console.log('\n🖼️ Creating portfolio items...');

  const portfolioItems = [
    {
      photographer_id: PHOTOGRAPHER_ID,
      title: 'Sunset Beach Wedding',
      image_url: 'https://images.unsplash.com/photo-1606216265946-61bb0cfc1e10',
      category: 'Wedding',
      tags: ['wedding', 'beach', 'sunset', 'romantic'],
      is_featured: true
    },
    {
      photographer_id: PHOTOGRAPHER_ID,
      title: 'Garden Wedding Ceremony',
      image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552',
      category: 'Wedding',
      tags: ['wedding', 'garden', 'ceremony', 'outdoor'],
      is_featured: true
    },
    {
      photographer_id: PHOTOGRAPHER_ID,
      title: 'Urban Portrait Session',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      category: 'Portrait',
      tags: ['portrait', 'urban', 'professional', 'headshot'],
      is_featured: false
    },
    {
      photographer_id: PHOTOGRAPHER_ID,
      title: 'Family Beach Session',
      image_url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300',
      category: 'Family',
      tags: ['family', 'beach', 'lifestyle', 'candid'],
      is_featured: false
    },
    {
      photographer_id: PHOTOGRAPHER_ID,
      title: 'Corporate Event Coverage',
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
      category: 'Event',
      tags: ['event', 'corporate', 'conference', 'professional'],
      is_featured: false
    }
  ];

  for (const item of portfolioItems) {
    const { error } = await supabase
      .from('portfolio_items')
      .insert(item);

    if (error) {
      console.error(`❌ Failed to create portfolio item ${item.title}:`, error.message);
    } else {
      console.log(`✅ Created portfolio item: ${item.title}`);
    }
  }
}

/**
 * Create bookings between customer and photographer
 */
async function createBookings() {
  console.log('\n📅 Creating bookings...');

  // Get photographer's packages
  const { data: packages } = await supabase
    .from('packages')
    .select('id, title, base_price')
    .eq('photographer_id', PHOTOGRAPHER_ID);

  if (!packages?.length) {
    console.log('⚠️  No packages found for photographer');
    return [];
  }

  const bookings = [
    {
      customer_id: CUSTOMER_ID,
      photographer_id: PHOTOGRAPHER_ID,
      package_id: packages[0].id,
      event_date: '2025-03-15',
      event_time: '14:00:00',
      event_end_time: '20:00:00',
      event_type: 'Wedding',
      venue_name: 'Sunset Beach Resort',
      venue_address: {
        street: '1234 Ocean Drive',
        city: 'Malibu',
        state: 'CA',
        zip: '90265',
        country: 'USA'
      },
      guest_count: 75,
      total_amount: packages[0].base_price,
      deposit_amount: packages[0].base_price * 0.3,
      payment_status: 'paid',
      booking_status: 'confirmed',
      special_requests: 'Please focus on candid shots during the reception',
      contract_url: 'https://contracts.example.com/riley-wedding.pdf',
      contract_signed_at: new Date().toISOString()
    },
    {
      customer_id: CUSTOMER_ID,
      photographer_id: PHOTOGRAPHER_ID,
      package_id: packages[2]?.id || packages[0].id,
      event_date: '2024-12-20',
      event_time: '10:00:00',
      event_end_time: '11:30:00',
      event_type: 'Portrait Session',
      venue_name: 'Griffith Observatory',
      venue_address: {
        street: '2800 E Observatory Rd',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90027',
        country: 'USA'
      },
      guest_count: 4,
      total_amount: 450,
      deposit_amount: 150,
      payment_status: 'paid',
      booking_status: 'completed',
      final_amount: 450,
      special_requests: 'Family holiday portraits'
    }
  ];

  const createdBookings = [];

  for (const booking of bookings) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to create booking:`, error.message);
    } else {
      console.log(`✅ Created booking for ${booking.event_type}`);
      createdBookings.push(data);
    }
  }

  return createdBookings;
}

/**
 * Create messages between users
 */
async function createMessages(bookingIds) {
  console.log('\n💬 Creating messages...');

  if (!bookingIds?.length) {
    console.log('⚠️  No bookings to create messages for');
    return;
  }

  const messages = [
    {
      booking_id: bookingIds[0],
      sender_id: CUSTOMER_ID,
      recipient_id: PHOTOGRAPHER_ID,
      subject: 'Wedding Photography Inquiry',
      content: 'Hi! I saw your portfolio and I\'m interested in booking you for my wedding on March 15th. Are you available?',
      is_read: true,
      read_at: new Date().toISOString()
    },
    {
      booking_id: bookingIds[0],
      sender_id: PHOTOGRAPHER_ID,
      recipient_id: CUSTOMER_ID,
      subject: 'Re: Wedding Photography Inquiry',
      content: 'Hello! Thank you for reaching out. Yes, I\'m available on March 15th! I\'d love to discuss your vision for the day.',
      is_read: true,
      read_at: new Date().toISOString()
    },
    {
      booking_id: bookingIds[0],
      sender_id: CUSTOMER_ID,
      recipient_id: PHOTOGRAPHER_ID,
      subject: 'Venue Details',
      content: 'Great! The wedding will be at Sunset Beach Resort in Malibu. We\'re expecting about 75 guests.',
      is_read: true,
      read_at: new Date().toISOString()
    },
    {
      booking_id: bookingIds[0],
      sender_id: PHOTOGRAPHER_ID,
      recipient_id: CUSTOMER_ID,
      subject: 'Contract and Timeline',
      content: 'Perfect! I\'ve sent over the contract and a proposed timeline for the day. Let me know if you have any questions!',
      is_read: false
    }
  ];

  for (const message of messages) {
    const { error } = await supabase
      .from('messages')
      .insert(message);

    if (error) {
      console.error(`❌ Failed to create message:`, error.message);
    } else {
      console.log(`✅ Created message: ${message.subject}`);
    }
  }
}

/**
 * Create reviews
 */
async function createReviews(bookingIds) {
  console.log('\n⭐ Creating reviews...');

  // Only create review for completed booking
  const completedBookingId = bookingIds.find(id => id); // Get the second booking if it exists

  if (!completedBookingId) {
    console.log('⚠️  No completed bookings to review');
    return;
  }

  const review = {
    booking_id: bookingIds[1] || bookingIds[0],
    reviewer_id: CUSTOMER_ID,
    photographer_id: PHOTOGRAPHER_ID,
    rating: 5,
    comment: 'Riley did an amazing job with our family portraits! Very professional, great with kids, and the photos turned out beautiful. The turnaround time was quick and the online gallery was easy to use. Highly recommend!',
    is_featured: true,
    is_verified: true,
    helpful_count: 15,
    response: 'Thank you so much for the kind words! It was a pleasure working with your family. Looking forward to our next session!',
    response_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('reviews')
    .insert(review);

  if (error) {
    console.error('❌ Failed to create review:', error.message);
  } else {
    console.log('✅ Created review');
  }
}

/**
 * Create availability
 */
async function createAvailability() {
  console.log('\n📆 Creating availability...');

  const availability = [];
  const startDate = new Date();

  // Create availability for next 60 days
  for (let i = 0; i < 60; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Skip some random days (photographer is booked)
    if (Math.random() > 0.8) continue;

    availability.push({
      photographer_id: PHOTOGRAPHER_ID,
      date: date.toISOString().split('T')[0],
      is_available: true,
      time_slots: ['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'],
      notes: i % 7 === 0 ? 'Weekend - Premium rates apply' : null
    });
  }

  // Insert in batches
  const batchSize = 30;
  for (let i = 0; i < availability.length; i += batchSize) {
    const batch = availability.slice(i, i + batchSize);
    const { error } = await supabase
      .from('availability')
      .insert(batch);

    if (error) {
      console.error(`❌ Failed to create availability batch:`, error.message);
    } else {
      console.log(`✅ Created ${batch.length} availability entries`);
    }
  }
}

/**
 * Create job queue entries
 */
async function createJobQueue(bookingIds) {
  console.log('\n⚙️ Creating job queue entries...');

  if (!bookingIds?.length) {
    console.log('⚠️  No bookings to create jobs for');
    return;
  }

  // Create job for completed booking
  if (bookingIds[1]) {
    const job = {
      photographer_id: PHOTOGRAPHER_ID,
      booking_id: bookingIds[1],
      upload_status: 'completed',
      files_uploaded: 127,
      overtime_logged: 0,
      overtime_approved: false,
      delivery_url: 'https://gallery.rileypasha.com/family-portraits-2024',
      delivery_password: 'FAM2024',
      deadline: '2024-12-27',
      delivered_at: '2024-12-25',
      customer_approved: true,
      notes: 'Holiday family portraits - Delivered early for Christmas'
    };

    const { error } = await supabase
      .from('job_queue')
      .insert(job);

    if (error) {
      console.error('❌ Failed to create job queue entry:', error.message);
    } else {
      console.log('✅ Created job queue entry for completed booking');
    }
  }

  // Create job for upcoming booking
  if (bookingIds[0]) {
    const job = {
      photographer_id: PHOTOGRAPHER_ID,
      booking_id: bookingIds[0],
      upload_status: 'pending',
      files_uploaded: 0,
      overtime_logged: 0,
      overtime_approved: false,
      deadline: '2025-04-15',
      notes: 'Wedding - Sunset Beach Resort'
    };

    const { error } = await supabase
      .from('job_queue')
      .insert(job);

    if (error) {
      console.error('❌ Failed to create job queue entry:', error.message);
    } else {
      console.log('✅ Created job queue entry for upcoming booking');
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Creating test data for Riley\'s users...');
  console.log(`📧 Customer: rileympasha@gmail.com`);
  console.log(`📸 Photographer: rileypashajrb@gmail.com`);
  console.log('');

  // Create photographer profile and related data
  await createPhotographerProfile();
  await createPackages();
  await createPortfolioItems();
  await createAvailability();

  // Create bookings and related data
  const bookingIds = await createBookings();

  if (bookingIds.length > 0) {
    await createMessages(bookingIds.map(b => b.id));
    await createReviews(bookingIds.map(b => b.id));
    await createJobQueue(bookingIds.map(b => b.id));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ TEST DATA CREATION COMPLETE!');
  console.log('='.repeat(60));
  console.log('\n📊 Created data in the following tables:');
  console.log('   ✅ photographers');
  console.log('   ✅ photographer_preview_profiles');
  console.log('   ✅ packages');
  console.log('   ✅ portfolio_items');
  console.log('   ✅ availability');
  console.log('   ✅ bookings');
  console.log('   ✅ messages');
  console.log('   ✅ reviews');
  console.log('   ✅ job_queue');
  console.log('\nYour users now have comprehensive test data across all tables!');
}

// Run the script
main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});