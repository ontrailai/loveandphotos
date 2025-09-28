/**
 * Contract Resilience E2E Tests
 * Tests contract step robustness against oversized URLs, missing RPC functions,
 * auxiliary data failures, and network issues
 */

import { test, expect } from '@playwright/test'

test.describe('Contract Step Resilience', () => {
  let consoleMessages = []
  let networkRequests = []
  let failedRequests = []

  test.beforeEach(async ({ page }) => {
    // Reset tracking arrays
    consoleMessages = []
    networkRequests = []
    failedRequests = []

    // Monitor console for errors and warnings
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: Date.now()
      })
    })

    // Monitor network requests and failures
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      })
    })

    page.on('requestfailed', (request) => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText || 'Unknown error',
        timestamp: Date.now()
      })
    })

    // Navigate to browse page to start booking flow
    await page.goto('/browse', { waitUntil: 'networkidle' })
  })

  async function completeBookingFlowToContract(page) {
    // Complete booking flow steps to reach contract
    await page.click('[data-testid="photographer-card"]:first-child .btn-primary')

    // Schedule step
    await page.waitForSelector('[data-testid="date-picker"]')
    await page.click('[data-testid="date-picker"] button:not([disabled]):first-child')
    await page.click('button:has-text("Continue")')

    // Package step
    await page.waitForSelector('[data-testid="package-card"]')
    await page.click('[data-testid="package-card"]:first-child .btn-primary')

    // Location step
    await page.waitForSelector('[data-testid="location-card"]')
    await page.click('[data-testid="location-card"]:first-child')
    await page.click('button:has-text("Continue")')

    // Add-ons step
    await page.click('button:has-text("Continue")')

    // Should be on contract page
    await expect(page).toHaveURL(/\/booking\/[\w-]+\/contract/)
  }

  test('should handle oversized URL scenarios without ERR_FAILED', async ({ page }) => {
    // Intercept Browse.jsx requests and simulate oversized URL scenario
    await page.route('**/rest/v1/photographers*', async (route, request) => {
      const url = request.url()

      // Check for oversized URLs (>2KB as per browser limits)
      if (url.length > 2048) {
        // In the old implementation, this would cause net::ERR_FAILED
        // In the new implementation, this shouldn't happen due to batching
        throw new Error(`Oversized URL detected: ${url.length} characters`)
      }

      // Allow normal requests to proceed
      await route.continue()
    })

    await completeBookingFlowToContract(page)

    // Wait for contract page to load
    await page.waitForSelector('h1:has-text("Contract Review & Signature")', { timeout: 10000 })

    // Verify no ERR_FAILED or oversized URL errors occurred
    const urlErrors = failedRequests.filter(req =>
      req.failure.includes('ERR_FAILED') ||
      req.failure.includes('URL too long') ||
      req.url.length > 2048
    )

    expect(urlErrors).toHaveLength(0)

    // Verify contract core functionality works
    await expect(page.locator('[data-testid="contract-text"]')).toBeVisible()
    await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible()
    await expect(page.locator('#signature')).toBeVisible()

    // Check console for batching success messages
    const batchingMessages = consoleMessages.filter(msg =>
      msg.text.includes('batch') ||
      msg.text.includes('Auxiliary data loaded')
    )

    // Should have evidence of batching working
    expect(batchingMessages.length).toBeGreaterThan(0)
  })

  test('should handle missing RPC function gracefully', async ({ page }) => {
    // Intercept RPC calls and simulate missing function
    await page.route('**/rest/v1/rpc/get_photographer_stats*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'PGRST202',
          message: 'Could not find function get_photographer_stats in schema public',
          details: 'Function does not exist'
        })
      })
    })

    await completeBookingFlowToContract(page)

    // Wait for contract page to load despite RPC failure
    await page.waitForSelector('h1:has-text("Contract Review & Signature")', { timeout: 10000 })

    // Core contract functionality should still work
    await expect(page.locator('[data-testid="contract-text"]')).toBeVisible()
    await expect(page.locator('#signature')).toBeVisible()

    // Verify signature widget is functional
    const canvas = page.locator('#signature canvas')
    await expect(canvas).toBeVisible()

    // Test signature input
    const nameInput = page.locator('#signer-name')
    await nameInput.fill('Test User')
    await page.click('button:has-text("Type")')

    // Should be able to proceed despite RPC failure
    await expect(page.locator('button:has-text("Sign & Continue")')).toBeEnabled()

    // Check that RPC failure was logged but didn't crash the page
    const rpcErrors = consoleMessages.filter(msg =>
      msg.text.includes('get_photographer_stats') ||
      msg.text.includes('404')
    )

    // Should have warning logs but no page crash
    expect(rpcErrors.length).toBeGreaterThan(0)

    // Page should still be functional
    expect(page.url()).toMatch(/\/contract/)
  })

  test('should handle auxiliary data timeouts gracefully', async ({ page }) => {
    // Intercept auxiliary data requests and simulate slow responses
    await page.route('**/api.ipify.org**', async (route) => {
      // Simulate slow auxiliary data (IP detection)
      await new Promise(resolve => setTimeout(resolve, 8000)) // 8s delay > 6s timeout
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '192.168.1.1' })
      })
    })

    await page.route('**/rest/v1/photographers*', async (route, request) => {
      const url = request.url()

      // Simulate slow photographer stats requests
      if (url.includes('acceptance_rate') || url.includes('response_time')) {
        await new Promise(resolve => setTimeout(resolve, 7000)) // 7s delay > 6s timeout
      }

      await route.continue()
    })

    await completeBookingFlowToContract(page)

    // Contract should load despite auxiliary timeouts
    await page.waitForSelector('h1:has-text("Contract Review & Signature")', { timeout: 10000 })

    // Core functionality should work immediately
    await expect(page.locator('[data-testid="contract-text"]')).toBeVisible()
    await expect(page.locator('#signature')).toBeVisible()

    // Check for auxiliary data timeout warnings
    await page.waitForFunction(() => {
      return window.console &&
             Array.from(document.querySelectorAll('*'))
               .some(el => el.textContent && el.textContent.includes('temporarily unavailable'))
    }, { timeout: 10000 })

    // Should show auxiliary data errors but not block main flow
    await expect(page.locator('text=Some optional features are temporarily unavailable')).toBeVisible()

    // Main contract flow should remain functional
    await page.fill('#signer-name', 'Test User')
    await page.click('button:has-text("Type")')
    await page.check('#consent-checkbox')

    await expect(page.locator('button:has-text("Sign & Continue")')).toBeEnabled()

    // Verify timeout messages in console
    const timeoutMessages = consoleMessages.filter(msg =>
      msg.text.includes('timed out') ||
      msg.text.includes('auxiliary data') ||
      msg.text.includes('6000ms')
    )

    expect(timeoutMessages.length).toBeGreaterThan(0)
  })

  test('should handle network failures with error boundaries', async ({ page }) => {
    // Simulate network failures for various requests
    await page.route('**/rest/v1/**', async (route, request) => {
      const url = request.url()

      // Fail 50% of non-essential requests randomly
      if (Math.random() < 0.5 && (
        url.includes('photographer_preview_profiles') ||
        url.includes('reviews') ||
        url.includes('acceptance_rate')
      )) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Internal server error',
            details: 'Simulated network failure'
          })
        })
        return
      }

      await route.continue()
    })

    await completeBookingFlowToContract(page)

    // Contract should still load with error boundaries
    await page.waitForSelector('h1:has-text("Contract Review & Signature")', { timeout: 10000 })

    // Error boundaries should prevent page crashes
    await expect(page.locator('[data-testid="contract-text"]')).toBeVisible()
    await expect(page.locator('#signature')).toBeVisible()

    // Should not see unhandled error pages
    await expect(page.locator('text=Something went wrong')).not.toBeVisible()
    await expect(page.locator('text=Page crashed')).not.toBeVisible()

    // Core functionality should remain intact
    await page.fill('#signer-name', 'Resilience Test User')
    await page.click('button:has-text("Type")')
    await page.check('#consent-checkbox')

    await expect(page.locator('button:has-text("Sign & Continue")')).toBeEnabled()

    // Check for graceful error handling in console
    const errorHandlingMessages = consoleMessages.filter(msg =>
      msg.text.includes('non-blocking') ||
      msg.text.includes('auxiliary data') ||
      msg.text.includes('graceful')
    )

    expect(errorHandlingMessages.length).toBeGreaterThan(0)
  })

  test('should maintain performance under stress conditions', async ({ page }) => {
    // Simulate high load with many concurrent requests
    await page.route('**/rest/v1/**', async (route, request) => {
      // Add artificial delays to test performance
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
      await route.continue()
    })

    const startTime = Date.now()

    await completeBookingFlowToContract(page)

    // Contract should load within reasonable time even under stress
    await page.waitForSelector('h1:has-text("Contract Review & Signature")', { timeout: 15000 })

    const loadTime = Date.now() - startTime

    // Should load within 15 seconds even under stress
    expect(loadTime).toBeLessThan(15000)

    // Core elements should be visible
    await expect(page.locator('[data-testid="contract-text"]')).toBeVisible()
    await expect(page.locator('#signature')).toBeVisible()

    // Performance should not impact functionality
    await page.fill('#signer-name', 'Performance Test')
    await page.click('button:has-text("Type")')
    await page.check('#consent-checkbox')

    await expect(page.locator('button:has-text("Sign & Continue")')).toBeEnabled()

    // Check that batching optimizations are working
    const photographerRequests = networkRequests.filter(req =>
      req.url.includes('/photographers') && req.method === 'GET'
    )

    // Should use batching to limit number of requests
    expect(photographerRequests.length).toBeLessThan(10)  // Should be batched, not 100+ individual requests
  })

  test('should validate Zod schema enforcement', async ({ page }) => {
    // Navigate directly to contract page without completing booking flow
    await page.goto('/booking/test-photographer/contract')

    // Should redirect due to missing required data
    await page.waitForFunction(() =>
      !window.location.pathname.includes('/contract') ||
      document.querySelector('text=Missing required contract information')
    , { timeout: 10000 })

    // Should either redirect or show validation error
    const currentUrl = page.url()
    const isRedirected = !currentUrl.includes('/contract')
    const hasValidationError = await page.locator('text=Missing required contract information').isVisible()

    expect(isRedirected || hasValidationError).toBe(true)

    // Check console for Zod validation messages
    const zodMessages = consoleMessages.filter(msg =>
      msg.text.includes('Contract requirements validation failed') ||
      msg.text.includes('Missing required contract information')
    )

    expect(zodMessages.length).toBeGreaterThan(0)
  })

  test('should handle signature widget resilience', async ({ page }) => {
    await completeBookingFlowToContract(page)
    await page.waitForSelector('#signature', { timeout: 10000 })

    // Test signature widget error boundary
    await page.evaluate(() => {
      // Simulate signature widget error
      const canvas = document.querySelector('#signature canvas')
      if (canvas) {
        canvas.dispatchEvent(new Error('Canvas context error'))
      }
    })

    // Signature widget should have fallback handling
    await expect(page.locator('#signature')).toBeVisible()

    // Should still be able to use typed signature fallback
    await page.fill('#signer-name', 'Fallback Test')
    await page.click('button:has-text("Type")')

    // Should show typed signature confirmation
    await expect(page.locator('text=Typed signature ready')).toBeVisible()

    // Should enable continue button
    await page.check('#consent-checkbox')
    await expect(page.locator('button:has-text("Sign & Continue")')).toBeEnabled()
  })

  test.afterEach(async () => {
    // Log summary of resilience test results
    console.log(`Contract Resilience Test Summary:`)
    console.log(`- Console messages: ${consoleMessages.length}`)
    console.log(`- Network requests: ${networkRequests.length}`)
    console.log(`- Failed requests: ${failedRequests.length}`)

    // Check for critical errors that indicate lack of resilience
    const criticalErrors = consoleMessages.filter(msg =>
      msg.type === 'error' && (
        msg.text.includes('ERR_FAILED') ||
        msg.text.includes('URL too long') ||
        msg.text.includes('Uncaught') ||
        msg.text.includes('crashed')
      )
    )

    if (criticalErrors.length > 0) {
      console.error('Critical resilience failures detected:', criticalErrors)
      throw new Error(`Contract resilience test failed: ${criticalErrors.length} critical errors`)
    }

    // Verify graceful degradation indicators
    const gracefulMessages = consoleMessages.filter(msg =>
      msg.text.includes('non-blocking') ||
      msg.text.includes('auxiliary data') ||
      msg.text.includes('temporarily unavailable') ||
      msg.text.includes('graceful')
    )

    console.log(`Graceful degradation messages: ${gracefulMessages.length}`)
  })
})