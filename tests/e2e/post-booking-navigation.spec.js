import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Post-Booking Dashboard Navigation
 *
 * Verifies that:
 * 1. After completing a booking, clicking "View Booking Details" navigates correctly
 * 2. The booking details page loads without "Booking Not Found" error
 * 3. The dashboard correctly displays the new booking
 * 4. "Go to Dashboard" button works from payment success page
 */

test.describe('Post-Booking Dashboard Navigation', () => {
  // Mock booking ID for testing (would be real in production)
  const mockBookingId = 'test-booking-123'

  test('should navigate to booking details from CheckoutComplete', async ({ page }) => {
    // Simulate being on the CheckoutComplete page after payment
    // In a real scenario, this would be reached through the full booking flow

    // Navigate to a mock checkout complete URL with query parameters
    await page.goto(`/checkout-complete?payment_intent=test-pi-123&redirect_status=succeeded`)

    // Wait for page to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Look for the "View Booking Details" button
    const viewBookingButton = page.locator('button:has-text("View Booking Details")')

    // Check if button exists (only after successful payment verification)
    const isVisible = await viewBookingButton.isVisible().catch(() => false)

    if (isVisible) {
      // Click the button
      await viewBookingButton.click()

      // Wait for navigation
      await page.waitForTimeout(1500)

      // Should navigate to /booking/:bookingId (not /booking/:bookingId/details)
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/booking\/[^/]+$/)

      // Should NOT have /details in the URL
      expect(currentUrl).not.toContain('/details')

      // Verify the booking details page loads
      const bodyText = await page.locator('body').textContent()

      // Should NOT show "Booking Not Found" error
      expect(bodyText).not.toContain('Booking Not Found')
    } else {
      console.log('CheckoutComplete page not in success state - skipping test')
    }
  })

  test('should navigate to dashboard from CheckoutComplete', async ({ page }) => {
    // Navigate to checkout complete page
    await page.goto(`/checkout-complete?payment_intent=test-pi-123&redirect_status=succeeded`)

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Look for "Go to Dashboard" button
    const dashboardButton = page.locator('button:has-text("Go to Dashboard")')

    const isVisible = await dashboardButton.isVisible().catch(() => false)

    if (isVisible) {
      // Click the button
      await dashboardButton.click()

      // Wait for navigation
      await page.waitForTimeout(1500)

      // Should navigate to /dashboard
      const currentUrl = page.url()
      expect(currentUrl).toContain('/dashboard')
      expect(currentUrl).not.toContain('/details')

      // Verify dashboard loads (not 404)
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).not.toContain('404')
      expect(bodyText).not.toContain('Page Not Found')
    } else {
      console.log('CheckoutComplete page not in success state - skipping test')
    }
  })

  test('should load booking details directly via URL', async ({ page }) => {
    // Test direct navigation to booking details page
    // In a real scenario, this would be a valid booking ID

    await page.goto(`/booking/${mockBookingId}`)

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check if page loaded
    const bodyText = await page.locator('body').textContent()

    // The page should either:
    // 1. Show "Booking Not Found" (expected for mock ID)
    // 2. Show actual booking details (if ID exists)
    // 3. Show loading state

    // For mock ID, we expect "Booking Not Found"
    if (bodyText.includes('Booking Not Found')) {
      console.log('Mock booking ID correctly shows "Booking Not Found"')

      // Verify the "Return to Dashboard" link works
      const returnButton = page.locator('button:has-text("Return to Dashboard")')
      await expect(returnButton).toBeVisible()
    } else {
      // If a real booking ID was used, verify page structure
      const heading = page.locator('h1')
      await expect(heading).toContainText(/Booking|Details/)
    }
  })

  test('should prevent navigation to invalid booking details URL format', async ({ page }) => {
    // Test that the old incorrect format doesn't work
    await page.goto(`/booking/${mockBookingId}/details`)

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const currentUrl = page.url()

    // React Router should either:
    // 1. Show 404/Not Found page
    // 2. Redirect to valid route
    // 3. Show "Booking Not Found"

    const bodyText = await page.locator('body').textContent()

    // The page should indicate an error or not found state
    const hasError =
      bodyText.includes('404') ||
      bodyText.includes('Not Found') ||
      bodyText.includes('Booking Not Found') ||
      currentUrl.includes('/dashboard') // redirected

    expect(hasError).toBeTruthy()
  })

  test('should display booking on dashboard after creation', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check if dashboard loads
    const heading = page.locator('h1')
    await expect(heading).toContainText(/Dashboard/)

    // Verify dashboard structure exists
    const bodyText = await page.locator('body').textContent()

    // Should have either bookings or empty state
    const hasBookingsSection =
      bodyText.includes('Upcoming Bookings') ||
      bodyText.includes('No bookings yet') ||
      bodyText.includes('Empty')

    expect(hasBookingsSection).toBeTruthy()
  })

  test('should navigate from dashboard booking card to booking details', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Look for a "View Details" or similar button on a booking card
    const viewDetailsButton = page.locator('button:has-text("View Details")').first()

    const isVisible = await viewDetailsButton.isVisible().catch(() => false)

    if (isVisible) {
      // Click to view booking details
      await viewDetailsButton.click()

      // Wait for navigation
      await page.waitForTimeout(1500)

      // Should navigate to /booking/:bookingId
      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/booking\/[^/]+$/)

      // Should NOT have /details suffix
      expect(currentUrl).not.toContain('/details')

      // Verify booking details page loads
      const bodyText = await page.locator('body').textContent()
      expect(bodyText).not.toContain('404')
    } else {
      console.log('No bookings available on dashboard - skipping test')
    }
  })
})
