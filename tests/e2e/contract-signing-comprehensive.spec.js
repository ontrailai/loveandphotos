/**
 * Contract Signing E2E Tests - Comprehensive Coverage
 * Tests complete contract flow with console monitoring, timeout behavior, and network scenarios
 */

import { test, expect } from '@playwright/test'

test.describe('Contract Signing - Comprehensive E2E', () => {
  let consoleMessages = []
  let networkRequests = []

  test.beforeEach(async ({ page }) => {
    // Reset tracking arrays
    consoleMessages = []
    networkRequests = []

    // Monitor console for warnings and errors
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: Date.now()
      })
    })

    // Monitor network requests
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      })
    })

    // Navigate to browse page to start booking flow
    await page.goto('/browse', { waitUntil: 'networkidle' })
  })

  test.afterEach(async ({ page }) => {
    // Check for React warnings about duplicate keys
    const duplicateKeyWarnings = consoleMessages.filter(msg =>
      msg.text.includes('Warning: Encountered two children with the same key') ||
      msg.text.includes('Each child in a list should have a unique "key" prop') ||
      msg.text.toLowerCase().includes('duplicate key')
    )

    if (duplicateKeyWarnings.length > 0) {
      console.log('Duplicate key warnings found:', duplicateKeyWarnings)
      throw new Error(`Found ${duplicateKeyWarnings.length} duplicate key warnings in console`)
    }

    // Check for any unexpected errors
    const errors = consoleMessages.filter(msg => msg.type === 'error')
    if (errors.length > 0) {
      console.log('Console errors found:', errors)
      // Allow expected errors but fail on unexpected ones
      const unexpectedErrors = errors.filter(error =>
        !error.text.includes('404') && // Expected 404s for contract API
        !error.text.includes('Network Error') && // Expected network errors in tests
        !error.text.includes('AbortError') // Expected when canceling requests
      )

      if (unexpectedErrors.length > 0) {
        throw new Error(`Found unexpected console errors: ${unexpectedErrors.map(e => e.text).join(', ')}`)
      }
    }
  })

  async function completeBookingFlowToContract(page) {
    // Click first photographer
    await page.click('[data-testid="photographer-card"]:first-child .btn-primary')

    // Schedule step - select first available date
    await page.waitForSelector('[data-testid="date-picker"]')
    await page.click('[data-testid="date-picker"] button:not([disabled]):first-child')
    await page.click('button:has-text("Continue")')

    // Package step - select first package
    await page.waitForSelector('[data-testid="package-card"]')
    await page.click('[data-testid="package-card"]:first-child .btn-primary')

    // Location step - select first location
    await page.waitForSelector('[data-testid="location-card"]')
    await page.click('[data-testid="location-card"]:first-child')
    await page.click('button:has-text("Continue")')

    // Add-ons step - skip to get to contract
    await page.click('button:has-text("Continue")')

    // Should now be on contract page
    await expect(page).toHaveURL(/\/booking\/[\w-]+\/contract/)
  }

  test('should complete contract flow without console warnings', async ({ page }) => {
    await completeBookingFlowToContract(page)

    // Wait for contract page to load completely
    await page.waitForSelector('h1:has-text("Contract Review & Signature")', { timeout: 10000 })

    // Verify no duplicate key warnings in console
    await page.waitForTimeout(2000) // Allow time for any delayed warnings

    const duplicateKeyWarnings = consoleMessages.filter(msg =>
      msg.text.includes('duplicate key') || msg.text.includes('same key')
    )

    expect(duplicateKeyWarnings).toHaveLength(0)

    // Verify contract content loads
    await expect(page.locator('h1')).toContainText('Contract Review & Signature')
    await expect(page.locator('[data-testid="contract-text"]')).toBeVisible()
  })

  test('should handle 10-second loading timeout gracefully', async ({ page }) => {
    // Intercept contract generation and delay it
    await page.route('/api/contracts/generate', async route => {
      // Hold the request for 12 seconds to trigger timeout
      await new Promise(resolve => setTimeout(resolve, 12000))
      await route.continue()
    })

    await completeBookingFlowToContract(page)

    // Should show loading initially
    await expect(page.locator('text=Loading contract...')).toBeVisible()

    // After 10+ seconds, should show error state
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Contract Unavailable')).toBeVisible()

    // Verify timeout is handled cleanly without infinite loading
    const loadingSpinner = page.locator('.animate-spin')
    await expect(loadingSpinner).not.toBeVisible()
  })

  test('should prevent infinite reconnection attempts', async ({ page }) => {
    let requestCount = 0

    // Track contract API calls
    await page.route('/api/contracts/generate', async route => {
      requestCount++
      if (requestCount <= 3) {
        await route.abort('failed')
      } else {
        // After 3 attempts, stop trying
        await route.continue()
      }
    })

    await completeBookingFlowToContract(page)

    // Wait for error handling
    await page.waitForTimeout(5000)

    // Should not make more than 3 retry attempts
    expect(requestCount).toBeLessThanOrEqual(3)

    // Should show error state, not infinite loading
    await expect(page.locator('[role="alert"]')).toBeVisible()
  })

  test('should complete signature flow end-to-end', async ({ page }) => {
    await completeBookingFlowToContract(page)

    // Wait for contract to load
    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Mock successful contract API
    await page.route('/api/contracts/sign', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          contractSignatureId: 'test-signature-123'
        })
      })
    })

    // Draw signature
    const canvas = page.locator('#signature canvas')
    await expect(canvas).toBeVisible()

    const box = await canvas.boundingBox()
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 150, box.y + 80)
    await page.mouse.move(box.x + 100, box.y + 120)
    await page.mouse.up()

    // Accept consent
    await page.click('#consent-checkbox')

    // Submit signature
    const submitButton = page.locator('button:has-text("Sign & Continue")')
    await expect(submitButton).not.toBeDisabled()
    await submitButton.click()

    // Should navigate to payment
    await expect(page).toHaveURL(/\/payment/, { timeout: 10000 })

    // Verify no console errors during the flow
    const unexpectedErrors = consoleMessages.filter(msg =>
      msg.type === 'error' && !msg.text.includes('404')
    )
    expect(unexpectedErrors).toHaveLength(0)
  })

  test('should handle network disconnection gracefully', async ({ page }) => {
    await completeBookingFlowToContract(page)

    // Wait for initial load
    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Simulate network disconnection for signature submission
    await page.route('/api/contracts/sign', async route => {
      await route.abort('failed')
    })

    // Complete signature
    const canvas = page.locator('#signature canvas')
    const box = await canvas.boundingBox()
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 100, box.y + 80)
    await page.mouse.up()

    await page.click('#consent-checkbox')

    // Attempt submission
    const submitButton = page.locator('button:has-text("Sign & Continue")')
    await submitButton.click()

    // Should show error message, not hang
    await expect(page.locator('text=Failed to submit signature')).toBeVisible({ timeout: 5000 })

    // Should remain on contract page
    await expect(page).toHaveURL(/\/contract/)

    // Submit button should be re-enabled for retry
    await expect(submitButton).not.toBeDisabled()
  })

  test('should monitor console for React warnings during interaction', async ({ page }) => {
    await completeBookingFlowToContract(page)

    // Wait for contract to load
    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Interact with various elements to trigger potential React warnings
    const canvas = page.locator('#signature canvas')

    // Multiple signature attempts to test for duplicate keys in dynamic content
    for (let i = 0; i < 3; i++) {
      const box = await canvas.boundingBox()

      // Draw signature
      await page.mouse.move(box.x + 30 + i * 10, box.y + 30 + i * 5)
      await page.mouse.down()
      await page.mouse.move(box.x + 120 + i * 10, box.y + 60 + i * 5)
      await page.mouse.up()

      // Clear and redraw
      await page.click('button:has-text("Clear")')

      // Check console after each interaction
      await page.waitForTimeout(500)
    }

    // Toggle consent multiple times
    for (let i = 0; i < 3; i++) {
      await page.click('#consent-checkbox')
      await page.waitForTimeout(200)
    }

    // Navigate to different steps and back
    await page.click('button:has-text("Back to Add-Ons")')
    await page.waitForTimeout(1000)
    await page.click('button:has-text("Continue")')

    // Final check for React warnings
    await page.waitForTimeout(2000)

    const reactWarnings = consoleMessages.filter(msg =>
      msg.text.includes('Warning:') ||
      msg.text.includes('duplicate key') ||
      msg.text.includes('same key') ||
      msg.text.includes('validateDOMNesting')
    )

    expect(reactWarnings).toHaveLength(0)
  })

  test('should handle rapid user interactions without errors', async ({ page }) => {
    await completeBookingFlowToContract(page)

    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Rapid clicking on various elements
    const canvas = page.locator('#signature canvas')
    const clearButton = page.locator('button:has-text("Clear")')
    const consentCheckbox = page.locator('#consent-checkbox')

    // Rapid signature drawing and clearing
    for (let i = 0; i < 5; i++) {
      const box = await canvas.boundingBox()
      await page.mouse.move(box.x + 50, box.y + 50)
      await page.mouse.down()
      await page.mouse.move(box.x + 100, box.y + 80)
      await page.mouse.up()

      await clearButton.click()
    }

    // Rapid consent toggling
    for (let i = 0; i < 10; i++) {
      await consentCheckbox.click()
    }

    // Check for JavaScript errors
    const jsErrors = consoleMessages.filter(msg =>
      msg.type === 'error' &&
      !msg.text.includes('404') &&
      !msg.text.includes('AbortError')
    )

    expect(jsErrors).toHaveLength(0)
  })

  test('should maintain clean console during navigation between steps', async ({ page }) => {
    await completeBookingFlowToContract(page)

    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Navigate back through completed steps
    const stepperSteps = page.locator('[data-testid="stepper-step"]')
    const stepCount = await stepperSteps.count()

    for (let i = stepCount - 2; i >= 0; i--) {
      const step = stepperSteps.nth(i)
      if (await step.isEnabled()) {
        await step.click()
        await page.waitForTimeout(1000)
      }
    }

    // Navigate back to contract
    await page.goto(page.url().replace(/\/[^\/]*$/, '/contract'))
    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Verify no warnings accumulated during navigation
    const warnings = consoleMessages.filter(msg =>
      msg.type === 'warning' || msg.text.includes('Warning:')
    )

    expect(warnings).toHaveLength(0)
  })

  test('should handle component unmount/remount cleanly', async ({ page }) => {
    await completeBookingFlowToContract(page)

    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Force component remount by navigating away and back
    await page.goto('/browse')
    await page.waitForTimeout(1000)

    // Complete flow again
    await completeBookingFlowToContract(page)
    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Check for memory leaks or cleanup warnings
    const memoryWarnings = consoleMessages.filter(msg =>
      msg.text.includes('memory leak') ||
      msg.text.includes('cleanup') ||
      msg.text.includes('useEffect')
    )

    expect(memoryWarnings).toHaveLength(0)
  })
})

