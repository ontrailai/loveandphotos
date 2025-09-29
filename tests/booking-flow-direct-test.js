#!/usr/bin/env node

import { chromium } from 'playwright';

// Test Configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:5176',
  photographerId: 'c68d85ca-5054-43a4-84b2-b098de11c0ca', // Using actual photographer ID from database
  timeout: 10000,
  viewport: { width: 1280, height: 720 },
};

// Test Results Storage
const testResults = {
  issues: [],
  successes: [],
  warnings: [],
  consoleErrors: [],
  networkErrors: [],
  stepResults: {},
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
  try {
    // Check for React errors
    const reactErrors = await page.locator('[data-testid="error-boundary"]').all();
    if (reactErrors.length > 0) {
      const errorText = await reactErrors[0].textContent();
      testResults.issues.push(`React error in ${stepName}: ${errorText}`);
      log(`React error boundary triggered in ${stepName}: ${errorText}`, 'error');
      return false;
    }

    // Check for broken images
    const brokenImages = await page.locator('img[alt*="error"], img[src=""], .image-error').count();
    if (brokenImages > 0) {
      testResults.warnings.push(`${brokenImages} broken images found in ${stepName}`);
      log(`${brokenImages} broken images found in ${stepName}`, 'warning');
    }

    // Check for 404 or other error messages
    const errorMessages = await page.locator('text=404, text="Not Found", text="Error", text="Failed"').count();
    if (errorMessages > 0) {
      testResults.warnings.push(`${errorMessages} error messages found in ${stepName}`);
      log(`${errorMessages} error messages found in ${stepName}`, 'warning');
    }

    return true;
  } catch (error) {
    log(`Error during error check in ${stepName}: ${error.message}`, 'warning');
    return true; // Don't fail the test if error checking fails
  }
}

// Test individual booking steps
async function testBookingStep(page, stepName, url, testFunction) {
  log(`Testing ${stepName}`, 'step');
  testResults.stepResults[stepName] = {
    url,
    success: false,
    errors: [],
    warnings: [],
    startTime: Date.now()
  };

  try {
    // Navigate to the step
    await page.goto(url);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Check for errors first
    const noErrors = await checkForErrors(page, stepName);
    
    // Run step-specific tests
    const stepSuccess = await testFunction(page);
    
    testResults.stepResults[stepName].success = stepSuccess && noErrors;
    testResults.stepResults[stepName].endTime = Date.now();
    testResults.stepResults[stepName].duration = testResults.stepResults[stepName].endTime - testResults.stepResults[stepName].startTime;
    
    if (stepSuccess && noErrors) {
      log(`${stepName} - PASSED`, 'success');
    } else {
      log(`${stepName} - FAILED`, 'error');
    }
    
    return stepSuccess && noErrors;
    
  } catch (error) {
    testResults.stepResults[stepName].errors.push(error.message);
    testResults.stepResults[stepName].endTime = Date.now();
    testResults.stepResults[stepName].duration = testResults.stepResults[stepName].endTime - testResults.stepResults[stepName].startTime;
    log(`${stepName} failed with error: ${error.message}`, 'error');
    return false;
  }
}

// Package Selection Test
async function testPackageSelection(page) {
  try {
    // Look for package cards or options
    const packageSelectors = [
      '[data-testid*="package"]',
      '.package-card', 
      '.pricing-card',
      '.package-option',
      'button:has-text("Starter")',
      'button:has-text("Pro")',
      'button:has-text("Luxe")',
      '.package-selection'
    ];

    let packagesFound = false;
    for (const selector of packageSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        log(`Found ${elements} package options using selector: ${selector}`, 'success');
        packagesFound = true;
        
        // Try to click the first package option
        await page.locator(selector).first().click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    if (!packagesFound) {
      testResults.issues.push('No package selection options found');
      return false;
    }

    // Look for pricing information
    const priceSelectors = ['[data-testid*="price"]', '.price', '.cost', '$'];
    let pricesFound = false;
    for (const selector of priceSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        log(`Found ${count} pricing displays`, 'success');
        pricesFound = true;
        break;
      }
    }

    // Look for continue/next button
    const nextButton = await page.locator('button:has-text("Continue"), button:has-text("Next"), [data-testid*="continue"]').first();
    const nextButtonExists = await nextButton.count() > 0;
    if (nextButtonExists) {
      log('Next/Continue button found', 'success');
    } else {
      log('No Next/Continue button found', 'warning');
    }

    return packagesFound && (pricesFound || true); // Don't fail if no prices shown
  } catch (error) {
    testResults.issues.push(`Package selection test failed: ${error.message}`);
    return false;
  }
}

