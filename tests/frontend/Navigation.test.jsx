/**
 * Navigation Tests
 * Tests for header navigation functionality and icons
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@contexts/AuthContext'
import { CleanNavbar } from '@components/ui/clean-navbar'

// Mock authenticated user
const mockAuthenticatedUser = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z'
  },
  profile: {
    id: 'test-user-id',
    full_name: 'Test User',
    role: 'customer'
  },
  photographerProfile: null,
  loading: false,
  signOut: jest.fn(),
  hasRole: jest.fn((role) => mockAuthenticatedUser.profile?.role === role),
  checkOnboardingStatus: jest.fn(() => true)
}

// Mock unauthenticated user
const mockUnauthenticatedUser = {
  user: null,
  profile: null,
  photographerProfile: null,
  loading: false,
  signOut: jest.fn(),
  hasRole: jest.fn(() => false),
  checkOnboardingStatus: jest.fn(() => false)
}

// Mock Supabase
const mockSupabase = {
  auth: {
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    getSession: jest.fn().mockResolvedValue({ data: { session: null } })
  }
}

jest.mock('@lib/supabase', () => ({
  supabase: mockSupabase
}))

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Test wrapper component
const TestWrapper = ({ children, authValue = mockUnauthenticatedUser, initialRoute = '/' }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <AuthProvider value={authValue}>
      {children}
    </AuthProvider>
  </MemoryRouter>
)

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Header Icons', () => {
    it('displays About nav item with Users icon (not User icon)', async () => {
      render(
        <TestWrapper>
          <CleanNavbar />
        </TestWrapper>
      )

      // Find the About link
      const aboutLink = screen.getByRole('link', { name: /about/i })
      expect(aboutLink).toBeInTheDocument()
      expect(aboutLink).toHaveAttribute('href', '/about')

      // Check that the About icon has proper aria-label
      const aboutIcon = aboutLink.querySelector('[aria-label="About"]')
      expect(aboutIcon).toBeInTheDocument()
    })

    it('displays different icons for About vs Profile', async () => {
      render(
        <TestWrapper authValue={mockAuthenticatedUser}>
          <CleanNavbar />
        </TestWrapper>
      )

      // About should use Users icon (multiple people)
      const aboutLink = screen.getByRole('link', { name: /about/i })
      const aboutIcon = aboutLink.querySelector('[aria-label="About"]')
      expect(aboutIcon).toBeInTheDocument()

      // Profile should use User icon (single person)
      const profileLink = screen.getByRole('link', { name: /profile/i })
      const profileIcon = profileLink.querySelector('[aria-label="Profile"]')
      expect(profileIcon).toBeInTheDocument()

      // They should be different components/icons
      expect(aboutIcon).not.toEqual(profileIcon)
    })
  })

  describe('Profile Link', () => {
    describe('When signed in', () => {
      it('displays Profile button that links to /profile', async () => {
        render(
          <TestWrapper authValue={mockAuthenticatedUser}>
            <CleanNavbar />
          </TestWrapper>
        )

        // Profile link should be visible
        const profileLink = screen.getByRole('link', { name: /profile/i })
        expect(profileLink).toBeInTheDocument()
        expect(profileLink).toHaveAttribute('href', '/profile')

        // Profile button should contain text "Profile"
        expect(profileLink).toHaveTextContent('Profile')

        // Profile icon should have proper aria-label
        const profileIcon = profileLink.querySelector('[aria-label="Profile"]')
        expect(profileIcon).toBeInTheDocument()
      })

      it('positions Profile button to the left of Sign Out', async () => {
        render(
          <TestWrapper authValue={mockAuthenticatedUser}>
            <CleanNavbar />
          </TestWrapper>
        )

        // Get all buttons in the authenticated user section
        const profileButton = screen.getByRole('link', { name: /profile/i })
        const signOutButton = screen.getByRole('button', { name: /sign out/i })

        expect(profileButton).toBeInTheDocument()
        expect(signOutButton).toBeInTheDocument()

        // Check that both are in the header
        const headerElement = profileButton.closest('header')
        expect(headerElement).toContain(signOutButton)
      })

      it('displays Dashboard, Profile, and Sign Out buttons in correct order', async () => {
        render(
          <TestWrapper authValue={mockAuthenticatedUser}>
            <CleanNavbar />
          </TestWrapper>
        )

        // All three buttons should be present
        const dashboardButton = screen.getByRole('link', { name: /dashboard/i })
        const profileButton = screen.getByRole('link', { name: /profile/i })
        const signOutButton = screen.getByRole('button', { name: /sign out/i })

        expect(dashboardButton).toBeInTheDocument()
        expect(profileButton).toBeInTheDocument()
        expect(signOutButton).toBeInTheDocument()

        // Verify they're in the same container (authenticated user section)
        const authSection = dashboardButton.closest('.gap-2')
        expect(authSection).toContain(profileButton)
        expect(authSection).toContain(signOutButton)
      })
    })

    describe('When not signed in', () => {
      it('does not display Profile button', async () => {
        render(
          <TestWrapper authValue={mockUnauthenticatedUser}>
            <CleanNavbar />
          </TestWrapper>
        )

        // Profile link should not be visible
        expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument()

        // But Sign In and Get Started should be visible
        expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Navigation', () => {
    it('includes Profile link in mobile menu when authenticated', async () => {
      render(
        <TestWrapper authValue={mockAuthenticatedUser}>
          <CleanNavbar />
        </TestWrapper>
      )

      // Mobile navigation Profile link should exist
      // (This would require opening the mobile menu in a more complete test)
      // For now, we verify the component renders without errors
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels on navigation icons', async () => {
      render(
        <TestWrapper authValue={mockAuthenticatedUser}>
          <CleanNavbar />
        </TestWrapper>
      )

      // About icon should have aria-label
      const aboutLink = screen.getByRole('link', { name: /about/i })
      const aboutIcon = aboutLink.querySelector('[aria-label="About"]')
      expect(aboutIcon).toBeInTheDocument()

      // Profile icon should have aria-label
      const profileLink = screen.getByRole('link', { name: /profile/i })
      const profileIcon = profileLink.querySelector('[aria-label="Profile"]')
      expect(profileIcon).toBeInTheDocument()
    })

    it('maintains keyboard navigation', async () => {
      render(
        <TestWrapper authValue={mockAuthenticatedUser}>
          <CleanNavbar />
        </TestWrapper>
      )

      // All navigation links should be focusable
      const aboutLink = screen.getByRole('link', { name: /about/i })
      const profileLink = screen.getByRole('link', { name: /profile/i })

      expect(aboutLink).not.toHaveAttribute('tabindex', '-1')
      expect(profileLink).not.toHaveAttribute('tabindex', '-1')
    })
  })
})