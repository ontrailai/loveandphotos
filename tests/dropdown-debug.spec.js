import { test, expect } from '@playwright/test';

test.describe('Dropdown Debug Investigation', () => {

  test('should debug dropdown element detection and positioning', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Find the Book Now button
    const bookNowButton = page.locator('text="Book Now"').first();
    await expect(bookNowButton).toBeVisible();

    console.log('=== BEFORE HOVER ===');

    // Check for any existing dropdowns
    const existingDropdowns = await page.locator('div[style*="position: fixed"]').count();
    console.log('Existing fixed positioned divs:', existingDropdowns);

    // Hover over Book Now
    await bookNowButton.hover();
    await page.waitForTimeout(500);

    console.log('=== AFTER HOVER ===');

    // Count all fixed positioned elements
    const fixedElements = await page.locator('div[style*="position: fixed"]').count();
    console.log('Total fixed positioned divs after hover:', fixedElements);

    // Get all elements with dropdown content
    const dropdownsWithText = await page.locator('div:has-text("Find Photographers")').count();
    console.log('Divs containing "Find Photographers":', dropdownsWithText);

    // Find elements with z-index 9999
    const highZElements = await page.locator('div[class*="z-\\[9999\\]"]').count();
    console.log('Elements with z-[9999]:', highZElements);

    // Try multiple selectors to find the dropdown
    const selectors = [
      'div[style*="position: fixed"]',
      'div[class*="z-\\[9999\\]"]',
      'div:has-text("Find Photographers")',
      '.shadow-lg:has-text("Find Photographers")',
      'div[style*="position: fixed"]:has-text("Find Photographers")'
    ];

    for (const selector of selectors) {
      const elements = await page.locator(selector).count();
      console.log(`Selector "${selector}": ${elements} elements`);

      if (elements > 0) {
        const firstElement = page.locator(selector).first();
        const box = await firstElement.boundingBox();
        const styles = await firstElement.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            position: computed.position,
            top: computed.top,
            left: computed.left,
            zIndex: computed.zIndex,
            display: computed.display,
            visibility: computed.visibility
          };
        });
        console.log(`  First element box:`, box);
        console.log(`  First element styles:`, styles);
      }
    }

    // Take a full page screenshot for visual debugging
    await page.screenshot({
      path: 'tests/screenshots/debug-dropdown-hover.png',
      fullPage: true
    });

    // Try to interact with dropdown content
    try {
      const findPhotographersLink = page.locator('text="Find Photographers"').first();
      const isVisible = await findPhotographersLink.isVisible();
      const box = await findPhotographersLink.boundingBox();
      console.log('Find Photographers link visible:', isVisible);
      console.log('Find Photographers link box:', box);
    } catch (error) {
      console.log('Error getting Find Photographers link:', error.message);
    }

    // Check if the dropdown is being created in the DOM
    const htmlContent = await page.content();
    const hasDropdownContent = htmlContent.includes('Find Photographers');
    console.log('HTML contains "Find Photographers":', hasDropdownContent);

    // Check portal root
    const portalElements = await page.locator('[data-portal-root], #portal-root, .portal-root').count();
    console.log('Portal root elements:', portalElements);
  });

});