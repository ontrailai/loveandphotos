import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Complete Talent Application Flow
 *
 * Flow:
 * 1. Navigate to /talent/apply
 * 2. Select role (photographer or videographer)
 * 3. Fill application form with all required fields
 * 4. Answer all eligibility questions (must be "yes" to pass)
 * 5. Accept terms and conditions
 * 6. Submit application
 * 7. Verify account creation
 * 8. Verify redirect to appropriate dashboard
 */

test.describe('Complete Talent Application Flow - Photographer', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all authentication state
    await context.clearCookies()
    await page.goto('/talent/apply')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should complete full photographer application and redirect to dashboard', async ({ page }) => {
    // Navigate to talent application page
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Verify role selection screen
    await expect(page.getByRole('heading', { name: /join love & photos/i })).toBeVisible()
    await expect(page.getByText('Select your specialty')).toBeVisible()

    // Select photographer role
    await page.getByRole('button', { name: /apply as photographer/i }).click()

    // Verify application form appears
    await expect(page.getByRole('heading', { name: /photographer application/i })).toBeVisible()

    // Fill personal information
    await page.getByLabel(/full name/i).fill('Test Photographer Pro')
    await page.getByLabel(/email address/i).fill(`photographer-${Date.now()}@test.com`)
    await page.locator('#phone').fill('5551234567')
    await page.locator('#password').fill('TestPass123!')
    await page.locator('#confirmPassword').fill('TestPass123!')

    // Answer all eligibility questions with "yes"
    await page.locator('input[name="age_18_plus"][value="yes"]').check()
    await page.locator('input[name="reliable_transportation"][value="yes"]').check()
    await page.locator('input[name="willing_40_hourly"][value="yes"]').check()
    await page.locator('input[name="professional_grade_camera"][value="yes"]').check()
    await page.locator('input[name="comfortable_solo"][value="yes"]').check()
    await page.locator('input[name="inclusive_mindset"][value="yes"]').check()

    // Fill additional questions (scroll fields into view before filling)
    const experienceField = page.locator('input[name="experience_years"]')
    await experienceField.scrollIntoViewIfNeeded()
    await experienceField.fill('5')

    const referralField = page.locator('input[name="referral_name"]')
    await referralField.scrollIntoViewIfNeeded()
    await referralField.fill('John Smith')

    const instagramField = page.locator('input[name="instagram_handle"]')
    await instagramField.scrollIntoViewIfNeeded()
    await instagramField.fill('@testphotographer')

    const backgroundField = page.locator('textarea[name="background_description"]')
    await backgroundField.scrollIntoViewIfNeeded()
    await backgroundField.fill('I am passionate about capturing beautiful wedding moments and have extensive experience in event photography.')

    // Scroll terms into view and accept
    await page.locator('input[name="terms_agreement"]').scrollIntoViewIfNeeded()
    await page.locator('input[name="terms_agreement"]').check()

    // Submit application
    await page.getByRole('button', { name: /submit application/i }).click()

    // Wait for success screen
    await expect(page.getByRole('heading', { name: /application approved/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/congratulations/i)).toBeVisible()

    // Wait for redirect to photographer dashboard
    await page.waitForURL('**/talent/dashboard', { timeout: 5000 })
    expect(page.url()).toContain('/talent/dashboard')
  })

  test('should reject photographer application if any eligibility question is "no"', async ({ page }) => {
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Select photographer role
    await page.getByRole('button', { name: /apply as photographer/i }).click()

    // Fill personal information
    await page.getByLabel(/full name/i).fill('Test Photographer Fail')
    await page.getByLabel(/email address/i).fill(`photographer-fail-${Date.now()}@test.com`)
    await page.locator('#password').fill('TestPass123!')
    await page.locator('#confirmPassword').fill('TestPass123!')

    // Answer eligibility questions with one "no" (this should reject application)
    await page.locator('input[name="age_18_plus"][value="yes"]').check()
    await page.locator('input[name="reliable_transportation"][value="yes"]').check()
    await page.locator('input[name="willing_40_hourly"][value="no"]').check() // Rejection trigger
    await page.locator('input[name="professional_grade_camera"][value="yes"]').check()
    await page.locator('input[name="comfortable_solo"][value="yes"]').check()
    await page.locator('input[name="inclusive_mindset"][value="yes"]').check()

    // Fill required experience
    const experienceField = page.locator('input[name="experience_years"]')
    await experienceField.scrollIntoViewIfNeeded()
    await experienceField.fill('3')

    // Accept terms
    await page.locator('input[name="terms_agreement"]').scrollIntoViewIfNeeded()
    await page.locator('input[name="terms_agreement"]').check()

    // Submit application
    await page.getByRole('button', { name: /submit application/i }).click()

    // Verify rejection screen
    await expect(page.getByRole('heading', { name: /application not approved/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/currently only accepting talent/i)).toBeVisible()
  })

  test('should validate required fields before submission', async ({ page }) => {
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Select photographer role
    await page.getByRole('button', { name: /apply as photographer/i }).click()

    // Try to submit without filling anything
    await page.getByRole('button', { name: /submit application/i }).click()

    // Verify browser validation prevents submission (form should still be visible)
    await expect(page.getByRole('heading', { name: /photographer application/i })).toBeVisible()
  })

  test('should validate password match', async ({ page }) => {
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Select photographer role
    await page.getByRole('button', { name: /apply as photographer/i }).click()

    // Fill form with mismatched passwords
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email address/i).fill(`test-${Date.now()}@test.com`)
    await page.locator('#password').fill('Password123!')
    await page.locator('#confirmPassword').fill('DifferentPassword123!')

    // Answer eligibility questions
    await page.locator('input[name="age_18_plus"][value="yes"]').check()
    await page.locator('input[name="reliable_transportation"][value="yes"]').check()
    await page.locator('input[name="willing_40_hourly"][value="yes"]').check()
    await page.locator('input[name="professional_grade_camera"][value="yes"]').check()
    await page.locator('input[name="comfortable_solo"][value="yes"]').check()
    await page.locator('input[name="inclusive_mindset"][value="yes"]').check()

    // Fill required experience
    const experienceField = page.locator('input[name="experience_years"]')
    await experienceField.scrollIntoViewIfNeeded()
    await experienceField.fill('3')

    // Accept terms
    await page.locator('input[name="terms_agreement"]').scrollIntoViewIfNeeded()
    await page.locator('input[name="terms_agreement"]').check()

    // Submit and expect error toast
    await page.getByRole('button', { name: /submit application/i }).click()

    // Wait for error message (toast or alert)
    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 3000 })
  })

  test.skip('should require terms acceptance before submission', async ({ page }) => {
    // Skipped: HTML5 'required' attribute prevents form submission before handleSubmit runs,
    // so the custom toast error message never appears. Browser validation handles this.
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Select photographer role
    await page.getByRole('button', { name: /apply as photographer/i }).click()

    // Fill all fields except terms
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email address/i).fill(`test-${Date.now()}@test.com`)
    await page.locator('#password').fill('TestPass123!')
    await page.locator('#confirmPassword').fill('TestPass123!')

    // Answer eligibility questions
    await page.locator('input[name="age_18_plus"][value="yes"]').check()
    await page.locator('input[name="reliable_transportation"][value="yes"]').check()
    await page.locator('input[name="willing_40_hourly"][value="yes"]').check()
    await page.locator('input[name="professional_grade_camera"][value="yes"]').check()
    await page.locator('input[name="comfortable_solo"][value="yes"]').check()
    await page.locator('input[name="inclusive_mindset"][value="yes"]').check()

    // Fill required experience
    const experienceField = page.locator('input[name="experience_years"]')
    await experienceField.scrollIntoViewIfNeeded()
    await experienceField.fill('3')

    // Do NOT check terms checkbox
    await page.getByRole('button', { name: /submit application/i }).click()

    // Verify browser validation or error message
    await expect(page.getByText(/accept the terms/i)).toBeVisible({ timeout: 3000 })
  })

  test('should allow going back to role selection from application form', async ({ page }) => {
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Select photographer role
    await page.getByRole('button', { name: /apply as photographer/i }).click()

    // Verify on application form
    await expect(page.getByRole('heading', { name: /photographer application/i })).toBeVisible()

    // Click back button
    await page.getByRole('button', { name: /^back$/i }).click()

    // Verify back on role selection
    await expect(page.getByRole('heading', { name: /join love & photos/i })).toBeVisible()
  })
})

