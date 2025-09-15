/**
 * E2E Tests for Photographer Thumbnail Rendering
 *
 * Tests real browser behavior, visual validation, performance,
 * and cross-environment compatibility for thumbnail rendering.
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const SCREENSHOT_PATH = 'tests/screenshots';

// Helper functions
const waitForPhotographersToLoad = async (page) => {
  // Wait for network requests to complete
  await page.waitForLoadState('networkidle');

  // Wait for at least one photographer card to be visible
  await page.locator('[data-testid="photographer-card"], .photographer-card, [class*="card"]').first().waitFor({
    state: 'visible',
    timeout: 10000
  });
};

const getPhotographerCards = (page) => {
  return page.locator('[data-testid="photographer-card"], .photographer-card, [class*="card"]:has-text("View Profile")');
};

const getAvatarImages = (page) => {
  return page.locator('img[alt*="photographer"], img[src*="avatar"], [class*="avatar"] img');
};

const getAvatarFallbacks = (page) => {
  return page.locator('[class*="avatar"] >> text=/^[A-Z]{1,2}$/, [data-testid*="fallback"] >> text=/^[A-Z]{1,2}$/');
};

test.describe('Photographer Thumbnail Rendering', () => {

  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to photographers page
    await page.goto(`${BASE_URL}/photographers`);
  });

  test.describe('Initial Load Validation', () => {
    test('validates thumbnail rendering on initial load', async ({ page }) => {
      await waitForPhotographersToLoad(page);

      // Count total photographer cards
      const cards = await getPhotographerCards(page).count();
      expect(cards).toBeGreaterThan(0);

      // Count images and fallbacks
      const images = await getAvatarImages(page).count();
      const fallbacks = await getAvatarFallbacks(page).count();

      // Every card should have either an image or fallback
      expect(images + fallbacks).toBe(cards);

      // Take screenshot for visual regression
      await page.screenshot({
        path: `${SCREENSHOT_PATH}/photographer-grid-initial.png`,
        fullPage: true
      });

      console.log(`✅ Initial load: ${cards} cards, ${images} images, ${fallbacks} fallbacks`);
    });

    test('validates individual card structure', async ({ page }) => {
      await waitForPhotographersToLoad(page);

      const firstCard = getPhotographerCards(page).first();

      // Each card should have required elements
      await expect(firstCard).toContainText('View Profile');

      // Should have either image or fallback
      const hasImage = await firstCard.locator('img[src]').count() > 0;
      const hasFallback = await firstCard.locator('text=/^[A-Z]{1,2}$/').count() > 0;

      expect(hasImage || hasFallback).toBeTruthy();

      // Should have photographer name
      const hasName = await firstCard.locator('text=/[A-Z][a-z]+ [A-Z][a-z]+/').count() > 0;
      expect(hasName).toBeTruthy();
    });

    test('ensures no broken image icons visible', async ({ page }) => {
      await waitForPhotographersToLoad(page);

      // Check for broken image indicators
      const brokenImages = await page.locator('img[alt]:not([src]), img[src=""]').count();
      expect(brokenImages).toBe(0);

      // Check for images that failed to load (common broken image sizes)
      const images = await getAvatarImages(page).all();

      for (const img of images) {
        const box = await img.boundingBox();
        if (box) {
          // Broken images often render as very small
          expect(box.width).toBeGreaterThan(20);
          expect(box.height).toBeGreaterThan(20);
        }
      }
    });
  });

  test.describe('Performance and CLS Measurement', () => {
    test('measures CLS during image loading', async ({ page }) => {
      // Set up CLS monitoring
      await page.addInitScript(() => {
        let cls = 0;
        let sessionValue = 0;
        let sessionEntries = [];

        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              const firstSessionEntry = sessionEntries[0];
              const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

              if (sessionValue &&
                  entry.startTime - lastSessionEntry.startTime < 1000 &&
                  entry.startTime - firstSessionEntry.startTime < 5000) {
                sessionValue += entry.value;
                sessionEntries.push(entry);
              } else {
                sessionValue = entry.value;
                sessionEntries = [entry];
              }

              if (sessionValue > cls) {
                cls = sessionValue;
              }
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });
        window.getCLS = () => cls;
        window.getSessionValue = () => sessionValue;
      });

      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Wait for all images to settle
      await page.waitForTimeout(2000);

      const clsValue = await page.evaluate(() => window.getCLS());
      const sessionValue = await page.evaluate(() => window.getSessionValue());

      console.log(`📊 CLS: ${clsValue}, Session: ${sessionValue}`);

      // CLS should be below Web Vitals threshold
      expect(clsValue).toBeLessThan(0.05);
    });

    test('monitors image loading performance', async ({ page }) => {
      const imageLoadTimes = [];
      const failedImages = [];

      // Monitor image requests
      page.on('response', response => {
        if (response.url().match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
          if (response.status() >= 400) {
            failedImages.push({
              url: response.url(),
              status: response.status()
            });
          }
        }
      });

      // Monitor image load events
      await page.addInitScript(() => {
        window.imageLoadTimes = [];

        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(this, tagName);

          if (tagName.toLowerCase() === 'img') {
            const startTime = performance.now();

            element.addEventListener('load', () => {
              const loadTime = performance.now() - startTime;
              window.imageLoadTimes.push({
                src: element.src,
                loadTime: loadTime
              });
            });

            element.addEventListener('error', () => {
              window.imageLoadTimes.push({
                src: element.src,
                loadTime: -1,
                error: true
              });
            });
          }

          return element;
        };
      });

      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Get image load times from client side
      const clientImageTimes = await page.evaluate(() => window.imageLoadTimes || []);

      console.log(`📈 Image loads: ${clientImageTimes.length}, Failed: ${failedImages.length}`);

      // No images should fail to load
      expect(failedImages).toHaveLength(0);

      // Most images should load reasonably quickly (under 3 seconds)
      const slowImages = clientImageTimes.filter(img => img.loadTime > 3000 && !img.error);
      expect(slowImages.length).toBeLessThan(clientImageTimes.length * 0.2); // Less than 20% slow
    });

    test('validates memory usage during large grid', async ({ page }) => {
      // Load page with maximum photographers
      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Scroll to load more if lazy loading is implemented
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);

      // Measure memory usage
      const metrics = await page.evaluate(async () => {
        if ('measureUserAgentSpecificMemory' in performance) {
          try {
            return await performance.measureUserAgentSpecificMemory();
          } catch (e) {
            return { usedJSHeapSize: performance.memory?.usedJSHeapSize || 0 };
          }
        } else {
          return { usedJSHeapSize: performance.memory?.usedJSHeapSize || 0 };
        }
      });

      console.log(`💾 Memory usage: ${Math.round(metrics.usedJSHeapSize / 1024 / 1024)}MB`);

      // Should not exceed reasonable memory usage (50MB threshold)
      expect(metrics.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
    });
  });

  test.describe('Responsive and Lazy Loading', () => {
    test('validates lazy loading behavior', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);

      // Count initially visible images
      await page.waitForLoadState('networkidle');
      const initialImages = await getAvatarImages(page).count();

      console.log(`🖼️ Initial images loaded: ${initialImages}`);

      // Scroll to trigger more loading if applicable
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);

      const afterScrollImages = await getAvatarImages(page).count();
      console.log(`🖼️ After scroll images: ${afterScrollImages}`);

      // If lazy loading is implemented, more images may load
      // If not, count should remain the same
      expect(afterScrollImages).toBeGreaterThanOrEqual(initialImages);
    });

    test('validates responsive grid behavior', async ({ page }) => {
      // Test desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      const desktopCards = await getPhotographerCards(page).count();

      await page.screenshot({
        path: `${SCREENSHOT_PATH}/photographer-grid-desktop.png`,
        fullPage: true
      });

      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      const tabletCards = await getPhotographerCards(page).count();
      expect(tabletCards).toBe(desktopCards); // Same number of cards

      await page.screenshot({
        path: `${SCREENSHOT_PATH}/photographer-grid-tablet.png`,
        fullPage: true
      });

      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const mobileCards = await getPhotographerCards(page).count();
      expect(mobileCards).toBe(desktopCards); // Same number of cards

      await page.screenshot({
        path: `${SCREENSHOT_PATH}/photographer-grid-mobile.png`,
        fullPage: true
      });
    });
  });

  test.describe('Theme and Visual Consistency', () => {
    test('validates dark mode consistency', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Capture light mode
      await page.screenshot({
        path: `${SCREENSHOT_PATH}/photographer-grid-light.png`
      });

      const lightModeImages = await getAvatarImages(page).count();

      // Switch to dark mode (assuming theme toggle exists)
      const themeToggle = page.locator('[data-testid="theme-toggle"], [class*="theme-toggle"], button:has-text("Dark")').first();

      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(1000);

        // Verify images still visible in dark mode
        const darkModeImages = await getAvatarImages(page).count();
        expect(darkModeImages).toBe(lightModeImages);

        // Capture dark mode
        await page.screenshot({
          path: `${SCREENSHOT_PATH}/photographer-grid-dark.png`
        });

        console.log(`🌙 Dark mode: ${darkModeImages} images maintained`);
      } else {
        console.log('⚠️ Theme toggle not found, skipping dark mode test');
      }
    });

    test('validates theme switching without image reload', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Track image src attributes
      const initialImageSrcs = await getAvatarImages(page).evaluateAll(imgs =>
        imgs.map(img => img.src)
      );

      // Switch theme if toggle is available
      const themeToggle = page.locator('[data-testid="theme-toggle"], [class*="theme-toggle"]').first();

      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Images should maintain same src attributes (no reload)
        const afterThemeImageSrcs = await getAvatarImages(page).evaluateAll(imgs =>
          imgs.map(img => img.src)
        );

        expect(afterThemeImageSrcs).toEqual(initialImageSrcs);
        console.log(`✅ Theme switch preserved ${initialImageSrcs.length} image sources`);
      }
    });
  });

  test.describe('Network Conditions and Reliability', () => {
    test('handles slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G
      await context.route('**/*.{jpg,jpeg,png,webp}', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
        return route.continue();
      });

      await page.goto(`${BASE_URL}/photographers`);

      // Should still load within reasonable time
      await waitForPhotographersToLoad(page);

      const cards = await getPhotographerCards(page).count();
      const images = await getAvatarImages(page).count();
      const fallbacks = await getAvatarFallbacks(page).count();

      expect(cards).toBeGreaterThan(0);
      expect(images + fallbacks).toBe(cards);

      console.log(`🐌 Slow network: ${cards} cards loaded successfully`);
    });

    test('handles network failures gracefully', async ({ page, context }) => {
      // Fail all image requests
      await context.route('**/*.{jpg,jpeg,png,webp}', route => {
        return route.fulfill({
          status: 404,
          contentType: 'text/plain',
          body: 'Not Found'
        });
      });

      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // All cards should show fallbacks
      const cards = await getPhotographerCards(page).count();
      const fallbacks = await getAvatarFallbacks(page).count();

      expect(cards).toBeGreaterThan(0);
      expect(fallbacks).toBe(cards); // All should be fallbacks

      console.log(`❌ Network failure: ${cards} cards with ${fallbacks} fallbacks`);
    });

    test('handles mixed success/failure scenarios', async ({ page, context }) => {
      let requestCount = 0;

      // Fail every other image request
      await context.route('**/*.{jpg,jpeg,png,webp}', route => {
        requestCount++;
        if (requestCount % 2 === 0) {
          return route.fulfill({
            status: 404,
            contentType: 'text/plain',
            body: 'Not Found'
          });
        }
        return route.continue();
      });

      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      const cards = await getPhotographerCards(page).count();
      const images = await getAvatarImages(page).count();
      const fallbacks = await getAvatarFallbacks(page).count();

      expect(cards).toBeGreaterThan(0);
      expect(images + fallbacks).toBe(cards);

      // Should have mix of images and fallbacks
      expect(images).toBeGreaterThan(0);
      expect(fallbacks).toBeGreaterThan(0);

      console.log(`🔀 Mixed scenario: ${images} images, ${fallbacks} fallbacks`);
    });
  });

  test.describe('Accessibility and Interaction', () => {
    test('validates keyboard navigation', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Tab through photographer cards
      await page.keyboard.press('Tab');

      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();

      // Should be able to activate with Enter
      await page.keyboard.press('Enter');

      // May navigate to profile page or have some interaction
      // Just ensure no errors occur
    });

    test('validates screen reader compatibility', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Check for proper alt text on images
      const images = await getAvatarImages(page).all();

      for (const img of images) {
        const altText = await img.getAttribute('alt');
        expect(altText).toBeTruthy();
        expect(altText.length).toBeGreaterThan(0);
      }

      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);

      console.log(`♿ Accessibility: ${images.length} images with alt text, ${headings.length} headings`);
    });

    test('validates ARIA labels and roles', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Check for proper ARIA labels on interactive elements
      const links = await page.locator('a').all();

      for (const link of links) {
        const ariaLabel = await link.getAttribute('aria-label');
        const text = await link.textContent();

        // Should have either aria-label or meaningful text
        expect(ariaLabel || (text && text.trim().length > 0)).toBeTruthy();
      }
    });
  });

  test.describe('Visual Regression Detection', () => {
    test('captures baseline screenshots for regression testing', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      // Full page screenshot
      await page.screenshot({
        path: `${SCREENSHOT_PATH}/baseline-full-page.png`,
        fullPage: true
      });

      // Individual card screenshots
      const cards = await getPhotographerCards(page).all();

      for (let i = 0; i < Math.min(cards.length, 3); i++) {
        await cards[i].screenshot({
          path: `${SCREENSHOT_PATH}/baseline-card-${i + 1}.png`
        });
      }

      console.log(`📸 Captured ${Math.min(cards.length, 3)} card baselines`);
    });

    test('detects layout shifts during loading', async ({ page }) => {
      let layoutShifts = [];

      await page.addInitScript(() => {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            window.layoutShifts = window.layoutShifts || [];
            window.layoutShifts.push({
              value: entry.value,
              startTime: entry.startTime,
              hadRecentInput: entry.hadRecentInput
            });
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });

      await page.goto(`${BASE_URL}/photographers`);
      await waitForPhotographersToLoad(page);

      layoutShifts = await page.evaluate(() => window.layoutShifts || []);

      // Log significant layout shifts
      const significantShifts = layoutShifts.filter(shift => shift.value > 0.01);

      if (significantShifts.length > 0) {
        console.log(`⚠️ Layout shifts detected:`, significantShifts);
      }

      // Total CLS should be minimal
      const totalCLS = layoutShifts.reduce((sum, shift) =>
        sum + (shift.hadRecentInput ? 0 : shift.value), 0
      );

      expect(totalCLS).toBeLessThan(0.05);
    });
  });
});