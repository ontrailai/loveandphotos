import { loadStripe } from '@stripe/stripe-js'
import { getApiUrl } from '@utils/validateEnv'

// Get Stripe public key
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY

// Check if Stripe is properly configured
const isConfigured = stripePublicKey && 
  !stripePublicKey.includes('pk_test_your') &&
  !stripePublicKey.includes('placeholder')

// Initialize Stripe with fallback
let stripePromise
export const getStripe = () => {
  if (!isConfigured) {
    console.warn('⚠️ Stripe not configured. Payment features disabled.')
    console.log('To enable payments:')
    console.log('1. Create a Stripe account at https://dashboard.stripe.com')
    console.log('2. Add your publishable key to .env')
    return null
  }
  
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey)
  }
  return stripePromise
}

// Export configuration status
export const isStripeConfigured = isConfigured

// API URL configuration
const API_URL = getApiUrl()

// Calculate pricing based on booking date
export const calculatePricing = (eventDate, basePrice) => {
  const today = new Date()
  const event = new Date(eventDate)
  const daysUntilEvent = Math.floor((event - today) / (1000 * 60 * 60 * 24))

  let finalPrice = basePrice
  let paymentOptions = []
  let lateFee = 0

  if (daysUntilEvent >= 60) {
    // More than 60 days out - all payment options available
    paymentOptions = [
      { 
        type: 'full', 
        label: 'Pay in Full', 
        amount: basePrice,
        description: 'Complete payment today'
      },
      { 
        type: 'deposit', 
        label: 'Pay 50% Deposit', 
        amount: basePrice * 0.5,
        description: `$${(basePrice * 0.5).toFixed(2)} now, $${(basePrice * 0.5).toFixed(2)} later`
      },
      { 
        type: 'monthly', 
        label: 'Monthly Payment Plan',
        amount: Math.ceil(basePrice / Math.min(Math.floor(daysUntilEvent / 30), 6)),
        description: `${Math.min(Math.floor(daysUntilEvent / 30), 6)} monthly payments`
      }
    ]
  } else if (daysUntilEvent >= 31) {
    // 31-59 days out - only full payment
    paymentOptions = [
      { 
        type: 'full', 
        label: 'Pay in Full', 
        amount: basePrice,
        description: 'Full payment required (booking within 60 days)'
      }
    ]
  } else if (daysUntilEvent >= 0) {
    // 30 days or less - full payment + late fee
    lateFee = 450
    finalPrice = basePrice + lateFee
    paymentOptions = [
      { 
        type: 'full_late', 
        label: 'Pay in Full + Late Booking Fee',
        amount: finalPrice,
        description: `Includes $${lateFee} late booking fee (within 30 days)`
      }
    ]
  } else {
    throw new Error('Cannot book events in the past')
  }

  return {
    basePrice,
    finalPrice,
    lateFee,
    daysUntilEvent,
    paymentOptions
  }
}

// Create Stripe checkout session (call from backend/serverless function)
export const createCheckoutSession = async (bookingData) => {
  if (!isConfigured) {
    throw new Error('Stripe is not configured. Please set up your payment credentials.')
  }
  
  const { 
    customerId,
    photographerId,
    packageId,
    eventDate,
    amount,
    paymentType,
    customerEmail,
    metadata = {}
  } = bookingData

  try {
    const response = await fetch(`${API_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        photographerId,
        packageId,
        eventDate,
        amount,
        paymentType,
        customerEmail,
        metadata: {
          ...metadata,
          booking_type: 'photography_service',
          platform: 'lovep'
        },
        successUrl: `${window.location.origin}/booking/confirm?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/book/${photographerId}?cancelled=true`
      })
    })

    const session = await response.json()
    
    if (session.error) {
      throw new Error(session.error)
    }

    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Redirect to Stripe Checkout
export const redirectToCheckout = async (sessionId) => {
  const stripe = await getStripe()
  
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }
  
  const { error } = await stripe.redirectToCheckout({ sessionId })
  
  if (error) {
    console.error('Stripe redirect error:', error)
    throw error
  }
}

// Verify payment session (call from backend)
export const verifyPaymentSession = async (sessionId) => {
  try {
    const response = await fetch(`${API_URL}/api/verify-payment?session_id=${sessionId}`)
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }

    return data
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

// Format price for display
export const formatPrice = (cents) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// Stripe Elements configuration
export const stripeElementsOptions = {
  fonts: [
    {
      cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
    }
  ],
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#e54d73',
      colorBackground: '#ffffff',
      colorSurface: '#ffffff',
      colorText: '#363941',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      spacingUnit: '4px'
    },
    rules: {
      '.Input': {
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        padding: '12px'
      },
      '.Input:focus': {
        border: '1px solid #e54d73',
        boxShadow: '0 0 0 3px rgb(229 77 115 / 0.1)',
        outline: 'none'
      },
      '.Label': {
        fontWeight: '500',
        marginBottom: '8px',
        fontSize: '14px'
      }
    }
  }
}

// Payment method utilities
export const paymentMethods = {
  async attachToCustomer(paymentMethodId, customerId) {
    try {
      const response = await fetch(`${API_URL}/api/attach-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
          customerId
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      return data
    } catch (error) {
      console.error('Error attaching payment method:', error)
      throw error
    }
  },

  async listForCustomer(customerId) {
    try {
      const response = await fetch(`${API_URL}/api/payment-methods?customer_id=${customerId}`)
      const data = await response.json()
      
      if (data.error) throw new Error(data.error)
      return data.paymentMethods || []
    } catch (error) {
      console.error('Error listing payment methods:', error)
      throw error
    }
  },

  async setDefault(paymentMethodId, customerId) {
    try {
      const response = await fetch(`${API_URL}/api/set-default-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
          customerId
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      return data
    } catch (error) {
      console.error('Error setting default payment method:', error)
      throw error
    }
  }
}

// Subscription management for payment plans
export const subscriptions = {
  async create(customerId, priceId, metadata = {}) {
    try {
      const response = await fetch(`${API_URL}/api/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          priceId,
          metadata
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      return data
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  },

  async cancel(subscriptionId) {
    try {
      const response = await fetch(`${API_URL}/api/cancel-subscription/${subscriptionId}`, {
        method: 'POST'
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      return data
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }
}

// Connect account management for photographers
export const connectAccounts = {
  async createOnboardingLink(accountId, refreshUrl, returnUrl) {
    try {
      const response = await fetch(`${API_URL}/api/create-connect-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          refreshUrl,
          returnUrl
        })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      return data.url
    } catch (error) {
      console.error('Error creating onboarding link:', error)
      throw error
    }
  },

  async createLoginLink(accountId) {
    try {
      const response = await fetch(`${API_URL}/api/create-connect-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      return data.url
    } catch (error) {
      console.error('Error creating login link:', error)
      throw error
    }
  }
}
