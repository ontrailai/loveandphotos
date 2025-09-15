/**
 * Test Data Fixtures for Photographer Thumbnail Testing
 *
 * Comprehensive test data covering edge cases, mixed quality data,
 * and realistic scenarios for robust thumbnail rendering validation.
 */

// Base URL patterns for test images
const IMAGE_BASES = {
  valid: 'https://images.unsplash.com/photo-',
  broken: 'https://broken-domain.invalid/',
  slow: 'https://httpstat.us/200?sleep=',
  error404: 'https://httpstat.us/404',
  error500: 'https://httpstat.us/500',
  tiny: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
};

// Generate realistic photographer data
const createPhotographerData = (id, overrides = {}) => {
  const basePhotographer = {
    id: `photographer-${id}`,
    user_id: `user-${id}`,
    slug: `photographer-${id}`,
    bio: `Professional wedding photographer with ${Math.floor(Math.random() * 10) + 3} years of experience. Specializing in candid moments and beautiful compositions.`,
    is_verified: Math.random() > 0.3, // 70% verified
    is_public: true,
    average_rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
    total_reviews: Math.floor(Math.random() * 100) + 5,
    completed_jobs_count: Math.floor(Math.random() * 150) + 10,
    created_at: '2023-01-01T00:00:00Z',
    vetted: Math.random() > 0.4, // 60% vetted

    // User data
    users: {
      id: `user-${id}`,
      full_name: generateRealisticName(),
      avatar_url: `${IMAGE_BASES.valid}${1500000000000 + id * 1000}-photographer?w=150&h=150&fit=crop&crop=face`,
    },

    // Pay tier data
    pay_tiers: {
      name: getRandomTier(),
      badge_color: getTierColor(getRandomTier()),
      hourly_rate: 100 + Math.floor(Math.random() * 300)
    },

    // Additional computed fields
    tier: getRandomTier(),
    city: getRandomCity(),
    state: getRandomState(),
    joinedDate: getRandomYear(),
    weddings_completed: Math.floor(Math.random() * 80) + 5,
    hourly_rate: 100 + Math.floor(Math.random() * 300),
    ...overrides
  };

  return basePhotographer;
};

// Helper functions for realistic data generation
function generateRealisticName() {
  const firstNames = [
    'Emma', 'James', 'Olivia', 'William', 'Ava', 'Benjamin', 'Sophia', 'Lucas',
    'Isabella', 'Henry', 'Charlotte', 'Alexander', 'Amelia', 'Michael', 'Evelyn',
    'Jacob', 'Abigail', 'Daniel', 'Harper', 'Matthew', 'Emily', 'Jackson',
    'Elizabeth', 'David', 'Avery', 'Owen', 'Sofia', 'Joseph', 'Ella', 'Samuel'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

function getRandomTier() {
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'New'];
  const weights = [0.3, 0.25, 0.25, 0.15, 0.05]; // Weighted distribution

  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < tiers.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return tiers[i];
    }
  }

  return 'Bronze';
}

function getTierColor(tier) {
  const colors = {
    'Gold': '#F59E0B',
    'Silver': '#6B7280',
    'Bronze': '#EA580C',
    'Platinum': '#8B5CF6',
    'New': '#10B981'
  };
  return colors[tier] || colors['Bronze'];
}

function getRandomCity() {
  const cities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
    'Seattle', 'Denver', 'Washington', 'Boston', 'Nashville', 'Baltimore',
    'Oklahoma City', 'Louisville', 'Portland', 'Las Vegas', 'Milwaukee'
  ];
  return cities[Math.floor(Math.random() * cities.length)];
}

function getRandomState() {
  const states = [
    'CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
    'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MD', 'MO', 'WI',
    'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT'
  ];
  return states[Math.floor(Math.random() * states.length)];
}

function getRandomYear() {
  return (2020 + Math.floor(Math.random() * 4)).toString();
}

