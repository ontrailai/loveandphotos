/**
 * Debug test to understand what's happening with the phone field
 */

import { test, expect } from '@playwright/test';

test('Debug phone form data', async ({ page }) => {
  await page.goto('http://localhost:5173/signup');

  // Navigate to form
  await page.waitForSelector('h2:text("Choose your path")');
  await page.click('button:text("Continue")');
  await page.waitForSelector('form');

  // Fill all fields
  await page.fill('input[name="fullName"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="phone"]', '5551234567');
  await page.fill('input[name="password"]', 'Test123!');
  await page.fill('input[name="confirmPassword"]', 'Test123!');
  await page.check('input[name="terms"]');

  // Check what the phone input actually contains
  const phoneValue = await page.inputValue('input[name="phone"]');
  console.log('Phone input value:', phoneValue);

  // Check if there are any hidden inputs
  const hiddenInputs = await page.locator('input[type="hidden"]').all();
  for (const input of hiddenInputs) {
    const name = await input.getAttribute('name');
    const value = await input.inputValue();
    console.log(`Hidden input ${name}:`, value);
  }

  // Check all inputs with name=phone
  const phoneInputs = await page.locator('input[name="phone"]').all();
  console.log(`Found ${phoneInputs.length} inputs with name="phone"`);

  for (let i = 0; i < phoneInputs.length; i++) {
    const value = await phoneInputs[i].inputValue();
    const type = await phoneInputs[i].getAttribute('type');
    console.log(`Phone input ${i}: type=${type}, value="${value}"`);
  }

  // Add console listener to capture form submission data
  page.on('console', msg => {
    if (msg.text().includes('FORM DATA:')) {
      console.log('Browser console:', msg.text());
    }
  });

  // Add script to capture form data on submit
  await page.addScriptTag({
    content: `
      document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        console.log('FORM DATA:', JSON.stringify(data, null, 2));
      });
    `
  });

  // Submit and capture the data
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
});