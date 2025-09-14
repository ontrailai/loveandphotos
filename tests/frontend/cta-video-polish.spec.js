/**
 * CTA Video Polish E2E Tests
 * Tests for rounded corners, full-width coverage, and depth styling
 */

import { test, expect } from '@playwright/test'

test.describe('CTA Video Polish', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('video container has rounded corners and depth styling', async ({ page }) => {
    // Navigate to CTA section
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Check for rounded corners container
    const videoContainer = ctaSection.locator('div').filter({ hasText: '' }).first()

    // Verify rounded corners are applied
    const borderRadius = await videoContainer.evaluate(el => {
      const computed = getComputedStyle(el.querySelector('.rounded-3xl'))
      return computed.borderRadius
    })

    // Should have significant border radius (rounded-3xl = 1.5rem = 24px)
    expect(parseFloat(borderRadius)).toBeGreaterThan(20)
  })

  test('video spans full width without black bars at different screen sizes', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Test different viewport sizes
    const viewports = [
      { width: 390, height: 844, name: 'mobile' },      // iPhone 12 Pro
      { width: 768, height: 1024, name: 'tablet' },     // iPad
      { width: 1024, height: 768, name: 'laptop' },     // Small laptop
      { width: 1440, height: 900, name: 'desktop' }     // Desktop
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500) // Allow resize to complete

      // Get section and video dimensions
      const sectionBox = await ctaSection.boundingBox()
      const videoElement = ctaSection.locator('video')
      const videoBox = await videoElement.boundingBox()

      // Video should span most of the section width (accounting for rounded corners)
      const widthRatio = videoBox.width / sectionBox.width
      expect(widthRatio).toBeGreaterThan(0.95) // At least 95% width coverage

      // Video should use object-cover to fill without letterboxing
      const objectFit = await videoElement.evaluate(el => getComputedStyle(el).objectFit)
      expect(objectFit).toBe('cover')

      console.log(`${viewport.name}: Video covers ${(widthRatio * 100).toFixed(1)}% of section width`)
    }
  })

  test('video has depth styling with ring and shadow', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Check for ring styling
    const ringElement = ctaSection.locator('.ring-1.ring-white\\/15')
    await expect(ringElement).toBeAttached()

    // Check for shadow styling
    const shadowElement = ctaSection.locator('.shadow-2xl.shadow-black\\/20')
    await expect(shadowElement).toBeAttached()

    // Verify shadow is actually applied
    const boxShadow = await shadowElement.evaluate(el => getComputedStyle(el).boxShadow)
    expect(boxShadow).not.toBe('none')
  })

  test('video has subtle scrim overlay for text readability', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Check for scrim overlay
    const scrim = ctaSection.locator('.bg-black\\/20.pointer-events-none')
    await expect(scrim).toBeAttached()

    // Verify scrim is positioned correctly
    const scrimStyles = await scrim.evaluate(el => {
      const computed = getComputedStyle(el)
      return {
        position: computed.position,
        pointerEvents: computed.pointerEvents,
        backgroundColor: computed.backgroundColor
      }
    })

    expect(scrimStyles.position).toBe('absolute')
    expect(scrimStyles.pointerEvents).toBe('none')
  })

  test('CTA button remains clickable and interactive over video', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    const ctaButton = ctaSection.locator('button', { hasText: 'Discover Excellence' })

    // Verify button is visible and clickable
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toBeEnabled()

    // Test hover effects
    await ctaButton.hover()

    // Verify button styling maintains proper z-index layering
    const zIndex = await ctaButton.evaluate(el => {
      // Check the parent container's z-index
      return getComputedStyle(el.closest('.relative.z-20')).zIndex
    })

    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(20)

    // Test click navigation
    await ctaButton.click()
    await page.waitForURL('**/photographers')
    expect(page.url()).toContain('/photographers')
  })

  test('text maintains proper contrast over video background', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    const headline = ctaSection.locator('h1')
    await expect(headline).toBeVisible()

    // Check text color for contrast
    const textColor = await headline.evaluate(el => getComputedStyle(el).color)

    // Should be white or very light for contrast over dark video
    expect(textColor).toBe('rgb(255, 255, 255)') // white
  })

  test('video loads without console errors', async ({ page }) => {
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    // Wait for video to attempt loading
    await page.waitForTimeout(3000)

    // Filter out expected/harmless errors
    const significantErrors = consoleErrors.filter(error =>
      !error.includes('autoplay') &&
      !error.includes('play() request was interrupted') &&
      !error.includes('network error') // Expected when testing without real video
    )

    expect(significantErrors).toHaveLength(0)
  })

  test('responsive layout maintains video quality at all breakpoints', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })

    const breakpoints = [
      { width: 375, height: 667, name: 'sm' },
      { width: 768, height: 1024, name: 'md' },
      { width: 1024, height: 768, name: 'lg' },
      { width: 1440, height: 900, name: 'xl' }
    ]

    for (const bp of breakpoints) {
      await page.setViewportSize(bp)
      await ctaSection.scrollIntoViewIfNeeded()

      // Verify section maintains minimum height
      const sectionBox = await ctaSection.boundingBox()
      expect(sectionBox.height).toBeGreaterThan(400)

      // Verify video element is present and styled correctly
      const video = ctaSection.locator('video')
      await expect(video).toBeAttached()

      const videoClasses = await video.getAttribute('class')
      expect(videoClasses).toContain('object-cover')
      expect(videoClasses).toContain('h-full')
      expect(videoClasses).toContain('w-full')

      console.log(`${bp.name}: Section height ${sectionBox.height}px, video properly styled`)
    }
  })

  test('accessibility - video is properly hidden from screen readers', async ({ page }) => {
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    await ctaSection.scrollIntoViewIfNeeded()

    const video = ctaSection.locator('video')

    // Verify video has proper aria attributes
    await expect(video).toHaveAttribute('aria-hidden', 'true')

    // Verify video has no controls (decorative background only)
    const hasControls = await video.evaluate(el => el.hasAttribute('controls'))
    expect(hasControls).toBe(false)
  })
})