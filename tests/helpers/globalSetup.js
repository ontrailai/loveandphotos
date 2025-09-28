/**
 * Playwright Global Setup
 * Prepares test environment before running E2E tests
 */

import { chromium } from '@playwright/test'

async function globalSetup() {
  console.log('🚀 Starting global test setup...')

  // Launch browser for setup tasks
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the development server to be ready
    console.log('⏳ Waiting for dev server...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 60000 })

    // Verify critical pages load
    console.log('✅ Dev server is ready')

    // Setup test data if needed
    console.log('📝 Setting up test data...')

    // Clear any existing test data
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Seed any required test data
    await page.evaluate(() => {
      // Set up test photographer data
      const testPhotographer = {
        id: 'test-photographer',
        name: 'Test Photographer',
        packages: [
          {
            id: 'package-1',
            title: 'Wedding Package',
            price: 500,
            type: 'monthly'
          }
        ],
        locations: [
          {
            id: 'loc-1',
            title: 'Central Park',
            vibe: 'romantic'
          }
        ]
      }

      localStorage.setItem('test-photographer-data', JSON.stringify(testPhotographer))
    })

    console.log('✅ Test data setup complete')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }

  console.log('✅ Global setup completed successfully')
}

export default globalSetup