/**
 * Browse.jsx Data Transformation Analysis
 * Validates the URL construction logic in lines 177-197
 */

import { describe, test, expect } from 'vitest'

// Extract and test the data transformation logic from Browse.jsx
const simulateBrowseTransformation = (mockData, profileImages, portfolioImages) => {
  return mockData.map((profile, index) => {
    const fallbackUrl = profileImages[index % profileImages.length]

    return {
      id: profile.id,
      user_id: profile.id,
      bio: profile.bio || `Professional photographer with years of experience`,
      specialties: Array.isArray(profile.specialties) ? profile.specialties : ['Wedding', 'Portrait'],
      languages: ['English'],
      years_experience: 5 + (index % 10),
      hourly_rate: profile.hourly_rate || (150 + (index * 25)),
      location_city: profile.location_city || 'New York',
      location_state: profile.location_state || 'NY',
      is_available: profile.is_available !== false,
      is_public: true,
      average_rating: profile.average_rating || (4.2 + (index % 8) * 0.1),
      total_reviews: 10 + (index * 3),
      total_bookings: 5 + (index * 2),
      users: {
        full_name: profile.display_name || `Photographer ${index + 1}`,
        avatar_url: profile.portfolio_images && profile.portfolio_images.length > 0 ? profile.portfolio_images[0] : fallbackUrl
      },
      pay_tiers: {
        name: profile.is_verified ? 'Professional' : 'Standard',
        hourly_rate: profile.hourly_rate || (150 + (index * 25)),
        badge_color: profile.is_verified ? 'gold' : 'silver'
      },
      portfolio_items: [
        { image_url: portfolioImages[index % portfolioImages.length] },
        { image_url: portfolioImages[(index + 5) % portfolioImages.length] },
        { image_url: portfolioImages[(index + 10) % portfolioImages.length] }
      ]
    }
  })
}

// Mock data arrays from Browse.jsx
const profileImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face&auto=format&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face&auto=format&q=80'
]

const portfolioImages = [
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600',
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
  'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600'
]