// Predefined test scenarios
export const testScenarios = {
  // Perfect data scenario
  highQuality: Array.from({ length: 6 }, (_, i) => createPhotographerData(i + 1, {
    users: {
      full_name: generateRealisticName(),
      avatar_url: `${IMAGE_BASES.valid}${1600000000000 + i * 1000}-professional?w=150&h=150&fit=crop&crop=face`
    },
    average_rating: 4.8 + Math.random() * 0.2,
    total_reviews: 25 + Math.floor(Math.random() * 75),
    is_verified: true,
    vetted: true,
    tier: 'Gold'
  })),

  // Mixed data quality
  mixedQuality: [
    // High quality with image
    createPhotographerData(1, {
      users: {
        full_name: 'Alice Johnson',
        avatar_url: `${IMAGE_BASES.valid}1600000001000-photographer?w=150&h=150&fit=crop&crop=face`
      },
      average_rating: 4.9,
      total_reviews: 45,
      tier: 'Platinum',
      vetted: true
    }),

    // No avatar URL (should show fallback)
    createPhotographerData(2, {
      users: {
        full_name: 'Bob Smith',
        avatar_url: null
      },
      average_rating: 4.2,
      total_reviews: 12,
      tier: 'Silver'
    }),

    // Minimal data
    createPhotographerData(3, {
      users: {
        full_name: 'Carol Davis',
        avatar_url: `${IMAGE_BASES.valid}1600000003000-minimal?w=150&h=150&fit=crop&crop=face`
      },
      bio: null,
      city: null,
      state: null,
      hourly_rate: null,
      total_reviews: 0,
      tier: 'New'
    }),

    // Broken image URL
    createPhotographerData(4, {
      users: {
        full_name: 'David Wilson',
        avatar_url: `${IMAGE_BASES.broken}404-image.jpg`
      },
      average_rating: 4.5,
      total_reviews: 25,
      tier: 'Gold'
    })
  ],

  // Error-prone scenarios
  errorProne: [
    // Very slow loading image
    createPhotographerData(1, {
      users: {
        full_name: 'Slow Loading',
        avatar_url: `${IMAGE_BASES.slow}3000` // 3 second delay
      }
    }),

    // 404 error image
    createPhotographerData(2, {
      users: {
        full_name: 'Error 404',
        avatar_url: IMAGE_BASES.error404
      }
    }),

    // 500 error image
    createPhotographerData(3, {
      users: {
        full_name: 'Server Error',
        avatar_url: IMAGE_BASES.error500
      }
    }),

    // Tiny 1x1 pixel image
    createPhotographerData(4, {
      users: {
        full_name: 'Tiny Image',
        avatar_url: IMAGE_BASES.tiny
      }
    })
  ],

  // Large dataset for performance testing
  largeDataset: Array.from({ length: 50 }, (_, i) => createPhotographerData(i + 1, {
    // Mix of valid and problematic images
    users: {
      full_name: generateRealisticName(),
      avatar_url: i % 5 === 0 ? null : // Every 5th has no avatar
                   i % 7 === 0 ? `${IMAGE_BASES.broken}broken-${i}.jpg` : // Every 7th is broken
                   `${IMAGE_BASES.valid}${1600000000000 + i * 100}-variety?w=150&h=150&fit=crop&crop=face`
    }
  })),

  // Edge case data types
  edgeCases: [
    // Empty/null values
    createPhotographerData(1, {
      users: {
        full_name: '',
        avatar_url: ''
      },
      total_reviews: 0,
      average_rating: 0,
      hourly_rate: 0
    }),

    // Very long names
    createPhotographerData(2, {
      users: {
        full_name: 'Extraordinarily Long Photographer Name That Should Test Text Truncation',
        avatar_url: `${IMAGE_BASES.valid}1600000002000-long-name?w=150&h=150`
      }
    }),

    // Special characters in name
    createPhotographerData(3, {
      users: {
        full_name: 'José María O\'Connor-Smith',
        avatar_url: `${IMAGE_BASES.valid}1600000003000-special?w=150&h=150`
      }
    }),

    // Very high numbers
    createPhotographerData(4, {
      users: {
        full_name: 'High Numbers',
        avatar_url: `${IMAGE_BASES.valid}1600000004000-numbers?w=150&h=150`
      },
      total_reviews: 9999,
      weddings_completed: 1500,
      hourly_rate: 2500
    })
  ],

  // Accessibility test data
  accessibility: Array.from({ length: 6 }, (_, i) => createPhotographerData(i + 1, {
    users: {
      full_name: `Accessible Photographer ${i + 1}`,
      avatar_url: i % 2 === 0 ?
        `${IMAGE_BASES.valid}${1600000000000 + i * 1000}-accessible?w=150&h=150&alt=Professional headshot of photographer` :
        null // Test fallback accessibility
    }
  }))
};

