/**
 * Simple test to check if signup page loads and form appears
 */

import { test, expect } from '@playwright/test';

test('Simple signup test', async ({ page }) => {
  await page.goto('http://localhost:5173/signup');

  // Wait for page load
  await page.waitForTimeout(2000);

  // Check if "Choose your path" appears
  const chooseText = await page.locator('h2:text("Choose your path")').count();
  console.log('Choose your path found:', chooseText);

  if (chooseText > 0) {
    // Click continue if found
    await page.click('button:text("Continue")');
    await page.waitForTimeout(1000);

    // Check if form appears
    const formCount = await page.locator('form').count();
    console.log('Form found:', formCount);

    if (formCount > 0) {
      // Try to fill phone field
      const phoneInputCount = await page.locator('input[name="phone"]').count();
      console.log('Phone input found:', phoneInputCount);

      if (phoneInputCount > 0) {
        await page.fill('input[name="phone"]', '5551234567');
        const phoneValue = await page.inputValue('input[name="phone"]');
        console.log('Phone value after fill:', phoneValue);
      }
    }
  }
});