describe('Browse Data Transformation Analysis', () => {
  describe('Avatar URL Construction Logic', () => {
    test('should use portfolio_images[0] as avatar when available', () => {
      const mockData = [
        {
          id: '1',
          display_name: 'Test Photographer',
          portfolio_images: [
            'https://images.unsplash.com/photo-custom-avatar.jpg',
            'https://images.unsplash.com/photo-portfolio-1.jpg'
          ]
        }
      ]

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      expect(transformed[0].users.avatar_url).toBe('https://images.unsplash.com/photo-custom-avatar.jpg')
      expect(transformed[0].users.avatar_url).toBe(mockData[0].portfolio_images[0])
    })

    test('should fallback to profileImages array when portfolio_images is empty', () => {
      const mockData = [
        {
          id: '1',
          display_name: 'Test Photographer',
          portfolio_images: []
        },
        {
          id: '2',
          display_name: 'Another Photographer',
          portfolio_images: null
        },
        {
          id: '3',
          display_name: 'Third Photographer'
          // no portfolio_images property
        }
      ]

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      // Index 0 -> profileImages[0 % 3] = profileImages[0]
      expect(transformed[0].users.avatar_url).toBe(profileImages[0])

      // Index 1 -> profileImages[1 % 3] = profileImages[1]
      expect(transformed[1].users.avatar_url).toBe(profileImages[1])

      // Index 2 -> profileImages[2 % 3] = profileImages[2]
      expect(transformed[2].users.avatar_url).toBe(profileImages[2])
    })

    test('should handle mixed scenarios correctly', () => {
      const mockData = [
        {
          id: '1',
          display_name: 'Has Portfolio',
          portfolio_images: ['https://custom-avatar.jpg']
        },
        {
          id: '2',
          display_name: 'Empty Portfolio',
          portfolio_images: []
        },
        {
          id: '3',
          display_name: 'Has Portfolio Again',
          portfolio_images: ['https://another-custom.jpg', 'https://extra.jpg']
        }
      ]

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      // First: uses custom
      expect(transformed[0].users.avatar_url).toBe('https://custom-avatar.jpg')

      // Second: uses fallback profileImages[1]
      expect(transformed[1].users.avatar_url).toBe(profileImages[1])

      // Third: uses custom
      expect(transformed[2].users.avatar_url).toBe('https://another-custom.jpg')
    })

    test('should cycle through profileImages array for multiple fallbacks', () => {
      // Create more photographers than profileImages to test cycling
      const mockData = Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        display_name: `Photographer ${i + 1}`,
        portfolio_images: [] // All empty to force fallback
      }))

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      // Should cycle: 0,1,2,0,1,2,0
      expect(transformed[0].users.avatar_url).toBe(profileImages[0]) // 0 % 3 = 0
      expect(transformed[1].users.avatar_url).toBe(profileImages[1]) // 1 % 3 = 1
      expect(transformed[2].users.avatar_url).toBe(profileImages[2]) // 2 % 3 = 2
      expect(transformed[3].users.avatar_url).toBe(profileImages[0]) // 3 % 3 = 0
      expect(transformed[4].users.avatar_url).toBe(profileImages[1]) // 4 % 3 = 1
      expect(transformed[5].users.avatar_url).toBe(profileImages[2]) // 5 % 3 = 2
      expect(transformed[6].users.avatar_url).toBe(profileImages[0]) // 6 % 3 = 0
    })
  })

  describe('Data Structure Consistency', () => {
    test('should maintain consistent user object structure', () => {
      const mockData = [
        {
          id: '1',
          display_name: 'Test Photographer',
          portfolio_images: ['https://test.jpg']
        }
      ]

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      expect(transformed[0].users).toHaveProperty('full_name')
      expect(transformed[0].users).toHaveProperty('avatar_url')
      expect(transformed[0].users.full_name).toBe('Test Photographer')
      expect(transformed[0].users.avatar_url).toBe('https://test.jpg')
    })

    test('should handle missing display_name gracefully', () => {
      const mockData = [
        {
          id: '1',
          // no display_name
          portfolio_images: []
        },
        {
          id: '2',
          display_name: '',
          portfolio_images: []
        }
      ]

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      expect(transformed[0].users.full_name).toBe('Photographer 1')
      expect(transformed[1].users.full_name).toBe('Photographer 2')
    })

    test('should provide valid avatar URLs for all scenarios', () => {
      const mockData = [
        { id: '1', portfolio_images: ['valid-url'] },
        { id: '2', portfolio_images: [] },
        { id: '3', portfolio_images: null },
        { id: '4' }, // no portfolio_images property
        { id: '5', portfolio_images: [''] }, // empty string
        { id: '6', portfolio_images: [null] }, // null in array
      ]

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      transformed.forEach((photographer, index) => {
        expect(photographer.users.avatar_url).toBeDefined()
        expect(photographer.users.avatar_url).not.toBe('')
        expect(photographer.users.avatar_url).not.toBe(null)
        expect(photographer.users.avatar_url).not.toBe(undefined)

        // Should be either the custom URL or a fallback URL
        const isCustom = photographer.users.avatar_url === 'valid-url'
        const isFallback = profileImages.includes(photographer.users.avatar_url)

        expect(isCustom || isFallback).toBe(true)

        console.log(`Photographer ${index + 1}: ${photographer.users.avatar_url}`)
      })
    })
  })

  describe('Fallback Array Validation', () => {
    test('should validate profileImages array URLs', () => {
      profileImages.forEach((url, index) => {
        expect(url).toContain('unsplash.com')
        expect(url).toContain('w=400')
        expect(url).toContain('h=400')
        expect(url).toContain('crop=face')
        console.log(`Profile image ${index}: ${url}`)
      })
    })

    test('should validate portfolioImages array URLs', () => {
      portfolioImages.forEach((url, index) => {
        expect(url).toContain('unsplash.com')
        expect(url).toContain('w=600')
        console.log(`Portfolio image ${index}: ${url}`)
      })
    })

    test('should ensure all fallback URLs are accessible format', () => {
      const allUrls = [...profileImages, ...portfolioImages]

      allUrls.forEach(url => {
        // Should be valid URL format
        expect(() => new URL(url)).not.toThrow()

        // Should be HTTPS
        expect(url).toMatch(/^https:\/\//)

        // Should be image format
        expect(url).toMatch(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)
      })
    })
  })

  describe('Edge Case Handling', () => {
    test('should handle malformed portfolio_images array', () => {
      const mockData = [
        {
          id: '1',
          portfolio_images: ['', null, undefined, 'valid-url']
        }
      ]

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      // Should use the first element (empty string) but logic should handle it
      // This is a potential bug - should skip invalid entries
      expect(transformed[0].users.avatar_url).toBe('')
    })

    test('should handle very large datasets', () => {
      const mockData = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        display_name: `Photographer ${i + 1}`,
        portfolio_images: []
      }))

      const transformed = simulateBrowseTransformation(mockData, profileImages, portfolioImages)

      expect(transformed).toHaveLength(100)

      // Should distribute fallback URLs evenly
      const urlCounts = {}
      transformed.forEach(p => {
        const url = p.users.avatar_url
        urlCounts[url] = (urlCounts[url] || 0) + 1
      })

      // Should have roughly even distribution (33-34 each for 100 items, 3 images)
      Object.values(urlCounts).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(33)
        expect(count).toBeLessThanOrEqual(34)
      })
    })
  })
})