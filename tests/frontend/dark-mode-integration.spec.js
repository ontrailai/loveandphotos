/**
 * Dark Mode Integration Tests
 * Comprehensive tests for Origin UI theme and dark mode implementation
 */

import { test, expect } from '@playwright/test'

test.describe('Dark Mode and Origin UI Theme Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('theme toggle exists and is functional', async ({ page }) => {
    // Find the theme toggle button
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"], button:has(svg path[d*="M21 12"])').first()
    await expect(themeToggle).toBeVisible()

    // Click to toggle theme
    await themeToggle.click()

    // Verify the HTML element has the dark class
    const htmlClass = await page.locator('html').getAttribute('class')
    const isDark = htmlClass?.includes('dark')

    // Toggle back
    await themeToggle.click()
    const htmlClassAfter = await page.locator('html').getAttribute('class')
    const isDarkAfter = htmlClassAfter?.includes('dark')

    // One should be true, the other false
    expect(isDark !== isDarkAfter).toBe(true)
  })

  test('dark mode applies to all major sections', async ({ page }) => {
    // Add dark class to HTML
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Check navbar background
    const navbar = page.locator('nav').first()
    const navbarBg = await navbar.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )
    expect(navbarBg).not.toBe('rgb(255, 255, 255)') // Not white

    // Check Featured Photographers section
    const featuredSection = page.locator('section').filter({ hasText: 'Featured Photographers' })
    if (await featuredSection.count() > 0) {
      const featuredBg = await featuredSection.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      expect(featuredBg).not.toBe('rgb(255, 255, 255)') // Not white
    }

    // Check Testimonials section
    const testimonialsSection = page.locator('section').filter({ hasText: 'What Our Customers Say' })
    if (await testimonialsSection.count() > 0) {
      const testimonialsBg = await testimonialsSection.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      expect(testimonialsBg).not.toBe('rgb(255, 255, 255)') // Not white
    }

    // Check CTA section
    const ctaSection = page.locator('section').filter({ hasText: 'Your Perfect Moment Deserves the Perfect Eye' })
    if (await ctaSection.count() > 0) {
      const ctaBg = await ctaSection.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      expect(ctaBg).not.toBe('rgb(255, 255, 255)') // Not white
    }
  })

  test('logo switches between light and dark variants', async ({ page }) => {
    // Get initial logo src
    const logo = page.locator('img[alt*="Love & Photos"]').first()
    await expect(logo).toBeVisible()
    const lightSrc = await logo.getAttribute('src')

    // Toggle to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Check if there's a dark logo variant (either through CSS or React)
    // The BrandLogo component should handle this automatically
    const logoInDark = page.locator('img[alt*="Love & Photos"]').first()
    const darkSrc = await logoInDark.getAttribute('src')

    // The src might be the same if using CSS to show/hide, or different if using React
    // Check if dark variant exists in the DOM
    const darkLogoExists = await page.locator('img[src*="dark"]').count() > 0
    expect(darkLogoExists || darkSrc !== lightSrc).toBe(true)
  })

  test('text colors adapt to dark mode', async ({ page }) => {
    // Add dark class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Check main heading text color
    const heading = page.locator('h1').first()
    const headingColor = await heading.evaluate(el =>
      window.getComputedStyle(el).color
    )

    // Should be light color in dark mode (not black)
    expect(headingColor).not.toBe('rgb(0, 0, 0)')

    // Check paragraph text
    const paragraph = page.locator('p').first()
    const paragraphColor = await paragraph.evaluate(el =>
      window.getComputedStyle(el).color
    )

    // Should be light/muted in dark mode
    expect(paragraphColor).not.toBe('rgb(0, 0, 0)')
  })

  test('form inputs use theme tokens', async ({ page }) => {
    // Navigate to a page with forms (login or signup)
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Add dark class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Check input backgrounds
    const input = page.locator('input[type="email"], input[type="text"]').first()
    if (await input.count() > 0) {
      const inputBg = await input.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      const inputBorder = await input.evaluate(el =>
        window.getComputedStyle(el).borderColor
      )

      // Should use theme tokens, not hardcoded white
      expect(inputBg).not.toBe('rgb(255, 255, 255)')
      expect(inputBorder).toBeTruthy()
    }
  })

  test('cards and containers use proper theme backgrounds', async ({ page }) => {
    // Add dark class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Check card backgrounds
    const cards = page.locator('.bg-card, [class*="card"]')
    const cardCount = await cards.count()

    if (cardCount > 0) {
      const firstCard = cards.first()
      const cardBg = await firstCard.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )

      // Card should not be white in dark mode
      expect(cardBg).not.toBe('rgb(255, 255, 255)')
    }
  })

  test('navbar maintains theme on scroll', async ({ page }) => {
    // Add dark class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500))
    await page.waitForTimeout(500)

    // Check navbar still uses theme
    const navbar = page.locator('nav').first()
    const navbarBg = await navbar.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    )

    // Should not revert to white on scroll
    expect(navbarBg).not.toBe('rgb(255, 255, 255)')
  })

  test('dropdown menus are readable in dark mode', async ({ page }) => {
    // Add dark class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Try to open a dropdown (if exists)
    const dropdownTrigger = page.locator('button').filter({ hasText: /menu|more|options/i }).first()
    if (await dropdownTrigger.count() > 0) {
      await dropdownTrigger.click()

      // Check dropdown content
      const dropdownContent = page.locator('[role="menu"], .dropdown-content').first()
      if (await dropdownContent.count() > 0) {
        const contentBg = await dropdownContent.evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        )
        const contentColor = await dropdownContent.evaluate(el =>
          window.getComputedStyle(el).color
        )

        // Should have proper contrast
        expect(contentBg).not.toBe('rgb(255, 255, 255)')
        expect(contentColor).not.toBe('rgb(255, 255, 255)')
      }
    }
  })

  test('theme preference persists across page reload', async ({ page }) => {
    // Toggle to dark mode
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"], button:has(svg path[d*="M21 12"])').first()
    if (await themeToggle.count() > 0) {
      await themeToggle.click()

      // Wait for theme to be saved
      await page.waitForTimeout(500)

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Check if dark mode persisted
      const htmlClass = await page.locator('html').getAttribute('class')
      const savedTheme = await page.evaluate(() =>
        localStorage.getItem('theme')
      )

      // Theme should be preserved
      expect(htmlClass?.includes('dark') || savedTheme === 'dark').toBe(true)
    }
  })

  test('/photographers page respects dark mode', async ({ page }) => {
    // Navigate to photographers page
    await page.goto('/photographers')
    await page.waitForLoadState('networkidle')

    // Add dark class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Check page background
    const pageBg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    )

    // Should not be white
    expect(pageBg).not.toBe('rgb(255, 255, 255)')

    // Check if any photographer cards exist
    const cards = page.locator('[class*="card"], .photographer-card')
    if (await cards.count() > 0) {
      const firstCardBg = await cards.first().evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      expect(firstCardBg).not.toBe('rgb(255, 255, 255)')
    }
  })

  test('CSS overrides are applied correctly', async ({ page }) => {
    // Check if override CSS is loaded
    const hasOverrides = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets)
      return styles.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || [])
          return rules.some(rule =>
            rule.cssText?.includes('var(--background)') ||
            rule.cssText?.includes('var(--foreground)')
          )
        } catch {
          return false
        }
      })
    })

    expect(hasOverrides).toBe(true)
  })

  test('Origin UI CSS variables are defined', async ({ page }) => {
    const cssVars = await page.evaluate(() => {
      const computed = window.getComputedStyle(document.documentElement)
      return {
        background: computed.getPropertyValue('--background'),
        foreground: computed.getPropertyValue('--foreground'),
        card: computed.getPropertyValue('--card'),
        popover: computed.getPropertyValue('--popover'),
        primary: computed.getPropertyValue('--primary'),
        muted: computed.getPropertyValue('--muted'),
        border: computed.getPropertyValue('--border'),
        ring: computed.getPropertyValue('--ring'),
      }
    })

    // All CSS variables should be defined
    expect(cssVars.background).toBeTruthy()
    expect(cssVars.foreground).toBeTruthy()
    expect(cssVars.card).toBeTruthy()
    expect(cssVars.popover).toBeTruthy()
    expect(cssVars.primary).toBeTruthy()
    expect(cssVars.muted).toBeTruthy()
    expect(cssVars.border).toBeTruthy()
    expect(cssVars.ring).toBeTruthy()
  })
})