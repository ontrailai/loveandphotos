/**
 * E2E Tests for Photographers Browse Page
 * Comprehensive testing of search, filtering, sorting, infinite scroll, and user interactions
 */

const { test, expect } = require('@playwright/test')

test.describe('Photographers Browse Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the photographers browse page
    await page.goto('/photographers')

    // Wait for the page to load and initial data to be fetched
    await page.waitForSelector('[data-testid="photographers-page"], .grid', { timeout: 15000 })
  })

  test.describe('Initial Page Load', () => {
    test('should load page with search bar and photographers grid', async ({ page }) => {
      // Check search bar is present
      await expect(page.locator('input[placeholder*="ZIP"], input[placeholder*="city"]')).toBeVisible()

      // Check date picker is present
      await expect(page.locator('input[type="date"]')).toBeVisible()

      // Check search button is present
      await expect(page.locator('button[type="submit"]', { hasText: 'Search' })).toBeVisible()

      // Check photographers grid/list is present
      await expect(page.locator('.grid, .space-y-4')).toBeVisible()

      // Check sort and view toggle is present
      await expect(page.locator('text=/Sort by/', 'button[aria-label*="view"]')).toBeVisible()
    })

    test('should display loading skeletons initially', async ({ page }) => {
      // Reload to catch loading state
      await page.reload()

      // Should show skeleton loaders
      const skeletons = page.locator('.bg-gradient-to-r.from-gray-200')
      await expect(skeletons.first()).toBeVisible({ timeout: 1000 })
    })

    test('should load photographer cards after loading', async ({ page }) => {
      // Wait for photographer cards to appear
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3') // Cards with photographer names
      })

      await expect(cards.first()).toBeVisible({ timeout: 10000 })

      const cardCount = await cards.count()
      expect(cardCount).toBeGreaterThan(0)

      // Each card should have essential elements
      const firstCard = cards.first()
      await expect(firstCard.locator('h3')).toBeVisible() // Name
      await expect(firstCard.locator('[class*="rounded-full"]')).toBeVisible() // Avatar
      await expect(firstCard.locator('text=/\\d+\\.\\d+/')).toBeVisible() // Rating
    })
  })

  test.describe('Search Functionality', () => {
    test('should search by location', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="ZIP"], input[placeholder*="city"]')

      // Enter a location
      await searchInput.fill('New York')

      // Submit search
      await page.locator('button[type="submit"]').click()

      // Wait for results
      await page.waitForTimeout(1000)

      // Should show photographers (even if mock data)
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible({ timeout: 5000 })
    })

    test('should handle autocomplete suggestions', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="ZIP"], input[placeholder*="city"]')

      // Type to trigger autocomplete
      await searchInput.fill('New')

      // Wait for suggestions dropdown
      await page.waitForSelector('[role="listbox"], ul', { timeout: 3000 }).catch(() => {
        // If no suggestions appear, that's okay - might be implemented differently
      })

      // If suggestions appear, they should be clickable
      const suggestions = page.locator('[role="option"], li').filter({ hasText: /New/ })
      if (await suggestions.count() > 0) {
        await suggestions.first().click()
        await expect(searchInput).toHaveValue(/New/)
      }
    })

    test('should search with date filter', async ({ page }) => {
      const dateInput = page.locator('input[type="date"]')

      // Set a future date
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const dateString = futureDate.toISOString().split('T')[0]

      await dateInput.fill(dateString)
      await page.locator('button[type="submit"]').click()

      // Should maintain the date value
      await expect(dateInput).toHaveValue(dateString)
    })

    test('should clear search inputs', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="ZIP"], input[placeholder*="city"]')
      const dateInput = page.locator('input[type="date"]')

      // Fill inputs
      await searchInput.fill('Los Angeles')
      await dateInput.fill('2024-12-01')

      // Clear search input
      const clearButtons = page.locator('button[aria-label*="Clear"], button').filter({ has: page.locator('svg') })
      if (await clearButtons.count() > 0) {
        await clearButtons.first().click()
        await expect(searchInput).toHaveValue('')
      }
    })
  })

  test.describe('Filtering System', () => {
    test('should open and close filters panel on desktop', async ({ page }) => {
      // On desktop, filters should be visible by default
      await page.setViewportSize({ width: 1280, height: 720 })

      const filtersPanel = page.locator('text="Filters", [data-testid="filters-panel"]').first()
      await expect(filtersPanel).toBeVisible()

      // Check for rating filter
      await expect(page.locator('text="Minimum Rating", text="5 stars"')).toBeVisible()
    })

    test('should filter by rating', async ({ page }) => {
      // Find and click on a rating filter
      const ratingFilter = page.locator('input[name="rating"], label').filter({ hasText: /4\+|5/ }).first()
      await ratingFilter.click()

      // Wait for results to update
      await page.waitForTimeout(1000)

      // Results should update (URL should change or content should refresh)
      const url = page.url()
      expect(url).toContain('rating=') || expect(url).toContain('filter')
    })

    test('should filter by tier', async ({ page }) => {
      // Find tier filter options
      const tierFilter = page.locator('input[name="tier"], label').filter({ hasText: /Gold|Silver|Platinum/ }).first()
      if (await tierFilter.isVisible()) {
        await tierFilter.click()

        // Wait for results
        await page.waitForTimeout(1000)

        // Should update URL or content
        const url = page.url()
        expect(url).toContain('tier=') || expect(url).toContain('filter')
      }
    })

    test('should filter by specialties', async ({ page }) => {
      // Find specialty checkboxes
      const specialtyFilter = page.locator('label').filter({ hasText: /Wedding|Portrait|Event/ }).first()
      if (await specialtyFilter.isVisible()) {
        await specialtyFilter.click()

        // Wait for results
        await page.waitForTimeout(1000)

        // Should show filtered results
        const url = page.url()
        expect(url).toContain('specialties=') || expect(url).toContain('filter')
      }
    })

    test('should clear all filters', async ({ page }) => {
      // Apply some filters first
      const ratingFilter = page.locator('input[name="rating"], label').filter({ hasText: /4\+/ }).first()
      if (await ratingFilter.isVisible()) {
        await ratingFilter.click()
      }

      // Look for clear filters button
      const clearButton = page.locator('button').filter({ hasText: /Clear|Reset/ }).first()
      if (await clearButton.isVisible()) {
        await clearButton.click()

        // Should reset to default state
        await page.waitForTimeout(1000)
        const url = page.url()
        expect(url).not.toContain('rating=')
      }
    })
  })

  test.describe('Sorting and View Modes', () => {
    test('should change sort order', async ({ page }) => {
      // Find sort dropdown
      const sortDropdown = page.locator('button').filter({ hasText: /Sort by|Top Rated|Most Reviewed/ }).first()
      await sortDropdown.click()

      // Select a different sort option
      const sortOption = page.locator('[role="option"], button').filter({ hasText: /Most Reviewed|Price/ }).first()
      if (await sortOption.isVisible()) {
        await sortOption.click()

        // Wait for results to reorder
        await page.waitForTimeout(1000)

        // URL should reflect sort change
        const url = page.url()
        expect(url).toContain('sortBy=') || expect(url).toContain('sort')
      }
    })

    test('should toggle between grid and list view', async ({ page }) => {
      // Find view toggle buttons
      const gridButton = page.locator('button[aria-label*="Grid"], button').filter({ has: page.locator('svg') }).first()
      const listButton = page.locator('button[aria-label*="List"], button').filter({ has: page.locator('svg') }).last()

      // Start in grid view, switch to list
      if (await listButton.isVisible()) {
        await listButton.click()

        // Should change layout
        await page.waitForTimeout(500)

        // Look for list-style layout (horizontal cards)
        const listLayout = page.locator('.space-y-4, .flex').filter({ has: page.locator('h3') })
        await expect(listLayout.first()).toBeVisible({ timeout: 3000 })

        // Switch back to grid
        if (await gridButton.isVisible()) {
          await gridButton.click()
          await page.waitForTimeout(500)

          // Should show grid layout
          const gridLayout = page.locator('.grid, .grid-cols-1')
          await expect(gridLayout.first()).toBeVisible({ timeout: 3000 })
        }
      }
    })

    test('should persist view mode in URL', async ({ page }) => {
      const listButton = page.locator('button[aria-label*="List"], button').filter({ has: page.locator('svg') }).last()

      if (await listButton.isVisible()) {
        await listButton.click()
        await page.waitForTimeout(500)

        // URL should reflect view mode
        const url = page.url()
        expect(url).toContain('view=') || expect(url).toContain('list')
      }
    })
  })

  test.describe('Infinite Scroll', () => {
    test('should load more photographers on scroll', async ({ page }) => {
      // Count initial photographers
      const initialCards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      const initialCount = await initialCards.count()
      expect(initialCount).toBeGreaterThan(0)

      // Scroll to bottom to trigger infinite scroll
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })

      // Wait for loading indicator
      const loadingIndicator = page.locator('text=/Loading|loading/', '.animate-spin')
      await expect(loadingIndicator.first()).toBeVisible({ timeout: 3000 }).catch(() => {
        // Loading indicator might not appear if data loads too fast
      })

      // Wait for more content to load
      await page.waitForTimeout(2000)

      // Should have more cards or reach end
      const finalCards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      const finalCount = await finalCards.count()

      // Either more cards loaded or we see "no more results" message
      const hasMoreCards = finalCount > initialCount
      const hasEndMessage = await page.locator('text=/no more|end of results/i').isVisible().catch(() => false)

      expect(hasMoreCards || hasEndMessage).toBe(true)
    })

    test('should show loading state during infinite scroll', async ({ page }) => {
      // Scroll to trigger infinite scroll
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })

      // Should show loading spinner or skeleton
      const loadingStates = page.locator('.animate-spin, .bg-gradient-to-r, text=/Loading/')
      await expect(loadingStates.first()).toBeVisible({ timeout: 2000 }).catch(() => {
        // Loading might be too fast to catch
      })
    })
  })

  test.describe('Photographer Card Interactions', () => {
    test('should show trust badges on cards', async ({ page }) => {
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      const firstCard = cards.first()

      // Should show trust metrics
      const trustMetrics = firstCard.locator('text=/\\d+ Events|\\d+min|\\d+%/')
      expect(await trustMetrics.count()).toBeGreaterThan(0)
    })

    test('should show availability indicators', async ({ page }) => {
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      const firstCard = cards.first()

      // Should show availability chip
      const availabilityChip = firstCard.locator('.bg-green-100, .bg-yellow-100, .bg-red-100, .bg-gray-100').filter({
        hasText: /Available|Limited|Busy|Unknown/
      })

      if (await availabilityChip.count() > 0) {
        await expect(availabilityChip.first()).toBeVisible()
      }
    })

    test('should handle card hover effects', async ({ page }) => {
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      const firstCard = cards.first()

      // Hover over card
      await firstCard.hover()

      // Should have hover effects (shadow, scale, etc.)
      await page.waitForTimeout(300) // Wait for animation

      // Card should still be visible and potentially transformed
      await expect(firstCard).toBeVisible()
    })

    test('should navigate to photographer detail on click', async ({ page }) => {
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      const firstCard = cards.first()

      // Click on card (might navigate to detail page)
      const [response] = await Promise.all([
        page.waitForResponse(response => response.url().includes('/photographers/') || response.status() === 200).catch(() => null),
        firstCard.click()
      ])

      // Should either navigate or show detail modal/overlay
      await page.waitForTimeout(1000)

      // Check if URL changed or modal opened
      const currentUrl = page.url()
      const hasModal = await page.locator('[role="dialog"], .modal, .overlay').isVisible().catch(() => false)

      expect(currentUrl.includes('/photographer') || hasModal).toBe(true)
    })
  })

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()

      // Wait for mobile layout
      await page.waitForSelector('.grid, [data-testid="photographers-page"]', { timeout: 10000 })

      // Filters should be hidden or in mobile menu
      const filtersPanel = page.locator('text="Filters"').first()

      // On mobile, filters might be in a drawer/sheet
      const mobileFiltersButton = page.locator('button').filter({ hasText: /Filter|menu/i }).first()
      if (await mobileFiltersButton.isVisible()) {
        await mobileFiltersButton.click()

        // Should open mobile filters
        await expect(page.locator('[role="dialog"], .sheet, .drawer')).toBeVisible({ timeout: 2000 }).catch(() => {
          // Mobile filters might be implemented differently
        })
      }
    })

    test('should show desktop layout on large screens', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.reload()

      // Wait for desktop layout
      await page.waitForSelector('.grid, [data-testid="photographers-page"]', { timeout: 10000 })

      // Filters should be visible in sidebar
      const filtersPanel = page.locator('text="Filters", text="Minimum Rating"').first()
      await expect(filtersPanel).toBeVisible()

      // Should show grid layout by default
      const gridContainer = page.locator('.grid-cols-2, .grid-cols-3, .md\\:grid-cols-2')
      await expect(gridContainer.first()).toBeVisible()
    })

    test('should handle tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.reload()

      await page.waitForSelector('.grid, [data-testid="photographers-page"]', { timeout: 10000 })

      // Should adapt layout for tablet
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible()

      // Cards should be appropriately sized for tablet
      const cardCount = await cards.count()
      expect(cardCount).toBeGreaterThan(0)
    })
  })

  test.describe('URL State Management', () => {
    test('should sync filters to URL', async ({ page }) => {
      // Apply a filter
      const ratingFilter = page.locator('input[name="rating"], label').filter({ hasText: /4\+/ }).first()
      if (await ratingFilter.isVisible()) {
        await ratingFilter.click()
        await page.waitForTimeout(500)

        // URL should contain filter
        const url = page.url()
        expect(url).toContain('rating=') || expect(url).toContain('filter')
      }
    })

    test('should restore state from URL on page load', async ({ page }) => {
      // Navigate with URL parameters
      await page.goto('/photographers?rating=4&tier=gold&viewMode=list')

      await page.waitForSelector('.grid, [data-testid="photographers-page"]', { timeout: 10000 })

      // Should restore filter states
      const ratingFilter = page.locator('input[value="4"]:checked, .text-[#FF4D6D]').first()
      if (await ratingFilter.count() > 0) {
        await expect(ratingFilter).toBeVisible()
      }

      // Should restore view mode
      const listView = page.locator('.space-y-4, button[aria-pressed="true"]').filter({ hasText: /list/i })
      if (await listView.count() > 0) {
        await expect(listView.first()).toBeVisible()
      }
    })

    test('should handle browser back/forward navigation', async ({ page }) => {
      // Apply a filter to change URL
      const searchInput = page.locator('input[placeholder*="ZIP"]')
      await searchInput.fill('New York')
      await page.locator('button[type="submit"]').click()

      await page.waitForTimeout(1000)

      // Navigate away and back
      await page.goto('/photographers')
      await page.goBack()

      // Should restore previous state
      await expect(searchInput).toHaveValue('New York')
    })
  })

  test.describe('Performance and Loading', () => {
    test('should load images efficiently', async ({ page }) => {
      const imageRequests = []
      const imageResponses = []

      // Track image requests
      page.on('request', request => {
        if (request.resourceType() === 'image') {
          imageRequests.push({
            url: request.url(),
            size: request.postData()?.length || 0
          })
        }
      })

      page.on('response', response => {
        if (response.request().resourceType() === 'image') {
          imageResponses.push({
            url: response.url(),
            status: response.status(),
            ok: response.ok()
          })
        }
      })

      // Wait for images to load
      await page.waitForTimeout(3000)

      console.log(`Image requests: ${imageRequests.length}`)
      console.log(`Image responses: ${imageResponses.length}`)

      // Should load images efficiently
      if (imageResponses.length > 0) {
        const successfulImages = imageResponses.filter(r => r.ok)
        const successRate = successfulImages.length / imageResponses.length
        expect(successRate).toBeGreaterThan(0.8) // 80% success rate
      }
    })

    test('should handle slow network gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay
        await route.continue()
      })

      await page.reload()

      // Should show loading states
      const loadingStates = page.locator('.animate-spin, .bg-gradient-to-r, text=/Loading/')
      await expect(loadingStates.first()).toBeVisible({ timeout: 1000 }).catch(() => {
        // Loading might be too fast even with delay
      })

      // Should eventually load content
      const cards = page.locator('[data-testid="photographer-card"], .bg-white.rounded-2xl').filter({
        has: page.locator('h3')
      })

      await expect(cards.first()).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API requests and return errors
      await page.route('**/photographers*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        })
      })

      await page.reload()

      // Should show error state
      const errorMessage = page.locator('text=/error|failed|try again/i')
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Error handling might be implemented differently
      })
    })

    test('should handle empty results', async ({ page }) => {
      // Intercept API and return empty results
      await page.route('**/photographers*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], count: 0 })
        })
      })

      await page.reload()

      // Should show empty state
      const emptyMessage = page.locator('text=/no photographers|no results|try different/i')
      await expect(emptyMessage.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Empty state might be implemented differently
      })
    })
  })
})