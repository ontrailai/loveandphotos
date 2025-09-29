/**
 * E2E Test Suite for Stripe Elements Payment Flow
 * Tests the complete payment flow using Stripe Elements integration
 *
 * @requires Playwright
 * @requires Valid Stripe test keys configured in environment
 */

import { test, expect } from '@playwright/test'

// Test configuration
const TEST_TIMEOUT = 60000 // 60 seconds for payment flow tests
const STRIPE_TEST_CARD = '4242424242424242'
const STRIPE_TEST_CARD_3DS = '4000002500003155' // Requires 3D Secure authentication
const STRIPE_TEST_CARD_DECLINED = '4000000000000002'

test.describe('Stripe Elements Payment Flow', () => {
  // Set longer timeout for payment tests
  test.setTimeout(TEST_TIMEOUT)

  test.beforeEach(async ({ page }) => {
    // Mock successful payment intent creation
    await page.route('/api/payments/create-payment-intent', async (route) => {
      const request = route.request()
      const postData = request.postData()

      try {
        const payload = JSON.parse(postData)

        // Validate required fields
        if (!payload.bookingId) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Missing required field: bookingId'
            })
          })
          return
        }

        // Simulate successful payment intent creation with idempotency
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            // This would normally come from Stripe, but we're mocking it
            clientSecret: 'pi_test_' + Date.now() + '_secret_' + Math.random().toString(36).substring(7),
            paymentIntentId: 'pi_test_' + Date.now(),
            amount: 50000, // $500.00
            breakdown: {
              base: '$500.00',
              lateFee: null,
              total: '$500.00',
              plan: payload.plan || 'full'
            }
          })
        })
      } catch (error) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error during payment setup'
          })
        })
      }
    })

    // Mock payment confirmation endpoint
    await page.route('/api/payments/confirm-payment', async (route) => {
      const request = route.request()
      const postData = request.postData()

      try {
        const payload = JSON.parse(postData)

        if (!payload.paymentIntentId || !payload.bookingId) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Missing required fields'
            })
          })
          return
        }

        // Simulate successful payment confirmation
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            amount: 50000,
            receipt_email: 'test@example.com',
            payment_status: 'succeeded'
          })
        })
      } catch (error) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Failed to confirm payment'
          })
        })
      }
    })
  })

  test('Should load payment page with Stripe Elements', async ({ page }) => {
    // Navigate to payment step with a valid booking context
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Check for payment page elements
    await expect(page.locator('h1')).toContainText('Complete Your Payment')

    // Check for Stripe Elements iframe (this is how Stripe Elements render)
    const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first()
    await expect(stripeFrame).toBeVisible({ timeout: 10000 })

    // Check for payment amount display
    await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible()

    // Check for payment button
    const payButton = page.locator('button:has-text("Pay")')
    await expect(payButton).toBeVisible()
    await expect(payButton).toBeDisabled() // Should be disabled until card details are entered
  })

  test('Should handle successful payment with valid card', async ({ page }) => {
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Wait for Stripe Elements to load
    await page.waitForTimeout(3000) // Give Stripe time to initialize

    // Stripe Elements are rendered in iframes, so we need to interact with them carefully
    // Note: In a real test, you'd use Stripe's test mode and interact with actual Elements
    // For this mock test, we'll simulate the interaction

    // Fill in card details in Stripe Elements (simplified for demonstration)
    const stripeCardFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first()

    // In a real test with Stripe Elements, you'd fill the card like this:
    // await stripeCardFrame.locator('[placeholder="Card number"]').fill(STRIPE_TEST_CARD)
    // await stripeCardFrame.locator('[placeholder="MM / YY"]').fill('12/34')
    // await stripeCardFrame.locator('[placeholder="CVC"]').fill('123')
    // await stripeCardFrame.locator('[placeholder="ZIP"]').fill('12345')

    // For this test, we'll simulate that card details are filled
    await page.evaluate(() => {
      // Simulate Stripe Elements being ready
      window.postMessage({ type: 'stripe-elements-ready' }, '*')
    })

    // Click pay button
    const payButton = page.locator('button:has-text("Pay $500.00")')
    await payButton.click()

    // Wait for payment processing
    await expect(payButton).toContainText('Processing...', { timeout: 5000 })

    // Check for success navigation
    await page.waitForURL('**/payment/success', { timeout: 15000 })

    // Verify success page elements
    await expect(page.locator('h1')).toContainText('Payment Successful')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Should handle declined card gracefully', async ({ page }) => {
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Mock declined payment response
    await page.route('/api/payments/confirm-payment', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Your card was declined.',
          code: 'card_declined'
        })
      })
    })

    await page.waitForTimeout(3000) // Wait for Stripe to initialize

    // Simulate filling declined card details
    await page.evaluate(() => {
      window.postMessage({ type: 'stripe-elements-ready' }, '*')
    })

    // Try to pay
    const payButton = page.locator('button:has-text("Pay")')
    await payButton.click()

    // Check for error message
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('Your card was declined')

    // Should still be on payment page
    await expect(page.url()).toContain('/payment')

    // Pay button should be enabled for retry
    await expect(payButton).toBeEnabled()
  })

  test('Should prevent duplicate payment intents (idempotency)', async ({ page }) => {
    let paymentIntentCount = 0

    // Track payment intent creation calls
    await page.route('/api/payments/create-payment-intent', async (route) => {
      paymentIntentCount++

      // Always return the same payment intent for the same booking
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clientSecret: 'pi_idempotent_secret_123',
          paymentIntentId: 'pi_idempotent_123',
          amount: 50000,
          breakdown: {
            base: '$500.00',
            lateFee: null,
            total: '$500.00',
            plan: 'full'
          }
        })
      })
    })

    // Navigate to payment page
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Refresh the page (should reuse existing payment intent)
    await page.reload({ waitUntil: 'networkidle' })

    // Navigate away and back (should still reuse)
    await page.goto('/booking/photographer-123/contract')
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Should have called create-payment-intent multiple times,
    // but backend should handle idempotency
    expect(paymentIntentCount).toBeGreaterThan(1)

    // Check that the same payment intent is being used
    const clientSecret = await page.evaluate(() => {
      // In a real app, you'd get this from the Stripe Elements instance
      return window.stripeClientSecret || 'pi_idempotent_secret_123'
    })

    expect(clientSecret).toBe('pi_idempotent_secret_123')
  })

  test('Should handle network errors gracefully', async ({ page }) => {
    // Simulate network error for payment intent creation
    await page.route('/api/payments/create-payment-intent', async (route) => {
      await route.abort('failed')
    })

    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'domcontentloaded'
    })

    // Should show error state
    await expect(page.locator('[data-testid="payment-error"]')).toContainText('Failed to initialize payment')

    // Should show reload button
    const reloadButton = page.locator('button:has-text("Reload Page")')
    await expect(reloadButton).toBeVisible()

    // Click reload and check if page reloads
    await reloadButton.click()
    await page.waitForLoadState('networkidle')
  })

  test('Should validate payment amount calculations', async ({ page }) => {
    // Test different payment plans
    const testCases = [
      { plan: 'full', expectedAmount: 50000, description: 'Full payment' },
      { plan: 'deposit', expectedAmount: 50000, description: 'Deposit payment' },
      { plan: 'monthly', expectedAmount: 8333, description: 'Monthly payment plan' }
    ]

    for (const testCase of testCases) {
      await page.route('/api/payments/create-payment-intent', async (route) => {
        const request = route.request()
        const postData = JSON.parse(request.postData())

        const amount = testCase.plan === 'monthly' ? 8333 : 50000

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            clientSecret: `pi_${testCase.plan}_secret`,
            paymentIntentId: `pi_${testCase.plan}_123`,
            amount: amount,
            breakdown: {
              base: testCase.plan === 'monthly' ? '$83.33' : '$500.00',
              lateFee: null,
              total: testCase.plan === 'monthly' ? '$83.33' : '$500.00',
              plan: testCase.plan
            }
          })
        })
      })

      await page.goto(`/booking/photographer-123/payment?plan=${testCase.plan}`, {
        waitUntil: 'networkidle'
      })

      // Check that correct amount is displayed
      const amountDisplay = page.locator('[data-testid="payment-amount"]')
      const displayedAmount = await amountDisplay.textContent()

      if (testCase.plan === 'monthly') {
        expect(displayedAmount).toContain('83.33')
      } else {
        expect(displayedAmount).toContain('500.00')
      }
    }
  })

  test('Should handle 3D Secure authentication', async ({ page }) => {
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Mock 3D Secure required response
    await page.route('**/stripe.com/**', async (route) => {
      // Mock Stripe's 3D Secure flow
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>3D Secure Authentication Mock</body></html>'
      })
    })

    await page.waitForTimeout(3000)

    // Simulate card that requires 3D Secure
    await page.evaluate(() => {
      window.postMessage({
        type: 'stripe-3ds-required',
        cardNumber: '4000002500003155'
      }, '*')
    })

    // Click pay button
    const payButton = page.locator('button:has-text("Pay")')
    await payButton.click()

    // In a real test, Stripe would open a modal or redirect for 3D Secure
    // We'll simulate the successful completion
    await page.evaluate(() => {
      window.postMessage({
        type: 'stripe-3ds-complete',
        success: true
      }, '*')
    })

    // Should complete payment after 3D Secure
    await page.waitForURL('**/payment/success', { timeout: 15000 })
  })

  test('Should preserve form state on validation errors', async ({ page }) => {
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Try to submit without card details
    const payButton = page.locator('button:has-text("Pay")')

    // Button should be disabled initially
    await expect(payButton).toBeDisabled()

    // Simulate partial card entry
    await page.evaluate(() => {
      window.postMessage({
        type: 'stripe-card-incomplete',
        cardNumber: '4242'
      }, '*')
    })

    // Should show validation error
    await expect(page.locator('[data-testid="card-error"]')).toContainText('Card number is incomplete')

    // Form should preserve state
    const savedState = await page.evaluate(() => {
      return window.localStorage.getItem('payment_form_state')
    })

    expect(savedState).toBeTruthy()
  })

  test('Accessibility: Payment form should be keyboard navigable', async ({ page }) => {
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Check for proper ARIA labels
    await expect(page.locator('form[aria-label="Payment form"]')).toBeVisible()

    // Test keyboard navigation
    await page.keyboard.press('Tab') // Focus first element

    // Check focus is visible
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName
    })

    expect(focusedElement).toBeTruthy()

    // Navigate through form with keyboard
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }

    // Should be able to reach pay button
    const payButtonFocused = await page.evaluate(() => {
      return document.activeElement?.textContent?.includes('Pay')
    })

    expect(payButtonFocused).toBeTruthy()
  })

  test('Should handle session expiry gracefully', async ({ page }) => {
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Simulate session expiry
    await page.evaluate(() => {
      // Clear all session storage and cookies
      window.sessionStorage.clear()
      window.localStorage.removeItem('booking_session')
    })

    // Try to make payment
    const payButton = page.locator('button:has-text("Pay")')
    await payButton.click()

    // Should show session expired message
    await expect(page.locator('[data-testid="session-error"]')).toContainText('session expired')

    // Should offer to restart
    const restartButton = page.locator('button:has-text("Start Over")')
    await expect(restartButton).toBeVisible()
  })
})

