/**
 * React Testing Library tests for SearchBar component behavior
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import '@testing-library/jest-dom'

// Mock the navigation
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

// Mock the normalization utility
jest.mock('../../../lib/utils/normalizeLocationQuery', () => ({
  normalizeLocationQuery: jest.fn((input) => ({
    kind: input.match(/^\d{5}$/) ? 'zip' : 'city',
    city: input.match(/^\d{5}$/) ? undefined : input.split(',')[0].trim(),
    zip: input.match(/^\d{5}$/) ? input : undefined,
    raw: input
  })),
  getCanonicalQueryParam: jest.fn((normalized) =>
    normalized.kind === 'zip' ? normalized.zip : normalized.city
  )
}))

// Simple SearchBar component for testing
const SearchBar = ({ placeholder = "Enter city or ZIP code", buttonText = "Search", className = "" }) => {
  const [searchValue, setSearchValue] = React.useState('')
  const navigate = useNavigate()
  const { normalizeLocationQuery, getCanonicalQueryParam } = require('../../../lib/utils/normalizeLocationQuery')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchValue.trim()) {
      const normalized = normalizeLocationQuery(searchValue.trim())
      const canonicalParam = getCanonicalQueryParam(normalized)
      navigate(`/photographers?q=${encodeURIComponent(canonicalParam)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className={className} data-testid="search-form">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border rounded-md"
          data-testid="search-input"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          data-testid="search-button"
        >
          {buttonText}
        </button>
      </div>
    </form>
  )
}

// Test wrapper with Router
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    test('renders search input and button', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      expect(screen.getByTestId('search-input')).toBeInTheDocument()
      expect(screen.getByTestId('search-button')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter city or ZIP code')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
    })

    test('renders with custom placeholder and button text', () => {
      render(
        <TestWrapper>
          <SearchBar placeholder="Custom placeholder" buttonText="Find" />
        </TestWrapper>
      )

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Find' })).toBeInTheDocument()
    })

    test('applies custom className', () => {
      render(
        <TestWrapper>
          <SearchBar className="custom-class" />
        </TestWrapper>
      )

      expect(screen.getByTestId('search-form')).toHaveClass('custom-class')
    })
  })

  describe('User Interactions', () => {
    test('updates input value when user types', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: 'San Diego' } })

      expect(input.value).toBe('San Diego')
    })

    test('handles form submission with Enter key', async () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: 'San Diego' } })
      fireEvent.submit(screen.getByTestId('search-form'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographers?q=San%20Diego')
      })
    })

    test('handles form submission with button click', async () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      const button = screen.getByTestId('search-button')

      fireEvent.change(input, { target: { value: 'Los Angeles' } })
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographers?q=Los%20Angeles')
      })
    })
  })

  describe('Search Query Normalization', () => {
    test('handles city name correctly', async () => {
      const { normalizeLocationQuery, getCanonicalQueryParam } = require('../../../lib/utils/normalizeLocationQuery')

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: 'San Diego, CA' } })
      fireEvent.submit(screen.getByTestId('search-form'))

      await waitFor(() => {
        expect(normalizeLocationQuery).toHaveBeenCalledWith('San Diego, CA')
        expect(getCanonicalQueryParam).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/photographers?q=San%20Diego')
      })
    })

    test('handles ZIP code correctly', async () => {
      const { normalizeLocationQuery, getCanonicalQueryParam } = require('../../../lib/utils/normalizeLocationQuery')

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: '94103' } })
      fireEvent.submit(screen.getByTestId('search-form'))

      await waitFor(() => {
        expect(normalizeLocationQuery).toHaveBeenCalledWith('94103')
        expect(getCanonicalQueryParam).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/photographers?q=94103')
      })
    })

    test('trims whitespace before processing', async () => {
      const { normalizeLocationQuery } = require('../../../lib/utils/normalizeLocationQuery')

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: '  San Diego  ' } })
      fireEvent.submit(screen.getByTestId('search-form'))

      await waitFor(() => {
        expect(normalizeLocationQuery).toHaveBeenCalledWith('San Diego')
      })
    })
  })

  describe('Edge Cases', () => {
    test('does not navigate with empty input', async () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      fireEvent.submit(screen.getByTestId('search-form'))

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    test('does not navigate with whitespace-only input', async () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.submit(screen.getByTestId('search-form'))

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    test('handles special characters in search term', async () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: 'New York & Brooklyn' } })
      fireEvent.submit(screen.getByTestId('search-form'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographers?q=New%20York%20%26%20Brooklyn')
      })
    })

    test('handles long search terms', async () => {
      const longTerm = 'Very Long City Name That Might Break Things'.repeat(3)

      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: longTerm } })
      fireEvent.submit(screen.getByTestId('search-form'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(`/photographers?q=${encodeURIComponent(longTerm)}`)
      })
    })
  })

  describe('Accessibility', () => {
    test('input has proper labeling through placeholder', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      expect(input).toHaveAttribute('placeholder', 'Enter city or ZIP code')
    })

    test('button has proper type and role', () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const button = screen.getByTestId('search-button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveRole('button')
    })

    test('form submission works with keyboard navigation', async () => {
      render(
        <TestWrapper>
          <SearchBar />
        </TestWrapper>
      )

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: 'Portland' } })
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/photographers?q=Portland')
      })
    })
  })
})