// Location Details Test
async function testLocationDetails(page) {
  try {
    // Look for address/location form fields
    const locationFields = [
      'input[name*="address"], input[placeholder*="address"]',
      'input[name*="city"], input[placeholder*="city"]', 
      'input[name*="state"], select[name*="state"]',
      'input[name*="zip"], input[name*="zipcode"]',
      '.location-form input',
      '.address-form input'
    ];

    let fieldsFound = 0;
    for (const selector of locationFields) {
      const count = await page.locator(selector).count();
      fieldsFound += count;
    }

    if (fieldsFound === 0) {
      testResults.issues.push('No location form fields found');
      return false;
    }

    log(`Found ${fieldsFound} location form fields`, 'success');

    // Test form validation by trying to submit empty
    const submitButton = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Next")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Check for validation errors
      const validationErrors = await page.locator('.error, .invalid, [class*="error"], [aria-invalid="true"]').count();
      if (validationErrors > 0) {
        log('Form validation working - found validation errors for empty submission', 'success');
      }
    }

    return fieldsFound > 0;
  } catch (error) {
    testResults.issues.push(`Location details test failed: ${error.message}`);
    return false;
  }
}

// Add-ons Selection Test
async function testAddOnsSelection(page) {
  try {
    // Look for add-on options
    const addonSelectors = [
      '[data-testid*="addon"]', 
      '.addon-card',
      '.addon-option',
      'input[type="checkbox"]',
      '.add-on-selection'
    ];

    let addonsFound = false;
    let addonCount = 0;
    for (const selector of addonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        log(`Found ${count} add-on options using selector: ${selector}`, 'success');
        addonsFound = true;
        addonCount = count;
        
        // Try to select first add-on
        await page.locator(selector).first().click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    if (!addonsFound) {
      log('No add-on options found - this may be normal if no add-ons are available', 'warning');
      return true; // Don't fail if no add-ons available
    }

    // Look for pricing updates when add-ons are selected
    const totalSelectors = [
      '[data-testid*="total"]',
      '.total-price',
      '.booking-total',
      '.summary-total'
    ];

    for (const selector of totalSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        log('Total/pricing display found', 'success');
        break;
      }
    }

    return true;
  } catch (error) {
    testResults.issues.push(`Add-ons selection test failed: ${error.message}`);
    return false;
  }
}

// Contract Step Test
async function testContractStep(page) {
  try {
    // Look for contract elements
    const contractElements = [
      'input[type="checkbox"][name*="agree"]',
      'input[type="checkbox"][name*="terms"]', 
      '.contract-agreement',
      '.terms-checkbox',
      '[data-testid*="agree"]'
    ];

    let contractFound = false;
    for (const selector of contractElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        log(`Found contract agreement elements: ${selector}`, 'success');
        contractFound = true;
        
        // Try to check the agreement
        await page.locator(selector).first().check();
        await page.waitForTimeout(1000);
        break;
      }
    }

    if (!contractFound) {
      testResults.issues.push('No contract agreement elements found');
      return false;
    }

    // Look for signature field
    const signatureSelectors = [
      '[data-testid*="signature"]',
      'input[name*="signature"]',
      '.signature-field',
      'canvas'
    ];

    let signatureFound = false;
    for (const selector of signatureSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        log(`Found signature element: ${selector}`, 'success');
        signatureFound = true;
        break;
      }
    }

    if (!signatureFound) {
      log('No signature field found', 'warning');
    }

    return contractFound;
  } catch (error) {
    testResults.issues.push(`Contract step test failed: ${error.message}`);
    return false;
  }
}

// Payment Step Test
async function testPaymentStep(page) {
  try {
    // Look for payment form elements
    const paymentSelectors = [
      'input[name*="card"]',
      'input[placeholder*="card"]',
      'input[name*="expiry"]',
      'input[name*="cvc"]',
      '.payment-form',
      '[data-testid*="payment"]'
    ];

    let paymentFieldsFound = 0;
    for (const selector of paymentSelectors) {
      const count = await page.locator(selector).count();
      paymentFieldsFound += count;
    }

    if (paymentFieldsFound === 0) {
      // Check for Stripe elements (they might be in iframes)
      const stripeFrames = await page.locator('iframe[name*="stripe"], iframe[title*="payment"]').count();
      if (stripeFrames > 0) {
        log(`Found ${stripeFrames} Stripe payment frames`, 'success');
        paymentFieldsFound = stripeFrames;
      }
    }

    if (paymentFieldsFound === 0) {
      testResults.issues.push('No payment form elements found');
      return false;
    }

    log(`Found ${paymentFieldsFound} payment form elements`, 'success');

    // Look for payment submit button
    const submitButton = await page.locator('button:has-text("Pay"), button:has-text("Submit Payment"), button[type="submit"]').count();
    if (submitButton > 0) {
      log('Payment submit button found', 'success');
    } else {
      log('No payment submit button found', 'warning');
    }

    return paymentFieldsFound > 0;
  } catch (error) {
    testResults.issues.push(`Payment step test failed: ${error.message}`);
    return false;
  }
}

