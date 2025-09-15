/**
 * Performance Tests for Photographer Grid
 *
 * Specialized tests for measuring loading performance, memory usage,
 * CLS metrics, and resource optimization for thumbnail rendering.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Performance thresholds based on Web Vitals
const PERFORMANCE_THRESHOLDS = {
  cls: 0.05,           // Cumulative Layout Shift
  lcp: 2500,           // Largest Contentful Paint (ms)
  fid: 100,            // First Input Delay (ms)
  imageLoad: 1500,     // Individual image load time (ms)
  memoryUsage: 52428800, // 50MB maximum
  totalLoadTime: 5000   // Total page load (ms)
};

const setupPerformanceMonitoring = async (page) => {
  await page.addInitScript(() => {
    // CLS monitoring
    let cls = 0;
    let sessionValue = 0;
    let sessionEntries = [];

    const clsObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }

          if (sessionValue > cls) {
            cls = sessionValue;
          }
        }
      }
    });

    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // LCP monitoring
    let lcp = 0;
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        lcp = entries[entries.length - 1].startTime;
      }
    });

    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // FID monitoring
    let fid = 0;
    const fidObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        fid = entry.processingStart - entry.startTime;
      }
    });

    fidObserver.observe({ type: 'first-input', buffered: true });

    // Image load monitoring
    window.imageLoadMetrics = [];
    window.resourceTimings = [];

    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);

      if (tagName.toLowerCase() === 'img') {
        const startTime = performance.now();

        element.addEventListener('load', function() {
          const loadTime = performance.now() - startTime;
          window.imageLoadMetrics.push({
            src: this.src,
            loadTime: loadTime,
            naturalWidth: this.naturalWidth,
            naturalHeight: this.naturalHeight,
            displayWidth: this.width,
            displayHeight: this.height,
            success: true
          });
        });

        element.addEventListener('error', function() {
          const loadTime = performance.now() - startTime;
          window.imageLoadMetrics.push({
            src: this.src,
            loadTime: loadTime,
            success: false,
            error: true
          });
        });
      }

      return element;
    };

    // Resource timing monitoring
    const resourceObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'img') {
          window.resourceTimings.push({
            name: entry.name,
            duration: entry.duration,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            decodedBodySize: entry.decodedBodySize
          });
        }
      }
    });

    resourceObserver.observe({ type: 'resource', buffered: true });

    // Expose metrics
    window.getPerformanceMetrics = () => ({
      cls: cls,
      lcp: lcp,
      fid: fid,
      imageMetrics: window.imageLoadMetrics || [],
      resourceTimings: window.resourceTimings || []
    });
  });
};

test.describe('Photographer Grid Performance', () => {

  test.beforeEach(async ({ page }) => {
    await setupPerformanceMonitoring(page);
  });

  test.describe('Core Web Vitals Measurement', () => {
    test('measures and validates CLS (Cumulative Layout Shift)', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      // Allow time for all layout shifts to settle
      await page.waitForTimeout(3000);

      const metrics = await page.evaluate(() => window.getPerformanceMetrics());

      console.log(`📊 CLS: ${metrics.cls.toFixed(4)}`);

      // CLS should be below the "good" threshold
      expect(metrics.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls);

      // Take screenshot if CLS is high
      if (metrics.cls > 0.03) {
        await page.screenshot({
          path: 'tests/screenshots/high-cls-debug.png',
          fullPage: true
        });
      }
    });

    test('measures and validates LCP (Largest Contentful Paint)', async ({ page }) => {
      const startTime = performance.now();

      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      const metrics = await page.evaluate(() => window.getPerformanceMetrics());
      const loadTime = performance.now() - startTime;

      console.log(`🖼️ LCP: ${metrics.lcp}ms, Total Load: ${loadTime.toFixed(0)}ms`);

      // LCP should be below the "good" threshold
      expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp);
      expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.totalLoadTime);
    });

    test('validates First Input Delay (FID) readiness', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      // Simulate user interaction
      const startTime = performance.now();
      await page.click('body'); // Generic click to measure responsiveness
      const interactionTime = performance.now() - startTime;

      const metrics = await page.evaluate(() => window.getPerformanceMetrics());

      console.log(`⚡ FID: ${metrics.fid}ms, Interaction: ${interactionTime.toFixed(0)}ms`);

      // Page should be interactive quickly
      expect(interactionTime).toBeLessThan(PERFORMANCE_THRESHOLDS.fid);
    });
  });

  test.describe('Image Loading Performance', () => {
    test('monitors individual image loading performance', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      // Wait for all images to finish loading
      await page.waitForTimeout(2000);

      const metrics = await page.evaluate(() => window.getPerformanceMetrics());
      const imageMetrics = metrics.imageMetrics;

      console.log(`📷 Images loaded: ${imageMetrics.length}`);

      expect(imageMetrics.length).toBeGreaterThan(0);

      // Analyze load times
      const successfulImages = imageMetrics.filter(img => img.success);
      const failedImages = imageMetrics.filter(img => img.error);

      console.log(`✅ Successful: ${successfulImages.length}, ❌ Failed: ${failedImages.length}`);

      // Most images should load successfully
      expect(successfulImages.length).toBeGreaterThan(failedImages.length);

      // Check load times for successful images
      for (const img of successfulImages) {
        expect(img.loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.imageLoad);
      }

      // Log slow images for debugging
      const slowImages = successfulImages.filter(img => img.loadTime > 1000);
      if (slowImages.length > 0) {
        console.log(`🐌 Slow images (>1s):`, slowImages.map(img => ({
          src: img.src.substring(0, 50) + '...',
          loadTime: Math.round(img.loadTime)
        })));
      }
    });

    test('validates image size optimization', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const metrics = await page.evaluate(() => window.getPerformanceMetrics());
      const resourceTimings = metrics.resourceTimings;

      console.log(`📦 Image resources: ${resourceTimings.length}`);

      if (resourceTimings.length > 0) {
        // Check transfer sizes
        const totalTransferSize = resourceTimings.reduce((sum, r) => sum + (r.transferSize || 0), 0);
        const averageSize = totalTransferSize / resourceTimings.length;

        console.log(`📏 Average image size: ${Math.round(averageSize / 1024)}KB`);

        // Images should be reasonably optimized
        expect(averageSize).toBeLessThan(500 * 1024); // 500KB average

        // Check for overly large images
        const largeImages = resourceTimings.filter(r => r.transferSize > 1024 * 1024); // >1MB
        expect(largeImages.length).toBeLessThan(resourceTimings.length * 0.1); // <10%

        if (largeImages.length > 0) {
          console.log(`🔍 Large images (>1MB):`, largeImages.map(img => ({
            url: img.name.substring(0, 50) + '...',
            size: Math.round(img.transferSize / 1024) + 'KB'
          })));
        }
      }
    });

    test('measures concurrent image loading efficiency', async ({ page }) => {
      const imageStartTimes = [];
      const imageEndTimes = [];

      // Track image load timing
      page.on('request', request => {
        if (request.url().match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
          imageStartTimes.push({
            url: request.url(),
            startTime: Date.now()
          });
        }
      });

      page.on('response', response => {
        if (response.url().match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
          imageEndTimes.push({
            url: response.url(),
            endTime: Date.now(),
            status: response.status()
          });
        }
      });

      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      // Calculate concurrent loading metrics
      const loadDurations = imageStartTimes.map(start => {
        const end = imageEndTimes.find(e => e.url === start.url);
        if (end) {
          return {
            url: start.url,
            duration: end.endTime - start.startTime,
            status: end.status
          };
        }
        return null;
      }).filter(Boolean);

      console.log(`⏱️ Concurrent loads: ${loadDurations.length}`);

      if (loadDurations.length > 1) {
        const avgDuration = loadDurations.reduce((sum, l) => sum + l.duration, 0) / loadDurations.length;
        console.log(`📊 Average load duration: ${Math.round(avgDuration)}ms`);

        // Images should load in parallel efficiently
        const maxDuration = Math.max(...loadDurations.map(l => l.duration));
        const minDuration = Math.min(...loadDurations.map(l => l.duration));

        // Variance shouldn't be too high (indicates good concurrent loading)
        const variance = maxDuration - minDuration;
        expect(variance).toBeLessThan(5000); // 5 second variance threshold
      }
    });
  });

  test.describe('Memory Usage and Resource Management', () => {
    test('monitors memory usage during grid rendering', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      // Measure memory after initial load
      const initialMemory = await page.evaluate(async () => {
        if ('measureUserAgentSpecificMemory' in performance) {
          try {
            const result = await performance.measureUserAgentSpecificMemory();
            return result.bytes || result.usedJSHeapSize || 0;
          } catch (e) {
            return performance.memory?.usedJSHeapSize || 0;
          }
        } else {
          return performance.memory?.usedJSHeapSize || 0;
        }
      });

      // Scroll to trigger more content loading
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      // Measure memory after scroll
      const afterScrollMemory = await page.evaluate(async () => {
        if ('measureUserAgentSpecificMemory' in performance) {
          try {
            const result = await performance.measureUserAgentSpecificMemory();
            return result.bytes || result.usedJSHeapSize || 0;
          } catch (e) {
            return performance.memory?.usedJSHeapSize || 0;
          }
        } else {
          return performance.memory?.usedJSHeapSize || 0;
        }
      });

      const memoryIncrease = afterScrollMemory - initialMemory;

      console.log(`💾 Initial: ${Math.round(initialMemory / 1024 / 1024)}MB`);
      console.log(`💾 After scroll: ${Math.round(afterScrollMemory / 1024 / 1024)}MB`);
      console.log(`💾 Increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

      // Memory usage should stay within reasonable bounds
      expect(afterScrollMemory).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);

      // Memory increase should be reasonable for additional content
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // 20MB increase max
    });

    test('validates garbage collection and memory cleanup', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      // Force garbage collection if available
      const beforeGC = await page.evaluate(async () => {
        // Try to force GC
        if (window.gc) {
          window.gc();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return performance.memory?.usedJSHeapSize || 0;
      });

      // Navigate away and back to test cleanup
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState('networkidle');

      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      const afterNavigation = await page.evaluate(async () => {
        if (window.gc) {
          window.gc();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return performance.memory?.usedJSHeapSize || 0;
      });

      console.log(`♻️ Before GC: ${Math.round(beforeGC / 1024 / 1024)}MB`);
      console.log(`♻️ After navigation: ${Math.round(afterNavigation / 1024 / 1024)}MB`);

      // Memory shouldn't grow significantly after navigation cycles
      const memoryGrowth = afterNavigation - beforeGC;
      expect(Math.abs(memoryGrowth)).toBeLessThan(10 * 1024 * 1024); // 10MB tolerance
    });
  });

  test.describe('Network Optimization', () => {
    test('validates HTTP/2 resource loading efficiency', async ({ page }) => {
      const resourceLoadOrder = [];

      page.on('response', response => {
        if (response.url().match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
          resourceLoadOrder.push({
            url: response.url(),
            timestamp: Date.now(),
            status: response.status(),
            httpVersion: response.httpVersion?.() || '1.1'
          });
        }
      });

      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      console.log(`🌐 Image requests: ${resourceLoadOrder.length}`);

      if (resourceLoadOrder.length > 1) {
        // Check for HTTP/2 usage if available
        const http2Requests = resourceLoadOrder.filter(r => r.httpVersion.startsWith('2'));
        console.log(`📡 HTTP/2 requests: ${http2Requests.length}/${resourceLoadOrder.length}`);

        // Measure loading parallelism
        const firstRequestTime = Math.min(...resourceLoadOrder.map(r => r.timestamp));
        const lastRequestTime = Math.max(...resourceLoadOrder.map(r => r.timestamp));
        const totalLoadTimeSpan = lastRequestTime - firstRequestTime;

        console.log(`⏱️ Total load time span: ${totalLoadTimeSpan}ms`);

        // With proper parallelization, total span should be reasonable
        expect(totalLoadTimeSpan).toBeLessThan(10000); // 10 seconds max
      }
    });

    test('measures cache effectiveness', async ({ page }) => {
      // First visit
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      let cachedResponses = 0;
      let freshResponses = 0;

      // Track cache hits/misses on second visit
      page.on('response', response => {
        if (response.url().match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
          const cacheStatus = response.headers()['cache-control'] || '';
          const fromCache = response.fromCache();

          if (fromCache) {
            cachedResponses++;
          } else {
            freshResponses++;
          }
        }
      });

      // Navigate away and back
      await page.goto(`${BASE_URL}/`);
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      console.log(`🗄️ Cached: ${cachedResponses}, Fresh: ${freshResponses}`);

      // Most resources should be cached on second visit
      if (cachedResponses + freshResponses > 0) {
        const cacheRatio = cachedResponses / (cachedResponses + freshResponses);
        expect(cacheRatio).toBeGreaterThan(0.5); // At least 50% cache hit rate
      }
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('establishes performance baseline', async ({ page }) => {
      const startTime = performance.now();

      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const endTime = performance.now();
      const totalLoadTime = endTime - startTime;

      const metrics = await page.evaluate(() => window.getPerformanceMetrics());

      const performanceReport = {
        timestamp: new Date().toISOString(),
        totalLoadTime: Math.round(totalLoadTime),
        cls: parseFloat(metrics.cls.toFixed(4)),
        lcp: Math.round(metrics.lcp),
        fid: Math.round(metrics.fid),
        imageCount: metrics.imageMetrics.length,
        successfulImages: metrics.imageMetrics.filter(img => img.success).length,
        averageImageLoadTime: Math.round(
          metrics.imageMetrics
            .filter(img => img.success)
            .reduce((sum, img) => sum + img.loadTime, 0) /
            metrics.imageMetrics.filter(img => img.success).length
        ) || 0
      };

      console.log('📊 Performance Baseline:', JSON.stringify(performanceReport, null, 2));

      // Store baseline (in a real scenario, this would go to a monitoring system)
      await page.evaluate(report => {
        localStorage.setItem('performance-baseline', JSON.stringify(report));
      }, performanceReport);

      // Validate against thresholds
      expect(performanceReport.totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.totalLoadTime);
      expect(performanceReport.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls);
      expect(performanceReport.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp);
    });

    test('detects performance regressions', async ({ page }) => {
      await page.goto(`${BASE_URL}/photographers`);
      await page.waitForLoadState('networkidle');

      // Get stored baseline
      const baseline = await page.evaluate(() => {
        const stored = localStorage.getItem('performance-baseline');
        return stored ? JSON.parse(stored) : null;
      });

      if (baseline) {
        const startTime = performance.now();
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        const endTime = performance.now();

        const currentMetrics = await page.evaluate(() => window.getPerformanceMetrics());

        const currentLoadTime = endTime - startTime;

        // Compare against baseline with tolerance
        const loadTimeRegression = (currentLoadTime - baseline.totalLoadTime) / baseline.totalLoadTime;
        const clsRegression = (currentMetrics.cls - baseline.cls) / (baseline.cls || 0.001);

        console.log(`📈 Load time change: ${(loadTimeRegression * 100).toFixed(1)}%`);
        console.log(`📈 CLS change: ${(clsRegression * 100).toFixed(1)}%`);

        // Detect significant regressions (>20% increase)
        expect(loadTimeRegression).toBeLessThan(0.2);
        expect(clsRegression).toBeLessThan(0.2);
      } else {
        console.log('⚠️ No baseline found, skipping regression detection');
      }
    });
  });
});