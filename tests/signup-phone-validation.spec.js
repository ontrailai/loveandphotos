/**
 * Test for signup phone number validation fix
 * Verifies that the "Phone number is required" error no longer appears
 * when a valid phone number is entered
 */

import { test, expect } from '@playwright/test';

test.describe('Signup Phone Validation', () => {
  test('should not show "Phone number is required" error when phone is filled', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    // Wait for the page to load
    await page.waitForSelector('h2:text("Choose your path")');

    // Step 1: Select role (Customer by default)
    await page.click('button:text("Continue")');

    // Wait for step 2 form
    await page.waitForSelector('form');

    // Fill all required fields
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');

    // Fill phone number
    await page.fill('input[name="phone"]', '5551234567');

    // Fill password fields
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');

    // Check terms
    await page.check('input[name="terms"]');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait a moment for validation
    await page.waitForTimeout(500);

    // Should NOT see phone number required error
    const phoneError = page.locator('text=Phone number is required');
    await expect(phoneError).not.toBeVisible();

    // Should also not see validation error about 10-digit format since we provided valid input
    const digitError = page.locator('text=Enter a valid 10-digit phone number');
    await expect(digitError).not.toBeVisible();

    console.log('✅ Phone validation test passed - no "Phone number is required" error shown');
  });

  test('should format phone number correctly as user types', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    // Navigate to form
    await page.waitForSelector('h2:text("Choose your path")');
    await page.click('button:text("Continue")');
    await page.waitForSelector('form');

    const phoneInput = page.locator('input[name="phone"]');

    // Test progressive formatting
    await phoneInput.fill('555');
    expect(await phoneInput.inputValue()).toBe('(555');

    await phoneInput.fill('5551234');
    expect(await phoneInput.inputValue()).toBe('(555) 123-4');

    await phoneInput.fill('5551234567');
    expect(await phoneInput.inputValue()).toBe('(555) 123-4567');

    console.log('✅ Phone formatting test passed');
  });

  test('should show validation error for incomplete phone number', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    // Navigate to form
    await page.waitForSelector('h2:text("Choose your path")');
    await page.click('button:text("Continue")');
    await page.waitForSelector('form');

    // Fill all fields except make phone incomplete
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '555123'); // Incomplete
    await page.fill('input[name="password"]', 'Test123!');
    await page.fill('input[name="confirmPassword"]', 'Test123!');
    await page.check('input[name="terms"]');

    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Should see the 10-digit validation error, not "required" error
    const digitError = page.locator('text=Enter a valid 10-digit phone number');
    await expect(digitError).toBeVisible();

    const requiredError = page.locator('text=Phone number is required');
    await expect(requiredError).not.toBeVisible();

    console.log('✅ Incomplete phone validation test passed');
  });
});