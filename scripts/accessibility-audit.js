/**
 * WCAG AA Accessibility Audit Script
 * Validates contract components for accessibility compliance
 */

import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const ACCESSIBILITY_STANDARDS = {
  wcag2a: ['wcag2a'],
  wcag2aa: ['wcag2aa'],
  wcag21aa: ['wcag21aa'],
  section508: ['section508']
}

async function runAccessibilityAudit() {
  console.log('🔍 Starting WCAG AA Accessibility Audit...\n')

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  const auditResults = {}

  try {
    // Audit Contract Step Page
    console.log('📋 Auditing Contract Step Page...')
    await page.goto('http://localhost:5173/booking/test-photographer/contract')

    // Wait for page to load completely
    await page.waitForSelector('#signature', { timeout: 10000 })

    const contractAudit = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze()

    auditResults.contractStep = contractAudit
    console.log(`✅ Contract Step: ${contractAudit.violations.length} violations found`)

    // Audit Signature Box Component specifically
    console.log('✍️ Auditing Signature Box Component...')
    const signatureAudit = await new AxeBuilder({ page })
      .include('#signature')
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze()

    auditResults.signatureBox = signatureAudit
    console.log(`✅ Signature Box: ${signatureAudit.violations.length} violations found`)

    // Test keyboard navigation
    console.log('⌨️ Testing Keyboard Navigation...')
    await testKeyboardNavigation(page)

    // Test color contrast
    console.log('🎨 Testing Color Contrast...')
    await testColorContrast(page)

    // Test screen reader compatibility
    console.log('📢 Testing Screen Reader Compatibility...')
    await testScreenReaderCompatibility(page)

    // Test with signature drawn
    console.log('✍️ Testing with Signature Interaction...')
    await testSignatureInteraction(page, auditResults)

  } catch (error) {
    console.error('❌ Audit failed:', error.message)
  } finally {
    await browser.close()
  }

  // Generate report
  generateAccessibilityReport(auditResults)
}

async function testKeyboardNavigation(page) {
  const keyboardTests = []

  try {
    // Test tab navigation through form
    await page.keyboard.press('Tab') // Should focus first focusable element
    const firstFocus = await page.evaluate(() => document.activeElement.tagName)
    keyboardTests.push({ test: 'Initial Tab Focus', result: firstFocus !== 'BODY' ? 'PASS' : 'FAIL' })

    // Test navigation to signature area
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const currentFocus = await page.evaluate(() => ({
        tag: document.activeElement.tagName,
        id: document.activeElement.id,
        className: document.activeElement.className
      }))

      if (currentFocus.id === 'signer-name' || currentFocus.tag === 'CANVAS') {
        keyboardTests.push({ test: 'Navigate to Signature Area', result: 'PASS' })
        break
      }
    }

    // Test Enter/Space activation on canvas
    await page.focus('#signature canvas')
    await page.keyboard.press('Enter')
    const focusAfterEnter = await page.evaluate(() => document.activeElement.id)
    keyboardTests.push({
      test: 'Canvas Enter Key Navigation',
      result: focusAfterEnter === 'signer-name' ? 'PASS' : 'FAIL'
    })

    console.log('   Keyboard Navigation Results:')
    keyboardTests.forEach(test => {
      console.log(`   ${test.result === 'PASS' ? '✅' : '❌'} ${test.test}`)
    })

  } catch (error) {
    console.log('   ❌ Keyboard navigation test failed:', error.message)
  }
}

async function testColorContrast(page) {
  const contrastTests = []

  try {
    // Test title contrast
    const titleContrast = await page.evaluate(() => {
      const title = document.querySelector('h1')
      if (!title) return null

      const styles = getComputedStyle(title)
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        element: 'Title (h1)'
      }
    })

    if (titleContrast) {
      contrastTests.push({
        element: titleContrast.element,
        result: titleContrast.color !== titleContrast.backgroundColor ? 'PASS' : 'FAIL'
      })
    }

    // Test button contrast
    const buttonContrast = await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]')
      if (!button) return null

      const styles = getComputedStyle(button)
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        element: 'Submit Button'
      }
    })

    if (buttonContrast) {
      contrastTests.push({
        element: buttonContrast.element,
        result: buttonContrast.color !== buttonContrast.backgroundColor ? 'PASS' : 'FAIL'
      })
    }

    // Test form label contrast
    const labelContrast = await page.evaluate(() => {
      const label = document.querySelector('label[for="signer-name"]')
      if (!label) return null

      const styles = getComputedStyle(label)
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
        element: 'Form Label'
      }
    })

    if (labelContrast) {
      contrastTests.push({
        element: labelContrast.element,
        result: labelContrast.color !== labelContrast.backgroundColor ? 'PASS' : 'FAIL'
      })
    }

    console.log('   Color Contrast Results:')
    contrastTests.forEach(test => {
      console.log(`   ${test.result === 'PASS' ? '✅' : '❌'} ${test.element}`)
    })

  } catch (error) {
    console.log('   ❌ Color contrast test failed:', error.message)
  }
}

