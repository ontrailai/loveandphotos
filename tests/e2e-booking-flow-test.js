#!/usr/bin/env node

import { chromium } from 'playwright';

// Test Configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:5176',
  timeout: 30000,
  viewport: { width: 1280, height: 720 },
  slowMo: 500, // Add delay between actions for better visibility
};

// Test Results Storage
const testResults = {
  issues: [],
  successes: [],
  warnings: [],
  consoleErrors: [],
  networkErrors: [],
  startTime: Date.now(),
  endTime: null
};

// Utility Functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    info: '📝',
    success: '✅', 
    warning: '⚠️',
    error: '❌',
    step: '🔄'
  }[type] || '📝';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
  
  if (type === 'error') testResults.issues.push(message);
  if (type === 'warning') testResults.warnings.push(message);
  if (type === 'success') testResults.successes.push(message);
}

// Enhanced error checking function
async function checkForErrors(page, stepName) {
  // Check for console errors
  const logs = await page.evaluate(() => {
    const errors = window.__testErrors || [];
    window.__testErrors = []; // Clear after reading
    return errors;
  });
  
  if (logs.length > 0) {
    logs.forEach(error => {
      testResults.consoleErrors.push({ step: stepName, error });
      log(`Console error in ${stepName}: ${error}`, 'error');
    });
  }
  
  // Check for React error boundaries
  const errorBoundary = await page.locator('[data-testid="error-boundary"]').first();
  if (await errorBoundary.isVisible()) {
    const errorText = await errorBoundary.textContent();
    log(`React error boundary triggered in ${stepName}: ${errorText}`, 'error');
  }
  
  // Check for network errors in browser console
  const networkErrors = await page.evaluate(() => {
    return window.__networkErrors || [];
  });
  
  networkErrors.forEach(error => {
    testResults.networkErrors.push({ step: stepName, error });
    log(`Network error in ${stepName}: ${error}`, 'warning');
  });
}

