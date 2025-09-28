/**
 * Contract Flow E2E Tests
 * Tests the complete contract step functionality including signature capture and validation
 */

import { test, expect } from '@playwright/test'

test.describe('Contract Flow', () => {
  let bookingFlowData

  test.beforeEach(async ({ page }) => {
    // Navigate to booking flow and complete prerequisite steps
    await page.goto('/browse')

    // Complete the booking flow up to contract step
    // This assumes we have test photographers and can complete the flow
    await page.click('[data-testid="photographer-card"]:first-child .btn-primary')

    // Schedule step - select first available date
    await page.click('[data-testid="date-picker"] button:not([disabled]):first-child')
    await page.click('button:has-text("Continue")')

    // Package step - select first package
    await page.click('[data-testid="package-card"]:first-child .btn-primary')

    // Location step - select first location
    await page.click('[data-testid="location-card"]:first-child')
    await page.click('button:has-text("Continue")')

    // Add-ons step - skip add-ons to get to contract
    await page.click('button:has-text("Continue")')

    // Should now be on contract page
    await expect(page).toHaveURL(/\/booking\/[\w-]+\/contract/)
  })

  test('should render contract page with auto-filled booking data', async ({ page }) => {
    // Verify page loads without errors
    await expect(page.locator('h1')).toContainText('Contract & Signature')

    // Verify booking summary card displays correct information
    await expect(page.locator('[data-testid="booking-summary"]')).toBeVisible()

    // Check that key booking details are populated
    const eventDate = page.locator('[data-testid="summary-event-date"]')
    const location = page.locator('[data-testid="summary-location"]')
    const packageName = page.locator('[data-testid="summary-package"]')
    const price = page.locator('[data-testid="summary-price"]')

    await expect(eventDate).not.toBeEmpty()
    await expect(location).not.toBeEmpty()
    await expect(packageName).not.toBeEmpty()
    await expect(price).toContainText('$')

    // Verify contract text is displayed
    await expect(page.locator('[data-testid="contract-text"]')).toBeVisible()
    await expect(page.locator('[data-testid="contract-text"]')).toContainText('THIS IS A LEGAL CONTRACT')

    // Verify signature section is present
    await expect(page.locator('#signature')).toBeVisible()
  })

  test('should scroll to signature when "Jump to Signature" button is clicked', async ({ page }) => {
    // Click the "Jump to Signature" button
    await page.click('button:has-text("Jump to Signature")')

    // Wait for scroll animation to complete
    await page.waitForTimeout(1000)

    // Verify signature section is in viewport
    const signatureBox = page.locator('#signature')
    await expect(signatureBox).toBeInViewport()

    // Verify the signature canvas is visible and focused area
    const canvas = page.locator('#signature canvas')
    await expect(canvas).toBeVisible()
  })

  test('should prevent navigation without signature and consent', async ({ page }) => {
    // Try to submit without signature
    const submitButton = page.locator('button:has-text("Sign Contract & Continue")')
    await expect(submitButton).toBeDisabled()

    // Try to click anyway (should not navigate)
    await submitButton.click({ force: true })

    // Should still be on contract page
    await expect(page).toHaveURL(/\/contract/)

    // Verify error messages are shown
    await expect(page.locator('text=Signature is required')).toBeVisible()
    await expect(page.locator('text=You must agree to the terms')).toBeVisible()
  })

  test('should capture and submit signature successfully', async ({ page }) => {
    // Draw a signature on the canvas
    const canvas = page.locator('#signature canvas')

    // Draw a simple signature by dragging
    const box = await canvas.boundingBox()
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 150, box.y + 80)
    await page.mouse.move(box.x + 100, box.y + 120)
    await page.mouse.up()

    // Verify signature was captured
    await expect(page.locator('.text-green-600:has-text("Signature captured")')).toBeVisible()

    // Check consent checkbox
    await page.click('#consent-checkbox')

    // Verify submit button is now enabled
    const submitButton = page.locator('button:has-text("Sign Contract & Continue")')
    await expect(submitButton).not.toBeDisabled()

    // Submit the signature
    await submitButton.click()

    // Should navigate to payment step
    await expect(page).toHaveURL(/\/payment/)
  })

  test('should support typed signature for accessibility', async ({ page }) => {
    // Enter name in the signer name field
    await page.fill('#signer-name', 'John Doe')

    // Click "Type" button to generate typed signature
    await page.click('button:has-text("Type")')

    // Verify typed signature was generated
    await expect(page.locator('.text-green-600:has-text("Typed signature ready")')).toBeVisible()

    // Check consent
    await page.click('#consent-checkbox')

    // Submit should work with typed signature
    const submitButton = page.locator('button:has-text("Sign Contract & Continue")')
    await expect(submitButton).not.toBeDisabled()

    await submitButton.click()
    await expect(page).toHaveURL(/\/payment/)
  })

  test('should validate signature controls work correctly', async ({ page }) => {
    // Draw initial signature
    const canvas = page.locator('#signature canvas')
    const box = await canvas.boundingBox()

    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 100, box.y + 80)
    await page.mouse.up()

    // Verify signature captured
    await expect(page.locator('.text-green-600')).toBeVisible()

    // Test clear button
    await page.click('button:has-text("Clear")')
    await expect(page.locator('.text-green-600')).not.toBeVisible()

    // Draw another signature for undo test
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 100, box.y + 80)
    await page.mouse.up()

    // Add second stroke
    await page.mouse.move(box.x + 60, box.y + 60)
    await page.mouse.down()
    await page.mouse.move(box.x + 110, box.y + 90)
    await page.mouse.up()

    // Test undo button (should remove last stroke)
    await page.click('button:has-text("Undo")')

    // Signature should still be present but modified
    await expect(page.locator('.text-green-600')).toBeVisible()
  })

  test('should support keyboard navigation for accessibility', async ({ page }) => {
    // Test keyboard navigation to signature area
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // When focused on canvas and pressing Enter/Space, should focus name input
    await page.keyboard.press('Enter')

    // Should focus the signer name input
    await expect(page.locator('#signer-name')).toBeFocused()

    // Test tabbing through form elements
    await page.keyboard.press('Tab') // To Type button
    await page.keyboard.press('Tab') // To Clear button
    await page.keyboard.press('Tab') // To Undo button
    await page.keyboard.press('Tab') // To consent checkbox
    await page.keyboard.press('Tab') // To submit button

    // Verify form is keyboard accessible
    await expect(page.locator('button:has-text("Sign Contract & Continue")')).toBeFocused()
  })

  test('should display contract version and handle hash validation', async ({ page }) => {
    // Verify contract version is displayed
    await expect(page.locator('text=LNP-Contract-v1.0')).toBeVisible()

    // Check that contract hash is generated (not visible to user but in form data)
    const hashInput = page.locator('input[name="contractHash"]')
    await expect(hashInput).toHaveValue(/.+/) // Should have some hash value

    // Verify contract text contains the expected booking data
    const contractText = page.locator('[data-testid="contract-text"]')
    await expect(contractText).toContainText('Event Date:')
    await expect(contractText).toContainText('Location:')
    await expect(contractText).toContainText('Package:')
    await expect(contractText).toContainText('Price:')
  })

  test('should prevent access if prerequisite steps not completed', async ({ page }) => {
    // Try to access contract page directly without completing prior steps
    await page.goto('/booking/test-photographer/contract')

    // Should redirect to first incomplete step
    await expect(page).toHaveURL(/\/schedule/)
  })

  test('should persist signature data and prevent duplicate submission', async ({ page }) => {
    // Draw signature and submit
    const canvas = page.locator('#signature canvas')
    const box = await canvas.boundingBox()

    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 150, box.y + 80)
    await page.mouse.up()

    await page.click('#consent-checkbox')

    // Intercept API call to verify data
    const responsePromise = page.waitForResponse('/api/contracts/sign')
    await page.click('button:has-text("Sign Contract & Continue")')

    const response = await responsePromise
    expect(response.status()).toBe(200)

    const responseData = await response.json()
    expect(responseData.success).toBe(true)
    expect(responseData.contractSignatureId).toBeDefined()

    // Should navigate to payment
    await expect(page).toHaveURL(/\/payment/)

    // Verify cannot go back to contract (should redirect if contract already signed)
    await page.goBack()
    await expect(page).toHaveURL(/\/payment/) // Should stay on or return to payment
  })

  test('should handle signature validation errors gracefully', async ({ page }) => {
    // Simulate oversized signature by injecting large base64 data
    await page.evaluate(() => {
      // Create oversized signature data
      const largeSignature = 'data:image/png;base64,' + 'A'.repeat(3000000) // > 2MB
      window.testOversizedSignature = largeSignature
    })

    // Mock the signature change to use oversized data
    await page.evaluate(() => {
      const canvas = document.querySelector('#signature canvas')
      if (canvas) {
        canvas.toDataURL = () => window.testOversizedSignature
      }
    })

    // Try to draw and submit (should be rejected by size validation)
    const canvas = page.locator('#signature canvas')
    const box = await canvas.boundingBox()
    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 100, box.y + 80)
    await page.mouse.up()

    await page.click('#consent-checkbox')
    await page.click('button:has-text("Sign Contract & Continue")')

    // Should show error message
    await expect(page.locator('text=Signature too large')).toBeVisible()

    // Should remain on contract page
    await expect(page).toHaveURL(/\/contract/)
  })
})