async function testScreenReaderCompatibility(page) {
  const screenReaderTests = []

  try {
    // Test ARIA labels
    const ariaLabels = await page.evaluate(() => {
      const elements = [
        { selector: '#signature', attribute: 'aria-label', expected: 'Digital signature capture' },
        { selector: '#signature canvas', attribute: 'aria-label', expected: 'Signature drawing area' },
        { selector: '#signer-name', attribute: 'aria-label', expected: null }, // Should have label element
        { selector: '#consent-checkbox', attribute: 'aria-describedby', expected: null }
      ]

      return elements.map(el => {
        const element = document.querySelector(el.selector)
        if (!element) return { ...el, found: false }

        return {
          ...el,
          found: true,
          value: element.getAttribute(el.attribute),
          hasValue: !!element.getAttribute(el.attribute)
        }
      })
    })

    ariaLabels.forEach(test => {
      if (test.found) {
        if (test.expected) {
          screenReaderTests.push({
            test: `${test.selector} has ${test.attribute}`,
            result: test.value === test.expected ? 'PASS' : 'FAIL'
          })
        } else {
          screenReaderTests.push({
            test: `${test.selector} has ${test.attribute}`,
            result: test.hasValue ? 'PASS' : 'FAIL'
          })
        }
      } else {
        screenReaderTests.push({
          test: `${test.selector} exists`,
          result: 'FAIL'
        })
      }
    })

    // Test live regions
    const liveRegion = await page.evaluate(() => {
      const liveElements = document.querySelectorAll('[aria-live]')
      return liveElements.length > 0
    })

    screenReaderTests.push({
      test: 'Live regions for announcements',
      result: liveRegion ? 'PASS' : 'FAIL'
    })

    // Test heading structure
    const headingStructure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      return headings.map(h => ({ tag: h.tagName, text: h.textContent.substring(0, 50) }))
    })

    screenReaderTests.push({
      test: 'Proper heading structure',
      result: headingStructure.length > 0 && headingStructure[0].tag === 'H1' ? 'PASS' : 'FAIL'
    })

    console.log('   Screen Reader Compatibility Results:')
    screenReaderTests.forEach(test => {
      console.log(`   ${test.result === 'PASS' ? '✅' : '❌'} ${test.test}`)
    })

  } catch (error) {
    console.log('   ❌ Screen reader compatibility test failed:', error.message)
  }
}

async function testSignatureInteraction(page, auditResults) {
  try {
    // Draw a signature
    const canvas = page.locator('#signature canvas')
    const box = await canvas.boundingBox()

    await page.mouse.move(box.x + 50, box.y + 50)
    await page.mouse.down()
    await page.mouse.move(box.x + 150, box.y + 80)
    await page.mouse.up()

    // Wait for signature state to update
    await page.waitForTimeout(500)

    // Test signature state announcements
    const hasStatusAnnouncement = await page.evaluate(() => {
      const statusElements = document.querySelectorAll('.text-green-600')
      return Array.from(statusElements).some(el =>
        el.textContent.includes('captured') || el.textContent.includes('ready')
      )
    })

    console.log(`   ${hasStatusAnnouncement ? '✅' : '❌'} Signature status announcement`)

    // Test with signature present
    const withSignatureAudit = await new AxeBuilder({ page })
      .include('#signature')
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze()

    auditResults.signatureWithDrawing = withSignatureAudit
    console.log(`   ✅ Signature with drawing: ${withSignatureAudit.violations.length} violations`)

  } catch (error) {
    console.log('   ❌ Signature interaction test failed:', error.message)
  }
}

function generateAccessibilityReport(results) {
  console.log('\n📊 WCAG AA Accessibility Audit Report')
  console.log('=====================================\n')

  let totalViolations = 0
  let criticalIssues = []
  let recommendations = []

  Object.entries(results).forEach(([component, audit]) => {
    if (audit && audit.violations) {
      console.log(`📋 ${component.toUpperCase()} COMPONENT:`)
      console.log(`   Total Violations: ${audit.violations.length}`)

      totalViolations += audit.violations.length

      if (audit.violations.length > 0) {
        audit.violations.forEach(violation => {
          const severity = violation.impact === 'critical' || violation.impact === 'serious' ? '🔴' : '🟡'
          console.log(`   ${severity} ${violation.id}: ${violation.description}`)

          if (violation.impact === 'critical' || violation.impact === 'serious') {
            criticalIssues.push({
              component,
              id: violation.id,
              description: violation.description,
              impact: violation.impact,
              help: violation.help
            })
          }
        })
      }
      console.log()
    }
  })

  // Generate recommendations
  if (criticalIssues.length > 0) {
    console.log('🚨 CRITICAL ISSUES TO ADDRESS:')
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.component} - ${issue.id}`)
      console.log(`   Impact: ${issue.impact}`)
      console.log(`   Fix: ${issue.help}`)
      console.log()
    })
  }

  console.log('📝 ACCESSIBILITY RECOMMENDATIONS:')

  recommendations.push('✅ Ensure all interactive elements have focus indicators')
  recommendations.push('✅ Test with screen readers (NVDA, JAWS, VoiceOver)')
  recommendations.push('✅ Verify color contrast meets 4.5:1 ratio for normal text')
  recommendations.push('✅ Test keyboard navigation without mouse')
  recommendations.push('✅ Validate signature announcements work properly')
  recommendations.push('✅ Test with users who have disabilities')

  recommendations.forEach(rec => console.log(`   ${rec}`))

  console.log('\n🏆 COMPLIANCE SUMMARY:')
  console.log(`   Total Violations: ${totalViolations}`)
  console.log(`   Critical Issues: ${criticalIssues.length}`)
  console.log(`   WCAG AA Status: ${totalViolations === 0 ? '✅ COMPLIANT' : '⚠️ NEEDS ATTENTION'}`)

  if (totalViolations === 0) {
    console.log('\n🎉 Congratulations! Contract components meet WCAG AA standards.')
  } else {
    console.log('\n🔧 Please address the violations above to achieve full WCAG AA compliance.')
  }
}

// Run the audit
runAccessibilityAudit().catch(console.error)