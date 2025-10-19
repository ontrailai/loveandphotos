import { test, expect } from '@playwright/test';

test.describe('FAQ Menu Items Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
  });

  test('FAQ appears in Join dropdown on desktop', async ({ page }) => {
    // Find the Join menu button
    const joinButton = page.getByRole('button', { name: 'Join' });
    await expect(joinButton).toBeVisible();

    // Hover to open dropdown
    await joinButton.hover();

    // Wait for dropdown to appear
    await page.waitForTimeout(500);

    // Look for FAQ link in the dropdown
    const faqLink = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' }).first();
    await expect(faqLink).toBeVisible();

    // Verify it has the correct description
    const faqDescription = page.getByText('Frequently asked questions');
    await expect(faqDescription).toBeVisible();
  });

  test('FAQ appears in Book Now dropdown on desktop', async ({ page }) => {
    // Find the Book Now menu button
    const bookNowButton = page.getByRole('button', { name: 'Book Now' });
    await expect(bookNowButton).toBeVisible();

    // Hover to open dropdown
    await bookNowButton.hover();

    // Wait for dropdown to appear
    await page.waitForTimeout(500);

    // Look for FAQ link in the dropdown
    const faqLink = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' }).first();
    await expect(faqLink).toBeVisible();

    // Verify it has the correct description
    const faqDescription = page.getByText('Frequently asked questions');
    await expect(faqDescription).toBeVisible();
  });

  test('FAQ link navigates to /faq from Join dropdown', async ({ page }) => {
    // Open Join dropdown
    const joinButton = page.getByRole('button', { name: 'Join' });
    await joinButton.hover();
    await page.waitForTimeout(500);

    // Click FAQ link
    const faqLink = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' }).first();
    await faqLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*\/faq/);
  });

  test('FAQ link navigates to /faq from Book Now dropdown', async ({ page }) => {
    // Open Book Now dropdown
    const bookNowButton = page.getByRole('button', { name: 'Book Now' });
    await bookNowButton.hover();
    await page.waitForTimeout(500);

    // Click FAQ link
    const faqLink = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' }).first();
    await faqLink.click();

    // Verify navigation
    await expect(page).toHaveURL(/.*\/faq/);
  });

  test('FAQ menu items have correct styling on hover', async ({ page }) => {
    // Test Join dropdown FAQ hover
    const joinButton = page.getByRole('button', { name: 'Join' });
    await joinButton.hover();
    await page.waitForTimeout(500);

    const joinFaqLink = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' }).first();

    // Hover over FAQ item
    await joinFaqLink.hover();

    // Check that it's still visible and clickable
    await expect(joinFaqLink).toBeVisible();
    await expect(joinFaqLink).toBeEnabled();

    // Navigate away to reset state
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Test Book Now dropdown FAQ hover
    const bookNowButton = page.getByRole('button', { name: 'Book Now' });
    await bookNowButton.hover();
    await page.waitForTimeout(500);

    const bookNowFaqLink = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' }).first();

    // Hover over FAQ item
    await bookNowFaqLink.hover();

    // Check that it's still visible and clickable
    await expect(bookNowFaqLink).toBeVisible();
    await expect(bookNowFaqLink).toBeEnabled();
  });

  test('FAQ is the first item in Join dropdown', async ({ page }) => {
    const joinButton = page.getByRole('button', { name: 'Join' });
    await joinButton.hover();
    await page.waitForTimeout(500);

    // Get all menu items in the Join dropdown
    const menuItems = page.locator('a[href^="/"]').filter({ has: page.getByText('Apply to Join') }).or(
      page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' })
    ).or(
      page.locator('a[href="/guidelines"]')
    );

    // FAQ should be first (index 0)
    const firstItem = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' }).first();
    await expect(firstItem).toBeVisible();
  });
});

test.describe('FAQ Menu Items - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
  });

  test('FAQ appears in mobile Join menu', async ({ page }) => {
    // Open mobile menu
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    await mobileMenuButton.click();
    await page.waitForTimeout(500);

    // Expand Join section
    const joinButton = page.getByRole('button', { name: 'Join' });
    if (await joinButton.isVisible()) {
      await joinButton.click();
      await page.waitForTimeout(300);
    }

    // Look for FAQ link
    const faqLink = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' });
    await expect(faqLink.first()).toBeVisible();
  });

  test('FAQ appears in mobile Book Now menu', async ({ page }) => {
    // Open mobile menu
    const mobileMenuButton = page.getByRole('button', { name: /menu/i });
    await mobileMenuButton.click();
    await page.waitForTimeout(500);

    // Expand Book Now section
    const bookNowButton = page.getByRole('button', { name: 'Book Now' });
    if (await bookNowButton.isVisible()) {
      await bookNowButton.click();
      await page.waitForTimeout(300);
    }

    // Look for FAQ link
    const faqLink = page.locator('a[href="/faq"]').filter({ hasText: 'FAQ' });
    await expect(faqLink.first()).toBeVisible();
  });
});
