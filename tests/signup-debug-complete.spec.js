/**
 * Complete debug test for signup flow
 */

import { test, expect } from '@playwright/test';

test('Complete signup debug', async ({ page }) => {
  // Capture all console messages and errors
  const messages = [];
  const errors = [];

  page.on('console', msg => {
    messages.push(`${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('http://localhost:5173/signup');

  // Step 1: Wait for initial page load
  console.log('1. Loading signup page...');
  await page.waitForTimeout(2000);

  // Check if step 1 loads
  const step1Title = await page.locator('h2:text("Choose your path")');
  const step1Count = await step1Title.count();
  console.log(`2. Step 1 title found: ${step1Count}`);

  if (step1Count === 0) {
    console.log('Step 1 not found, capturing page content...');
    const content = await page.content();
    console.log('Page HTML length:', content.length);

    // Check for any React errors
    const reactErrors = await page.locator('[data-testid="error"], .error, [class*="error"]').count();
    console.log('React error elements found:', reactErrors);

    if (errors.length > 0) {
      console.log('JavaScript errors:', errors);
    }

    if (messages.length > 0) {
      console.log('Console messages:', messages.slice(-10)); // Last 10 messages
    }

    return;
  }

  // Step 2: Click Continue button
  console.log('3. Clicking Continue button...');
  const continueButton = page.locator('button:text("Continue")');
  const continueCount = await continueButton.count();
  console.log(`Continue button found: ${continueCount}`);

  if (continueCount > 0) {
    await continueButton.click();
    console.log('4. Continue button clicked');

    // Wait for step 2 to appear
    await page.waitForTimeout(2000);

    // Check if step 2 form appears
    const formCount = await page.locator('form').count();
    console.log(`5. Form elements found after click: ${formCount}`);

    // Check if step 2 title appears
    const step2Title = await page.locator('h2:text("Create your account")');
    const step2Count = await step2Title.count();
    console.log(`6. Step 2 title found: ${step2Count}`);

    // Check for phone input specifically
    const phoneInputCount = await page.locator('input[name="phone"]').count();
    console.log(`7. Phone input found: ${phoneInputCount}`);

    // Look for any error messages or loading states
    const errorCount = await page.locator('.error, [data-testid="error"]').count();
    console.log(`8. Error elements found: ${errorCount}`);

    // Check if there are JavaScript errors after clicking
    if (errors.length > 0) {
      console.log('9. JavaScript errors after continue:', errors);
    }

    // Show recent console messages
    if (messages.length > 0) {
      console.log('10. Recent console messages:', messages.slice(-5));
    }

    // Try to get current step state
    const currentStep = await page.evaluate(() => {
      return window.location.href;
    });
    console.log('11. Current URL:', currentStep);
  }
});