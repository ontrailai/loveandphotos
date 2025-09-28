/**
 * Contract Test Data Fixtures
 * Comprehensive test data for contract signing scenarios
 */

// Booking flow scenarios for different test cases
export const BOOKING_FLOW_SCENARIOS = {
  COMPLETE_VALID: {
    photographerId: 'test-photographer-1',
    currentStep: 'contract',
    completedSteps: ['schedule', 'package', 'location', 'addons'],
    scheduleDetails: {
      date: '2024-06-15',
      timeOfDay: 'morning',
      selectedAt: '2024-01-15T10:00:00.000Z'
    },
    packageDetails: {
      packageType: 'monthly',
      packagePrice: 800,
      packageTitle: 'Premium Wedding Package',
      hoursBooked: 6,
      isPhotoVideo: true,
      selectedAt: '2024-01-15T10:05:00.000Z'
    },
    locationDetails: {
      locationId: 'central-park',
      locationTitle: 'Central Park Conservatory Garden',
      locationVibe: 'romantic',
      selectedAt: '2024-01-15T10:10:00.000Z'
    },
    addonsDetails: {
      selectedAddons: [
        { id: 'addon-1', title: 'Extra Hour', price: 150, qty: 1 },
        { id: 'addon-2', title: 'Second Photographer', price: 300, qty: 1 }
      ],
      totalAddonsPrice: 450,
      selectedAt: '2024-01-15T10:15:00.000Z'
    },
    contractDetails: {
      contractSigned: false,
      contractSignatureId: null,
      contractVersion: null,
      signedAt: null
    }
  },

  MISSING_SCHEDULE: {
    photographerId: 'test-photographer-2',
    currentStep: 'schedule',
    completedSteps: [],
    scheduleDetails: {
      date: null,
      timeOfDay: null,
      selectedAt: null
    },
    packageDetails: {
      packageType: null,
      packagePrice: null,
      packageTitle: null,
      selectedAt: null
    },
    locationDetails: {
      locationId: null,
      locationTitle: null,
      locationVibe: null,
      selectedAt: null
    },
    addonsDetails: {
      selectedAddons: [],
      totalAddonsPrice: 0,
      selectedAt: null
    }
  },

  MISSING_PACKAGE: {
    photographerId: 'test-photographer-3',
    currentStep: 'package',
    completedSteps: ['schedule'],
    scheduleDetails: {
      date: '2024-07-20',
      timeOfDay: 'afternoon',
      selectedAt: '2024-01-15T10:00:00.000Z'
    },
    packageDetails: {
      packageType: null,
      packagePrice: null,
      packageTitle: null,
      selectedAt: null
    },
    locationDetails: {
      locationId: null,
      locationTitle: null,
      locationVibe: null,
      selectedAt: null
    },
    addonsDetails: {
      selectedAddons: [],
      totalAddonsPrice: 0,
      selectedAt: null
    }
  },

  PARTIALLY_COMPLETE: {
    photographerId: 'test-photographer-4',
    currentStep: 'location',
    completedSteps: ['schedule', 'package'],
    scheduleDetails: {
      date: '2024-08-10',
      timeOfDay: 'evening',
      selectedAt: '2024-01-15T10:00:00.000Z'
    },
    packageDetails: {
      packageType: 'deposit',
      packagePrice: 400,
      packageTitle: 'Basic Portrait Session',
      hoursBooked: 2,
      isPhotoVideo: false,
      selectedAt: '2024-01-15T10:05:00.000Z'
    },
    locationDetails: {
      locationId: null,
      locationTitle: null,
      locationVibe: null,
      selectedAt: null
    },
    addonsDetails: {
      selectedAddons: [],
      totalAddonsPrice: 0,
      selectedAt: null
    }
  }
}

