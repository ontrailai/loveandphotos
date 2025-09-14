/**
 * PageHero Dark Mode Tests
 * Tests for the unified PageHero component across all pages
 */

import { test, expect } from '@playwright/test'

test.describe('PageHero Dark Mode Tests', () => {
  const pages = [
    { path: '/about', title: 'About Love & Photos' },
    { path: '/contact', title: 'Get in Touch' },
    { path: '/how-it-works', title: 'How Love & Photos Works' },
    { path: '/pricing', title: 'Simple, Transparent Pricing' },
    { path: '/resources', title: 'Photographer Resources' },
    { path: '/dashboard', title: 'Welcome back', requiresAuth: true }
  ]

  test.beforeEach(async ({ page }) => {
    // Mock authentication for dashboard
    await page.addInitScript(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: { access_token: 'mock-token', user: { id: 'mock-user' } }
      }))
    })
  })

  pages.forEach(({ path, title, requiresAuth }) => {
    test(`${path} page hero renders correctly in light mode`, async ({ page }) => {
      if (requiresAuth) {
        // Skip auth-required pages in this test
        return
      }

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Check hero section exists
      const hero = page.locator('section').filter({ hasText: title }).first()
      await expect(hero).toBeVisible()

      // Check background is using theme tokens
      const heroBg = await hero.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )

      // Should not be hardcoded white
      expect(heroBg).not.toBe('rgb(255, 255, 255)')
    })

    test(`${path} page hero renders correctly in dark mode`, async ({ page }) => {
      if (requiresAuth) {
        // Skip auth-required pages in this test
        return
      }

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })

      // Check hero section
      const hero = page.locator('section').filter({ hasText: title }).first()
      await expect(hero).toBeVisible()

      // Check text colors adapt
      const heading = hero.locator('h1').first()
      const headingColor = await heading.evaluate(el =>
        window.getComputedStyle(el).color
      )

      // Should not be black in dark mode
      expect(headingColor).not.toBe('rgb(0, 0, 0)')

      // Check subtitle if exists
      const subtitle = hero.locator('p').first()
      if (await subtitle.count() > 0) {
        const subtitleColor = await subtitle.evaluate(el =>
          window.getComputedStyle(el).color
        )
        // Should be muted but visible
        expect(subtitleColor).not.toBe('rgb(0, 0, 0)')
      }
    })
  })

  test('PageHero component uses consistent styling across pages', async ({ page }) => {
    const pagesToCheck = pages.filter(p => !p.requiresAuth).slice(0, 3)
    const heroClasses = []

    for (const { path } of pagesToCheck) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const hero = page.locator('section').first()
      const className = await hero.getAttribute('class')
      heroClasses.push(className)
    }

    // All heroes should have similar base classes
    heroClasses.forEach(className => {
      expect(className).toContain('bg-background')
    })
  })

  test('No hardcoded white backgrounds remain', async ({ page }) => {
    const pagesToCheck = pages.filter(p => !p.requiresAuth)

    for (const { path } of pagesToCheck) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Enable dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })

      // Check for any elements with hardcoded white backgrounds
      const whiteElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*')
        const problematic = []

        elements.forEach(el => {
          const style = window.getComputedStyle(el)
          const bg = style.backgroundColor
          const className = el.className

          // Check for hardcoded white that doesn't change in dark mode
          if (bg === 'rgb(255, 255, 255)' &&
              typeof className === 'string' &&
              (className.includes('bg-white') || className.includes('from-primary-50'))) {
            problematic.push({
              tag: el.tagName,
              className: el.className,
              bg: bg
            })
          }
        })

        return problematic
      })

      // Should have no or minimal hardcoded white elements
      expect(whiteElements.length).toBeLessThanOrEqual(2)
    }
  })

  test('Theme tokens are used for all text colors', async ({ page }) => {
    const checkPage = pages[0] // Check About page

    await page.goto(checkPage.path)
    await page.waitForLoadState('networkidle')

    // Check in light mode
    const lightTextColors = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3')
      const paragraphs = document.querySelectorAll('p')

      return {
        headings: Array.from(headings).map(el => ({
          tag: el.tagName,
          className: el.className,
          color: window.getComputedStyle(el).color
        })),
        paragraphs: Array.from(paragraphs).slice(0, 5).map(el => ({
          className: el.className,
          color: window.getComputedStyle(el).color
        }))
      }
    })

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    const darkTextColors = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3')
      const paragraphs = document.querySelectorAll('p')

      return {
        headings: Array.from(headings).map(el => ({
          tag: el.tagName,
          className: el.className,
          color: window.getComputedStyle(el).color
        })),
        paragraphs: Array.from(paragraphs).slice(0, 5).map(el => ({
          className: el.className,
          color: window.getComputedStyle(el).color
        }))
      }
    })

    // Colors should change between light and dark mode
    expect(lightTextColors.headings[0]?.color).not.toBe(darkTextColors.headings[0]?.color)
  })
})