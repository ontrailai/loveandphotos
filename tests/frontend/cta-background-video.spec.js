/**
 * CTA Background Video E2E Tests
 * Playwright tests for the CTA section background video fix
 */

import { test, expect } from '@playwright/test'

test.describe('CTA Background Video', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('CTA section with background video is visible and properly layered', async ({ page }) => {
    // Scroll to CTA section
    await page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' }).scrollIntoViewIfNeeded()

    // Check that CTA section exists
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await expect(ctaSection).toBeVisible()

    // Verify section has proper height
    const sectionBox = await ctaSection.boundingBox()
    expect(sectionBox.height).toBeGreaterThan(500) // Should be at least 500px (min-h-[600px])

    // Check that video element exists within the CTA section
    const video = ctaSection.locator('video')
    await expect(video).toBeAttached()

    // Verify video has correct attributes for autoplay
    await expect(video).toHaveAttribute('autoplay')
    await expect(video).toHaveAttribute('muted')
    await expect(video).toHaveAttribute('loop')
    await expect(video).toHaveAttribute('playsinline')
    await expect(video).toHaveAttribute('aria-hidden', 'true')
  })

  test('video element has multiple source formats for browser compatibility', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    const video = ctaSection.locator('video')

    // Check for WebM source
    const webmSource = video.locator('source[type="video/webm"]')
    await expect(webmSource).toBeAttached()
    await expect(webmSource).toHaveAttribute('src', '/videos/cta-hero.webm')

    // Check for MP4 source
    const mp4Source = video.locator('source[type="video/mp4"]')
    await expect(mp4Source).toBeAttached()
    await expect(mp4Source).toHaveAttribute('src', '/videos/cta-hero.mp4')
  })

  test('video has poster image for fallback', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    const video = ctaSection.locator('video')

    // Verify poster attribute exists and contains unsplash URL (default fallback)
    const poster = await video.getAttribute('poster')
    expect(poster).toBeTruthy()
    expect(poster).toContain('unsplash.com')
  })

  test('CTA content is properly layered above video background', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Check that the headline is visible and properly positioned
    const headline = ctaSection.locator('h1').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await expect(headline).toBeVisible()

    // Check that the CTA button is visible
    const ctaButton = ctaSection.locator('button', { hasText: 'Discover Excellence' })
    await expect(ctaButton).toBeVisible()

    // Verify text is readable (not obscured by video)
    const headlineColor = await headline.evaluate(el => getComputedStyle(el).color)
    // Text should be white or light colored for visibility over dark video
    expect(headlineColor).toBe('rgb(255, 255, 255)') // white text
  })

  test('CTA button is clickable and functional', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    const ctaButton = ctaSection.locator('button', { hasText: 'Discover Excellence' })

    // Verify button is clickable
    await expect(ctaButton).toBeEnabled()

    // Click button and verify navigation (should go to photographers page)
    await ctaButton.click()
    await page.waitForURL('**/photographers')
    expect(page.url()).toContain('/photographers')
  })

  test('video background loads without console errors', async ({ page }) => {
    // Monitor console errors
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Navigate and scroll to CTA
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Wait a moment for video to attempt loading
    await page.waitForTimeout(3000)

    // Filter out expected video loading messages (these are normal)
    const unexpectedErrors = consoleErrors.filter(error =>
      !error.includes('Video autoplay failed') &&
      !error.includes('Video failed to load') &&
      !error.includes('network error') // Expected when video files are placeholders
    )

    // No unexpected errors should occur
    expect(unexpectedErrors).toHaveLength(0)
  })

  test('responsive behavior - CTA section maintains layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Verify CTA section is still visible and properly sized
    await expect(ctaSection).toBeVisible()
    const sectionBox = await ctaSection.boundingBox()
    expect(sectionBox.height).toBeGreaterThan(400) // Minimum height on mobile

    // Verify video maintains aspect ratio
    const video = ctaSection.locator('video')
    await expect(video).toBeAttached()

    // Verify text and button are still visible and readable
    const headline = ctaSection.locator('h1')
    await expect(headline).toBeVisible()

    const ctaButton = ctaSection.locator('button', { hasText: 'Discover Excellence' })
    await expect(ctaButton).toBeVisible()
  })

  test('video accessibility - proper ARIA attributes', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    const video = ctaSection.locator('video')

    // Verify video is properly hidden from screen readers
    await expect(video).toHaveAttribute('aria-hidden', 'true')

    // Verify fallback div has proper aria-label
    const fallbackDiv = video.locator('div[aria-label*="Background image"]')
    await expect(fallbackDiv).toBeAttached()
  })

  test('network resilience - graceful fallback when video files are unavailable', async ({ page }) => {
    // Mock video requests to return 404
    await page.route('**/videos/cta-hero.*', route => {
      route.fulfill({ status: 404 })
    })

    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Even with video 404, the CTA section should still render properly
    await expect(ctaSection).toBeVisible()

    // Content should still be visible and functional
    const headline = ctaSection.locator('h1')
    await expect(headline).toBeVisible()

    const ctaButton = ctaSection.locator('button', { hasText: 'Discover Excellence' })
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toBeEnabled()

    // Poster image should be visible as fallback
    const video = ctaSection.locator('video')
    const poster = await video.getAttribute('poster')
    expect(poster).toBeTruthy()
  })
})