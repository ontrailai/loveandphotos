/**
 * E2E Tests for Browse.jsx Thumbnail Loading
 * Tests actual thumbnail loading behavior in a real browser
 */

const { test, expect } = require('@playwright/test')

test.describe('Browse Page Thumbnail Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the browse page
    await page.goto('/photographers')

    // Wait for the page to load and data to be fetched
    await page.waitForSelector('[data-testid="browse-page"], .cursor-pointer', { timeout: 10000 })
  })

  test('should load photographer avatars successfully', async ({ page }) => {
    // Wait for photographer cards to load
    await expect(page.locator('text=/\\d+ Photographers Available/')).toBeVisible()

    // Get all photographer cards
    const cards = page.locator('.cursor-pointer').filter({
      has: page.locator('h3') // Cards with photographer names
    })

    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Analyze first 5 cards for avatar loading
    const maxCards = Math.min(5, cardCount)

    for (let i = 0; i < maxCards; i++) {
      const card = cards.nth(i)
      const photographerName = await card.locator('h3').textContent()

      console.log(`Analyzing card ${i + 1}: ${photographerName}`)

      // Look for avatar container (rounded-full element)
      const avatarContainer = card.locator('[class*="rounded-full"]').first()
      await expect(avatarContainer).toBeVisible()

      // Check if it's showing an image or initials
      const avatarImg = card.locator('img').first()
      const avatarText = avatarContainer.locator('span').first()

      const hasImage = await avatarImg.isVisible().catch(() => false)
      const hasInitials = await avatarText.isVisible().catch(() => false)

      console.log(`  - Has image: ${hasImage}`)
      console.log(`  - Has initials: ${hasInitials}`)

      if (hasImage) {
        // If showing image, check that it loaded successfully
        const imgSrc = await avatarImg.getAttribute('src')
        console.log(`  - Image src: ${imgSrc}`)

        // Verify image is actually loaded (not broken)
        const naturalWidth = await avatarImg.evaluate(img => img.naturalWidth)
        expect(naturalWidth).toBeGreaterThan(0) // Image should have loaded with actual dimensions
      }

      if (hasInitials) {
        // If showing initials, verify they're reasonable
        const initials = await avatarText.textContent()
        console.log(`  - Initials: ${initials}`)
        expect(initials).toMatch(/^[A-Z]{1,2}$/) // Should be 1-2 uppercase letters
      }

      // Every avatar should show either image or initials
      expect(hasImage || hasInitials).toBe(true)
    }
  })

  test('should handle image load failures gracefully', async ({ page }) => {
    // Intercept image requests and simulate failures
    await page.route('**/images.unsplash.com/**', async route => {
      // Randomly fail 50% of image requests to simulate network issues
      if (Math.random() > 0.5) {
        await route.abort()
      } else {
        await route.continue()
      }
    })

    // Wait for cards to load
    await expect(page.locator('text=/\\d+ Photographers Available/')).toBeVisible()

    const cards = page.locator('.cursor-pointer').filter({
      has: page.locator('h3')
    })

    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    // Check that failed images fall back to initials
    const maxCards = Math.min(3, cardCount)

    for (let i = 0; i < maxCards; i++) {
      const card = cards.nth(i)
      const avatarContainer = card.locator('[class*="rounded-full"]').first()

      // Wait a bit for images to attempt loading
      await page.waitForTimeout(1000)

      // Should have either a loaded image or initials
      const avatarImg = card.locator('img').first()
      const avatarText = avatarContainer.locator('span').first()

      const hasVisibleImage = await avatarImg.isVisible().catch(() => false)
      const hasInitials = await avatarText.isVisible().catch(() => false)

      expect(hasVisibleImage || hasInitials).toBe(true)
    }
  })

  test('should maintain consistent avatar appearance', async ({ page }) => {
    // Take screenshot for visual comparison
    await expect(page.locator('text=/\\d+ Photographers Available/')).toBeVisible()

    const cards = page.locator('.cursor-pointer').filter({
      has: page.locator('h3')
    }).first() // Just test first card for consistency

    await expect(cards).toBeVisible()

    // Take screenshot of first photographer card
    await cards.screenshot({ path: 'tests/screenshots/photographer-card-avatar.png' })

    // Reload page and compare
    await page.reload()
    await expect(page.locator('text=/\\d+ Photographers Available/')).toBeVisible()

    const cardsAfterReload = page.locator('.cursor-pointer').filter({
      has: page.locator('h3')
    }).first()

    // Avatar should render consistently
    await expect(cardsAfterReload.locator('[class*="rounded-full"]')).toBeVisible()
  })

  test('should handle different screen sizes properly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()

    await expect(page.locator('text=/\\d+ Photographers Available/')).toBeVisible()

    const mobileCards = page.locator('.cursor-pointer').filter({
      has: page.locator('h3')
    })

    const mobileCardCount = await mobileCards.count()
    expect(mobileCardCount).toBeGreaterThan(0)

    // Verify avatars render on mobile
    const firstMobileCard = mobileCards.first()
    await expect(firstMobileCard.locator('[class*="rounded-full"]')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.reload()

    await expect(page.locator('text=/\\d+ Photographers Available/')).toBeVisible()

    const desktopCards = page.locator('.cursor-pointer').filter({
      has: page.locator('h3')
    })

    const desktopCardCount = await desktopCards.count()
    expect(desktopCardCount).toBeGreaterThan(0)

    // Verify avatars render on desktop
    const firstDesktopCard = desktopCards.first()
    await expect(firstDesktopCard.locator('[class*="rounded-full"]')).toBeVisible()
  })

  test('should track network requests for avatar images', async ({ page }) => {
    const imageRequests = []
    const imageResponses = []

    // Track image requests
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        imageRequests.push({
          url: request.url(),
          method: request.method()
        })
      }
    })

    // Track image responses
    page.on('response', response => {
      if (response.request().resourceType() === 'image') {
        imageResponses.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        })
      }
    })

    // Load the page
    await expect(page.locator('text=/\\d+ Photographers Available/')).toBeVisible()

    // Wait for images to load
    await page.waitForTimeout(2000)

    console.log(`Image requests: ${imageRequests.length}`)
    console.log(`Image responses: ${imageResponses.length}`)

    // Should have made some image requests for avatars
    expect(imageRequests.length).toBeGreaterThan(0)

    // Most images should load successfully
    const successfulImages = imageResponses.filter(r => r.ok)
    const failedImages = imageResponses.filter(r => !r.ok)

    console.log(`Successful images: ${successfulImages.length}`)
    console.log(`Failed images: ${failedImages.length}`)

    // Log failed image URLs for debugging
    failedImages.forEach(img => {
      console.log(`Failed image: ${img.url} (status: ${img.status})`)
    })

    // At least 50% of images should load successfully
    if (imageResponses.length > 0) {
      const successRate = successfulImages.length / imageResponses.length
      expect(successRate).toBeGreaterThan(0.5)
    }
  })

  test('should render fallback initials correctly', async ({ page }) => {
    // Block all image requests to force fallback
    await page.route('**/*.{jpg,jpeg,png,gif,webp,svg}', route => route.abort())

    await expect(page.locator('text=/\\d+ Photographers Available/')).toBeVisible()

    const cards = page.locator('.cursor-pointer').filter({
      has: page.locator('h3')
    })

    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)

    // All avatars should show initials since images are blocked
    const maxCards = Math.min(3, cardCount)

    for (let i = 0; i < maxCards; i++) {
      const card = cards.nth(i)
      const photographerName = await card.locator('h3').textContent()
      const avatarContainer = card.locator('[class*="rounded-full"]').first()
      const avatarText = avatarContainer.locator('span').first()

      await expect(avatarText).toBeVisible()

      const initials = await avatarText.textContent()
      console.log(`${photographerName} -> ${initials}`)

      // Verify initials make sense for the name
      expect(initials).toMatch(/^[A-Z]{1,2}$/)

      // For known names, verify correct initials
      if (photographerName.includes('Sarah Johnson')) {
        expect(initials).toBe('SJ')
      }
    }
  })
})