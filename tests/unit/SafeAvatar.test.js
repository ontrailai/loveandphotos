/**
 * SafeAvatar Unit Tests
 * Testing URL validation logic and component behavior
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SafeAvatar from '@components/shared/SafeAvatar'

// Mock the debug logging to avoid console spam in tests
vi.mock('process', () => ({
  env: { NODE_ENV: 'test' }
}))

describe('SafeAvatar', () => {
  describe('URL Validation Logic', () => {
    const testValidImageUrl = async () => {
      // Import the validation function by rendering and extracting
      const { isValidImageUrl } = await import('@components/shared/SafeAvatar')
      return isValidImageUrl
    }

    test('should validate common avatar URL patterns', async () => {
      const validUrls = [
        'https://images.unsplash.com/photo-123/avatar.jpg',
        'https://gravatar.com/avatar/123',
        'https://github.com/user/avatar.png',
        'https://googleusercontent.com/profile/photo.jpg',
        'https://example.supabase.co/storage/avatars/user.png',
        'https://cdn.example.com/photos/headshot.jpeg',
        '/assets/profile.jpg',
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
      ]

      // Test each URL by creating components and checking rendering
      for (const url of validUrls) {
        render(<SafeAvatar src={url} name="Test User" />)

        // If URL is valid, should render img element
        const avatar = screen.getByRole('img', { hidden: true })
        expect(avatar).toBeInTheDocument()
        expect(avatar.src).toBe(url.startsWith('/') || url.startsWith('data:') ? url : url)
      }
    })

    test('should reject invalid URL patterns', async () => {
      const invalidUrls = [
        '',
        null,
        undefined,
        'not-a-url',
        'ftp://example.com/file.jpg',
        'https://example.com/document.pdf',
        'javascript:alert(1)',
        'https://malicious.com/script.js'
      ]

      for (const url of invalidUrls) {
        const { container } = render(<SafeAvatar src={url} name="Test User" />)

        // Should not render img element, should show initials instead
        const imgElements = container.querySelectorAll('img')
        expect(imgElements).toHaveLength(0)

        // Should show initials
        const initials = screen.getByText('TU') // Test User -> TU
        expect(initials).toBeInTheDocument()
      }
    })

    test('should handle Browse.jsx portfolio URLs correctly', () => {
      const browseUrlPattern = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80'

      render(<SafeAvatar src={browseUrlPattern} name="Photographer" />)

      // Should render img element for unsplash URLs
      const avatar = screen.getByRole('img', { hidden: true })
      expect(avatar).toBeInTheDocument()
      expect(avatar.src).toBe(browseUrlPattern)
    })
  })

  describe('Component Behavior', () => {
    test('should show initials when no valid src provided', () => {
      render(<SafeAvatar name="John Doe" />)

      const initials = screen.getByText('JD')
      expect(initials).toBeInTheDocument()
    })

    test('should show initials when image fails to load', async () => {
      // Mock image load failure
      const mockImage = {
        addEventListener: vi.fn((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler({ type: 'error' }), 100)
          }
        }),
        removeEventListener: vi.fn(),
        src: 'https://images.unsplash.com/nonexistent.jpg'
      }

      global.Image = vi.fn(() => mockImage)

      render(<SafeAvatar src="https://images.unsplash.com/nonexistent.jpg" name="Test User" />)

      // Initially should try to load image
      let avatar = screen.queryByRole('img', { hidden: true })
      expect(avatar).toBeInTheDocument()

      // After error, should show initials
      await waitFor(() => {
        const initials = screen.getByText('TU')
        expect(initials).toBeInTheDocument()
      })
    })

    test('should force initials when forceInitials=true', () => {
      render(<SafeAvatar src="https://images.unsplash.com/valid.jpg" name="Jane Smith" forceInitials={true} />)

      // Should show initials despite valid src
      const initials = screen.getByText('JS')
      expect(initials).toBeInTheDocument()

      // Should not render img element
      const avatar = screen.queryByRole('img', { hidden: true })
      expect(avatar).not.toBeInTheDocument()
    })

    test('should render different sizes correctly', () => {
      const { container: smallContainer } = render(
        <SafeAvatar name="User" size="sm" />
      )
      const { container: largeContainer } = render(
        <SafeAvatar name="User" size="lg" />
      )

      const smallAvatar = smallContainer.querySelector('.w-10.h-10')
      const largeAvatar = largeContainer.querySelector('.w-16.h-16')

      expect(smallAvatar).toBeInTheDocument()
      expect(largeAvatar).toBeInTheDocument()
    })

    test('should generate consistent colors for same names', () => {
      const { container: container1 } = render(<SafeAvatar name="John Smith" />)
      const { container: container2 } = render(<SafeAvatar name="John Smith" />)

      const avatar1 = container1.querySelector('[class*="bg-gradient-to-br"]')
      const avatar2 = container2.querySelector('[class*="bg-gradient-to-br"]')

      // Both should have same gradient class (consistent hashing)
      expect(avatar1.className).toBe(avatar2.className)
    })
  })

  describe('Browse.jsx Integration', () => {
    test('should handle typical Browse.jsx photographer data structure', () => {
      const photographerData = {
        users: {
          full_name: 'Sarah Johnson',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face&auto=format&q=80'
        }
      }

      render(
        <SafeAvatar
          src={photographerData.users?.avatar_url}
          name={photographerData.users?.full_name}
          size="sm"
        />
      )

      // Should render image for valid unsplash URL
      const avatar = screen.getByRole('img', { hidden: true })
      expect(avatar).toBeInTheDocument()
      expect(avatar.src).toBe(photographerData.users.avatar_url)
    })

    test('should handle fallback when portfolio_images[0] is used as avatar', () => {
      const photographerData = {
        users: {
          full_name: 'Mike Wilson'
        },
        portfolio_images: [
          'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600'
        ]
      }

      render(
        <SafeAvatar
          src={photographerData.portfolio_images?.[0]}
          name={photographerData.users?.full_name}
          size="sm"
        />
      )

      // Should render image for portfolio URL
      const avatar = screen.getByRole('img', { hidden: true })
      expect(avatar).toBeInTheDocument()
    })

    test('should show initials when no image data available', () => {
      const photographerData = {
        users: {
          full_name: 'Alex Chen'
        }
        // No avatar_url or portfolio_images
      }

      render(
        <SafeAvatar
          src={photographerData.users?.avatar_url}
          name={photographerData.users?.full_name}
          size="sm"
        />
      )

      // Should show initials
      const initials = screen.getByText('AC')
      expect(initials).toBeInTheDocument()
    })
  })
})

// Helper function to test URL validation directly
export const testUrlValidation = (url) => {
  const { container } = render(<SafeAvatar src={url} name="Test" />)
  const hasImg = container.querySelector('img') !== null
  const hasInitials = container.querySelector('span') !== null

  return {
    hasImg,
    hasInitials,
    renderType: hasImg ? 'image' : hasInitials ? 'initials' : 'icon'
  }
}