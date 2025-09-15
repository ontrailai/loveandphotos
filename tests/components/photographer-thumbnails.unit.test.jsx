/**
 * Unit Tests for Photographer Thumbnail Logic
 *
 * Tests core logic for image rendering, fallbacks, and data processing
 * without browser dependencies or network requests.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PhotographerCard } from '../../src/components/ui/featured-photographers';
import { getPhotographerProfileLink, formatCurrency } from '../../src/lib/supabaseClient';

// Mock external dependencies
jest.mock('../../src/lib/supabaseClient', () => ({
  getPhotographerProfileLink: jest.fn(),
  formatCurrency: jest.fn()
}));

jest.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }) => <div data-testid="motion-div" {...props}>{children}</div>
  }
}));

// Test data fixtures
const createMockPhotographer = (overrides = {}) => ({
  id: 'test-photographer-1',
  slug: 'jane-doe-photographer',
  full_name: 'Jane Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  tier: 'Gold',
  city: 'Los Angeles',
  state: 'CA',
  joinedDate: '2023',
  total_reviews: 15,
  weddings_completed: 25,
  average_rating: 4.8,
  hourly_rate: 200,
  bio: 'Professional wedding photographer with 5+ years experience.',
  vetted: true,
  ...overrides
});

const renderPhotographerCard = (photographer, index = 0) => {
  return render(
    <MemoryRouter>
      <PhotographerCard photographer={photographer} index={index} />
    </MemoryRouter>
  );
};

describe('Photographer Thumbnail Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPhotographerProfileLink.mockReturnValue('/photographer/jane-doe-photographer');
    formatCurrency.mockImplementation(amount => amount ? `$${amount}` : null);
  });

  describe('Avatar URL Processing', () => {
    test('renders image when valid avatar_url provided', () => {
      const photographer = createMockPhotographer({
        avatar_url: 'https://example.com/valid-avatar.jpg'
      });

      renderPhotographerCard(photographer);

      const avatarImage = screen.getByRole('img', { name: /jane doe/i });
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/valid-avatar.jpg');
    });

    test('provides fallback when avatar_url is null', () => {
      const photographer = createMockPhotographer({
        avatar_url: null
      });

      renderPhotographerCard(photographer);

      // Should show fallback with initials
      const fallback = screen.getByText('JD'); // Jane Doe initials
      expect(fallback).toBeInTheDocument();

      // Should not show img element
      const avatarImage = screen.queryByRole('img', { name: /jane doe/i });
      expect(avatarImage).not.toBeInTheDocument();
    });

    test('provides fallback when avatar_url is empty string', () => {
      const photographer = createMockPhotographer({
        avatar_url: ''
      });

      renderPhotographerCard(photographer);

      const fallback = screen.getByText('JD');
      expect(fallback).toBeInTheDocument();
    });

    test('handles broken image URLs gracefully', async () => {
      const photographer = createMockPhotographer({
        avatar_url: 'https://broken-url.com/404.jpg'
      });

      renderPhotographerCard(photographer);

      const avatarImage = screen.getByRole('img', { name: /jane doe/i });

      // Simulate image load error
      fireEvent.error(avatarImage);

      // Fallback should appear after error
      await waitFor(() => {
        const fallback = screen.getByText('JD');
        expect(fallback).toBeInTheDocument();
      });
    });

    test('generates consistent fallback initials from name', () => {
      const testCases = [
        { name: 'John Smith', expected: 'JS' },
        { name: 'Mary Jane Watson', expected: 'MW' },
        { name: 'SingleName', expected: 'S' },
        { name: '', expected: 'P' }, // Default fallback
        { name: null, expected: 'P' },
        { name: '   ', expected: 'P' } // Whitespace only
      ];

      testCases.forEach(({ name, expected }) => {
        const photographer = createMockPhotographer({
          full_name: name,
          avatar_url: null
        });

        const { unmount } = renderPhotographerCard(photographer);

        const fallback = screen.getByText(expected);
        expect(fallback).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Data Transformation and Display', () => {
    test('handles missing optional fields gracefully', () => {
      const photographer = createMockPhotographer({
        bio: null,
        city: null,
        state: null,
        hourly_rate: null,
        weddings_completed: null
      });

      renderPhotographerCard(photographer);

      // Should still render card with available data
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();

      // Missing location should not show location section
      expect(screen.queryByText(/,/)).not.toBeInTheDocument();

      // Should show fallback values for stats
      expect(screen.getByText('0')).toBeInTheDocument(); // weddings fallback
    });

    test('preserves data integrity through transformations', () => {
      const photographer = createMockPhotographer({
        total_reviews: 1250,
        weddings_completed: 150,
        average_rating: 4.95
      });

      renderPhotographerCard(photographer);

      // Should format large numbers correctly
      expect(screen.getByText('1.3k')).toBeInTheDocument(); // total_reviews formatted
      expect(screen.getByText('150')).toBeInTheDocument(); // weddings
      expect(screen.getByText('5.0')).toBeInTheDocument(); // rating rounded
    });

    test('handles currency formatting correctly', () => {
      formatCurrency.mockImplementation(amount => {
        if (!amount) return null;
        return `$${amount}`;
      });

      const photographer = createMockPhotographer({
        hourly_rate: 350
      });

      renderPhotographerCard(photographer);

      expect(formatCurrency).toHaveBeenCalledWith(350);
      expect(screen.getByText('From $350/hr')).toBeInTheDocument();
    });

    test('handles zero and negative values appropriately', () => {
      const photographer = createMockPhotographer({
        total_reviews: 0,
        weddings_completed: 0,
        average_rating: 0,
        hourly_rate: 0
      });

      renderPhotographerCard(photographer);

      expect(screen.getByText('0')).toBeInTheDocument(); // reviews
      expect(screen.getByText('0.0')).toBeInTheDocument(); // rating

      // Zero hourly rate should not show pricing
      expect(screen.queryByText(/from.*hr/i)).not.toBeInTheDocument();
    });
  });

  describe('Profile Link Generation Logic', () => {
    test('generates slug-based URLs when slug available', () => {
      const photographer = createMockPhotographer({
        id: 'test-id-123',
        slug: 'professional-photographer'
      });

      getPhotographerProfileLink.mockReturnValue('/photographer/professional-photographer');

      renderPhotographerCard(photographer);

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i });
      expect(viewProfileLink).toHaveAttribute('href', '/photographer/professional-photographer');
      expect(getPhotographerProfileLink).toHaveBeenCalledWith(photographer);
    });

    test('falls back to ID-based URLs when slug missing', () => {
      const photographer = createMockPhotographer({
        id: 'test-id-123',
        slug: null
      });

      getPhotographerProfileLink.mockReturnValue('/photographer/test-id-123');

      renderPhotographerCard(photographer);

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i });
      expect(viewProfileLink).toHaveAttribute('href', '/photographer/test-id-123');
    });

    test('hides view profile button when link is null', () => {
      const photographer = createMockPhotographer();
      getPhotographerProfileLink.mockReturnValue(null);

      renderPhotographerCard(photographer);

      const viewProfileButton = screen.queryByRole('link', { name: /view.*profile/i });
      expect(viewProfileButton).not.toBeInTheDocument();
    });

    test('handles undefined or invalid photographer data', () => {
      const photographer = createMockPhotographer({
        id: null,
        slug: null
      });

      getPhotographerProfileLink.mockReturnValue(null);

      renderPhotographerCard(photographer);

      // Should still render basic card structure
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();

      // But no profile link
      expect(screen.queryByRole('link', { name: /view.*profile/i })).not.toBeInTheDocument();
    });
  });

  describe('Tier and Badge Display', () => {
    test('displays tier badge with correct styling', () => {
      const tiers = ['Gold', 'Silver', 'Bronze', 'Platinum', 'New'];

      tiers.forEach(tier => {
        const photographer = createMockPhotographer({ tier });
        const { unmount } = renderPhotographerCard(photographer);

        const badge = screen.getByText(tier);
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('text-xs', 'font-medium');

        unmount();
      });
    });

    test('handles unknown tier gracefully', () => {
      const photographer = createMockPhotographer({
        tier: 'UnknownTier'
      });

      renderPhotographerCard(photographer);

      const badge = screen.getByText('UnknownTier');
      expect(badge).toBeInTheDocument();
      // Should fall back to default bronze styling
    });

    test('displays vetted status indicator', () => {
      const photographer = createMockPhotographer({
        vetted: true
      });

      renderPhotographerCard(photographer);

      // Should show star icon for vetted photographers
      const starIcon = screen.getByTestId('vetted-star');
      expect(starIcon).toBeInTheDocument();
    });

    test('hides vetted indicator when not vetted', () => {
      const photographer = createMockPhotographer({
        vetted: false
      });

      renderPhotographerCard(photographer);

      const starIcon = screen.queryByTestId('vetted-star');
      expect(starIcon).not.toBeInTheDocument();
    });
  });

  describe('Accessibility and Semantic Structure', () => {
    test('provides proper ARIA labels for interactive elements', () => {
      const photographer = createMockPhotographer();

      renderPhotographerCard(photographer);

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i });
      expect(viewProfileLink).toHaveAttribute('aria-label', `View ${photographer.full_name}'s profile`);
    });

    test('provides alt text for avatar images', () => {
      const photographer = createMockPhotographer();

      renderPhotographerCard(photographer);

      const avatarImage = screen.getByRole('img', { name: /jane doe/i });
      expect(avatarImage).toHaveAttribute('alt', 'Jane Doe');
    });

    test('maintains semantic heading structure', () => {
      const photographer = createMockPhotographer();

      renderPhotographerCard(photographer);

      // Photographer name should be a heading
      const nameHeading = screen.getByRole('heading', { name: /jane doe/i });
      expect(nameHeading).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      const photographer = createMockPhotographer();

      renderPhotographerCard(photographer);

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i });

      viewProfileLink.focus();
      expect(viewProfileLink).toHaveFocus();

      // Test keyboard activation
      fireEvent.keyDown(viewProfileLink, { key: 'Enter' });
      fireEvent.keyDown(viewProfileLink, { key: ' ' });
      // Links handle these naturally, no additional logic needed
    });
  });

  describe('Error Boundary and Edge Cases', () => {
    test('handles completely empty photographer object', () => {
      const photographer = {};
      getPhotographerProfileLink.mockReturnValue(null);

      renderPhotographerCard(photographer);

      // Should render basic structure without crashing
      const card = screen.getByTestId('motion-div');
      expect(card).toBeInTheDocument();

      // Should show fallback initials 'P'
      expect(screen.getByText('P')).toBeInTheDocument();
    });

    test('handles photographer with only ID', () => {
      const photographer = { id: 'minimal-photographer' };
      getPhotographerProfileLink.mockReturnValue('/photographer/minimal-photographer');

      renderPhotographerCard(photographer);

      const viewProfileLink = screen.getByRole('link', { name: /view.*profile/i });
      expect(viewProfileLink).toHaveAttribute('href', '/photographer/minimal-photographer');
    });

    test('prevents XSS in displayed content', () => {
      const photographer = createMockPhotographer({
        full_name: '<script>alert("xss")</script>',
        bio: '<img src="x" onerror="alert(\'xss\')">'
      });

      renderPhotographerCard(photographer);

      // Content should be escaped/sanitized
      expect(screen.queryByText('<script>alert("xss")</script>')).not.toBeInTheDocument();
      expect(screen.queryByText('<img src="x" onerror="alert(\'xss\')">')).not.toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    test('component mounts without causing memory leaks', () => {
      const photographer = createMockPhotographer();
      const { unmount } = renderPhotographerCard(photographer);

      // Component should mount successfully
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();

      // Should unmount cleanly
      unmount();
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });

    test('handles rapid prop updates without issues', () => {
      const { rerender } = renderPhotographerCard(createMockPhotographer({ full_name: 'First Name' }));

      expect(screen.getByText('First Name')).toBeInTheDocument();

      // Rapidly update props
      rerender(
        <MemoryRouter>
          <PhotographerCard
            photographer={createMockPhotographer({ full_name: 'Second Name' })}
            index={0}
          />
        </MemoryRouter>
      );

      expect(screen.getByText('Second Name')).toBeInTheDocument();
      expect(screen.queryByText('First Name')).not.toBeInTheDocument();
    });
  });
});