// Mock API responses
export const mockApiResponses = {
  success: {
    photographers: testScenarios.mixedQuality,
    metrics: {
      acceptanceRate: 95,
      fiveStarReviews: 87,
      responseTime: 12
    }
  },

  error: {
    photographers: new Error('Database connection failed'),
    metrics: new Error('Metrics service unavailable')
  },

  empty: {
    photographers: [],
    metrics: null
  },

  partialError: {
    photographers: testScenarios.mixedQuality,
    metrics: new Error('Metrics calculation failed')
  },

  slowResponse: {
    photographers: new Promise(resolve =>
      setTimeout(() => resolve(testScenarios.mixedQuality), 2000)
    ),
    metrics: new Promise(resolve =>
      setTimeout(() => resolve({
        acceptanceRate: 95,
        fiveStarReviews: 87,
        responseTime: 12
      }), 1500)
    )
  }
};

// Test utilities
export const testUtils = {
  // Generate photographer with specific avatar issue
  createPhotographerWithAvatarIssue: (issueType) => {
    const avatarUrls = {
      'null': null,
      'empty': '',
      'broken': `${IMAGE_BASES.broken}broken.jpg`,
      'slow': `${IMAGE_BASES.slow}2000`,
      '404': IMAGE_BASES.error404,
      '500': IMAGE_BASES.error500,
      'tiny': IMAGE_BASES.tiny,
      'valid': `${IMAGE_BASES.valid}1600000000000-test?w=150&h=150`
    };

    return createPhotographerData(1, {
      users: {
        full_name: `Test ${issueType} Avatar`,
        avatar_url: avatarUrls[issueType] || avatarUrls['valid']
      }
    });
  },

  // Generate batch of photographers with specific characteristics
  createBatch: (count, characteristics = {}) => {
    return Array.from({ length: count }, (_, i) =>
      createPhotographerData(i + 1, characteristics)
    );
  },

  // Generate photographers with specific tier distribution
  createWithTierDistribution: (tiers) => {
    return tiers.map((tier, i) => createPhotographerData(i + 1, { tier }));
  },

  // Generate photographers with rating range
  createWithRatingRange: (count, minRating = 4.0, maxRating = 5.0) => {
    return Array.from({ length: count }, (_, i) => {
      const rating = minRating + (maxRating - minRating) * Math.random();
      return createPhotographerData(i + 1, {
        average_rating: parseFloat(rating.toFixed(1))
      });
    });
  },

  // Generate photographers with mixed review counts
  createWithMixedReviews: (count) => {
    return Array.from({ length: count }, (_, i) => {
      // Create distribution: 20% with 0-5 reviews, 50% with 5-25, 30% with 25+
      let reviewCount;
      const rand = Math.random();

      if (rand < 0.2) {
        reviewCount = Math.floor(Math.random() * 6); // 0-5
      } else if (rand < 0.7) {
        reviewCount = 5 + Math.floor(Math.random() * 21); // 5-25
      } else {
        reviewCount = 25 + Math.floor(Math.random() * 75); // 25-100
      }

      return createPhotographerData(i + 1, {
        total_reviews: reviewCount
      });
    });
  }
};

// Export default test scenarios
export default testScenarios;