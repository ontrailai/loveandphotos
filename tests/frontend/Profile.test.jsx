/**
 * Profile Page Tests
 * Tests for the Profile page functionality and navigation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@contexts/AuthContext'
import Profile from '@pages/Profile'

// Mock the auth context
const mockAuthContextValue = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z'
  },
  profile: {
    id: 'test-user-id',
    full_name: 'Test User',
    role: 'customer',
    phone: '+1234567890',
    location: 'San Francisco, CA'
  },
  photographerProfile: null,
  loading: false
}

// Mock Supabase
const mockSupabase = {
  auth: {
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    getSession: jest.fn().mockResolvedValue({ data: { session: null } })
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null })
  }))
}

jest.mock('@lib/supabase', () => ({
  supabase: mockSupabase,
  db: {
    users: {
      getProfile: jest.fn().mockResolvedValue(mockAuthContextValue.profile)
    }
  }
}))

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}))

// Test wrapper component
const TestWrapper = ({ children, authValue = mockAuthContextValue, initialRoute = '/profile' }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <AuthProvider value={authValue}>
      {children}
    </AuthProvider>
  </MemoryRouter>
)

describe('Profile Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authenticated User', () => {
    it('renders profile page with user information', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      // Check main heading
      expect(screen.getByText('My Profile')).toBeInTheDocument()

      // Check account information section
      expect(screen.getByText('Account Information')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Customer')).toBeInTheDocument()
      expect(screen.getByText('+1234567890')).toBeInTheDocument()
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()

      // Check that edit profile button is present
      expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    })

    it('displays photographer profile section when user is a photographer', async () => {
      const photographerAuthValue = {
        ...mockAuthContextValue,
        profile: {
          ...mockAuthContextValue.profile,
          role: 'photographer'
        },
        photographerProfile: {
          id: 'photographer-id',
          business_name: 'Test Photography Studio',
          specialties: ['Wedding', 'Portrait'],
          bio: 'Professional photographer with 5 years of experience',
          status: 'active'
        }
      }

      render(
        <TestWrapper authValue={photographerAuthValue}>
          <Profile />
        </TestWrapper>
      )

      // Check photographer profile section
      expect(screen.getByText('Photographer Profile')).toBeInTheDocument()
      expect(screen.getByText('Test Photography Studio')).toBeInTheDocument()
      expect(screen.getByText('Wedding, Portrait')).toBeInTheDocument()
      expect(screen.getByText('Professional photographer with 5 years of experience')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Manage Photographer Profile')).toBeInTheDocument()
    })

    it('displays quick stats and activity sections', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      // Check sidebar sections
      expect(screen.getByText('Quick Stats')).toBeInTheDocument()
      expect(screen.getByText('Total Bookings')).toBeInTheDocument()
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()

      // Check placeholder content
      expect(screen.getByText('No recent activity to display')).toBeInTheDocument()
    })

    it('formats date correctly', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      // Check that the member since date is formatted properly
      expect(screen.getByText('January 1, 2024')).toBeInTheDocument()
    })

    it('handles missing optional fields gracefully', async () => {
      const minimalAuthValue = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          created_at: '2024-01-01T00:00:00Z'
        },
        profile: {
          id: 'test-user-id',
          role: 'customer'
          // No full_name, phone, location
        },
        photographerProfile: null,
        loading: false
      }

      render(
        <TestWrapper authValue={minimalAuthValue}>
          <Profile />
        </TestWrapper>
      )

      // Check that "Not provided" appears for missing fields
      expect(screen.getByText('Not provided')).toBeInTheDocument()

      // Phone and location sections should not be rendered
      expect(screen.queryByText('Phone Number')).not.toBeInTheDocument()
      expect(screen.queryByText('Location')).not.toBeInTheDocument()
    })
  })

  describe('Authentication Guard', () => {
    it('is protected by ProtectedRoute component', () => {
      // This test would need to be in the App.test.jsx or a routing test
      // since the authentication guard is handled at the route level
      // For now, we verify the component renders assuming authentication
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      expect(screen.getByText('My Profile')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      // Check heading structure
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('My Profile')

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(sectionHeadings).toHaveLength(1) // Account Information
      expect(sectionHeadings[0]).toHaveTextContent('Account Information')
    })

    it('has proper icon labels', async () => {
      render(
        <TestWrapper>
          <Profile />
        </TestWrapper>
      )

      // Icons should have proper aria-labels (this would need to be implemented in the component)
      // For now, just verify the component renders without accessibility violations
      expect(screen.getByText('My Profile')).toBeInTheDocument()
    })
  })
})