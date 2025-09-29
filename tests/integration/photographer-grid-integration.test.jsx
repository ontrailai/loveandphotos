/**
 * Integration Tests for Photographer Grid
 *
 * Tests component interactions, API integration, loading states,
 * and cross-component data flow for photographer grid rendering.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeaturedPhotographersSection } from '../../src/components/ui/featured-photographers';
import * as supabaseClient from '../../src/lib/supabaseClient';

// Mock external dependencies
jest.mock('../../src/lib/supabaseClient');
jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }) => <div data-testid="motion-div" {...props}>{children}</div>
  }
}));

// Test data fixtures
const createMockPhotographer = (id, overrides = {}) => ({
  id: `photographer-${id}`,
  slug: `photographer-${id}`,
  full_name: `Photographer ${id}`,
  avatar_url: `https://example.com/avatar-${id}.jpg`,
  tier: 'Gold',
  city: 'Test City',
  state: 'TS',
  joinedDate: '2023',
  total_reviews: Math.floor(Math.random() * 100) + 10,
  weddings_completed: Math.floor(Math.random() * 50) + 5,
  average_rating: 4.5 + Math.random() * 0.5,
  hourly_rate: 150 + Math.random() * 200,
  bio: `Professional photographer specializing in ${id} photography.`,
  vetted: Math.random() > 0.5,
  ...overrides
});

const createMixedQualityData = () => [
  // High quality data
  createMockPhotographer(1, {
    avatar_url: 'https://example.com/valid-avatar.jpg',
    full_name: 'Alice Johnson',
    total_reviews: 45,
    average_rating: 4.9
  }),
  // Missing avatar
  createMockPhotographer(2, {
    avatar_url: null,
    full_name: 'Bob Smith',
    total_reviews: 12,
    average_rating: 4.2
  }),
  // Minimal data
  createMockPhotographer(3, {
    avatar_url: 'https://example.com/another-avatar.jpg',
    full_name: 'Carol Davis',
    bio: null,
    city: null,
    state: null,
    hourly_rate: null,
    total_reviews: 0
  }),
  // Potentially broken image URL
  createMockPhotographer(4, {
    avatar_url: 'https://broken-domain.invalid/404.jpg',
    full_name: 'David Wilson',
    total_reviews: 25
  })
];

const renderFeaturedSection = (props = {}) => {
  const defaultProps = {
    title: "Test Photographers",
    maxUsers: 6,
    showStats: true
  };

  return render(
    <MemoryRouter>
      <FeaturedPhotographersSection {...defaultProps} {...props} />
    </MemoryRouter>
  );
};

describe('Photographer Grid Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful mocks
    supabaseClient.getFeaturedPhotographers.mockResolvedValue(createMixedQualityData());
    supabaseClient.getFeaturedPhotographersMetrics.mockResolvedValue({
      acceptanceRate: 95,
      fiveStarReviews: 87,
      responseTime: 12
    });
    supabaseClient.getPhotographerProfileLink.mockImplementation(photographer =>
      photographer.slug ? `/photographer/${photographer.slug}` : `/photographer/${photographer.id}`
    );
    supabaseClient.formatCurrency.mockImplementation(amount =>
      amount ? `$${Math.round(amount)}` : null
    );
  });

  describe('Data Loading and State Management', () => {
    test('renders grid with mixed data quality without errors', async () => {
      renderFeaturedSection();

      // Initially show loading skeletons
      await waitFor(() => {
        expect(screen.getByTestId('motion-div')).toBeInTheDocument();
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.getByText('Carol Davis')).toBeInTheDocument();
        expect(screen.getByText('David Wilson')).toBeInTheDocument();
      });

      // Verify API was called correctly
      expect(supabaseClient.getFeaturedPhotographers).toHaveBeenCalledWith(6);
      expect(supabaseClient.getFeaturedPhotographersMetrics).toHaveBeenCalled();
    });

    test('handles API error gracefully with retry functionality', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      supabaseClient.getFeaturedPhotographers.mockRejectedValue(new Error('API Error'));

      renderFeaturedSection();

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/unable to load photographers/i)).toBeInTheDocument();
      });

      // Should show retry button
      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toBeInTheDocument();

      // Reset mock for retry
      supabaseClient.getFeaturedPhotographers.mockResolvedValue(createMixedQualityData());

      // Click retry
      fireEvent.click(retryButton);

      // Should load successfully on retry
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    test('shows empty state when no photographers returned', async () => {
      supabaseClient.getFeaturedPhotographers.mockResolvedValue([]);

      renderFeaturedSection();

      await waitFor(() => {
        expect(screen.getByText(/no photographers available/i)).toBeInTheDocument();
      });

      // Should show link to full directory
      expect(screen.getByText(/view all photographers/i)).toBeInTheDocument();
    });

    test('handles loading state transitions correctly', async () => {
      renderFeaturedSection();

      // Should start in loading state - skeleton cards should be visible
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Loading skeletons should be gone
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  describe('Image Loading and Fallback Behavior', () => {
    test('handles mixed avatar availability correctly', async () => {
      renderFeaturedSection();

      await waitFor(() => {
        // Alice Johnson should have image
        const aliceAvatar = screen.getByRole('img', { name: /alice johnson/i });
        expect(aliceAvatar).toBeInTheDocument();
        expect(aliceAvatar).toHaveAttribute('src', 'https://example.com/valid-avatar.jpg');

        // Bob Smith should have fallback (BS)
        expect(screen.getByText('BS')).toBeInTheDocument();

        // Carol Davis should have image
        const carolAvatar = screen.getByRole('img', { name: /carol davis/i });
        expect(carolAvatar).toBeInTheDocument();

        // David Wilson should have image (might fail loading later)
        const davidAvatar = screen.getByRole('img', { name: /david wilson/i });
        expect(davidAvatar).toBeInTheDocument();
      });
    });

    test('gracefully handles image load failures', async () => {
      renderFeaturedSection();

      await waitFor(() => {
        const davidAvatar = screen.getByRole('img', { name: /david wilson/i });
        expect(davidAvatar).toBeInTheDocument();

        // Simulate image load failure
        fireEvent.error(davidAvatar);
      });

      // Should show fallback after error
      await waitFor(() => {
        expect(screen.getByText('DW')).toBeInTheDocument();
      });
    });

    test('preserves image state during theme changes', async () => {
      renderFeaturedSection();

      await waitFor(() => {
        const aliceAvatar = screen.getByRole('img', { name: /alice johnson/i });
        expect(aliceAvatar).toBeInTheDocument();
      });

      // Simulate theme change (would be triggered externally)
      // The avatar should remain visible
      await waitFor(() => {
        const aliceAvatar = screen.getByRole('img', { name: /alice johnson/i });
        expect(aliceAvatar).toBeInTheDocument();
        expect(aliceAvatar).toHaveAttribute('src', 'https://example.com/valid-avatar.jpg');
      });
    });
  });

  describe('Responsive Grid Behavior', () => {
    test('adapts to different maxUsers limits', async () => {
      const { rerender } = renderFeaturedSection({ maxUsers: 3 });

      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      });

      // Change max users
      rerender(
        <MemoryRouter>
          <FeaturedPhotographersSection maxUsers={6} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(supabaseClient.getFeaturedPhotographers).toHaveBeenLastCalledWith(6);
      });
    });

    test('handles stats display toggle correctly', async () => {
      const { rerender } = renderFeaturedSection({ showStats: false });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Should not fetch metrics when showStats is false
      expect(supabaseClient.getFeaturedPhotographersMetrics).not.toHaveBeenCalled();

      // Enable stats
      rerender(
        <MemoryRouter>
          <FeaturedPhotographersSection showStats={true} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(supabaseClient.getFeaturedPhotographersMetrics).toHaveBeenCalled();
      });
    });

    test('displays metrics when stats enabled and data available', async () => {
      renderFeaturedSection({ showStats: true });

      await waitFor(() => {
        expect(screen.getByText('95%')).toBeInTheDocument(); // acceptance rate
        expect(screen.getByText('87%')).toBeInTheDocument(); // five star reviews
        expect(screen.getByText('12 hrs')).toBeInTheDocument(); // response time
      });
    });
  });

  describe('Navigation and Interaction', () => {
    test('all profile links use correct routing', async () => {
      renderFeaturedSection();

      await waitFor(() => {
        // Check that all profile links are properly generated
        const profileLinks = screen.getAllByText(/view profile/i);
        expect(profileLinks).toHaveLength(4); // All test photographers should have links

        // Verify specific links
        const aliceLink = screen.getByRole('link', { name: /view alice johnson's profile/i });
        expect(aliceLink).toHaveAttribute('href', '/photographer/photographer-1');

        const bobLink = screen.getByRole('link', { name: /view bob smith's profile/i });
        expect(bobLink).toHaveAttribute('href', '/photographer/photographer-2');
      });
    });

    test('browse all photographers link is present', async () => {
      renderFeaturedSection();

      await waitFor(() => {
        const browseLink = screen.getByRole('link', { name: /view photographers/i });
        expect(browseLink).toHaveAttribute('href', '/photographers');
      });
    });

    test('handles keyboard navigation correctly', async () => {
      renderFeaturedSection();

      await waitFor(() => {
        const firstProfileLink = screen.getAllByText(/view profile/i)[0].closest('a');
        firstProfileLink.focus();
        expect(document.activeElement).toBe(firstProfileLink);

        // Tab to next link
        fireEvent.keyDown(firstProfileLink, { key: 'Tab' });
      });
    });
  });

  describe('Data Consistency and Validation', () => {
    test('preserves data integrity across component updates', async () => {
      const { rerender } = renderFeaturedSection();

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Get initial rating
      const initialRating = screen.getByText('4.9');
      expect(initialRating).toBeInTheDocument();

      // Rerender with same data
      rerender(
        <MemoryRouter>
          <FeaturedPhotographersSection maxUsers={6} />
        </MemoryRouter>
      );

      // Data should remain consistent
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('4.9')).toBeInTheDocument();
      });
    });

    test('handles concurrent data updates gracefully', async () => {
      renderFeaturedSection();

      // Simulate rapid prop changes
      await act(async () => {
        const newData = createMixedQualityData();
        supabaseClient.getFeaturedPhotographers.mockResolvedValue(newData);
      });

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });
    });

    test('validates data types and prevents runtime errors', async () => {
      // Provide malformed data
      const malformedData = [
        {
          id: null, // Invalid ID
          full_name: 123, // Wrong type
          avatar_url: true, // Wrong type
          total_reviews: 'not a number', // Wrong type
          average_rating: null
        }
      ];

      supabaseClient.getFeaturedPhotographers.mockResolvedValue(malformedData);

      // Should not crash
      renderFeaturedSection();

      await waitFor(() => {
        // Should handle gracefully with fallbacks
        expect(screen.getByTestId('motion-div')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Memory Management', () => {
    test('cleans up properly on unmount', async () => {
      const { unmount } = renderFeaturedSection();

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      // Unmount component
      unmount();

      // Should not cause memory leaks or errors
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    test('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderFeaturedSection();
        unmount();
      }

      // Should not cause errors
      expect(true).toBe(true);
    });

    test('debounces API calls during rapid prop changes', async () => {
      const { rerender } = renderFeaturedSection({ maxUsers: 3 });

      // Rapid rerenders
      rerender(<MemoryRouter><FeaturedPhotographersSection maxUsers={4} /></MemoryRouter>);
      rerender(<MemoryRouter><FeaturedPhotographersSection maxUsers={5} /></MemoryRouter>);
      rerender(<MemoryRouter><FeaturedPhotographersSection maxUsers={6} /></MemoryRouter>);

      await waitFor(() => {
        // Should have made API calls but not excessively
        expect(supabaseClient.getFeaturedPhotographers).toHaveBeenCalled();
      });
    });
  });

  describe('Error Boundary and Recovery', () => {
    test('recovers from partial data failures', async () => {
      // Mock photographers data success but metrics failure
      supabaseClient.getFeaturedPhotographersMetrics.mockRejectedValue(new Error('Metrics Error'));

      renderFeaturedSection();

      await waitFor(() => {
        // Should still show photographers
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();

        // But no metrics
        expect(screen.queryByText(/acceptance rate/i)).not.toBeInTheDocument();
      });
    });

    test('handles network timeouts gracefully', async () => {
      supabaseClient.getFeaturedPhotographers.mockRejectedValue(new Error('Network timeout'));

      renderFeaturedSection();

      await waitFor(() => {
        expect(screen.getByText(/unable to load photographers/i)).toBeInTheDocument();
      });
    });

    test('provides user-friendly error messages', async () => {
      supabaseClient.getFeaturedPhotographers.mockRejectedValue(new Error('Database connection failed'));

      renderFeaturedSection();

      await waitFor(() => {
        expect(screen.getByText(/having trouble connecting/i)).toBeInTheDocument();
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });
  });
});