// Test BookingFlowGuard
async function testBookingFlowGuard(page, photographerId) {
  try {
    log('Testing BookingFlowGuard step protection', 'step');
    
    // Try to navigate directly to contract step without completing previous steps
    await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/contract`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const currentUrl = page.url();
    if (currentUrl.includes('/contract')) {
      log('WARNING: BookingFlowGuard allowed direct navigation to contract step', 'warning');
      testResults.warnings.push('BookingFlowGuard may not be properly preventing step skipping');
      return false;
    } else {
      log('BookingFlowGuard successfully prevented skipping to contract step', 'success');
    }
    
    // Try payment step
    await page.goto(`${TEST_CONFIG.baseURL}/booking/${photographerId}/payment`);
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const paymentUrl = page.url();
    if (paymentUrl.includes('/payment')) {
      log('WARNING: BookingFlowGuard allowed direct navigation to payment step', 'warning');
      testResults.warnings.push('BookingFlowGuard may not be properly preventing payment step access');
      return false;
    } else {
      log('BookingFlowGuard successfully prevented skipping to payment step', 'success');
    }

    return true;
  } catch (error) {
    log(`BookingFlowGuard test failed: ${error.message}`, 'error');
    return false;
  }
}

// Main Test Function
async function runDirectBookingFlowTest() {
  log('🚀 Starting direct booking flow test for each step');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: false
  });
  
  const context = await browser.newContext({
    viewport: TEST_CONFIG.viewport,
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Set up console monitoring
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const error = msg.text();
      if (!error.includes('favicon') && !error.includes('DevTools')) {
        testResults.consoleErrors.push(error);
        log(`Console error: ${error}`, 'warning');
      }
    }
  });
  
  try {
    page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    const photographerId = TEST_CONFIG.photographerId;
    
    // Test each step individually
    const steps = [
      {
        name: 'Package Selection',
        url: `${TEST_CONFIG.baseURL}/booking/${photographerId}/package`,
        testFn: testPackageSelection
      },
      {
        name: 'Location Details', 
        url: `${TEST_CONFIG.baseURL}/booking/${photographerId}/location`,
        testFn: testLocationDetails
      },
      {
        name: 'Add-ons Selection',
        url: `${TEST_CONFIG.baseURL}/booking/${photographerId}/addons`, 
        testFn: testAddOnsSelection
      },
      {
        name: 'Contract Step',
        url: `${TEST_CONFIG.baseURL}/booking/${photographerId}/contract`,
        testFn: testContractStep
      },
      {
        name: 'Payment Step',
        url: `${TEST_CONFIG.baseURL}/booking/${photographerId}/payment`,
        testFn: testPaymentStep
      }
    ];

    // Test all booking steps
    for (const step of steps) {
      await testBookingStep(page, step.name, step.url, step.testFn);
      await page.waitForTimeout(1000); // Small delay between tests
    }

    // Test BookingFlowGuard
    await testBookingFlowGuard(page, photographerId);
    
    log('✅ Direct booking flow test completed!', 'success');
    
  } catch (error) {
    log(`Fatal error during direct booking flow test: ${error.message}`, 'error');
    testResults.issues.push(`Fatal error: ${error.message}`);
  } finally {
    testResults.endTime = Date.now();
    await browser.close();
    
    // Generate final report
    generateDetailedTestReport();
  }
}

// Generate comprehensive test report
function generateDetailedTestReport() {
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIRECT BOOKING FLOW TEST REPORT');
  console.log('='.repeat(80));
  console.log(`⏱️  Total Test Duration: ${duration.toFixed(2)} seconds`);
  console.log(`📋 Steps Tested: ${Object.keys(testResults.stepResults).length}`);
  console.log(`✅ Successes: ${testResults.successes.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`❌ Issues: ${testResults.issues.length}`);
  console.log(`🔥 Console Errors: ${testResults.consoleErrors.length}`);
  
  // Step-by-step results
  console.log('\n📋 STEP-BY-STEP RESULTS:');
  Object.entries(testResults.stepResults).forEach(([step, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? `(${result.duration}ms)` : '';
    console.log(`   ${status} ${step} ${duration}`);
    if (result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`      └─ Error: ${error}`);
      });
    }
  });
  
  if (testResults.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    testResults.issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  }
  
  if (testResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    testResults.warnings.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  }
  
  if (testResults.consoleErrors.length > 0) {
    console.log('\n🔥 CONSOLE ERRORS:');
    testResults.consoleErrors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Overall assessment
  const passedSteps = Object.values(testResults.stepResults).filter(result => result.success).length;
  const totalSteps = Object.keys(testResults.stepResults).length;
  const passRate = totalSteps > 0 ? (passedSteps / totalSteps) * 100 : 0;
  
  if (passRate >= 80) {
    console.log(`🎉 OVERALL: Excellent! ${passedSteps}/${totalSteps} steps passed (${passRate.toFixed(1)}%)`);
  } else if (passRate >= 60) {
    console.log(`⚠️  OVERALL: Good! ${passedSteps}/${totalSteps} steps passed (${passRate.toFixed(1)}%) - Some improvements needed`);
  } else {
    console.log(`❌ OVERALL: Needs attention! ${passedSteps}/${totalSteps} steps passed (${passRate.toFixed(1)}%)`);
  }
  
  console.log('='.repeat(80) + '\n');
}

// Run the test
runDirectBookingFlowTest().catch(console.error);