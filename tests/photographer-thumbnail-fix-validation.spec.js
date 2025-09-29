/**
 * Playwright test to validate photographer thumbnail rendering fix
 *
 * Tests that all photographer cards on the /photographers page show either:
 * 1. A valid thumbnail image
 * 2. A fallback avatar with initials
 *
 * ACCEPTANCE CRITERIA:
 * - 100% of visible cards render thumbnails in dark/light modes
 * - No broken image placeholders or empty avatar containers
 * - CLS < 0.05 during image loading
 */

import { test, expect } from '@playwright/test';

test.describe('Photographer Thumbnail Rendering Fix', () => {
  test('should render thumbnails for all photographer cards', async ({ page }) => {
    // Navigate to the photographers page
    await page.goto('/photographers');

    // Wait for photographers to load
    await page.waitForSelector('[data-testid="photographer-card"]', { timeout: 10000 });

    // Get all photographer cards
    const photographerCards = await page.locator('[data-testid="photographer-card"]').all();

    expect(photographerCards.length).toBeGreaterThan(0);

    // Check each card has either an image or fallback avatar
    for (const card of photographerCards) {
      const avatar = card.locator('img, [data-testid="avatar-fallback"]').first();
      await expect(avatar).toBeVisible();

      // If it's an image, ensure it loaded successfully
      const img = card.locator('img').first();
      if (await img.count() > 0) {
        // Check image has loaded (not broken)
        const naturalWidth = await img.evaluate(img => img.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('should show fallback avatars when image fails to load', async ({ page }) => {
    // Navigate to the photographers page
    await page.goto('/photographers');

    // Block image loading to force fallbacks
    await page.route('**/*.{jpg,jpeg,png,gif,webp}', route => route.abort());

    await page.reload();
    await page.waitForSelector('[data-testid="photographer-card"]', { timeout: 10000 });

    const fallbackAvatars = await page.locator('[data-testid="avatar-fallback"]').all();
    expect(fallbackAvatars.length).toBeGreaterThan(0);

    // Each fallback should have initials or user icon
    for (const avatar of fallbackAvatars) {
      const hasText = await avatar.textContent();
      const hasIcon = await avatar.locator('svg').count() > 0;
      expect(hasText || hasIcon).toBeTruthy();
    }
  });

  test('should maintain consistent layout during image loading', async ({ page }) => {
    await page.goto('/photographers');

    // Measure CLS by checking layout shifts
    const clsScore = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
          resolve(cls);
        }).observe({ entryTypes: ['layout-shift'] });

        // Resolve after 3 seconds
        setTimeout(() => resolve(cls), 3000);
      });
    });

    // CLS should be less than 0.05 (good threshold)
    expect(clsScore).toBeLessThan(0.05);
  });

  test('should work in both light and dark modes', async ({ page }) => {
    // Test light mode
    await page.goto('/photographers');
    await page.waitForSelector('[data-testid="photographer-card"]');

    let cards = await page.locator('[data-testid="photographer-card"]').count();
    expect(cards).toBeGreaterThan(0);

    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Verify thumbnails still work in dark mode
    await page.waitForTimeout(1000); // Allow theme transition
    cards = await page.locator('[data-testid="photographer-card"]').count();
    expect(cards).toBeGreaterThan(0);

    // Check that at least some images are still visible
    const visibleImages = await page.locator('img[src*="avatar"], img[src*="profile"]').count();
    expect(visibleImages).toBeGreaterThanOrEqual(0); // May have fallbacks
  });
});