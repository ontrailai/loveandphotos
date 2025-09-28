/**
 * Playwright Global Teardown
 * Cleanup after all E2E tests complete
 */

import { chromium } from '@playwright/test'

async function globalTeardown() {
  console.log('🧹 Starting global test teardown...')

  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    await page.goto('http://localhost:3000')

    // Clean up test data
    await page.evaluate(() => {
      // Clear all test-related localStorage and sessionStorage
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('test-') || key.includes('booking_')) {
          localStorage.removeItem(key)
        }
      })

      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach(key => {
        if (key.includes('test-') || key.includes('booking_')) {
          sessionStorage.removeItem(key)
        }
      })
    })

    console.log('✅ Test data cleanup complete')

  } catch (error) {
    console.warn('⚠️ Teardown warning (non-fatal):', error.message)
  } finally {
    await browser.close()
  }

  console.log('✅ Global teardown completed')
}

export default globalTeardown