// Contract data scenarios
export const CONTRACT_DATA_SCENARIOS = {
  STANDARD: {
    contractText: `THIS IS A LEGAL CONTRACT

PHOTOGRAPHY SERVICE AGREEMENT

Event Date: June 15, 2024
Location: Central Park Conservatory Garden
Package: Premium Wedding Package
Price: $1,250

TERMS AND CONDITIONS:

1. Payment Terms
   - Deposit required to secure booking
   - Remaining balance due on event date

2. Service Details
   - Professional photography services for 6 hours
   - Photo and video coverage included
   - Additional services: Extra Hour, Second Photographer

3. Cancellation Policy
   - 30 days notice required for full refund
   - 14 days notice for 50% refund
   - Less than 14 days: no refund

4. Photographer Rights
   - Right to use images for portfolio/marketing
   - Client receives edited digital gallery

5. Client Responsibilities
   - Provide accurate event details
   - Ensure access to venue
   - Respect photographer's creative process

By signing below, you agree to these terms and conditions.`,

    contractHash: 'sha256-abc123def456',
    contractVersion: 'LNP-Contract-v1.2',
    bookingData: {
      eventDate: 'June 15, 2024',
      location: 'Central Park Conservatory Garden',
      packageName: 'Premium Wedding Package',
      price: '$1,250'
    }
  },

  LARGE_CONTRACT: {
    contractText: `THIS IS A LEGAL CONTRACT

${'DETAILED TERMS AND CONDITIONS\n'.repeat(100)}

Event Date: July 20, 2024
Location: Brooklyn Bridge Park
Package: Extended Portrait Session
Price: $600

${'ADDITIONAL CLAUSES\n'.repeat(50)}`,

    contractHash: 'sha256-large-contract-789',
    contractVersion: 'LNP-Contract-v1.2',
    bookingData: {
      eventDate: 'July 20, 2024',
      location: 'Brooklyn Bridge Park',
      packageName: 'Extended Portrait Session',
      price: '$600'
    }
  },

  MINIMAL: {
    contractText: `THIS IS A LEGAL CONTRACT

Event Date: August 10, 2024
Location: Studio
Package: Headshots
Price: $200

Basic terms apply.`,

    contractHash: 'sha256-minimal-contract-xyz',
    contractVersion: 'LNP-Contract-v1.0',
    bookingData: {
      eventDate: 'August 10, 2024',
      location: 'Studio',
      packageName: 'Headshots',
      price: '$200'
    }
  }
}

// Signature test data
export const SIGNATURE_SCENARIOS = {
  VALID_DRAWN: {
    signaturePngBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    signerFullName: 'John Doe',
    consentAccepted: true
  },

  VALID_TYPED: {
    signaturePngBase64: 'data:image/png;base64,typed-signature-data-here',
    signerFullName: 'Jane Smith',
    consentAccepted: true
  },

  MISSING_SIGNATURE: {
    signaturePngBase64: null,
    signerFullName: 'Bob Johnson',
    consentAccepted: true
  },

  MISSING_CONSENT: {
    signaturePngBase64: 'data:image/png;base64,valid-signature-data',
    signerFullName: 'Alice Brown',
    consentAccepted: false
  },

  INVALID_FORMAT: {
    signaturePngBase64: 'not-a-valid-base64-signature',
    signerFullName: 'Invalid User',
    consentAccepted: true
  },

  OVERSIZED: {
    signaturePngBase64: `data:image/png;base64,${'A'.repeat(3 * 1024 * 1024)}`, // 3MB
    signerFullName: 'Large Signature User',
    consentAccepted: true
  },

  LONG_NAME: {
    signaturePngBase64: 'data:image/png;base64,valid-signature',
    signerFullName: 'A'.repeat(150), // Exceeds 100 character limit
    consentAccepted: true
  }
}

// API response scenarios
export const API_RESPONSES = {
  SUCCESS: {
    status: 200,
    body: {
      success: true,
      contractSignatureId: 'cs_1234567890abcdef',
      message: 'Contract signed successfully'
    }
  },

  NOT_FOUND: {
    status: 404,
    body: {
      error: 'Contract API endpoint not found',
      message: 'Service temporarily unavailable'
    }
  },

  SERVER_ERROR: {
    status: 500,
    body: {
      error: 'Internal server error',
      message: 'Unable to process contract signing'
    }
  },

  TIMEOUT: {
    status: 408,
    body: {
      error: 'Request timeout',
      message: 'Contract signing timed out'
    }
  },

  VALIDATION_ERROR: {
    status: 400,
    body: {
      error: 'Validation failed',
      details: {
        signature: 'Invalid signature format',
        consent: 'Consent required'
      }
    }
  },

  RATE_LIMITED: {
    status: 429,
    body: {
      error: 'Rate limit exceeded',
      retryAfter: 60
    }
  }
}

