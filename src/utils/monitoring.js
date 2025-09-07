/**
 * Production Monitoring Utility
 * Sends performance metrics and errors to monitoring service
 */

import { validateEnvironment } from './validateEnv'

// Check if monitoring is enabled
const isMonitoringEnabled = () => {
  const env = validateEnvironment()
  return env.isValid && import.meta.env.PROD
}

/**
 * Log error to monitoring service (Sentry, LogRocket, etc.)
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  // Console log in development
  if (import.meta.env.DEV) {
    console.error('Error:', error, context)
    return
  }

  // In production, send to monitoring service
  if (isMonitoringEnabled() && window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context,
      tags: {
        environment: import.meta.env.MODE,
        version: import.meta.env.VITE_APP_VERSION || '1.0.0'
      }
    })
  }
}

/**
 * Track custom event
 * @param {string} eventName - Event name
 * @param {Object} properties - Event properties
 */
export const trackEvent = (eventName, properties = {}) => {
  // Console log in development
  if (import.meta.env.DEV) {
    console.log(`📊 Event: ${eventName}`, properties)
    return
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, properties)
  }

  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track(eventName, properties)
  }

  // Custom analytics
  if (window.analytics) {
    window.analytics.track(eventName, properties)
  }
}

/**
 * Track page view
 * @param {string} path - Page path
 * @param {string} title - Page title
 */
export const trackPageView = (path, title) => {
  // Console log in development
  if (import.meta.env.DEV) {
    console.log(`📄 Page View: ${path} - ${title}`)
    return
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title
    })
  }

  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track('Page View', {
      path,
      title
    })
  }
}

/**
 * Identify user for analytics
 * @param {string} userId - User ID
 * @param {Object} traits - User traits
 */
export const identifyUser = (userId, traits = {}) => {
  if (import.meta.env.DEV) {
    console.log(`👤 Identify User: ${userId}`, traits)
    return
  }

  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.identify(userId)
    window.mixpanel.people.set(traits)
  }

  // Custom analytics
  if (window.analytics) {
    window.analytics.identify(userId, traits)
  }

  // Sentry
  if (window.Sentry) {
    window.Sentry.setUser({
      id: userId,
      ...traits
    })
  }
}

/**
 * Track conversion
 * @param {string} conversionType - Type of conversion
 * @param {number} value - Conversion value
 * @param {Object} metadata - Additional metadata
 */
export const trackConversion = (conversionType, value, metadata = {}) => {
  trackEvent(`conversion_${conversionType}`, {
    value,
    currency: 'USD',
    ...metadata
  })

  // Facebook Pixel
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value,
      currency: 'USD',
      content_type: conversionType,
      ...metadata
    })
  }

  // Google Ads
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: import.meta.env.VITE_GOOGLE_ADS_ID,
      value,
      currency: 'USD',
      transaction_id: metadata.transactionId
    })
  }
}

/**
 * Track timing metric
 * @param {string} category - Metric category
 * @param {string} variable - Metric variable
 * @param {number} value - Time value in ms
 */
export const trackTiming = (category, variable, value) => {
  if (import.meta.env.DEV) {
    console.log(`⏱️ Timing: ${category}/${variable} = ${value}ms`)
    return
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      event_category: category,
      name: variable,
      value
    })
  }
}

/**
 * Initialize monitoring services
 */
export const initMonitoring = () => {
  if (import.meta.env.DEV) {
    console.log('📊 Monitoring disabled in development')
    return
  }

  // Initialize Sentry (if configured)
  if (import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/react').then(Sentry => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
          new Sentry.BrowserTracing(),
        ],
        tracesSampleRate: 0.1, // 10% of transactions
        environment: import.meta.env.MODE,
        beforeSend(event, hint) {
          // Filter out certain errors
          if (event.exception) {
            const error = hint.originalException
            // Don't log network errors in development
            if (error?.message?.includes('Network')) {
              return null
            }
          }
          return event
        }
      })
      window.Sentry = Sentry
      console.log('✅ Sentry initialized')
    })
  }

  // Initialize Google Analytics (if configured)
  if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function() { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID)
    console.log('✅ Google Analytics initialized')
  }
}

/**
 * Log performance metrics
 */
export const logPerformanceMetrics = () => {
  if (!isMonitoringEnabled()) return

  // Core Web Vitals
  if (window.performance && window.performance.getEntriesByType) {
    const navigation = window.performance.getEntriesByType('navigation')[0]
    
    if (navigation) {
      trackTiming('performance', 'page_load', navigation.loadEventEnd)
      trackTiming('performance', 'dom_ready', navigation.domContentLoadedEventEnd)
      trackTiming('performance', 'ttfb', navigation.responseStart)
    }
  }

  // First Contentful Paint
  if (window.PerformanceObserver) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          trackTiming('performance', 'fcp', Math.round(entry.startTime))
        }
      }
    })
    
    try {
      observer.observe({ entryTypes: ['paint'] })
    } catch (e) {
      // Paint timing not supported
    }
  }
}

export default {
  logError,
  trackEvent,
  trackPageView,
  identifyUser,
  trackConversion,
  trackTiming,
  initMonitoring,
  logPerformanceMetrics
}
