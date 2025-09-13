/**
 * Test data fixtures for consistent testing
 * Provides predefined data sets for various test scenarios
 */

// Sample users
export const testUsers = {
  validUser: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+1234567890',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },

  anotherUser: {
    id: 'user-456',
    email: 'another@example.com',
    name: 'Another User',
    phone: '+0987654321',
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z'
  },

  photographerUser: {
    id: 'user-photographer-789',
    email: 'photographer@example.com',
    name: 'John Photographer',
    phone: '+1122334455',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z'
  }
};

// Sample photographers
export const testPhotographers = {
  established: {
    id: 'photographer-123',
    user_id: 'user-photographer-789',
    business_name: 'Capture Moments Photography',
    location: 'New York, NY',
    price_range: '$1000-$2000',
    rating: 4.8,
    review_count: 127,
    bio: 'Professional photographer specializing in weddings and events with 10+ years experience.',
    website: 'https://capturemoments.com',
    instagram: '@capturemoments',
    portfolio_images: [
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800'
    ],
    specialties: ['weddings', 'engagement', 'events'],
    equipment: ['Canon 5D Mark IV', 'Sony A7R IV', 'Professional lighting'],
    years_experience: 10,
    travel_radius: 50,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  },

  newbie: {
    id: 'photographer-456',
    user_id: 'user-456',
    business_name: 'Fresh Focus Photography',
    location: 'Los Angeles, CA',
    price_range: '$300-$600',
    rating: 4.2,
    review_count: 8,
    bio: 'Enthusiastic new photographer eager to capture your special moments.',
    website: null,
    instagram: '@freshfocus',
    portfolio_images: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'
    ],
    specialties: ['portraits', 'family'],
    equipment: ['Canon EOS Rebel', 'Basic lighting'],
    years_experience: 1,
    travel_radius: 25,
    created_at: '2024-01-25T16:00:00Z',
    updated_at: '2024-01-25T16:00:00Z'
  },

  premium: {
    id: 'photographer-789',
    user_id: 'user-123',
    business_name: 'Elite Photography Studio',
    location: 'Miami, FL',
    price_range: '$2500+',
    rating: 4.9,
    review_count: 203,
    bio: 'Award-winning luxury photographer for discerning clients.',
    website: 'https://elitephotostudio.com',
    instagram: '@elitephoto',
    portfolio_images: [
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800',
      'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800'
    ],
    specialties: ['luxury weddings', 'corporate events', 'fashion'],
    equipment: ['Hasselblad H6D', 'Profoto lighting', 'Drone equipment'],
    years_experience: 15,
    travel_radius: 100,
    created_at: '2023-12-01T08:00:00Z',
    updated_at: '2024-01-28T12:15:00Z'
  }
};