// Network failure scenarios
export const NETWORK_SCENARIOS = {
  SLOW_CONNECTION: {
    delay: 5000, // 5 second delay
    type: 'slow'
  },

  INTERMITTENT_FAILURE: {
    failureRate: 0.5, // 50% failure rate
    type: 'intermittent'
  },

  COMPLETE_FAILURE: {
    type: 'offline'
  },

  DNS_FAILURE: {
    type: 'dns_error'
  },

  CONNECTION_RESET: {
    type: 'connection_reset'
  }
}

// Validation error messages
export const VALIDATION_MESSAGES = {
  SIGNATURE_REQUIRED: 'Signature is required',
  CONSENT_REQUIRED: 'You must agree to the terms and conditions',
  SIGNATURE_TOO_LARGE: 'Signature image is too large (max 2MB)',
  INVALID_SIGNATURE_FORMAT: 'Invalid signature format',
  SIGNER_NAME_TOO_LONG: 'Signer name is too long (max 100 characters)',
  CONTRACT_DATA_MISSING: 'Contract data not available. Please refresh the page.',
  BOOKING_DATA_INCOMPLETE: 'Booking data incomplete'
}

// Test user personas
export const USER_PERSONAS = {
  HAPPY_PATH_USER: {
    name: 'Happy Path User',
    behavior: 'completes_all_steps_correctly',
    signatureType: 'drawn',
    patience: 'high'
  },

  IMPATIENT_USER: {
    name: 'Impatient User',
    behavior: 'clicks_rapidly',
    signatureType: 'typed',
    patience: 'low'
  },

  ACCESSIBILITY_USER: {
    name: 'Accessibility User',
    behavior: 'keyboard_only',
    signatureType: 'typed',
    patience: 'medium',
    assistiveTech: true
  },

  MOBILE_USER: {
    name: 'Mobile User',
    behavior: 'touch_interactions',
    signatureType: 'drawn',
    patience: 'medium',
    device: 'mobile'
  },

  CAUTIOUS_USER: {
    name: 'Cautious User',
    behavior: 'reads_everything',
    signatureType: 'drawn',
    patience: 'high',
    scrollsSlowly: true
  }
}

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  CONTRACT_LOAD_TIME: 3000, // 3 seconds max
  SIGNATURE_RESPONSE_TIME: 1000, // 1 second max
  PAGE_NAVIGATION_TIME: 2000, // 2 seconds max
  FORM_VALIDATION_TIME: 500, // 500ms max
  ERROR_DISPLAY_TIME: 1000 // 1 second max
}

// Browser-specific test data
export const BROWSER_SCENARIOS = {
  CHROME: {
    canvas: 'hardware_accelerated',
    localStorage: 'available',
    signature: 'smooth_drawing'
  },

  FIREFOX: {
    canvas: 'software_rendered',
    localStorage: 'available',
    signature: 'good_drawing'
  },

  SAFARI: {
    canvas: 'webkit_optimized',
    localStorage: 'limited',
    signature: 'touch_optimized'
  },

  MOBILE_CHROME: {
    canvas: 'touch_enabled',
    localStorage: 'available',
    signature: 'finger_drawing'
  },

  MOBILE_SAFARI: {
    canvas: 'ios_optimized',
    localStorage: 'available',
    signature: 'apple_pencil_support'
  }
}

// Load testing scenarios
export const LOAD_TEST_SCENARIOS = {
  SINGLE_USER: {
    concurrent_users: 1,
    duration: '1m'
  },

  MODERATE_LOAD: {
    concurrent_users: 10,
    duration: '5m'
  },

  STRESS_TEST: {
    concurrent_users: 50,
    duration: '10m'
  },

  PEAK_LOAD: {
    concurrent_users: 100,
    duration: '15m'
  }
}