/**
 * Environment Variable Validation Utility
 * Checks if all required environment variables are properly configured
 */

export function validateEnvironment() {
  const required = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_STRIPE_PUBLIC_KEY: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
    VITE_APP_URL: import.meta.env.VITE_APP_URL
  }

  const missing = []
  const placeholder = []
  const configured = []

  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      missing.push(key)
    } else if (
      value.includes('your-') || 
      value.includes('placeholder') ||
      value === 'your_supabase_project_url' ||
      value === 'your_supabase_anon_key' ||
      value === 'your_stripe_publishable_key'
    ) {
      placeholder.push(key)
    } else {
      configured.push(key)
    }
  }

  const isValid = missing.length === 0 && placeholder.length === 0
  const isPartiallyConfigured = configured.length > 0

  return {
    isValid,
    isPartiallyConfigured,
    missing,
    placeholder,
    configured,
    all: required,
    // Helper method to get status message
    getStatusMessage() {
      if (isValid) {
        return 'All environment variables are properly configured'
      }
      if (missing.length > 0) {
        return `Missing required environment variables: ${missing.join(', ')}`
      }
      if (placeholder.length > 0) {
        return `Using placeholder values for: ${placeholder.join(', ')}`
      }
      return 'Environment configuration needs attention'
    },
    // Helper to check if specific service is configured
    isSupabaseConfigured() {
      return required.VITE_SUPABASE_URL && 
             required.VITE_SUPABASE_ANON_KEY &&
             !required.VITE_SUPABASE_URL.includes('your-') &&
             !required.VITE_SUPABASE_ANON_KEY.includes('your-')
    },
    isStripeConfigured() {
      return required.VITE_STRIPE_PUBLIC_KEY &&
             !required.VITE_STRIPE_PUBLIC_KEY.includes('your-') &&
             !required.VITE_STRIPE_PUBLIC_KEY.includes('pk_test_your')
    }
  }
}

// Development environment checker
export function isDevelopment() {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
}

// Production environment checker
export function isProduction() {
  return import.meta.env.PROD || import.meta.env.MODE === 'production'
}

// Get base URL for API calls
export function getApiUrl() {
  // In production, use the same domain
  if (isProduction()) {
    return import.meta.env.VITE_API_URL || ''
  }
  // In development, use local API server
  return import.meta.env.VITE_API_URL || 'http://localhost:3001'
}

// Get app URL for redirects
export function getAppUrl() {
  return import.meta.env.VITE_APP_URL || window.location.origin
}

// Export a ready-to-use environment config
export const env = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  stripe: {
    publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
  },
  app: {
    url: getAppUrl(),
    apiUrl: getApiUrl(),
    isDev: isDevelopment(),
    isProd: isProduction(),
  },
  resend: {
    apiKey: import.meta.env.VITE_RESEND_API_KEY,
  }
}

export default env
