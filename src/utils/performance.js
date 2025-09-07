/**
 * Performance Monitoring Utility
 * Helps track and optimize app performance
 */

/**
 * Measure component render time
 * @param {string} componentName - Name of the component
 */
export const measureRenderTime = (componentName) => {
  if (import.meta.env.PROD) return // Only in development

  const startTime = performance.now()
  
  return () => {
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    if (renderTime > 16) { // More than one frame (16ms)
      console.warn(`⚠️ ${componentName} took ${renderTime.toFixed(2)}ms to render`)
    }
  }
}

/**
 * Track API call performance
 * @param {string} endpoint - API endpoint
 * @param {Function} apiCall - API call function
 */
export const trackApiCall = async (endpoint, apiCall) => {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    const duration = performance.now() - startTime
    
    // Log slow API calls
    if (duration > 1000) {
      console.warn(`🐌 Slow API call: ${endpoint} took ${duration.toFixed(0)}ms`)
    }
    
    // Store metrics (could send to analytics)
    if (window.performanceMetrics) {
      window.performanceMetrics.apiCalls.push({
        endpoint,
        duration,
        timestamp: Date.now(),
        success: true
      })
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    console.error(`❌ API call failed: ${endpoint} (${duration.toFixed(0)}ms)`, error)
    
    // Store error metrics
    if (window.performanceMetrics) {
      window.performanceMetrics.apiCalls.push({
        endpoint,
        duration,
        timestamp: Date.now(),
        success: false,
        error: error.message
      })
    }
    
    throw error
  }
}

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (import.meta.env.PROD) return // Only in development

  // Initialize metrics storage
  window.performanceMetrics = {
    apiCalls: [],
    renders: [],
    navigation: []
  }

  // Monitor page load performance
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0]
    
    console.log('📊 Page Load Metrics:')
    console.log(`  DOM Content Loaded: ${perfData.domContentLoadedEventEnd.toFixed(0)}ms`)
    console.log(`  Page Load Complete: ${perfData.loadEventEnd.toFixed(0)}ms`)
    console.log(`  Time to First Byte: ${perfData.responseStart.toFixed(0)}ms`)
  })

  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(0)}ms`)
          }
        }
      })
      
      observer.observe({ entryTypes: ['longtask'] })
    } catch (e) {
      // Long task observer not supported
    }
  }

  // Add performance report command
  window.getPerformanceReport = () => {
    const metrics = window.performanceMetrics
    
    console.log('📈 Performance Report:')
    
    // API metrics
    if (metrics.apiCalls.length > 0) {
      const avgDuration = metrics.apiCalls.reduce((acc, call) => acc + call.duration, 0) / metrics.apiCalls.length
      const failureRate = metrics.apiCalls.filter(call => !call.success).length / metrics.apiCalls.length * 100
      
      console.log('\n🌐 API Calls:')
      console.log(`  Total: ${metrics.apiCalls.length}`)
      console.log(`  Average Duration: ${avgDuration.toFixed(0)}ms`)
      console.log(`  Failure Rate: ${failureRate.toFixed(1)}%`)
      
      // Slowest endpoints
      const slowest = [...metrics.apiCalls]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
      
      console.log('  Slowest Endpoints:')
      slowest.forEach(call => {
        console.log(`    - ${call.endpoint}: ${call.duration.toFixed(0)}ms`)
      })
    }

    return metrics
  }

  console.log('🔍 Performance monitoring initialized')
  console.log('   Run window.getPerformanceReport() to see metrics')
}

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 */
export const debounce = (func, wait = 250) => {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 */
export const throttle = (func, limit = 100) => {
  let inThrottle
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Check if element is in viewport
 * @param {Element} element - DOM element
 * @returns {boolean} Is in viewport
 */
export const isInViewport = (element) => {
  const rect = element.getBoundingClientRect()
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Memory usage warning
 */
export const checkMemoryUsage = () => {
  if (import.meta.env.PROD) return

  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1048576
    const limit = performance.memory.jsHeapSizeLimit / 1048576
    const usage = (used / limit) * 100

    if (usage > 90) {
      console.error(`💾 Critical memory usage: ${usage.toFixed(1)}% (${used.toFixed(0)}MB / ${limit.toFixed(0)}MB)`)
    } else if (usage > 75) {
      console.warn(`💾 High memory usage: ${usage.toFixed(1)}% (${used.toFixed(0)}MB / ${limit.toFixed(0)}MB)`)
    }
    
    return {
      used: used.toFixed(0),
      limit: limit.toFixed(0),
      percentage: usage.toFixed(1)
    }
  }
  
  return null
}

export default {
  measureRenderTime,
  trackApiCall,
  initPerformanceMonitoring,
  debounce,
  throttle,
  isInViewport,
  checkMemoryUsage
}