// Sample packages
export const testPackages = {
  basic: {
    id: 'package-bronze-123',
    photographer_id: 'photographer-456',
    name: 'Basic Portrait Session',
    tier_id: 'bronze',
    price: 299,
    duration: '1 hour',
    deliverables: 'Digital gallery with 15 edited photos',
    description: 'Perfect for individual portraits or small family sessions',
    included_services: [
      'Pre-session consultation',
      '1-hour photo session',
      '15 professionally edited high-resolution images',
      'Online gallery for easy sharing and downloading'
    ],
    add_ons: [
      { name: 'Additional edited photos (per 5)', price: 75 },
      { name: 'Print release', price: 25 }
    ],
    booking_requirements: 'Valid at least 48 hours in advance',
    created_at: '2024-01-25T16:30:00Z',
    updated_at: '2024-01-25T16:30:00Z'
  },

  standard: {
    id: 'package-silver-456',
    photographer_id: 'photographer-123',
    name: 'Wedding Coverage - Essential',
    tier_id: 'silver',
    price: 1299,
    duration: '6 hours',
    deliverables: 'Complete digital gallery with 200+ edited photos',
    description: 'Comprehensive wedding coverage for your special day',
    included_services: [
      'Pre-wedding consultation and planning',
      '6 hours of wedding day coverage',
      '200+ professionally edited high-resolution images',
      'Online gallery with download and sharing options',
      'Print release included',
      'Sneak peek gallery within 48 hours'
    ],
    add_ons: [
      { name: 'Additional coverage hour', price: 200 },
      { name: 'Engagement session', price: 400 },
      { name: 'Wedding album (50 pages)', price: 500 }
    ],
    booking_requirements: 'Valid at least 2 weeks in advance. 50% deposit required.',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-20T15:00:00Z'
  },

  premium: {
    id: 'package-gold-789',
    photographer_id: 'photographer-789',
    name: 'Luxury Wedding Experience',
    tier_id: 'platinum',
    price: 3999,
    duration: 'Full day (10 hours)',
    deliverables: 'Premium digital gallery, same-day highlights, professional album',
    description: 'The ultimate luxury wedding photography experience',
    included_services: [
      'Comprehensive pre-wedding planning sessions',
      'Engagement session included',
      'Full wedding day coverage (10+ hours)',
      '500+ professionally edited high-resolution images',
      'Same-day highlight reel and preview gallery',
      'Luxury online gallery with advanced sharing features',
      'Professional wedding album (100 pages)',
      'Print release and commercial usage rights',
      'Personal photography assistant',
      'Drone coverage (where permitted)'
    ],
    add_ons: [
      { name: 'Second photographer', price: 800 },
      { name: 'Rehearsal dinner coverage', price: 600 },
      { name: 'Additional album copies', price: 300 }
    ],
    booking_requirements: 'Valid at least 6 months in advance. Payment plan available.',
    created_at: '2023-12-01T09:00:00Z',
    updated_at: '2024-01-28T13:00:00Z'
  }
};

// Sample bookings
export const testBookings = {
  pending: {
    id: 'booking-pending-123',
    user_id: 'user-123',
    photographer_id: 'photographer-123',
    package_id: 'package-silver-456',
    event_date: '2024-06-15',
    event_time: '14:00:00',
    event_location: 'Central Park, New York, NY',
    status: 'pending',
    total_amount: 1299,
    deposit_amount: 649.50,
    notes: 'Outdoor ceremony weather backup needed',
    contact_phone: '+1234567890',
    contact_email: 'test@example.com',
    special_requests: 'Family photos with grandparents who have mobility issues',
    guest_count: 150,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  },

  confirmed: {
    id: 'booking-confirmed-456',
    user_id: 'user-456',
    photographer_id: 'photographer-456',
    package_id: 'package-bronze-123',
    event_date: '2024-03-20',
    event_time: '10:00:00',
    event_location: 'Downtown Studio, Los Angeles, CA',
    status: 'confirmed',
    total_amount: 299,
    deposit_amount: 149.50,
    payment_status: 'deposit_paid',
    stripe_session_id: 'cs_test_confirmed_session_123',
    notes: 'Individual portrait session',
    contact_phone: '+0987654321',
    contact_email: 'another@example.com',
    special_requests: 'Professional headshots for LinkedIn',
    guest_count: 1,
    created_at: '2024-01-28T14:00:00Z',
    updated_at: '2024-01-29T09:30:00Z'
  },

  completed: {
    id: 'booking-completed-789',
    user_id: 'user-123',
    photographer_id: 'photographer-789',
    package_id: 'package-gold-789',
    event_date: '2024-01-10',
    event_time: '15:00:00',
    event_location: 'The Breakers, Palm Beach, FL',
    status: 'completed',
    total_amount: 3999,
    deposit_amount: 1999.50,
    payment_status: 'paid',
    stripe_session_id: 'cs_test_completed_session_789',
    completion_date: '2024-01-11T20:00:00Z',
    gallery_delivered_date: '2024-01-15T12:00:00Z',
    notes: 'Luxury beachfront wedding',
    contact_phone: '+1234567890',
    contact_email: 'test@example.com',
    special_requests: 'Drone footage of beach ceremony',
    guest_count: 200,
    created_at: '2023-11-15T16:00:00Z',
    updated_at: '2024-01-15T12:30:00Z'
  }
};

