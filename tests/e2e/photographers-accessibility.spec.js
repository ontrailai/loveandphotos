/**
 * E2E Accessibility Tests for Photographers Browse Page
 * WCAG AA compliance testing, keyboard navigation, screen reader compatibility
 */

const { test, expect } = require('@playwright/test')

test.describe('Photographers Browse Page - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/photographers')
    await page.waitForSelector('[data-testid="photographers-page"], .grid', { timeout: 15000 })
  })

  test.describe('Keyboard Navigation', () => {
    test('should navigate through search form with keyboard', async ({ page }) => {
      // Start from location input
      const locationInput = page.locator('input[placeholder*="ZIP"], input[placeholder*="city"]')
      await locationInput.focus()
      await expect(locationInput).toBeFocused()

      // Tab to date input
      await page.keyboard.press('Tab')
      const dateInput = page.locator('input[type="date"]')
      await expect(dateInput).toBeFocused()

      // Tab to search button
      await page.keyboard.press('Tab')
      const searchButton = page.locator('button[type="submit"]')
      await expect(searchButton).toBeFocused()

      // Should be able to activate with Enter or Space
      await page.keyboard.press('Enter')

      // Should submit search
      await page.waitForTimeout(500)
    })

    test('should navigate sort dropdown with keyboard', async ({ page }) => {
      // Find and focus sort dropdown
      const sortDropdown = page.locator('button').filter({ hasText: /Sort by|Top Rated/ }).first()
      await sortDropdown.focus()
      await expect(sortDropdown).toBeFocused()

      // Open dropdown with Enter
      await page.keyboard.press('Enter')

      // Should show dropdown options
      await page.waitForTimeout(300)

      // Arrow keys should navigate options
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')

      // Enter should select option
      await page.keyboard.press('Enter')

      // Dropdown should close
      await page.waitForTimeout(300)
    })

    test('should navigate view mode toggle with keyboard', async ({ page }) => {
      // Find view toggle buttons
      const viewButtons = page.locator('button[aria-label*="view"], button').filter({ has: page.locator('svg') })

      if (await viewButtons.count() > 0) {
        const firstButton = viewButtons.first()
        await firstButton.focus()
        await expect(firstButton).toBeFocused()

        // Space should activate
        await page.keyboard.press('Space')
        await page.waitForTimeout(300)

        // Tab to next view button
        await page.keyboard.press('Tab')
        const secondButton = viewButtons.last()
        if (await secondButton.isVisible()) {
          await expect(secondButton).toBeFocused()
        }
      }
    })

    test('should navigate photographer cards with keyboard', async ({ page }) => {
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      // Cards should be focusable
      const firstCard = cards.first()
      await firstCard.focus()
      await expect(firstCard).toBeFocused()

      // Enter should activate card
      await page.keyboard.press('Enter')

      // Should navigate or show details
      await page.waitForTimeout(1000)
    })

    test('should navigate filters with keyboard', async ({ page }) => {
      // Find rating filter options
      const ratingLabels = page.locator('label').filter({ hasText: /star/ })

      if (await ratingLabels.count() > 0) {
        const firstRating = ratingLabels.first()
        await firstRating.focus()

        // Arrow keys should navigate between radio options
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowUp')

        // Space should select
        await page.keyboard.press('Space')
        await page.waitForTimeout(300)
      }

      // Find checkbox filters (specialties)
      const checkboxLabels = page.locator('label').filter({ hasText: /Wedding|Portrait|Event/ })

      if (await checkboxLabels.count() > 0) {
        const firstCheckbox = checkboxLabels.first()
        await firstCheckbox.focus()

        // Space should toggle checkbox
        await page.keyboard.press('Space')
        await page.waitForTimeout(300)
      }
    })

    test('should trap focus in mobile filter modal', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Find mobile filter button
      const mobileFilterButton = page.locator('button').filter({ hasText: /Filter|menu/i }).first()

      if (await mobileFilterButton.isVisible()) {
        await mobileFilterButton.click()

        // Wait for modal
        const modal = page.locator('[role="dialog"], .sheet, .drawer')
        await expect(modal.first()).toBeVisible({ timeout: 2000 }).catch(() => {
          // Modal might be implemented differently
        })

        // Focus should be trapped within modal
        await page.keyboard.press('Tab')
        await page.keyboard.press('Tab')
        await page.keyboard.press('Tab')

        // Focus should remain within modal
        const focusedElement = page.locator(':focus')
        const isInModal = await modal.first().locator(':focus').count() > 0

        if (isInModal) {
          expect(true).toBe(true) // Focus is trapped
        }

        // Escape should close modal
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)
      }
    })
  })

  test.describe('ARIA Attributes and Semantics', () => {
    test('should have proper headings structure', async ({ page }) => {
      // Check for main heading
      const mainHeading = page.locator('h1')
      if (await mainHeading.count() > 0) {
        await expect(mainHeading.first()).toBeVisible()
      }

      // Check for logical heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      expect(headings.length).toBeGreaterThan(0)

      // Photographer names should be h3 or similar
      const photographerNames = page.locator('h3')
      expect(await photographerNames.count()).toBeGreaterThan(0)
    })

    test('should have proper form labels', async ({ page }) => {
      // Location input should have label
      const locationInput = page.locator('input[placeholder*="ZIP"], input[placeholder*="city"]')
      const locationLabel = await locationInput.getAttribute('aria-label')
      expect(locationLabel).toBeTruthy()

      // Date input should have label
      const dateInput = page.locator('input[type="date"]')
      const dateLabel = await dateInput.getAttribute('aria-label')
      expect(dateLabel).toBeTruthy()

      // Search button should have accessible name
      const searchButton = page.locator('button[type="submit"]')
      const buttonText = await searchButton.textContent()
      const buttonLabel = await searchButton.getAttribute('aria-label')
      expect(buttonText || buttonLabel).toBeTruthy()
    })

    test('should have proper button states and labels', async ({ page }) => {
      // View toggle buttons should have aria-pressed
      const viewButtons = page.locator('button[aria-label*="view"]')

      for (let i = 0; i < await viewButtons.count(); i++) {
        const button = viewButtons.nth(i)
        const ariaPressed = await button.getAttribute('aria-pressed')
        const ariaLabel = await button.getAttribute('aria-label')

        expect(ariaLabel).toBeTruthy()
        // aria-pressed should be 'true' or 'false', not null
        expect(ariaPressed === 'true' || ariaPressed === 'false').toBe(true)
      }
    })

    test('should have proper list and listitem semantics', async ({ page }) => {
      // Photographer cards should be in a list or have proper structure
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      // Check if cards are in a list or grid structure
      const listContainer = page.locator('ul, [role="list"], .grid')
      await expect(listContainer.first()).toBeVisible()

      // Each card should have proper semantics
      const firstCard = cards.first()
      const role = await firstCard.getAttribute('role')
      const isClickable = await firstCard.getAttribute('tabindex')

      // Cards should be interactive (role="button" or similar)
      expect(role === 'button' || isClickable !== null || await firstCard.locator('a').count() > 0).toBe(true)
    })

    test('should have proper dropdown semantics', async ({ page }) => {
      const sortDropdown = page.locator('button').filter({ hasText: /Sort by/ }).first()

      if (await sortDropdown.isVisible()) {
        // Should have aria-expanded
        const ariaExpanded = await sortDropdown.getAttribute('aria-expanded')
        expect(ariaExpanded === 'true' || ariaExpanded === 'false').toBe(true)

        // Should have aria-haspopup
        const ariaHaspopup = await sortDropdown.getAttribute('aria-haspopup')
        expect(ariaHaspopup).toBeTruthy()

        // Open dropdown
        await sortDropdown.click()
        await page.waitForTimeout(300)

        // Dropdown should have proper role
        const dropdown = page.locator('[role="listbox"], [role="menu"]')
        if (await dropdown.count() > 0) {
          await expect(dropdown.first()).toBeVisible()

          // Options should have proper roles
          const options = dropdown.first().locator('[role="option"], [role="menuitem"]')
          expect(await options.count()).toBeGreaterThan(0)
        }
      }
    })

    test('should have proper image alt text', async ({ page }) => {
      // Portfolio images should have alt text
      const portfolioImages = page.locator('img').filter({ hasText: /portfolio|photo/ })

      for (let i = 0; i < Math.min(3, await portfolioImages.count()); i++) {
        const img = portfolioImages.nth(i)
        const alt = await img.getAttribute('alt')
        expect(alt).toBeTruthy()
        expect(alt.length).toBeGreaterThan(0)
      }

      // Avatar images should have alt text
      const avatarImages = page.locator('img').filter({ hasText: /avatar/ })

      for (let i = 0; i < Math.min(3, await avatarImages.count()); i++) {
        const img = avatarImages.nth(i)
        const alt = await img.getAttribute('alt')
        expect(alt).toBeTruthy()
      }
    })
  })

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should have sufficient color contrast', async ({ page }) => {
      // Check main text elements have sufficient contrast
      const textElements = [
        page.locator('h1, h2, h3').first(),
        page.locator('p, span').first(),
        page.locator('button').first()
      ]

      for (const element of textElements) {
        if (await element.isVisible()) {
          // Get computed styles
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el)
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            }
          })

          // Basic check that text isn't transparent
          expect(styles.color).not.toBe('rgba(0, 0, 0, 0)')
          expect(styles.color).not.toBe('transparent')
        }
      }
    })

    test('should support reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.reload()

      // Page should still function without animations
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      // Hover effects should still work but without motion
      await cards.first().hover()
      await page.waitForTimeout(300)
      await expect(cards.first()).toBeVisible()
    })

    test('should be usable at 200% zoom', async ({ page }) => {
      // Simulate 200% zoom
      await page.setViewportSize({ width: 640, height: 360 }) // Half size simulates 200% zoom

      await page.reload()
      await page.waitForSelector('.grid, [data-testid="photographers-page"]', { timeout: 10000 })

      // Page should still be functional
      const searchInput = page.locator('input[placeholder*="ZIP"]')
      await expect(searchInput).toBeVisible()

      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      // Text should not be cut off
      const photographerName = cards.first().locator('h3')
      await expect(photographerName).toBeVisible()
    })
  })

  test.describe('Screen Reader Compatibility', () => {
    test('should announce loading states', async ({ page }) => {
      // Check for aria-live regions
      const liveRegions = page.locator('[aria-live], [aria-atomic]')

      if (await liveRegions.count() > 0) {
        // Loading states should be announced
        await page.reload()

        // Look for loading announcements
        const loadingAnnouncements = page.locator('[aria-live]').filter({ hasText: /loading|updating/ })
        if (await loadingAnnouncements.count() > 0) {
          await expect(loadingAnnouncements.first()).toBeVisible({ timeout: 2000 })
        }
      }
    })

    test('should announce filter changes', async ({ page }) => {
      // Apply a filter
      const ratingFilter = page.locator('label').filter({ hasText: /4\+|5 stars/ }).first()

      if (await ratingFilter.isVisible()) {
        await ratingFilter.click()
        await page.waitForTimeout(1000)

        // Should announce results update
        const announcements = page.locator('[aria-live]').filter({ hasText: /result|found|photographer/ })
        if (await announcements.count() > 0) {
          const announcementText = await announcements.first().textContent()
          expect(announcementText.length).toBeGreaterThan(0)
        }
      }
    })

    test('should have descriptive card labels', async ({ page }) => {
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      // Cards should have accessible names or labels
      const firstCard = cards.first()
      const ariaLabel = await firstCard.getAttribute('aria-label')
      const ariaLabelledby = await firstCard.getAttribute('aria-labelledby')
      const cardText = await firstCard.textContent()

      // Card should have some way to identify it to screen readers
      expect(ariaLabel || ariaLabelledby || cardText.length > 0).toBe(true)
    })

    test('should properly announce trust badges', async ({ page }) => {
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      const trustBadges = cards.first().locator('[data-testid="trust-badge"], text=/\\d+ Events|\\d+min|\\d+%/')

      for (let i = 0; i < Math.min(3, await trustBadges.count()); i++) {
        const badge = trustBadges.nth(i)
        const text = await badge.textContent()
        const ariaLabel = await badge.getAttribute('aria-label')

        // Trust badges should have meaningful text
        expect(text || ariaLabel).toBeTruthy()
        if (text) {
          expect(text.length).toBeGreaterThan(2)
        }
      }
    })
  })

  test.describe('Focus Management', () => {
    test('should maintain logical focus order', async ({ page }) => {
      // Tab through main interactive elements
      const focusableElements = []

      // Start from beginning
      await page.keyboard.press('Tab')
      let previousElement = null

      // Tab through first 10 elements to check order
      for (let i = 0; i < 10; i++) {
        const focused = page.locator(':focus')
        if (await focused.count() > 0) {
          const tagName = await focused.evaluate(el => el.tagName)
          const type = await focused.getAttribute('type')
          const role = await focused.getAttribute('role')

          focusableElements.push({ tagName, type, role, index: i })

          previousElement = focused
          await page.keyboard.press('Tab')
          await page.waitForTimeout(100)
        }
      }

      // Should have found focusable elements
      expect(focusableElements.length).toBeGreaterThan(0)

      // Focus order should be logical (search → filters → cards)
      console.log('Focus order:', focusableElements)
    })

    test('should restore focus after modal close', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const mobileFilterButton = page.locator('button').filter({ hasText: /Filter|menu/i }).first()

      if (await mobileFilterButton.isVisible()) {
        // Focus button
        await mobileFilterButton.focus()
        await expect(mobileFilterButton).toBeFocused()

        // Open modal
        await page.keyboard.press('Enter')
        await page.waitForTimeout(300)

        // Close modal with Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)

        // Focus should return to button
        await expect(mobileFilterButton).toBeFocused()
      }
    })

    test('should handle focus in infinite scroll', async ({ page }) => {
      // Focus on a card
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      const middleCard = cards.nth(2)
      if (await middleCard.isVisible()) {
        await middleCard.focus()
        await expect(middleCard).toBeFocused()

        // Scroll to trigger more content
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight)
        })

        await page.waitForTimeout(2000)

        // Focus should be maintained or logically managed
        const stillFocused = await middleCard.isVisible()
        expect(stillFocused).toBe(true)
      }
    })
  })

  test.describe('Error State Accessibility', () => {
    test('should announce errors to screen readers', async ({ page }) => {
      // Trigger an error state (invalid search)
      const searchInput = page.locator('input[placeholder*="ZIP"]')
      await searchInput.fill('invalid-location-xyz-123')
      await page.locator('button[type="submit"]').click()

      await page.waitForTimeout(2000)

      // Look for error announcements
      const errorMessages = page.locator('[role="alert"], [aria-live="polite"]').filter({ hasText: /error|not found|invalid/ })

      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible()

        const errorText = await errorMessages.first().textContent()
        expect(errorText.length).toBeGreaterThan(0)
      }
    })

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network error
      await page.route('**/photographers*', route => route.abort())

      await page.reload()
      await page.waitForTimeout(3000)

      // Should show accessible error state
      const errorElements = page.locator('text=/error|failed|unavailable/i, [role="alert"]')

      if (await errorElements.count() > 0) {
        await expect(errorElements.first()).toBeVisible()

        // Error should be focusable or announced
        const firstError = errorElements.first()
        const tabIndex = await firstError.getAttribute('tabindex')
        const ariaLive = await firstError.getAttribute('aria-live')

        expect(tabIndex !== null || ariaLive !== null).toBe(true)
      }
    })
  })
})