test.describe('Contract Signing - Accessibility & Performance', () => {
  test('should maintain accessibility during loading states', async ({ page }) => {
    // Slow down contract loading to test accessibility during loading
    await page.route('/api/contracts/generate', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    await page.goto('/browse')

    // Complete booking flow
    await page.click('[data-testid="photographer-card"]:first-child .btn-primary')
    await page.click('[data-testid="date-picker"] button:not([disabled]):first-child')
    await page.click('button:has-text("Continue")')
    await page.click('[data-testid="package-card"]:first-child .btn-primary')
    await page.click('[data-testid="location-card"]:first-child')
    await page.click('button:has-text("Continue")')
    await page.click('button:has-text("Continue")')

    // Check loading state accessibility
    await expect(page.locator('[aria-live="polite"]')).toBeVisible()
    await expect(page.locator('text=Loading contract...')).toBeVisible()

    // Wait for content to load
    await page.waitForSelector('h1:has-text("Contract Review & Signature")')

    // Verify proper focus management
    const heading = page.locator('h1:has-text("Contract Review & Signature")')
    await expect(heading).toBeVisible()
  })

  test('should handle large contract content without performance issues', async ({ page }) => {
    // Mock large contract content
    await page.route('/api/contracts/generate', async route => {
      const largeContract = 'A'.repeat(50000) // Large contract text
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contractText: largeContract,
          contractHash: 'large-hash',
          contractVersion: 'v1.0'
        })
      })
    })

    await page.goto('/browse')

    // Complete booking flow quickly
    await page.click('[data-testid="photographer-card"]:first-child .btn-primary')
    await page.click('[data-testid="date-picker"] button:not([disabled]):first-child')
    await page.click('button:has-text("Continue")')
    await page.click('[data-testid="package-card"]:first-child .btn-primary')
    await page.click('[data-testid="location-card"]:first-child')
    await page.click('button:has-text("Continue")')
    await page.click('button:has-text("Continue")')

    // Measure page performance
    const startTime = Date.now()
    await page.waitForSelector('h1:has-text("Contract Review & Signature")')
    const loadTime = Date.now() - startTime

    // Should load within reasonable time even with large content
    expect(loadTime).toBeLessThan(5000)

    // Verify scrolling performance
    const contractText = page.locator('[data-testid="contract-text"]')
    await contractText.scrollIntoView()

    // Should be responsive after large content load
    const canvas = page.locator('#signature canvas')
    await expect(canvas).toBeVisible()
  })
})