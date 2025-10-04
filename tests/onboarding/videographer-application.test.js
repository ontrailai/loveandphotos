/**
 * Videographer Application Test Suite
 * Tests the complete videographer onboarding flow including:
 * - Form rendering
 * - Critical question validation
 * - Auto-rejection logic
 * - Successful submission
 * - Database integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TalentApplication from '@/pages/TalentApplication'
import { supabase } from '@lib/supabase'

// Mock Supabase
vi.mock('@lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

// Mock Auth Context
vi.mock('@contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: vi.fn((email, password, userData) => ({
      success: true,
      user: { id: 'test-user-id' }
    }))
  })
}))

// Mock React Router navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Helper function to render component
const renderApplication = () => {
  return render(
    <BrowserRouter>
      <TalentApplication />
    </BrowserRouter>
  )
}

describe('Videographer Application - Critical Questions Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display role selection screen on initial load', () => {
    renderApplication()

    expect(screen.getByText('Join Love & Photos')).toBeInTheDocument()
    expect(screen.getByText('Photographer')).toBeInTheDocument()
    expect(screen.getByText('Videographer')).toBeInTheDocument()
  })

  it('should navigate to videographer application form when videographer is selected', () => {
    renderApplication()

    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    expect(screen.getByText('Videographer Application')).toBeInTheDocument()
  })

  it('should display all 6 critical eligibility questions for videographers', () => {
    renderApplication()

    // Select videographer role
    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    // Check all 6 critical questions are present
    expect(screen.getByText(/Are you at least 18 years of age/)).toBeInTheDocument()
    expect(screen.getByText(/Do you have reliable transportation/)).toBeInTheDocument()
    expect(screen.getByText(/Are you willing to accept work for \$40 per hour/)).toBeInTheDocument()
    expect(screen.getByText(/Do you have gear to record sound/)).toBeInTheDocument()
    expect(screen.getByText(/Are you open to filming weddings of all backgrounds/)).toBeInTheDocument()
    expect(screen.getByText(/Is your camera professional-grade/)).toBeInTheDocument()
  })

  it('should display additional questions section for videographers', () => {
    renderApplication()

    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    // Check additional questions are present
    expect(screen.getByText(/Do you have a drone/)).toBeInTheDocument()
    expect(screen.getByText(/How many years of experience do you have in wedding videography/)).toBeInTheDocument()
    expect(screen.getByText(/Did someone refer you/)).toBeInTheDocument()
    expect(screen.getByText(/Do you have Instagram/)).toBeInTheDocument()
    expect(screen.getByText(/Do you also offer photography services/)).toBeInTheDocument()
    expect(screen.getByText(/We'd love to get to know you better/)).toBeInTheDocument()
  })

  it('should display terms and conditions checkbox', () => {
    renderApplication()

    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    expect(screen.getByText(/I accept the/)).toBeInTheDocument()
    expect(screen.getByText('Terms and Conditions')).toBeInTheDocument()
  })
})

describe('Videographer Application - Auto-Rejection Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject application if age question is answered "No"', async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { id: 'app-123', is_accepted: false },
          error: null
        }))
      }))
    }))

    supabase.from = vi.fn(() => ({
      insert: mockInsert,
      update: vi.fn(() => ({ eq: vi.fn() }))
    }))

    renderApplication()

    // Select videographer
    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    // Fill in personal info
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'password123' } })

    // Answer first question "No" (age 18+)
    const ageNoRadio = screen.getAllByLabelText('No')[0]
    fireEvent.click(ageNoRadio)

    // Answer rest "Yes"
    const yesRadios = screen.getAllByLabelText('Yes')
    for (let i = 1; i < 6; i++) {
      fireEvent.click(yesRadios[i])
    }

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox')
    fireEvent.click(termsCheckbox)

    // Submit
    const submitButton = screen.getByText('Submit Application')
    fireEvent.click(submitButton)

    // Should show rejection message
    await waitFor(() => {
      expect(screen.getByText('Application Not Approved')).toBeInTheDocument()
    })
  })

  it('should reject application if any critical question is answered "No"', async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { id: 'app-123', is_accepted: false },
          error: null
        }))
      }))
    }))

    supabase.from = vi.fn(() => ({
      insert: mockInsert
    }))

    renderApplication()

    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    // Fill personal info
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'password123' } })

    // Answer all "Yes" except one critical question (e.g., audio equipment)
    const yesRadios = screen.getAllByLabelText('Yes')
    yesRadios.forEach((radio, idx) => {
      if (idx !== 3) fireEvent.click(radio) // Skip audio equipment question
    })

    const noRadios = screen.getAllByLabelText('No')
    fireEvent.click(noRadios[3]) // Answer "No" to audio equipment

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox')
    fireEvent.click(termsCheckbox)

    // Submit
    const submitButton = screen.getByText('Submit Application')
    fireEvent.click(submitButton)

    // Should save to database with is_accepted: false
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            is_accepted: false,
            rejection_reason: expect.stringContaining('Failed requirement')
          })
        ])
      )
    })
  })
})

describe('Videographer Application - Successful Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should accept application when all critical questions are "Yes"', async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { id: 'app-123', is_accepted: true },
          error: null
        }))
      }))
    }))

    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))

    supabase.from = vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate
    }))

    renderApplication()

    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    // Fill all required fields
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Success User' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'success@example.com' } })
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'password123' } })

    // Answer all critical questions "Yes"
    const yesRadios = screen.getAllByLabelText('Yes')
    yesRadios.forEach(radio => fireEvent.click(radio))

    // Fill additional questions
    fireEvent.change(screen.getByPlaceholderText(/e.g., 3 years/), { target: { value: '5 years' } })
    fireEvent.change(screen.getByPlaceholderText(/@yourhandle/), { target: { value: '@johndoe' } })

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox')
    fireEvent.click(termsCheckbox)

    // Submit
    const submitButton = screen.getByText('Submit Application')
    fireEvent.click(submitButton)

    // Should save with is_accepted: true
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            is_accepted: true,
            full_name: 'Success User',
            email: 'success@example.com',
            role: 'videographer',
            answers: expect.objectContaining({
              years_experience: '5 years',
              instagram_handle: '@johndoe'
            })
          })
        ])
      )
    })
  })

  it('should redirect to dashboard on successful application', async () => {
    const mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { id: 'app-123', is_accepted: true },
          error: null
        }))
      }))
    }))

    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))

    supabase.from = vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate
    }))

    renderApplication()

    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    // Fill form with all "Yes" answers
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Redirect Test' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'redirect@example.com' } })
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'password123' } })

    const yesRadios = screen.getAllByLabelText('Yes')
    yesRadios.forEach(radio => fireEvent.click(radio))

    const termsCheckbox = screen.getByRole('checkbox')
    fireEvent.click(termsCheckbox)

    const submitButton = screen.getByText('Submit Application')
    fireEvent.click(submitButton)

    // Should navigate to dashboard after 2 seconds
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/talent/dashboard')
    }, { timeout: 3000 })
  })
})

describe('Videographer Application - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require terms acceptance before submission', async () => {
    renderApplication()

    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    // Fill all fields except terms
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'No Terms User' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'noterms@example.com' } })
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'password123' } })

    const yesRadios = screen.getAllByLabelText('Yes')
    yesRadios.forEach(radio => fireEvent.click(radio))

    // Don't click terms checkbox

    const submitButton = screen.getByText('Submit Application')
    fireEvent.click(submitButton)

    // Should show error toast
    await waitFor(() => {
      expect(screen.getByText(/Please accept the Terms and Conditions/)).toBeInTheDocument()
    })
  })

  it('should validate password matching', async () => {
    renderApplication()

    const videographerButton = screen.getByText('Apply as Videographer').closest('button')
    fireEvent.click(videographerButton)

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Password Mismatch' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'mismatch@example.com' } })
    fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: 'different456' } })

    const submitButton = screen.getByText('Submit Application')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/)).toBeInTheDocument()
    })
  })
})