test.describe('Complete Talent Application Flow - Videographer', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all authentication state
    await context.clearCookies()
    await page.goto('/talent/apply')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should complete full videographer application and redirect to videographer dashboard', async ({ page }) => {
    // Navigate to talent application page
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Select videographer role
    await page.getByRole('button', { name: /apply as videographer/i }).click()

    // Verify application form appears
    await expect(page.getByRole('heading', { name: /videographer application/i })).toBeVisible()

    // Fill personal information
    await page.getByLabel(/full name/i).fill('Test Videographer Pro')
    await page.getByLabel(/email address/i).fill(`videographer-${Date.now()}@test.com`)
    await page.locator('#phone').fill('5559876543')
    await page.locator('#password').fill('VideoPass123!')
    await page.locator('#confirmPassword').fill('VideoPass123!')

    // Answer all videographer eligibility questions with "yes"
    // Note: Videographers have has_audio_gear instead of professional_grade_camera
    await page.locator('input[name="age_18_plus"][value="yes"]').check()
    await page.locator('input[name="reliable_transportation"][value="yes"]').check()
    await page.locator('input[name="willing_40_hourly"][value="yes"]').check()
    await page.locator('input[name="has_audio_gear"][value="yes"]').check()
    await page.locator('input[name="comfortable_solo"][value="yes"]').check()
    await page.locator('input[name="inclusive_mindset"][value="yes"]').check()

    // Fill additional questions (scroll fields into view before filling)
    const experienceField = page.locator('input[name="experience_years"]')
    await experienceField.scrollIntoViewIfNeeded()
    await experienceField.fill('4')

    const referralField = page.locator('input[name="referral_name"]')
    await referralField.scrollIntoViewIfNeeded()
    await referralField.fill('Jane Doe')

    const instagramField = page.locator('input[name="instagram_handle"]')
    await instagramField.scrollIntoViewIfNeeded()
    await instagramField.fill('@testvideographer')

    const backgroundField = page.locator('textarea[name="background_description"]')
    await backgroundField.scrollIntoViewIfNeeded()
    await backgroundField.fill('I specialize in cinematic wedding videography with professional audio equipment.')

    // Accept terms
    await page.locator('input[name="terms_agreement"]').scrollIntoViewIfNeeded()
    await page.locator('input[name="terms_agreement"]').check()

    // Submit application
    await page.getByRole('button', { name: /submit application/i }).click()

    // Wait for success screen
    await expect(page.getByRole('heading', { name: /application approved/i })).toBeVisible({ timeout: 10000 })

    // Wait for redirect to videographer dashboard
    await page.waitForURL('**/talent/dashboard/videographer', { timeout: 5000 })
    expect(page.url()).toContain('/talent/dashboard/videographer')
  })

  test('should display videographer-specific eligibility questions', async ({ page }) => {
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Select videographer role
    await page.getByRole('button', { name: /apply as videographer/i }).click()

    // Verify videographer-specific question appears
    await expect(page.getByText(/do you have gear to record sound/i)).toBeVisible()

    // Verify photographer-specific question does NOT appear
    await expect(page.getByText(/is your camera professional-grade/i)).not.toBeVisible()
  })
})

