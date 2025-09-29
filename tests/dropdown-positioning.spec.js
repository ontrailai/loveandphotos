import { test, expect } from '@playwright/test';

test.describe('Navbar Dropdown Positioning Tests', () => {

  test('should test Book Now dropdown positioning at page top', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: 'tests/screenshots/01-initial-page-load.png',
      fullPage: true
    });

    // Find the Book Now button
    const bookNowButton = page.locator('text="Book Now"').first();
    await expect(bookNowButton).toBeVisible();

    // Hover over Book Now to trigger dropdown
    await bookNowButton.hover();

    // Wait for dropdown to appear
    await page.waitForTimeout(500);

    // Take screenshot with dropdown open at top of page
    await page.screenshot({
      path: 'tests/screenshots/02-dropdown-open-page-top.png',
      fullPage: true
    });

    // Check if dropdown is visible
    const dropdown = page.locator('[class*="dropdown"], [class*="submenu"], .absolute').first();
    await expect(dropdown).toBeVisible();

    // Get dropdown position
    const dropdownBox = await dropdown.boundingBox();
    const buttonBox = await bookNowButton.boundingBox();

    console.log('At page top:');
    console.log('Button position:', buttonBox);
    console.log('Dropdown position:', dropdownBox);

    // Verify dropdown is positioned below the button
    expect(dropdownBox.y).toBeGreaterThan(buttonBox.y);
  });

  test('should test dropdown positioning after scrolling', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Scroll down to middle of page
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    // Take screenshot after scrolling
    await page.screenshot({
      path: 'tests/screenshots/03-after-scroll.png',
      fullPage: true
    });

    // Find and hover over Book Now button
    const bookNowButton = page.locator('text="Book Now"').first();
    await bookNowButton.hover();
    await page.waitForTimeout(500);

    // Take screenshot with dropdown open after scroll
    await page.screenshot({
      path: 'tests/screenshots/04-dropdown-open-after-scroll.png',
      fullPage: true
    });

    // Check dropdown positioning after scroll
    const dropdown = page.locator('[class*="dropdown"], [class*="submenu"], .absolute').first();
    const dropdownBox = await dropdown.boundingBox();
    const buttonBox = await bookNowButton.boundingBox();

    console.log('After scrolling:');
    console.log('Button position:', buttonBox);
    console.log('Dropdown position:', dropdownBox);

    // Verify dropdown is still positioned correctly
    expect(dropdownBox.y).toBeGreaterThan(buttonBox.y);
  });

  test('should test dropdown positioning at bottom of page', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Take screenshot at bottom
    await page.screenshot({
      path: 'tests/screenshots/05-bottom-of-page.png',
      fullPage: true
    });

    // Find and hover over Book Now button
    const bookNowButton = page.locator('text="Book Now"').first();
    await bookNowButton.hover();
    await page.waitForTimeout(500);

    // Take screenshot with dropdown at bottom
    await page.screenshot({
      path: 'tests/screenshots/06-dropdown-open-bottom.png',
      fullPage: true
    });

    // Check dropdown positioning at bottom
    const dropdown = page.locator('[class*="dropdown"], [class*="submenu"], .absolute').first();
    const dropdownBox = await dropdown.boundingBox();
    const buttonBox = await bookNowButton.boundingBox();

    console.log('At page bottom:');
    console.log('Button position:', buttonBox);
    console.log('Dropdown position:', dropdownBox);

    // Verify dropdown doesn't go off-screen
    expect(dropdownBox.y + dropdownBox.height).toBeLessThanOrEqual(page.viewportSize().height);
  });

  test('should test dropdown hover behavior and timing', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    const bookNowButton = page.locator('text="Book Now"').first();

    // Test hover timing - dropdown should appear quickly
    const startTime = Date.now();
    await bookNowButton.hover();

    // Wait for dropdown to be visible
    const dropdown = page.locator('[class*="dropdown"], [class*="submenu"], .absolute').first();
    await dropdown.waitFor({ state: 'visible', timeout: 1000 });

    const hoverTime = Date.now() - startTime;
    console.log('Dropdown appearance time:', hoverTime + 'ms');

    // Dropdown should appear within reasonable time
    expect(hoverTime).toBeLessThan(800);

    // Move mouse away and test disappearance
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);

    // Take final screenshot
    await page.screenshot({
      path: 'tests/screenshots/07-dropdown-hidden.png',
      fullPage: true
    });
  });

});