import { test, expect } from '@playwright/test';

test.describe('Navbar Dropdown Portal Positioning Tests', () => {

  test('should test Book Now dropdown positioning with Portal at page top', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({
      path: 'tests/screenshots/fixed-01-initial-page-load.png',
      fullPage: true
    });

    // Find the Book Now button
    const bookNowButton = page.locator('text="Book Now"').first();
    await expect(bookNowButton).toBeVisible();

    // Get button position before hover
    const buttonBox = await bookNowButton.boundingBox();
    console.log('Button position at page top:', buttonBox);

    // Hover over Book Now to trigger dropdown
    await bookNowButton.hover();
    await page.waitForTimeout(300);

    // Take screenshot with dropdown open at top of page
    await page.screenshot({
      path: 'tests/screenshots/fixed-02-dropdown-open-page-top.png',
      fullPage: true
    });

    // Find the dropdown using Portal selector (fixed positioned div with specific classes)
    const dropdown = page.locator('div[style*="position: fixed"]').filter({
      has: page.locator('text="Find Photographers"')
    });

    await expect(dropdown).toBeVisible();

    // Get dropdown position
    const dropdownBox = await dropdown.boundingBox();
    console.log('Dropdown position at page top:', dropdownBox);

    // Verify dropdown is positioned below the button (accounting for fixed positioning)
    const expectedTop = buttonBox.y + buttonBox.height + 8; // button bottom + offset
    expect(dropdownBox.y).toBeGreaterThanOrEqual(expectedTop - 10); // Allow 10px tolerance
    expect(dropdownBox.y).toBeLessThanOrEqual(expectedTop + 20); // Upper bound
  });

  test('should test dropdown positioning after scrolling with Portal', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Scroll down to middle of page
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    // Take screenshot after scrolling
    await page.screenshot({
      path: 'tests/screenshots/fixed-03-after-scroll.png',
      fullPage: true
    });

    // Find and hover over Book Now button
    const bookNowButton = page.locator('text="Book Now"').first();
    const buttonBoxAfterScroll = await bookNowButton.boundingBox();
    console.log('Button position after scroll:', buttonBoxAfterScroll);

    await bookNowButton.hover();
    await page.waitForTimeout(300);

    // Take screenshot with dropdown open after scroll
    await page.screenshot({
      path: 'tests/screenshots/fixed-04-dropdown-open-after-scroll.png',
      fullPage: true
    });

    // Find dropdown with Portal selector
    const dropdown = page.locator('div[style*="position: fixed"]').filter({
      has: page.locator('text="Find Photographers"')
    });

    const dropdownBoxAfterScroll = await dropdown.boundingBox();
    console.log('Dropdown position after scroll:', dropdownBoxAfterScroll);

    // Verify dropdown is positioned correctly relative to button (fixed positioning)
    const expectedTop = buttonBoxAfterScroll.y + buttonBoxAfterScroll.height + 8;
    expect(dropdownBoxAfterScroll.y).toBeGreaterThanOrEqual(expectedTop - 10);
    expect(dropdownBoxAfterScroll.y).toBeLessThanOrEqual(expectedTop + 20);

    // Verify dropdown doesn't go off-screen
    expect(dropdownBoxAfterScroll.y).toBeGreaterThanOrEqual(0);
    expect(dropdownBoxAfterScroll.x).toBeGreaterThanOrEqual(0);
  });

  test('should test dropdown positioning at bottom of page with flip behavior', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Scroll to bottom of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - window.innerHeight + 50));
    await page.waitForTimeout(500);

    // Take screenshot at bottom
    await page.screenshot({
      path: 'tests/screenshots/fixed-05-bottom-of-page.png',
      fullPage: true
    });

    const bookNowButton = page.locator('text="Book Now"').first();
    const buttonBoxAtBottom = await bookNowButton.boundingBox();
    console.log('Button position at bottom:', buttonBoxAtBottom);

    await bookNowButton.hover();
    await page.waitForTimeout(300);

    // Take screenshot with dropdown at bottom
    await page.screenshot({
      path: 'tests/screenshots/fixed-06-dropdown-open-bottom.png',
      fullPage: true
    });

    // Find dropdown
    const dropdown = page.locator('div[style*="position: fixed"]').filter({
      has: page.locator('text="Find Photographers"')
    });

    const dropdownBoxAtBottom = await dropdown.boundingBox();
    console.log('Dropdown position at bottom:', dropdownBoxAtBottom);

    // Get viewport height
    const viewportSize = page.viewportSize();

    // Check if dropdown flipped above the button (smart positioning)
    const isFlipped = dropdownBoxAtBottom.y < buttonBoxAtBottom.y;
    if (isFlipped) {
      console.log('✓ Dropdown correctly flipped above button at bottom of page');
      expect(dropdownBoxAtBottom.y + dropdownBoxAtBottom.height).toBeLessThanOrEqual(buttonBoxAtBottom.y + 10);
    } else {
      // If not flipped, ensure it doesn't go off-screen
      console.log('→ Dropdown positioned below button');
      expect(dropdownBoxAtBottom.y + dropdownBoxAtBottom.height).toBeLessThanOrEqual(viewportSize.height);
    }

    // Ensure dropdown is always within viewport bounds
    expect(dropdownBoxAtBottom.y).toBeGreaterThanOrEqual(0);
    expect(dropdownBoxAtBottom.x).toBeGreaterThanOrEqual(0);
  });

  test('should test dropdown responsiveness and hover timing', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    const bookNowButton = page.locator('text="Book Now"').first();

    // Test hover timing - dropdown should appear quickly
    const startTime = Date.now();
    await bookNowButton.hover();

    // Wait for dropdown to be visible
    const dropdown = page.locator('div[style*="position: fixed"]').filter({
      has: page.locator('text="Find Photographers"')
    });

    await dropdown.waitFor({ state: 'visible', timeout: 1000 });
    const hoverTime = Date.now() - startTime;
    console.log('Dropdown appearance time:', hoverTime + 'ms');

    // Dropdown should appear within reasonable time
    expect(hoverTime).toBeLessThan(500);

    // Test dropdown content is accessible
    const findPhotographersLink = dropdown.locator('text="Find Photographers"');
    const howItWorksLink = dropdown.locator('text="How It Works"');
    const pricingLink = dropdown.locator('text="Pricing"');

    await expect(findPhotographersLink).toBeVisible();
    await expect(howItWorksLink).toBeVisible();
    await expect(pricingLink).toBeVisible();

    // Test that dropdown links are clickable
    const findPhotographersBox = await findPhotographersLink.boundingBox();
    expect(findPhotographersBox).toBeTruthy();

    // Move mouse away and test disappearance
    await page.mouse.move(100, 100);
    await page.waitForTimeout(200);

    // Take final screenshot
    await page.screenshot({
      path: 'tests/screenshots/fixed-07-dropdown-hidden.png',
      fullPage: true
    });

    // Dropdown should be hidden after mouse leaves
    await expect(dropdown).not.toBeVisible();
  });

  test('should test Join dropdown positioning and behavior', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Test the Join dropdown as well
    const joinButton = page.locator('text="Join"').first();
    await expect(joinButton).toBeVisible();

    const joinButtonBox = await joinButton.boundingBox();
    console.log('Join button position:', joinButtonBox);

    await joinButton.hover();
    await page.waitForTimeout(300);

    // Take screenshot with Join dropdown open
    await page.screenshot({
      path: 'tests/screenshots/fixed-08-join-dropdown-open.png',
      fullPage: true
    });

    // Find Join dropdown
    const joinDropdown = page.locator('div[style*="position: fixed"]').filter({
      has: page.locator('text="Become a Photographer"')
    });

    await expect(joinDropdown).toBeVisible();

    const joinDropdownBox = await joinDropdown.boundingBox();
    console.log('Join dropdown position:', joinDropdownBox);

    // Verify positioning
    const expectedTop = joinButtonBox.y + joinButtonBox.height + 8;
    expect(joinDropdownBox.y).toBeGreaterThanOrEqual(expectedTop - 10);

    // Verify content
    await expect(joinDropdown.locator('text="Become a Photographer"')).toBeVisible();
    await expect(joinDropdown.locator('text="Resources"')).toBeVisible();
  });

});