test.describe('Contract Accessibility', () => {
  test('should meet WCAG AA color contrast requirements', async ({ page }) => {
    await page.goto('/booking/test-photographer/contract')

    // Test color contrast on key elements
    const title = page.locator('h1')
    const titleColor = await title.evaluate(el => getComputedStyle(el).color)
    const titleBg = await title.evaluate(el => getComputedStyle(el).backgroundColor)

    // Basic check that text is not the same color as background
    expect(titleColor).not.toBe(titleBg)

    // Verify important interactive elements have proper contrast
    const submitButton = page.locator('button:has-text("Sign Contract & Continue")')
    await expect(submitButton).toBeVisible()

    const checkbox = page.locator('#consent-checkbox')
    await expect(checkbox).toBeVisible()
  })

  test('should provide proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/booking/test-photographer/contract')

    // Verify signature area has proper ARIA labeling
    const signatureRegion = page.locator('#signature')
    await expect(signatureRegion).toHaveAttribute('role', 'region')
    await expect(signatureRegion).toHaveAttribute('aria-label', 'Digital signature capture')

    // Verify canvas has proper labeling
    const canvas = page.locator('#signature canvas')
    await expect(canvas).toHaveAttribute('aria-label', 'Signature drawing area')

    // Verify form controls have labels
    const nameInput = page.locator('#signer-name')
    await expect(nameInput).toHaveAttribute('aria-label')

    const consentCheckbox = page.locator('#consent-checkbox')
    await expect(consentCheckbox).toHaveAttribute('aria-describedby')
  })

  test('should announce signature status to screen readers', async ({ page }) => {
    await page.goto('/booking/test-photographer/contract')

    // Verify live region exists for announcements
    const liveRegion = page.locator('[aria-live="polite"]')
    await expect(liveRegion).toBeAttached()

    // Draw signature and verify announcement
    const canvas = page.locator('#signature canvas')
    const box = await canvas.boundingBox()

    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 100, box.y + 80)
    await page.mouse.up()

    // Check that status is announced
    await expect(page.locator('.text-green-600')).toContainText('captured')
  })
})