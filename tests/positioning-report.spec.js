import { test, expect } from '@playwright/test';

test.describe('Comprehensive Dropdown Positioning Report', () => {

  test('should generate complete positioning analysis report', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    const results = {
      pageTop: {},
      afterScroll: {},
      pageBottom: {},
      issues: [],
      recommendations: []
    };

    console.log('\n=== DROPDOWN POSITIONING ANALYSIS REPORT ===\n');

    // === PAGE TOP ANALYSIS ===
    console.log('1. PAGE TOP ANALYSIS');
    console.log('--------------------');

    const bookNowButton = page.locator('text="Book Now"').first();
    const buttonBox = await bookNowButton.boundingBox();

    console.log(`Button position: x=${buttonBox.x}, y=${buttonBox.y}, w=${buttonBox.width}, h=${buttonBox.height}`);

    await bookNowButton.hover();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: 'tests/screenshots/report-01-page-top.png',
      fullPage: true
    });

    const dropdown = page.locator('div[class*="z-\\[9999\\]"]:has-text("Find Photographers")');
    const dropdownBox = await dropdown.boundingBox();

    console.log(`Dropdown position: x=${dropdownBox.x}, y=${dropdownBox.y}, w=${dropdownBox.width}, h=${dropdownBox.height}`);

    const expectedTop = buttonBox.y + buttonBox.height + 8;
    const topDifference = dropdownBox.y - expectedTop;

    console.log(`Expected dropdown top: ${expectedTop}`);
    console.log(`Actual dropdown top: ${dropdownBox.y}`);
    console.log(`Difference: ${topDifference}px`);

    results.pageTop = {
      buttonPosition: buttonBox,
      dropdownPosition: dropdownBox,
      expectedTop,
      actualTop: dropdownBox.y,
      difference: topDifference,
      isCorrect: Math.abs(topDifference) <= 20
    };

    if (!results.pageTop.isCorrect) {
      results.issues.push('Dropdown positioned incorrectly at page top (0,0 instead of below button)');
    }

    // === SCROLL POSITION ANALYSIS ===
    console.log('\n2. AFTER SCROLL ANALYSIS');
    console.log('-------------------------');

    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);

    // Move mouse away to hide dropdown, then hover again
    await page.mouse.move(100, 100);
    await page.waitForTimeout(200);

    const buttonBoxAfterScroll = await bookNowButton.boundingBox();
    console.log(`Button position after scroll: x=${buttonBoxAfterScroll.x}, y=${buttonBoxAfterScroll.y}`);

    await bookNowButton.hover();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: 'tests/screenshots/report-02-after-scroll.png',
      fullPage: true
    });

    const dropdownBoxAfterScroll = await dropdown.boundingBox();
    console.log(`Dropdown position after scroll: x=${dropdownBoxAfterScroll.x}, y=${dropdownBoxAfterScroll.y}`);

    const expectedTopAfterScroll = buttonBoxAfterScroll.y + buttonBoxAfterScroll.height + 8;
    const topDifferenceAfterScroll = dropdownBoxAfterScroll.y - expectedTopAfterScroll;

    console.log(`Expected dropdown top after scroll: ${expectedTopAfterScroll}`);
    console.log(`Actual dropdown top after scroll: ${dropdownBoxAfterScroll.y}`);
    console.log(`Difference after scroll: ${topDifferenceAfterScroll}px`);

    results.afterScroll = {
      buttonPosition: buttonBoxAfterScroll,
      dropdownPosition: dropdownBoxAfterScroll,
      expectedTop: expectedTopAfterScroll,
      actualTop: dropdownBoxAfterScroll.y,
      difference: topDifferenceAfterScroll,
      isCorrect: Math.abs(topDifferenceAfterScroll) <= 20
    };

    if (!results.afterScroll.isCorrect) {
      results.issues.push('Dropdown positioning not updating correctly on scroll');
    }

    // === BOTTOM OF PAGE ANALYSIS ===
    console.log('\n3. BOTTOM OF PAGE ANALYSIS');
    console.log('---------------------------');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - window.innerHeight + 100));
    await page.waitForTimeout(500);

    await page.mouse.move(100, 100);
    await page.waitForTimeout(200);

    const buttonBoxAtBottom = await bookNowButton.boundingBox();
    console.log(`Button position at bottom: x=${buttonBoxAtBottom.x}, y=${buttonBoxAtBottom.y}`);

    await bookNowButton.hover();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: 'tests/screenshots/report-03-page-bottom.png',
      fullPage: true
    });

    const dropdownBoxAtBottom = await dropdown.boundingBox();
    console.log(`Dropdown position at bottom: x=${dropdownBoxAtBottom.x}, y=${dropdownBoxAtBottom.y}`);

    const viewportHeight = page.viewportSize().height;
    const wouldOverflow = (buttonBoxAtBottom.y + buttonBoxAtBottom.height + 8 + dropdownBoxAtBottom.height) > viewportHeight;
    const shouldFlip = wouldOverflow;
    const isFlipped = dropdownBoxAtBottom.y < buttonBoxAtBottom.y;

    console.log(`Viewport height: ${viewportHeight}`);
    console.log(`Would overflow: ${wouldOverflow}`);
    console.log(`Should flip: ${shouldFlip}`);
    console.log(`Is flipped: ${isFlipped}`);

    results.pageBottom = {
      buttonPosition: buttonBoxAtBottom,
      dropdownPosition: dropdownBoxAtBottom,
      viewportHeight,
      wouldOverflow,
      shouldFlip,
      isFlipped,
      isCorrect: dropdownBoxAtBottom.x >= 0 && dropdownBoxAtBottom.y >= 0
    };

    // === TIMING ANALYSIS ===
    console.log('\n4. HOVER TIMING ANALYSIS');
    console.log('-------------------------');

    await page.mouse.move(100, 100);
    await page.waitForTimeout(200);

    const startTime = Date.now();
    await bookNowButton.hover();
    await dropdown.waitFor({ state: 'visible' });
    const hoverTime = Date.now() - startTime;

    console.log(`Dropdown appearance time: ${hoverTime}ms`);

    const timingAcceptable = hoverTime < 500;
    if (!timingAcceptable) {
      results.issues.push(`Slow dropdown appearance: ${hoverTime}ms (should be < 500ms)`);
    }

    // === FUNCTIONALITY ANALYSIS ===
    console.log('\n5. FUNCTIONALITY ANALYSIS');
    console.log('--------------------------');

    // Test dropdown content accessibility
    const findPhotographersLink = dropdown.locator('text="Find Photographers"');
    const howItWorksLink = dropdown.locator('text="How It Works"');
    const pricingLink = dropdown.locator('text="Pricing"');

    const contentAccessible = await findPhotographersLink.isVisible() &&
                             await howItWorksLink.isVisible() &&
                             await pricingLink.isVisible();

    console.log(`Dropdown content accessible: ${contentAccessible}`);

    if (!contentAccessible) {
      results.issues.push('Dropdown content not fully accessible');
    }

    // === FINAL ASSESSMENT ===
    console.log('\n=== ASSESSMENT SUMMARY ===');
    console.log(`Issues found: ${results.issues.length}`);
    results.issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });

    // Generate recommendations
    if (results.pageTop.difference !== 0 || results.afterScroll.difference !== 0) {
      results.recommendations.push('Fix calculatePosition() function - positioning calculation returns (0,0)');
    }

    if (!results.pageBottom.isFlipped && results.pageBottom.shouldFlip) {
      results.recommendations.push('Implement smart positioning to flip dropdown above button when near viewport bottom');
    }

    if (hoverTime > 300) {
      results.recommendations.push('Optimize hover timing for faster dropdown appearance');
    }

    console.log('\n=== RECOMMENDATIONS ===');
    results.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

    // Final status
    const overallStatus = results.issues.length === 0 ? 'PASS' : 'FAIL';
    console.log(`\nOVERALL STATUS: ${overallStatus}`);
    console.log('=================================\n');

    // Export results for analysis
    await page.evaluate((data) => {
      window.testResults = data;
    }, results);

  });

});