// Sample reviews
export const testReviews = {
  excellent: {
    id: 'review-excellent-123',
    booking_id: 'booking-completed-789',
    user_id: 'user-123',
    photographer_id: 'photographer-789',
    rating: 5,
    title: 'Absolutely Perfect Wedding Photography!',
    content: 'Elite Photography Studio exceeded all our expectations. The attention to detail, professionalism, and artistic vision were outstanding. Our photos are absolutely stunning!',
    helpful_votes: 15,
    created_at: '2024-01-16T14:00:00Z'
  },

  good: {
    id: 'review-good-456',
    booking_id: 'booking-confirmed-456',
    user_id: 'user-456',
    photographer_id: 'photographer-456',
    rating: 4,
    title: 'Great experience for the price',
    content: 'Fresh Focus Photography provided good value and professional service. The photographer was punctual and delivered quality photos. Would recommend for budget-conscious clients.',
    helpful_votes: 3,
    created_at: '2024-02-01T16:30:00Z'
  },

  critical: {
    id: 'review-critical-789',
    booking_id: 'booking-pending-123',
    user_id: 'user-123',
    photographer_id: 'photographer-123',
    rating: 3,
    title: 'Good but communication could be better',
    content: 'The photography quality was good, but there were some communication issues during planning. The final results were satisfactory overall.',
    helpful_votes: 1,
    created_at: '2024-02-02T11:15:00Z'
  }
};

// Sample availability
export const testAvailability = {
  available: {
    id: 'availability-123',
    photographer_id: 'photographer-123',
    date: '2024-06-15',
    status: 'available',
    time_slots: ['09:00', '14:00', '18:00'],
    notes: 'Available for full day bookings',
    created_at: '2024-01-15T08:00:00Z'
  },

  booked: {
    id: 'availability-456',
    photographer_id: 'photographer-456',
    date: '2024-03-20',
    status: 'booked',
    booking_id: 'booking-confirmed-456',
    time_slots: ['10:00'],
    notes: 'Booked for portrait session',
    created_at: '2024-01-28T14:30:00Z'
  },

  unavailable: {
    id: 'availability-789',
    photographer_id: 'photographer-789',
    date: '2024-04-01',
    status: 'unavailable',
    time_slots: [],
    notes: 'Personal vacation',
    created_at: '2024-01-01T10:00:00Z'
  }
};

// Test scenarios for different use cases
export const testScenarios = {
  newUserBooking: {
    user: testUsers.validUser,
    photographer: testPhotographers.established,
    package: testPackages.standard,
    eventDate: '2024-07-20',
    eventLocation: 'Brooklyn Botanic Garden, NY'
  },

  budgetBooking: {
    user: testUsers.anotherUser,
    photographer: testPhotographers.newbie,
    package: testPackages.basic,
    eventDate: '2024-05-10',
    eventLocation: 'Client\'s home, LA'
  },

  luxuryBooking: {
    user: testUsers.validUser,
    photographer: testPhotographers.premium,
    package: testPackages.premium,
    eventDate: '2024-09-15',
    eventLocation: 'Four Seasons Resort, Miami'
  }
};

// Validation test cases
export const validationTestCases = {
  invalidEmail: [
    'invalid-email',
    'test@',
    '@example.com',
    'test..test@example.com',
    'test@.com',
    ''
  ],

  invalidPhone: [
    '123',
    'abc-def-ghij',
    '1-800-INVALID',
    '+1-invalid',
    ''
  ],

  invalidDates: [
    '2023-01-01', // Past date
    '2099-12-31', // Far future
    'invalid-date',
    '2024-02-30', // Invalid date
    '2024-13-01'  // Invalid month
  ],

  invalidAmounts: [
    -100,
    0,
    'invalid',
    null,
    undefined,
    99999999 // Unreasonably high
  ]
};

// API response templates
export const apiResponses = {
  success: (data = {}) => ({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }),

  error: (message, code = 400, details = {}) => ({
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    }
  }),

  paginated: (items, page = 1, limit = 10, total = null) => ({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total: total || items.length,
      pages: Math.ceil((total || items.length) / limit)
    },
    timestamp: new Date().toISOString()
  })
};

export default {
  testUsers,
  testPhotographers,
  testPackages,
  testBookings,
  testReviews,
  testAvailability,
  testScenarios,
  validationTestCases,
  apiResponses
};