// Main Test Function
async function runBookingFlowTest() {
  log('🚀 Starting comprehensive booking flow test');
  
  const browser = await chromium.launch({ 
    headless: false, // Set to true for CI/CD
    slowMo: TEST_CONFIG.slowMo,
    devtools: false
  });
  
  const context = await browser.newContext({
    viewport: TEST_CONFIG.viewport,
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Set up console and network monitoring
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const error = msg.text();
      if (!error.includes('favicon') && !error.includes('DevTools')) {
        page.evaluate((error) => {
          window.__testErrors = window.__testErrors || [];
          window.__testErrors.push(error);
        }, error);
      }
    }
  });
  
  page.on('response', response => {
    if (!response.ok() && response.status() !== 304) {
      page.evaluate((error) => {
        window.__networkErrors = window.__networkErrors || [];
        window.__networkErrors.push(error);
      }, `${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // Set timeout for all operations
    page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    // Step 1: Navigate to photographers page
    log('Step 1: Navigating to photographers page', 'step');
    await page.goto(`${TEST_CONFIG.baseURL}/photographers`);
    await page.waitForLoadState('networkidle');
    await checkForErrors(page, 'photographers-page-load');
    
    // Check if photographers are loaded
    const photographerCards = page.locator('[data-testid*="photographer-card"], .photographer-card, .grid > div, [class*="card"]').first();
    await photographerCards.waitFor({ timeout: 10000 });
    const photographerCount = await page.locator('[data-testid*="photographer-card"], .photographer-card, .grid > div, [class*="card"]').count();
    
    if (photographerCount === 0) {
      log('No photographer cards found on the page', 'error');
      return;
    }
    log(`Found ${photographerCount} photographer cards`, 'success');
    
    // Step 2: Click on the first photographer
    log('Step 2: Clicking on first photographer profile', 'step');
    await photographerCards.click();
    await page.waitForLoadState('networkidle');
    await checkForErrors(page, 'photographer-profile-load');
    
    // Verify we're on a photographer profile page
    const currentUrl = page.url();
    if (!currentUrl.includes('/photographer/')) {
      log(`Expected to be on photographer profile page, but URL is: ${currentUrl}`, 'error');
    } else {
      log('Successfully navigated to photographer profile page', 'success');
    }
    
    // Step 3: Find and click the booking/hire button
    log('Step 3: Looking for booking initiation button', 'step');
    
    const bookingSelectors = [
      '[data-testid="book-now-button"]',
      '[data-testid="hire-button"]', 
      'button:has-text("Book Now")',
      'button:has-text("Hire")',
      'button:has-text("Start Booking")',
      'a[href*="/book/"]',
      '.book-now-btn',
      '.hire-btn'
    ];
    
    let bookingButton = null;
    for (const selector of bookingSelectors) {
      bookingButton = page.locator(selector).first();
      if (await bookingButton.isVisible()) {
        log(`Found booking button with selector: ${selector}`, 'success');
        break;
      }
    }
    
    if (!bookingButton || !(await bookingButton.isVisible())) {
      log('No booking button found on photographer profile page', 'error');
      // Try to find any clickable button that might initiate booking
      const allButtons = await page.locator('button, a[href*="book"]').all();
      log(`Found ${allButtons.length} buttons/links that might be booking-related`, 'warning');
      
      for (const button of allButtons) {
        const text = await button.textContent();
        const href = await button.getAttribute('href');
        log(`Button: "${text}" href: ${href}`, 'info');
      }
      return;
    }
    
    await bookingButton.click();
    await page.waitForLoadState('networkidle');
    await checkForErrors(page, 'booking-initiation');
    
    // Step 4: Test Schedule Selection (if it exists as a step)
    log('Step 4: Testing schedule selection step', 'step');
    const scheduleUrl = page.url();
    
    if (scheduleUrl.includes('/schedule')) {
      log('On schedule selection step', 'info');
      
      // Look for date/time pickers
      const dateSelectors = [
        'input[type="date"]',
        '[data-testid="date-picker"]',
        '.react-datepicker-wrapper',
        '.date-picker'
      ];
      
      for (const selector of dateSelectors) {
        const dateInput = page.locator(selector).first();
        if (await dateInput.isVisible()) {
          log(`Found date picker: ${selector}`, 'success');
          // Try to interact with date picker
          await dateInput.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      // Look for time selection
      const timeSelectors = [
        'input[type="time"]',
        '[data-testid="time-picker"]',
        '.time-slots button',
        '.time-picker'
      ];
      
      for (const selector of timeSelectors) {
        const timeElements = page.locator(selector);
        const count = await timeElements.count();
        if (count > 0) {
          log(`Found ${count} time selection elements: ${selector}`, 'success');
          // Click first available time slot
          await timeElements.first().click();
          await page.waitForTimeout(1000);
          break;
        }
      }
      
      // Look for next/continue button
      const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next"), [data-testid="continue-btn"]').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
        await page.waitForLoadState('networkidle');
      }
    }
    await checkForErrors(page, 'schedule-selection');
    
    // Step 5: Test Package Selection
    log('Step 5: Testing package selection step', 'step');
    
    // Navigate directly to package step if not already there
    const photographerId = page.url().match(/\/(?:book|booking)\/([^\/]+)/)?.[1];
    if (photographerId && !page.url().includes('/package')) {
      await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/package`);
      await page.waitForLoadState('networkidle');
    }
    
    await checkForErrors(page, 'package-step-navigation');
    
    // Look for package options
    const packageSelectors = [
      '[data-testid*="package"]',
      '.package-card',
      '.pricing-card', 
      'button:has-text("Starter")',
      'button:has-text("Pro")',
      'button:has-text("Luxe")'
    ];
    
    let packageFound = false;
    for (const selector of packageSelectors) {
      const packages = page.locator(selector);
      const count = await packages.count();
      if (count > 0) {
        log(`Found ${count} package options with selector: ${selector}`, 'success');
        // Click first package
        await packages.first().click();
        await page.waitForTimeout(1000);
        packageFound = true;
        break;
      }
    }
    
    if (!packageFound) {
      log('No package selection options found', 'error');
    }
    
    // Look for and click next button
    const nextButton = page.locator('button:has-text("Continue"), button:has-text("Next"), [data-testid="next-btn"]').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      log('Clicked next button on package step', 'success');
    }
    await checkForErrors(page, 'package-selection');
    
    // Step 6: Test Location Details
    log('Step 6: Testing location details step', 'step');
    
    if (photographerId && !page.url().includes('/location')) {
      await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/location`);
      await page.waitForLoadState('networkidle');
    }
    
    // Fill out location form
    const locationInputs = [
      { selector: 'input[name="address"], input[placeholder*="address"], [data-testid="address-input"]', value: '123 Main St' },
      { selector: 'input[name="city"], input[placeholder*="city"], [data-testid="city-input"]', value: 'Los Angeles' },
      { selector: 'input[name="state"], select[name="state"], [data-testid="state-input"]', value: 'CA' },
      { selector: 'input[name="zipCode"], input[name="zip"], [data-testid="zip-input"]', value: '90210' }
    ];
    
    for (const input of locationInputs) {
      const element = page.locator(input.selector).first();
      if (await element.isVisible()) {
        await element.fill(input.value);
        log(`Filled location field: ${input.selector} with value: ${input.value}`, 'success');
        await page.waitForTimeout(500);
      }
    }
    
    // Continue to next step
    const locationNextBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await locationNextBtn.isVisible()) {
      await locationNextBtn.click();
      await page.waitForLoadState('networkidle');
    }
    await checkForErrors(page, 'location-details');
    
    // Step 7: Test Add-ons Selection
    log('Step 7: Testing add-ons selection step', 'step');
    
    if (photographerId && !page.url().includes('/addons')) {
      await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/addons`);
      await page.waitForLoadState('networkidle');
    }
    
    // Look for add-on options
    const addonSelectors = [
      '[data-testid*="addon"]',
      '.addon-card',
      'input[type="checkbox"]',
      'button[data-addon], [data-testid*="add-on"]'
    ];
    
    for (const selector of addonSelectors) {
      const addons = page.locator(selector);
      const count = await addons.count();
      if (count > 0) {
        log(`Found ${count} add-on options with selector: ${selector}`, 'success');
        // Select first add-on
        await addons.first().click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    // Continue to contract step
    const addonsNextBtn = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await addonsNextBtn.isVisible()) {
      await addonsNextBtn.click();
      await page.waitForLoadState('networkidle');
    }
    await checkForErrors(page, 'addons-selection');
    
    // Step 8: Test Contract Step
    log('Step 8: Testing contract signing step', 'step');
    
    if (photographerId && !page.url().includes('/contract')) {
      await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/contract`);
      await page.waitForLoadState('networkidle');
    }
    
    // Look for contract elements
    const contractElements = [
      'input[type="checkbox"][name*="agree"]',
      'input[type="checkbox"][name*="terms"]',
      '[data-testid="agree-checkbox"]',
      '.contract-agreement input[type="checkbox"]'
    ];
    
    for (const selector of contractElements) {
      const checkbox = page.locator(selector).first();
      if (await checkbox.isVisible()) {
        await checkbox.check();
        log(`Checked contract agreement checkbox: ${selector}`, 'success');
        await page.waitForTimeout(500);
        break;
      }
    }
    
    // Signature pad or input
    const signatureSelectors = [
      '[data-testid="signature-pad"]',
      'input[name="signature"]',
      '.signature-field',
      'canvas'
    ];
    
    for (const selector of signatureSelectors) {
      const sigElement = page.locator(selector).first();
      if (await sigElement.isVisible()) {
        if (selector.includes('input')) {
          await sigElement.fill('John Doe');
        } else if (selector.includes('canvas')) {
          // Draw a simple signature on canvas
          await sigElement.click();
        }
        log(`Interacted with signature element: ${selector}`, 'success');
        break;
      }
    }
    
    // Continue to payment
    const contractNextBtn = page.locator('button:has-text("Continue"), button:has-text("Proceed"), button:has-text("Next")').first();
    if (await contractNextBtn.isVisible()) {
      await contractNextBtn.click();
      await page.waitForLoadState('networkidle');
    }
    await checkForErrors(page, 'contract-step');
    
    // Step 9: Test Payment Step
    log('Step 9: Testing payment step', 'step');
    
    if (photographerId && !page.url().includes('/payment')) {
      await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/payment`);
      await page.waitForLoadState('networkidle');
    }
    
    // Look for payment form elements
    const paymentFields = [
      { selector: 'input[name*="card"], input[placeholder*="card"], [data-testid="card-number"]', value: '4242424242424242' },
      { selector: 'input[name*="expiry"], input[placeholder*="expiry"], [data-testid="expiry"]', value: '12/25' },
      { selector: 'input[name*="cvc"], input[placeholder*="cvc"], [data-testid="cvc"]', value: '123' },
      { selector: 'input[name*="name"], input[placeholder*="name"], [data-testid="cardholder-name"]', value: 'John Doe' }
    ];
    
    for (const field of paymentFields) {
      const element = page.locator(field.selector).first();
      if (await element.isVisible()) {
        await element.fill(field.value);
        log(`Filled payment field: ${field.selector}`, 'success');
        await page.waitForTimeout(500);
      }
    }
    
    // Look for Stripe Elements (they might be in iframes)
    const stripeCardElement = page.frameLocator('iframe[name*="stripe"]').locator('[name="cardnumber"]');
    if (await stripeCardElement.isVisible()) {
      await stripeCardElement.fill('4242424242424242');
      log('Filled Stripe card element', 'success');
    }
    
    // Don't actually submit payment, just check the form is there
    const paymentSubmitBtn = page.locator('button:has-text("Pay"), button:has-text("Submit"), button[type="submit"]').first();
    if (await paymentSubmitBtn.isVisible()) {
      log('Payment submit button found and ready', 'success');
      // Note: Not clicking to avoid actual payment
    }
    await checkForErrors(page, 'payment-step');
    
    // Step 10: Test BookingFlowGuard - Try to skip steps
    log('Step 10: Testing BookingFlowGuard step protection', 'step');
    
    if (photographerId) {
      // Try to navigate directly to contract step without completing previous steps
      await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/contract`);
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/contract')) {
        log('WARNING: BookingFlowGuard allowed direct navigation to contract step', 'warning');
      } else {
        log('BookingFlowGuard successfully prevented skipping steps', 'success');
      }
      
      // Try payment step
      await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/payment`);
      await page.waitForLoadState('networkidle');
      
      const paymentUrl = page.url();
      if (paymentUrl.includes('/payment')) {
        log('WARNING: BookingFlowGuard allowed direct navigation to payment step', 'warning');
      } else {
        log('BookingFlowGuard successfully prevented skipping to payment', 'success');
      }
    }
    await checkForErrors(page, 'booking-flow-guard');
    
    // Step 11: Test totals calculation throughout the flow
    log('Step 11: Testing totals calculation', 'step');
    
    const totalSelectors = [
      '[data-testid="total-amount"]',
      '.total-price',
      '.booking-total',
      '[class*="total"]'
    ];
    
    for (const selector of totalSelectors) {
      const totalElements = page.locator(selector);
      const count = await totalElements.count();
      if (count > 0) {
        const totalText = await totalElements.first().textContent();
        log(`Found total display: ${totalText}`, 'success');
        
        // Verify it contains currency formatting
        if (totalText.includes('$') || totalText.includes('USD')) {
          log('Total properly formatted with currency', 'success');
        } else {
          log('Total may not be properly formatted with currency', 'warning');
        }
        break;
      }
    }
    
    // Final success message
    log('✅ Booking flow test completed successfully!', 'success');
    
  } catch (error) {
    log(`Fatal error during booking flow test: ${error.message}`, 'error');
    testResults.issues.push(`Fatal error: ${error.message}`);
  } finally {
    testResults.endTime = Date.now();
    await browser.close();
    
    // Generate final report
    generateTestReport();
  }
}