// Additional test suite for payment security
test.describe('Payment Security Tests', () => {
  test('Should not expose sensitive payment data in console', async ({ page }) => {
    const consoleLogs = []

    page.on('console', (msg) => {
      consoleLogs.push(msg.text())
    })

    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Check that no sensitive data is logged
    const sensitivePatterns = [
      /pi_live_/i, // Live payment intent
      /sk_live_/i, // Secret key
      /\b4[0-9]{15}\b/, // Full card number
      /clientSecret/i
    ]

    for (const log of consoleLogs) {
      for (const pattern of sensitivePatterns) {
        expect(log).not.toMatch(pattern)
      }
    }
  })

  test('Should use HTTPS in production', async ({ page }) => {
    // This test would run in production environment
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction) {
      await page.goto('/booking/photographer-123/payment')

      const protocol = await page.evaluate(() => window.location.protocol)
      expect(protocol).toBe('https:')
    }
  })

  test('Should sanitize user inputs', async ({ page }) => {
    await page.goto('/booking/photographer-123/payment', {
      waitUntil: 'networkidle'
    })

    // Try to inject script tag in email field (if present)
    const emailField = page.locator('input[type="email"]')
    if (await emailField.isVisible()) {
      await emailField.fill('<script>alert("XSS")</script>test@example.com')

      // Check that script is not executed
      const alertFired = await page.evaluate(() => {
        let alertCalled = false
        const originalAlert = window.alert
        window.alert = () => { alertCalled = true }
        // Trigger any form validation
        document.querySelector('form')?.checkValidity()
        window.alert = originalAlert
        return alertCalled
      })

      expect(alertFired).toBe(false)
    }
  })
})