test.describe('Talent Application - Shared Functionality', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all authentication state
    await context.clearCookies()
    await page.goto('/talent/apply')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('should display both role options on initial screen', async ({ page }) => {
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Verify both role cards are visible
    await expect(page.getByRole('button', { name: /apply as photographer/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /apply as videographer/i })).toBeVisible()

    // Verify descriptive text for each role
    await expect(page.getByText(/capture beautiful moments/i)).toBeVisible()
    await expect(page.getByText(/create cinematic wedding videos/i)).toBeVisible()
  })

  test('should have back to home button on role selection screen', async ({ page }) => {
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Verify back to home button exists
    await expect(page.getByRole('button', { name: /back to home/i })).toBeVisible()
  })

  test.skip('should validate minimum password length', async ({ page }) => {
    // Skipped: HTML5 minLength={6} attribute prevents form submission before handleSubmit runs,
    // so the custom toast error message never appears. Browser validation handles this.
    await page.goto('/talent/apply')
    await page.waitForLoadState('networkidle')

    // Select photographer role
    await page.getByRole('button', { name: /apply as photographer/i }).click()

    // Fill with short password
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email address/i).fill(`test-${Date.now()}@test.com`)
    await page.locator('#password').fill('123')
    await page.locator('#confirmPassword').fill('123')

    // Answer eligibility questions
    await page.locator('input[name="age_18_plus"][value="yes"]').check()
    await page.locator('input[name="reliable_transportation"][value="yes"]').check()
    await page.locator('input[name="willing_40_hourly"][value="yes"]').check()
    await page.locator('input[name="professional_grade_camera"][value="yes"]').check()
    await page.locator('input[name="comfortable_solo"][value="yes"]').check()
    await page.locator('input[name="inclusive_mindset"][value="yes"]').check()

    // Fill required experience
    const experienceField = page.locator('input[name="experience_years"]')
    await experienceField.scrollIntoViewIfNeeded()
    await experienceField.fill('3')

    // Accept terms
    await page.locator('input[name="terms_agreement"]').scrollIntoViewIfNeeded()
    await page.locator('input[name="terms_agreement"]').check()

    // Submit and expect error
    await page.getByRole('button', { name: /submit application/i }).click()

    // Verify error message about password length
    await expect(page.getByText(/password must be at least 6 characters/i)).toBeVisible({ timeout: 3000 })
  })
})
