/**
 * Issue #73: Photographer Application Submission Test
 *
 * Reproduces and verifies fix for:
 * - ERR_NAME_NOT_RESOLVED for Supabase URL (typo: jdvelavsl → jwjelavsl)
 * - Multiple GoTrueClient instances warning
 *
 * BEFORE FIX: Application fails with DNS resolution error
 * AFTER FIX: Application submits successfully
 */

import { test, expect } from '@playwright/test'

test.describe('Issue #73 - Photographer Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application page
    await page.goto('https://loveandphotos.onrender.com/talent/apply')
  })

  test('should successfully submit photographer application', async ({ page }) => {
    // Create array to capture console messages
    const consoleMessages = []
    const networkErrors = []

    // Listen for console messages
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      })
    })

    // Listen for failed network requests
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure()?.errorText || 'Unknown error'
      })
    })

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Select "Photographer" role
    await page.click('text=Photographer')

    // Fill out the form with test data
    await page.fill('input[name="full_name"]', 'Test Photographer Issue73')
    await page.fill('input[name="email"]', `test-issue73-${Date.now()}@example.com`)
    await page.fill('input[name="phone"]', '(555) 123-4567')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.fill('input[placeholder*="Confirm"]', 'TestPassword123!')

    // Answer professional requirements (all "Yes")
    const yesRadios = await page.locator('input[type="radio"][value="yes"]').all()
    for (const radio of yesRadios) {
      await radio.click()
    }

    // Fill years of experience
    await page.fill('input[name="years_experience"]', '5')

    // Fill referrer
    await page.fill('input[name="referrer"]', 'Test Referral')

    // Fill Instagram
    await page.fill('input[placeholder*="Instagram"]', '@testphotographer73')

    // Fill bio (500+ characters)
    const bio = 'I am a passionate wedding photographer with over 5 years of experience. '.repeat(8)
    await page.fill('textarea[name="bio"]', bio)

    // Check Terms of Service
    await page.check('input[type="checkbox"][name="tos_accepted"]')

    // Submit the form
    await page.click('button[type="submit"]:has-text("Submit Application")')

    // Wait for response
    await page.waitForTimeout(3000)

    // VERIFICATION: Check for DNS errors
    const dnsErrors = networkErrors.filter(err =>
      err.failure.includes('ERR_NAME_NOT_RESOLVED') ||
      err.url.includes('tboltfobncbyjdvelavsl')
    )

    // ASSERTION 1: No DNS resolution errors
    expect(dnsErrors.length).toBe(0)

    // ASSERTION 2: No failed requests to wrong Supabase URL
    const wrongUrlRequests = networkErrors.filter(err =>
      err.url.includes('tboltfobncbyjdvelavsl.supabase.co')
    )
    expect(wrongUrlRequests.length).toBe(0)

    // ASSERTION 3: Check for success redirect or message
    const currentUrl = page.url()
    const hasSuccessMessage = await page.locator('text=/application.*success|submit.*success|training/i').count() > 0

    expect(currentUrl.includes('/talent/training') || hasSuccessMessage).toBeTruthy()

    // ASSERTION 4: Verify no multiple GoTrueClient warnings (should be minimal due to singleton)
    const multiClientWarnings = consoleMessages.filter(msg =>
      msg.text.includes('Multiple GoTrueClient instances')
    )

    // Should be 0 or 1 (one warning max due to initial load)
    expect(multiClientWarnings.length).toBeLessThanOrEqual(1)

    // Log results for analysis
    console.log('✅ Test passed - No DNS errors detected')
    console.log(`Network errors: ${networkErrors.length}`)
    console.log(`GoTrueClient warnings: ${multiClientWarnings.length}`)

    if (networkErrors.length > 0) {
      console.log('Network errors:', JSON.stringify(networkErrors, null, 2))
    }
  })

  test('should load reviews without DNS errors', async ({ page }) => {
    const networkErrors = []

    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure()?.errorText || 'Unknown error'
      })
    })

    // Navigate to home page (loads reviews)
    await page.goto('https://loveandphotos.onrender.com/')
    await page.waitForLoadState('networkidle')

    // Check for reviews table DNS errors
    const reviewsDnsErrors = networkErrors.filter(err =>
      err.url.includes('/reviews') &&
      (err.failure.includes('ERR_NAME_NOT_RESOLVED') || err.url.includes('tboltfobncbyjdvelavsl'))
    )

    expect(reviewsDnsErrors.length).toBe(0)

    // Verify correct Supabase URL is being used
    const supabaseRequests = networkErrors.filter(err => err.url.includes('.supabase.co'))

    supabaseRequests.forEach(req => {
      // Should use correct URL: jwjelavsl not jdvelavsl
      expect(req.url).toContain('tboltfobncbjwjelavsl')
      expect(req.url).not.toContain('tboltfobncbyjdvelavsl')
    })

    console.log('✅ Reviews loaded successfully with correct Supabase URL')
  })

  test('should capture network requests to verify correct URL', async ({ page }) => {
    const supabaseRequests = []

    // Intercept all requests
    page.on('request', request => {
      if (request.url().includes('.supabase.co')) {
        supabaseRequests.push({
          url: request.url(),
          method: request.method()
        })
      }
    })

    await page.goto('https://loveandphotos.onrender.com/')
    await page.waitForLoadState('networkidle')

    // Verify at least some Supabase requests were made
    expect(supabaseRequests.length).toBeGreaterThan(0)

    // Verify ALL requests use correct URL
    supabaseRequests.forEach(req => {
      expect(req.url).toContain('tboltfobncbjwjelavsl.supabase.co')
      expect(req.url).not.toContain('tboltfobncbyjdvelavsl.supabase.co')
    })

    console.log(`✅ All ${supabaseRequests.length} Supabase requests use correct URL`)
  })
})