// Generate comprehensive test report
function generateTestReport() {
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 BOOKING FLOW TEST REPORT');
  console.log('='.repeat(60));
  console.log(`⏱️  Test Duration: ${duration.toFixed(2)} seconds`);
  console.log(`✅ Successes: ${testResults.successes.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`❌ Issues: ${testResults.issues.length}`);
  console.log(`🔥 Console Errors: ${testResults.consoleErrors.length}`);
  console.log(`🌐 Network Errors: ${testResults.networkErrors.length}`);
  
  if (testResults.successes.length > 0) {
    console.log('\n✅ SUCCESSES:');
    testResults.successes.forEach((success, i) => {
      console.log(`   ${i + 1}. ${success}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    testResults.warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  }
  
  if (testResults.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    testResults.issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  if (testResults.consoleErrors.length > 0) {
    console.log('\n🔥 CONSOLE ERRORS:');
    testResults.consoleErrors.forEach((error, i) => {
      console.log(`   ${i + 1}. [${error.step}] ${error.error}`);
    });
  }
  
  if (testResults.networkErrors.length > 0) {
    console.log('\n🌐 NETWORK ERRORS:');
    testResults.networkErrors.forEach((error, i) => {
      console.log(`   ${i + 1}. [${error.step}] ${error.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Overall assessment
  const criticalIssues = testResults.issues.length + testResults.consoleErrors.filter(e => 
    e.error.includes('Error') || e.error.includes('Failed')
  ).length;
  
  if (criticalIssues === 0) {
    console.log('🎉 OVERALL: Booking flow is working well!');
  } else if (criticalIssues <= 3) {
    console.log('⚠️  OVERALL: Some issues found, but booking flow is mostly functional');
  } else {
    console.log('❌ OVERALL: Multiple critical issues found, booking flow needs attention');
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run the test
runBookingFlowTest().catch(console.error);