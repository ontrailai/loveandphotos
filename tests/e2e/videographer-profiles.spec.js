import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Videographer Profile Pages
 *
 * Verifies that:
 * 1. Videographers page loads correctly
 * 2. Individual videographer profiles load without "Profile not found" errors
 * 3. Navigation from videographers list to profile works
 */

test.describe('Videographer Profiles', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the videographers browse page before each test
    await page.goto('/videographers')
  })

  test('should load videographers browse page without errors', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify page title or heading
    await expect(page.locator('h1, h2').first()).toBeVisible()

    // Verify no 404 or "Page Not Found" error
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('404')
    expect(bodyText).not.toContain('Page Not Found')
  })

  test('should display videographer cards or listings', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle')

    // Check for videographer cards or profile elements
    // Adjust selector based on actual component structure
    const videographerElements = page.locator('[data-testid="videographer-card"], article, [class*="card"]')

    // Should have at least one videographer displayed
    await expect(videographerElements.first()).toBeVisible({ timeout: 10000 })
  })

  test('should load a specific videographer profile without "Profile not found" error', async ({ page }) => {
    // Navigate to a known videographer profile
    // Using the ID from the investigation: fab78e79-9011-4772-a1c7-e55b1d9628a3
    await page.goto('/photographer/fab78e79-9011-4772-a1c7-e55b1d9628a3')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Verify profile loaded successfully
    const bodyText = await page.locator('body').textContent()

    // Should NOT contain error messages
    expect(bodyText).not.toContain('Profile not found')
    expect(bodyText).not.toContain('404')
    expect(bodyText).not.toContain('Page Not Found')

    // Should contain profile information
    // Verify profile name, location, or other identifying information is present
    await expect(page.locator('h1, h2, [data-testid="photographer-name"]').first()).toBeVisible()
  })

  test('should navigate from videographers list to profile successfully', async ({ page }) => {
    // Wait for videographers to load
    await page.waitForLoadState('networkidle')

    // Find the first videographer card (uses onClick, not <a> tags)
    const firstVideographerCard = page.locator('div[class*="cursor-pointer"]').first()

    // Wait for the card to be visible
    await expect(firstVideographerCard).toBeVisible({ timeout: 10000 })

    // Click to navigate to profile
    await firstVideographerCard.click()

    // Wait for navigation
    await page.waitForLoadState('networkidle')

    // Verify we're on a profile page
    expect(page.url()).toContain('/photographer/')

    // Verify profile loaded without error
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('Profile not found')
    expect(bodyText).not.toContain('404')
  })

  test('should have working "Video Specialists" link in footer', async ({ page }) => {
    // Navigate to home page
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Find and click the "Video Specialists" link in footer
    const videoLink = page.locator('footer a:has-text("Video Specialists")')
    await expect(videoLink).toBeVisible()

    await videoLink.click()

    // Wait for navigation
    await page.waitForLoadState('networkidle')

    // Verify we're on the videographers page
    expect(page.url()).toContain('/videographers')

    // Verify no 404 error
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('404')
    expect(bodyText).not.toContain('Page Not Found')
  })

  test('should load videographer profile with all required sections', async ({ page }) => {
    // Navigate to a known videographer profile
    await page.goto('/photographer/fab78e79-9011-4772-a1c7-e55b1d9628a3')
    await page.waitForLoadState('networkidle')

    // Verify key profile sections are present
    // Portfolio/images section
    const portfolioSection = page.locator('[data-testid="portfolio"], [class*="portfolio"], img').first()
    await expect(portfolioSection).toBeVisible({ timeout: 10000 })

    // Booking button or contact section
    const bookingButton = page.locator('button:has-text("Book"), a:has-text("Book"), button:has-text("Contact")')
    await expect(bookingButton.first()).toBeVisible()
  })
})
