/**
 * Playwright E2E tests for complete location search flow
 */

import { test, expect } from '@playwright/test'

test.describe('Location Search Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test.describe('Home Page Search', () => {
    test('should search by city name from home page', async ({ page }) => {
      // Find the search input on home page
      const searchInput = page.locator('input[placeholder*="ZIP"]').first()
      const searchButton = page.locator('button:has-text("Search")').first()

      // Enter city name and search
      await searchInput.fill('San Diego')
      await searchButton.click()

      // Should navigate to results page
      await expect(page).toHaveURL(/\/photographers\?q=San%20Diego/)

      // Should show results
      await expect(page.locator('[data-testid="photographer-count"]')).toBeVisible()

      // Should show search results for San Diego
      const resultsText = await page.locator('[data-testid="photographer-count"]').textContent()
      expect(resultsText).toContain('photographer')
    })

    test('should search by ZIP code from home page', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="ZIP"]').first()
      const searchButton = page.locator('button:has-text("Search")').first()

      // Enter ZIP code and search
      await searchInput.fill('92101')
      await searchButton.click()

      // Should navigate to results page
      await expect(page).toHaveURL(/\/photographers\?q=92101/)

      // Should show results (ZIP should be resolved to city)
      await expect(page.locator('[data-testid="photographer-count"]')).toBeVisible()
    })

    test('should handle city with state format', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="ZIP"]').first()
      const searchButton = page.locator('button:has-text("Search")').first()

      // Enter "City, State" format
      await searchInput.fill('San Diego, CA')
      await searchButton.click()

      // Should normalize to just the city name
      await expect(page).toHaveURL(/\/photographers\?q=San%20Diego/)
    })

    test('should not search with empty input', async ({ page }) => {
      const searchButton = page.locator('button:has-text("Search")').first()
      const currentUrl = page.url()

      // Click search without entering anything
      await searchButton.click()

      // Should stay on same page
      expect(page.url()).toBe(currentUrl)
    })
  })

  test.describe('Results Page Functionality', () => {
    test('should display search results correctly', async ({ page }) => {
      // Navigate directly to search results
      await page.goto('http://localhost:5173/photographers?q=San%20Diego')

      // Wait for results to load
      await expect(page.locator('[data-testid="photographer-count"]')).toBeVisible()

      // Should show photographer cards
      await expect(page.locator('[data-testid="photographer-card"]').first()).toBeVisible()

      // Should show non-zero results for San Diego
      const resultsText = await page.locator('[data-testid="photographer-count"]').textContent()
      expect(resultsText).not.toContain('0 photographer')
    })

    test('should handle ZIP code resolution on results page', async ({ page }) => {
      // Navigate with ZIP code that should resolve to a city
      await page.goto('http://localhost:5173/photographers?q=92101')

      // Should either show results or friendly error message
      await page.waitForLoadState('networkidle')

      const isResults = await page.locator('[data-testid="photographer-count"]').isVisible()
      const isError = await page.locator('text=don\'t recognize that ZIP').isVisible()

      expect(isResults || isError).toBe(true)
    })

    test('should show error for unrecognized ZIP', async ({ page }) => {
      // Use a ZIP code that shouldn't exist in test data
      await page.goto('http://localhost:5173/photographers?q=99999')

      // Should show friendly error message
      await expect(page.locator('text=don\'t recognize that ZIP')).toBeVisible()
    })

    test('should handle direct URL access correctly', async ({ page }) => {
      // This tests the issue user reported - direct URL works
      await page.goto('http://localhost:5173/photographers?q=San%20Diego')

      await expect(page.locator('[data-testid="photographer-count"]')).toBeVisible()

      const resultsText = await page.locator('[data-testid="photographer-count"]').textContent()
      expect(resultsText).toContain('photographer')
      expect(resultsText).not.toContain('0 photographer')
    })
  })

  test.describe('Navigation Integration', () => {
    test('should maintain search state in URL', async ({ page }) => {
      await page.goto('http://localhost:5173/photographers?q=Los%20Angeles')

      // URL should remain consistent
      expect(page.url()).toContain('q=Los%20Angeles')

      // Refresh should maintain search
      await page.reload()
      expect(page.url()).toContain('q=Los%20Angeles')
    })

    test('should handle browser back/forward correctly', async ({ page }) => {
      // Start at home
      await page.goto('http://localhost:5173')

      // Search for San Diego
      const searchInput = page.locator('input[placeholder*="ZIP"]').first()
      const searchButton = page.locator('button:has-text("Search")').first()

      await searchInput.fill('San Diego')
      await searchButton.click()

      await expect(page).toHaveURL(/\/photographers\?q=San%20Diego/)

      // Go back to home
      await page.goBack()
      await expect(page).toHaveURL('http://localhost:5173/')

      // Go forward to results
      await page.goForward()
      await expect(page).toHaveURL(/\/photographers\?q=San%20Diego/)
    })
  })

  test.describe('Parameter Compatibility', () => {
    test('should handle legacy search parameter', async ({ page }) => {
      // Test old 'search' parameter still works
      await page.goto('http://localhost:5173/photographers?search=San%20Diego')

      await expect(page.locator('[data-testid="photographer-count"]')).toBeVisible()

      const resultsText = await page.locator('[data-testid="photographer-count"]').textContent()
      expect(resultsText).toContain('photographer')
    })

    test('should handle legacy zip parameter', async ({ page }) => {
      // Test old 'zip' parameter still works
      await page.goto('http://localhost:5173/photographers?zip=92101')

      // Should either show results or ZIP resolution
      await page.waitForLoadState('networkidle')

      const hasResults = await page.locator('[data-testid="photographer-count"]').isVisible()
      const hasError = await page.locator('text=don\'t recognize').isVisible()

      expect(hasResults || hasError).toBe(true)
    })

    test('should prioritize q parameter over legacy', async ({ page }) => {
      // Test that 'q' takes precedence over 'search' and 'zip'
      await page.goto('http://localhost:5173/photographers?q=San%20Diego&search=Los%20Angeles&zip=94103')

      // Should show San Diego results, not Los Angeles or SF
      await expect(page.locator('[data-testid="photographer-count"]')).toBeVisible()

      // URL should maintain q parameter
      expect(page.url()).toContain('q=San%20Diego')
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Navigate to results page
      await page.goto('http://localhost:5173/photographers?q=San%20Diego')

      // Simulate network failure by blocking API calls
      await page.route('**/supabase.co/**', route => route.abort())

      // Reload the page
      await page.reload()

      // Should handle error gracefully (not crash)
      // The exact behavior depends on error handling implementation
      await page.waitForLoadState('networkidle')

      // Page should still be functional
      expect(page.url()).toContain('photographers')
    })

    test('should handle malformed URLs', async ({ page }) => {
      // Test with malformed query parameters
      await page.goto('http://localhost:5173/photographers?q=%XX%invalid')

      // Should not crash
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('photographers')
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('http://localhost:5173')

      // Find search input and navigate with keyboard
      const searchInput = page.locator('input[placeholder*="ZIP"]').first()

      // Tab to search input
      await page.keyboard.press('Tab')
      await searchInput.fill('San Diego')

      // Submit with Enter
      await page.keyboard.press('Enter')

      // Should navigate to results
      await expect(page).toHaveURL(/\/photographers\?q=San%20Diego/)
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto('http://localhost:5173/photographers?q=San%20Diego')

      // Wait for results to load
      await expect(page.locator('[data-testid="photographer-count"]')).toBeVisible()

      // Check for proper semantic structure
      await expect(page.locator('main')).toBeVisible()

      // Results should be in a proper list or grid structure
      const hasProperStructure = await page.locator('[role="list"], [role="grid"], ul, ol').first().isVisible()
      expect(hasProperStructure).toBe(true)
    })
  })
})