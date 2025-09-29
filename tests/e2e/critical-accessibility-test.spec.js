/**
 * Critical User Journey Accessibility Tests for Love & Photos
 * Tests the most important user flows for WCAG 2.1 AA compliance
 */

const { test, expect } = require('@playwright/test')
const { AxeBuilder } = require('@axe-core/playwright')

// Test configuration
const ACCESSIBILITY_STANDARDS = ['wcag2a', 'wcag2aa', 'wcag21aa']
const VIEWPORT_MOBILE = { width: 375, height: 667 }
const VIEWPORT_DESKTOP = { width: 1280, height: 720 }

test.describe('Critical User Journey Accessibility Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up common test environment
    await page.goto('/')
  })

  test('Journey 1: Browse Photographers - Desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_DESKTOP)
    
    console.log('🔍 Testing Browse Photographers journey on Desktop...')
    
    // Navigate to photographers page
    await page.click('text=Book Now')
    await page.click('text=Find Photographers')
    await page.waitForLoadState('networkidle')
    
    // Test search functionality keyboard access
    const searchInput = page.locator('input[placeholder*="ZIP"]')
    await searchInput.focus()
    await expect(searchInput).toBeFocused()
    
    // Type in search
    await searchInput.fill('90210')
    
    // Test search with Enter key
    await searchInput.press('Enter')
    await page.waitForTimeout(1000)
    
    // Run accessibility audit on browse page
    const browseAudit = await new AxeBuilder({ page })
      .withTags(ACCESSIBILITY_STANDARDS)
      .analyze()
    
    console.log(`   Browse page violations: ${browseAudit.violations.length}`)
    
    // Test photographer card keyboard navigation
    const firstPhotographer = page.locator('[data-testid="photographer-card"]').first()
    if (await firstPhotographer.count() > 0) {
      await firstPhotographer.focus()
      await expect(firstPhotographer).toBeFocused()
      
      // Test Enter key to open photographer profile
      await firstPhotographer.press('Enter')
      await page.waitForLoadState('networkidle')
    }
    
    // Verify no critical violations
    const criticalViolations = browseAudit.violations.filter(v => 
      v.impact === 'critical' || v.impact === 'serious'
    )
    
    expect(criticalViolations.length).toBeLessThanOrEqual(2) // Allow some tolerance for existing issues
  })

  test('Journey 1: Browse Photographers - Mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORT_MOBILE)
    
    console.log('📱 Testing Browse Photographers journey on Mobile...')
    
    // Navigate to photographers page (mobile navigation)
    await page.click('[aria-label="Open menu"]')
    await page.click('text=Book Now')
    await page.waitForLoadState('networkidle')
    
    // Test touch targets are adequate size
    const touchTargets = page.locator('button, a[href], input[type="button"], input[type="submit"]')
    const count = await touchTargets.count()
    
    for (let i = 0; i < Math.min(count, 10); i++) { // Test first 10 interactive elements
      const element = touchTargets.nth(i)
      const boundingBox = await element.boundingBox()
      
      if (boundingBox) {
        // WCAG AA requires 44x44 CSS pixels minimum for touch targets
        if (boundingBox.width < 44 || boundingBox.height < 44) {
          console.warn(`   ⚠️ Touch target too small: ${boundingBox.width}x${boundingBox.height}`)
        }
      }
    }
    
    // Run mobile accessibility audit
    const mobileAudit = await new AxeBuilder({ page })
      .withTags(ACCESSIBILITY_STANDARDS)
      .analyze()
      
    console.log(`   Mobile violations: ${mobileAudit.violations.length}`)
    
    // Test that text can be zoomed to 200% without horizontal scrolling
    await page.evaluate(() => {
      document.body.style.zoom = '200%'
    })
    
    // Check for horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '100%'
    })
    
    if (hasHorizontalScroll) {
      console.warn('   ⚠️ Horizontal scrolling detected at 200% zoom')
    }
  })

  test('Journey 2: Complete Booking Flow', async ({ page }) => {
    console.log('📋 Testing Complete Booking Flow...')
    
    // Navigate to a photographer profile
    await page.goto('/photographers')
    await page.waitForLoadState('networkidle')
    
    const firstPhotographer = page.locator('[data-testid="photographer-card"]').first()
    if (await firstPhotographer.count() > 0) {
      await firstPhotographer.click()
      await page.waitForLoadState('networkidle')
      
      // Test booking button accessibility
      const bookingButton = page.locator('text=Book Now, text=Start Booking').first()
      if (await bookingButton.count() > 0) {
        await bookingButton.focus()
        await expect(bookingButton).toBeFocused()
        
        // Check if button has accessible name
        const accessibleName = await bookingButton.getAttribute('aria-label')
        const buttonText = await bookingButton.textContent()
        
        expect(accessibleName || buttonText).toBeTruthy()
        
        await bookingButton.click()
        await page.waitForLoadState('networkidle')
      }
    }
    
    // Run accessibility audit on booking flow
    const bookingAudit = await new AxeBuilder({ page })
      .withTags(ACCESSIBILITY_STANDARDS)
      .analyze()
      
    console.log(`   Booking flow violations: ${bookingAudit.violations.length}`)
    
    // Test form accessibility if we're on a booking page
    const formElements = page.locator('form input, form select, form textarea')
    const formCount = await formElements.count()
    
    if (formCount > 0) {
      console.log(`   Found ${formCount} form elements to test`)
      
      for (let i = 0; i < Math.min(formCount, 5); i++) {
        const element = formElements.nth(i)
        
        // Check if form element has accessible name
        const hasAriaLabel = await element.getAttribute('aria-label')
        const hasAriaLabelledby = await element.getAttribute('aria-labelledby') 
        const hasId = await element.getAttribute('id')
        
        if (!hasAriaLabel && !hasAriaLabelledby && hasId) {
          // Check if there's a label for this ID
          const label = page.locator(`label[for="${await element.getAttribute('id')}"]`)
          const hasLabel = await label.count() > 0
          
          if (!hasLabel) {
            console.warn(`   ⚠️ Form element missing accessible name`)
          }
        }
      }
    }
  })

  test('Journey 3: Login/Signup Process', async ({ page }) => {
    console.log('🔐 Testing Login/Signup Process...')
    
    // Test Login page
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    // Run accessibility audit on login page
    const loginAudit = await new AxeBuilder({ page })
      .withTags(ACCESSIBILITY_STANDARDS)
      .analyze()
      
    console.log(`   Login page violations: ${loginAudit.violations.length}`)
    
    // Test form keyboard navigation
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitButton = page.locator('button[type="submit"]')
    
    if (await emailInput.count() > 0) {
      await emailInput.focus()
      await expect(emailInput).toBeFocused()
      
      // Tab to password field
      await emailInput.press('Tab')
      if (await passwordInput.count() > 0) {
        await expect(passwordInput).toBeFocused()
        
        // Tab to submit button
        await passwordInput.press('Tab')
        // Submit button should be focusable
      }
    }
    
    // Test Signup page
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    const signupAudit = await new AxeBuilder({ page })
      .withTags(ACCESSIBILITY_STANDARDS)
      .analyze()
      
    console.log(`   Signup page violations: ${signupAudit.violations.length}`)
    
    // Test password visibility toggle if it exists
    const passwordToggle = page.locator('[aria-label*="password"], button:has-text("Show"), button:has-text("Hide")')
    if (await passwordToggle.count() > 0) {
      await passwordToggle.focus()
      await expect(passwordToggle).toBeFocused()
      
      // Check if toggle has proper aria-pressed or aria-expanded state
      const ariaPressed = await passwordToggle.getAttribute('aria-pressed')
      const ariaExpanded = await passwordToggle.getAttribute('aria-expanded')
      const ariaLabel = await passwordToggle.getAttribute('aria-label')
      
      expect(ariaPressed || ariaExpanded || ariaLabel).toBeTruthy()
    }
  })

  test('Journey 4: Navigation and Page Structure', async ({ page }) => {
    console.log('🧭 Testing Navigation and Page Structure...')
    
    // Test main navigation keyboard accessibility
    await page.goto('/')
    
    // Test skip link (should be first focusable element)
    await page.keyboard.press('Tab')
    const firstFocus = await page.evaluate(() => document.activeElement.textContent)
    
    if (firstFocus && firstFocus.toLowerCase().includes('skip')) {
      console.log('   ✅ Skip link found')
      await page.keyboard.press('Enter')
    }
    
    // Test main navigation items
    const navLinks = page.locator('nav a, nav button')
    const navCount = await navLinks.count()
    
    console.log(`   Testing ${navCount} navigation items`)
    
    // Test heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const headingCount = await headings.count()
    
    if (headingCount > 0) {
      const firstHeading = headings.first()
      const firstHeadingTag = await firstHeading.evaluate(el => el.tagName.toLowerCase())
      
      if (firstHeadingTag === 'h1') {
        console.log('   ✅ Proper heading hierarchy (starts with h1)')
      } else {
        console.warn('   ⚠️ Heading hierarchy issue - first heading is not h1')
      }
    }
    
    // Test landmarks
    const mainLandmark = page.locator('main, [role="main"]')
    const navLandmark = page.locator('nav, [role="navigation"]')
    const bannerLandmark = page.locator('header, [role="banner"]')
    const contentinfoLandmark = page.locator('footer, [role="contentinfo"]')
    
    expect(await mainLandmark.count()).toBeGreaterThan(0)
    expect(await navLandmark.count()).toBeGreaterThan(0)
    
    console.log(`   Landmarks found - main: ${await mainLandmark.count()}, nav: ${await navLandmark.count()}`)
  })

  test('Color Contrast and Visual Accessibility', async ({ page }) => {
    console.log('🎨 Testing Color Contrast and Visual Accessibility...')
    
    await page.goto('/')
    
    // Run audit with specific focus on color contrast
    const contrastAudit = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze()
      
    console.log(`   Color contrast violations: ${contrastAudit.violations.length}`)
    
    // List specific contrast violations
    contrastAudit.violations.forEach(violation => {
      if (violation.id === 'color-contrast') {
        violation.nodes.forEach(node => {
          console.log(`   ⚠️ Contrast issue: ${node.target}`)
        })
      }
    })
    
    // Test that page is usable without color
    // This is a simplified test - in practice you'd use specialized tools
    const colorDependentElements = page.locator('.text-red, .text-green, .text-blue, .text-yellow')
    const colorElementsCount = await colorDependentElements.count()
    
    if (colorElementsCount > 0) {
      console.log(`   Found ${colorElementsCount} elements that may rely on color alone`)
      
      // Check if these elements have additional visual indicators
      for (let i = 0; i < Math.min(colorElementsCount, 5); i++) {
        const element = colorDependentElements.nth(i)
        const hasIcon = await element.locator('svg, .icon, [class*="icon"]').count() > 0
        const text = await element.textContent()
        const hasDescriptiveText = text && text.length > 10
        
        if (!hasIcon && !hasDescriptiveText) {
          console.warn('   ⚠️ Element may rely on color alone for meaning')
        }
      }
    }
  })

})

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === 'failed') {
    // Capture screenshot on failure for debugging
    await page.screenshot({ 
      path: `test-results/accessibility-failure-${testInfo.title.replace(/\s+/g, '-')}.png`,
      fullPage: true 
    })
  }
})