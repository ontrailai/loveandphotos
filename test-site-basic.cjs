#!/usr/bin/env node

/**
 * Basic Site Test Script
 * Tests that the site loads and doesn't have obvious errors
 */

const https = require('https');
const http = require('http');

const SITE_URL = 'https://love-and-photos.onrender.com';

async function testSiteBasics() {
  console.log('🚀 Starting basic site validation...');
  
  const results = {
    homepage: { passed: false, errors: [], loadTime: 0 },
    photographersPage: { passed: false, errors: [], loadTime: 0 },
    jsAssets: { passed: false, errors: [], assetsFound: 0 }
  };

  // Test 1: Homepage
  console.log('\n📱 Testing Homepage...');
  try {
    const startTime = Date.now();
    const homePageContent = await fetchPage(`${SITE_URL}/`);
    const loadTime = Date.now() - startTime;
    results.homepage.loadTime = loadTime;

    if (homePageContent.includes('Love & Photos') && 
        homePageContent.includes('Featured Photographers')) {
      results.homepage.passed = true;
      console.log(`✅ Homepage loads successfully (${loadTime}ms)`);
    } else {
      results.homepage.errors.push('Homepage missing expected content');
      console.log('❌ Homepage missing expected content');
    }

    // Check for correct JS assets
    const jsMatches = homePageContent.match(/\/assets\/index-[a-zA-Z0-9]+\.js/g);
    if (jsMatches && jsMatches.length > 0) {
      console.log(`✅ Found ${jsMatches.length} JS assets: ${jsMatches[0]}`);
      results.jsAssets.assetsFound = jsMatches.length;
      
      // Verify the main JS asset can be loaded
      try {
        const jsContent = await fetchPage(`${SITE_URL}${jsMatches[0]}`);
        if (jsContent.length > 1000) { // Basic sanity check
          results.jsAssets.passed = true;
          console.log('✅ Main JS asset loads successfully');
        } else {
          results.jsAssets.errors.push('JS asset too small or empty');
        }
      } catch (e) {
        results.jsAssets.errors.push(`Failed to load JS asset: ${e.message}`);
      }
    } else {
      results.jsAssets.errors.push('No JS assets found in HTML');
    }

  } catch (error) {
    results.homepage.errors.push(error.message);
    console.log(`❌ Homepage failed: ${error.message}`);
  }

  // Test 2: Photographers Page
  console.log('\n🔍 Testing /photographers page...');
  try {
    const startTime = Date.now();
    const photographersContent = await fetchPage(`${SITE_URL}/photographers`);
    const loadTime = Date.now() - startTime;
    results.photographersPage.loadTime = loadTime;

    if (photographersContent.includes('Love & Photos')) {
      results.photographersPage.passed = true;
      console.log(`✅ Photographers page loads successfully (${loadTime}ms)`);
      
      // Check if it's the same SPA content (which is expected)
      if (photographersContent === homePageContent) {
        console.log('ℹ️  Photographers page serves same SPA content (normal for React apps)');
      }
    } else {
      results.photographersPage.errors.push('Photographers page missing expected content');
      console.log('❌ Photographers page missing expected content');
    }

  } catch (error) {
    results.photographersPage.errors.push(error.message);
    console.log(`❌ Photographers page failed: ${error.message}`);
  }

  // Generate report
  console.log('\n📋 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  const allTests = Object.entries(results);
  const passedTests = allTests.filter(([name, result]) => result.passed);
  
  allTests.forEach(([testName, result]) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName.toUpperCase()}`);
    
    if (result.loadTime) {
      console.log(`    Load Time: ${result.loadTime}ms`);
    }
    if (result.assetsFound) {
      console.log(`    Assets Found: ${result.assetsFound}`);
    }
    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(error => {
        console.log(`    ❌ ${error}`);
      });
    }
  });

  console.log(`\n🎯 OVERALL: ${passedTests.length}/${allTests.length} tests passed`);

  // Manual test instructions
  console.log('\n🧪 MANUAL TESTING INSTRUCTIONS:');
  console.log('===============================');
  console.log('1. Open: https://love-and-photos.onrender.com');
  console.log('2. Check: Featured Photographers section shows 3 photographers (not loading skeletons)');
  console.log('3. Navigate to /photographers page');
  console.log('4. Verify: No 400 errors in browser console');
  console.log('5. Check: Photographers are displayed (not just "Loading...")');
  console.log('6. Look for: Console logs showing successful database queries');

  return {
    success: passedTests.length === allTests.length,
    results
  };
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
if (require.main === module) {
  testSiteBasics()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testSiteBasics };