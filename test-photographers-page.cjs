#!/usr/bin/env node

/**
 * Puppeteer Test Script for /photographers Page
 * Tests database connectivity, UI rendering, and user interactions
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://love-and-photos.onrender.com';
const SCREENSHOTS_DIR = './test-screenshots';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function testPhotographersPage() {
  console.log('🚀 Starting comprehensive photographers page test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for CI
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error(`❌ Browser Error: ${text}`);
    } else if (text.includes('Failed to load resource') || text.includes('400')) {
      console.error(`❌ Network Error: ${text}`);
    } else if (text.includes('photographers')) {
      console.log(`ℹ️  Browser Log: ${text}`);
    }
  });

  // Track network failures
  page.on('requestfailed', request => {
    console.error(`❌ Request Failed: ${request.url()} - ${request.failure().errorText}`);
  });

  const results = {
    homepage: { passed: false, errors: [] },
    browsePage: { passed: false, errors: [], photographerCount: 0 },
    featuredPhotographers: { passed: false, errors: [], count: 0 },
    databaseQueries: { passed: false, errors: [] },
    imageLoading: { passed: false, errors: [] },
    userInteractions: { passed: false, errors: [] }
  };

  try {
    console.log('\n📱 Testing Homepage and Featured Photographers...');
    
    // Test 1: Homepage and Featured Photographers
    await page.goto(`${SITE_URL}`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Wait for featured photographers to load
    await page.waitForTimeout(5000);
    
    // Take homepage screenshot
    await page.screenshot({ 
      path: `${SCREENSHOTS_DIR}/01-homepage.png`,
      fullPage: true
    });

    // Check for featured photographers (should be 3)
    const featuredPhotographers = await page.$$eval('[data-testid="featured-photographer"], .featured-photographer, [class*="featured"] [class*="card"]', 
      elements => elements.length
    );

    if (featuredPhotographers >= 3) {
      results.featuredPhotographers.passed = true;
      results.featuredPhotographers.count = featuredPhotographers;
      console.log(`✅ Found ${featuredPhotographers} featured photographers`);
    } else {
      results.featuredPhotographers.errors.push(`Only found ${featuredPhotographers} featured photographers, expected 3`);
      console.log(`⚠️  Only found ${featuredPhotographers} featured photographers`);
    }

    results.homepage.passed = true;

    console.log('\n🔍 Testing /photographers page navigation...');
    
    // Test 2: Navigate to photographers page
    const photographersLinks = await page.$$('a[href="/photographers"], a[href*="photographers"]');
    if (photographersLinks.length > 0) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
        photographersLinks[0].click()
      ]);
      console.log('✅ Successfully navigated to photographers page');
    } else {
      // Direct navigation fallback
      await page.goto(`${SITE_URL}/photographers`, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log('✅ Direct navigation to photographers page');
    }

    // Wait for page to load and data to be fetched
    console.log('⏳ Waiting for photographer data to load...');
    await page.waitForTimeout(10000); // Give time for data fetching

    // Take photographers page screenshot
    await page.screenshot({ 
      path: `${SCREENSHOTS_DIR}/02-photographers-loading.png`,
      fullPage: true
    });

    console.log('\n🧪 Testing database queries and data loading...');

    // Test 3: Check for database query errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('400')) {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for any additional loading
    await page.waitForTimeout(5000);

    if (consoleErrors.length === 0) {
      results.databaseQueries.passed = true;
      console.log('✅ No 400 database errors detected');
    } else {
      results.databaseQueries.errors = consoleErrors;
      console.log(`❌ Found ${consoleErrors.length} database errors`);
    }

    console.log('\n👥 Counting photographers displayed...');

    // Test 4: Count actual photographer cards displayed
    const photographerSelectors = [
      '[data-testid="photographer-card"]',
      '.photographer-card', 
      '[class*="photographer"]',
      '[class*="card"]',
      '.grid > div',
      '.grid-cols-3 > div',
      '[class*="grid"] > [class*="card"]'
    ];

    let photographerCount = 0;
    for (const selector of photographerSelectors) {
      try {
        const count = await page.$$eval(selector, elements => 
          elements.filter(el => {
            // Filter out skeleton loaders and empty cards
            const text = el.textContent || '';
            const hasImage = el.querySelector('img') !== null;
            const isNotSkeleton = !el.classList.contains('animate-pulse') && 
                                !el.classList.contains('skeleton');
            return text.length > 10 && hasImage && isNotSkeleton;
          }).length
        );
        
        if (count > photographerCount) {
          photographerCount = count;
          console.log(`📊 Found ${count} photographers using selector: ${selector}`);
        }
      } catch (e) {
        // Selector didn't match, continue
      }
    }

    // Check for loading states
    const hasLoadingSkeletons = await page.$('.animate-pulse') !== null;
    const hasLoadingText = await page.evaluate(() => 
      document.body.textContent.includes('Loading...')
    );

    if (hasLoadingSkeletons || hasLoadingText) {
      console.log('⚠️  Page still showing loading state');
      results.browsePage.errors.push('Page stuck in loading state');
    }

    // Take final screenshot
    await page.screenshot({ 
      path: `${SCREENSHOTS_DIR}/03-photographers-final.png`,
      fullPage: true
    });

    if (photographerCount >= 50) {
      results.browsePage.passed = true;
      results.browsePage.photographerCount = photographerCount;
      console.log(`✅ Found ${photographerCount} photographers displayed`);
    } else {
      results.browsePage.errors.push(`Only ${photographerCount} photographers displayed, expected 50+`);
      console.log(`❌ Only ${photographerCount} photographers displayed`);
    }

    console.log('\n🖼️  Testing image loading...');

    // Test 5: Check image loading
    const images = await page.$$('img');
    let loadedImages = 0;
    let brokenImages = 0;

    for (const img of images) {
      const isLoaded = await img.evaluate(img => img.complete && img.naturalHeight !== 0);
      if (isLoaded) {
        loadedImages++;
      } else {
        brokenImages++;
      }
    }

    const imageLoadRate = loadedImages / (loadedImages + brokenImages);
    if (imageLoadRate >= 0.9) { // 90% success rate
      results.imageLoading.passed = true;
      console.log(`✅ ${loadedImages}/${loadedImages + brokenImages} images loaded successfully (${Math.round(imageLoadRate * 100)}%)`);
    } else {
      results.imageLoading.errors.push(`Poor image loading: ${loadedImages}/${loadedImages + brokenImages} (${Math.round(imageLoadRate * 100)}%)`);
      console.log(`❌ Poor image loading rate: ${Math.round(imageLoadRate * 100)}%`);
    }

    console.log('\n🖱️  Testing user interactions...');

    // Test 6: Test filters and interactions
    try {
      // Test filter button
      const filterButton = await page.$('button:contains("Filter"), [class*="filter"]');
      if (filterButton) {
        await filterButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Filter button works');
      }

      // Test load more button if present
      const loadMoreButton = await page.$('button:contains("Load More"), button:contains("More")');
      if (loadMoreButton) {
        await loadMoreButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Load More button works');
      }

      results.userInteractions.passed = true;
    } catch (e) {
      results.userInteractions.errors.push(e.message);
      console.log(`⚠️  Some interactions failed: ${e.message}`);
    }

    // Final comprehensive screenshot
    await page.screenshot({ 
      path: `${SCREENSHOTS_DIR}/04-final-state.png`,
      fullPage: true
    });

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    await page.screenshot({ 
      path: `${SCREENSHOTS_DIR}/error-state.png`,
      fullPage: true 
    });
  } finally {
    await browser.close();
  }

  // Generate test report
  console.log('\n📋 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  const allTests = Object.entries(results);
  const passedTests = allTests.filter(([name, result]) => result.passed);
  
  allTests.forEach(([testName, result]) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName.toUpperCase()}`);
    
    if (result.count !== undefined) {
      console.log(`    Count: ${result.count}`);
    }
    if (result.photographerCount !== undefined) {
      console.log(`    Photographers: ${result.photographerCount}`);
    }
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`    ❌ ${error}`);
      });
    }
  });

  console.log(`\n🎯 OVERALL: ${passedTests.length}/${allTests.length} tests passed`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}/`);

  // Return results for programmatic use
  return {
    success: passedTests.length === allTests.length,
    results,
    screenshotsPath: SCREENSHOTS_DIR
  };
}

// Run the test
if (require.main === module) {
  testPhotographersPage()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testPhotographersPage };