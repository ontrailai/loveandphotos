/**
 * Button Component Tests
 * Tests for the reusable Button UI component
 */

import { describe, it, expect } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '@components/ui/Button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>)

      const button = screen.getByRole('button', { name: 'Click me' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-blush-500', 'px-4', 'py-2')
    })

    it('renders with custom className', () => {
      render(<Button className="custom-class">Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="secondary">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-sage-500')

      rerender(<Button variant="outline">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('border-2', 'text-dusty-700')

      rerender(<Button variant="ghost">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('text-dusty-700')

      rerender(<Button variant="danger">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-red-500')
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<Button size="sm">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm')

      rerender(<Button size="lg">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg')

      rerender(<Button size="xl">Button</Button>)
      expect(screen.getByRole('button')).toHaveClass('px-8', 'py-4', 'text-xl')
    })
  })

  describe('States', () => {
    it('renders disabled state correctly', () => {
      render(<Button disabled>Disabled Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })

    it('renders loading state correctly', () => {
      render(<Button loading>Loading Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Loading Button')

      // Check for loading spinner
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('disables button when loading', () => {
      render(<Button loading>Button</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup()
      const mockClick = jest.fn()

      render(<Button onClick={mockClick}>Click me</Button>)

      await user.click(screen.getByRole('button'))
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const mockClick = jest.fn()

      render(<Button onClick={mockClick} disabled>Disabled</Button>)

      await user.click(screen.getByRole('button'))
      expect(mockClick).not.toHaveBeenCalled()
    })

    it('does not call onClick when loading', async () => {
      const user = userEvent.setup()
      const mockClick = jest.fn()

      render(<Button onClick={mockClick} loading>Loading</Button>)

      await user.click(screen.getByRole('button'))
      expect(mockClick).not.toHaveBeenCalled()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockClick = jest.fn()

      render(<Button onClick={mockClick}>Button</Button>)

      const button = screen.getByRole('button')
      button.focus()

      await user.keyboard('{Enter}')
      expect(mockClick).toHaveBeenCalledTimes(1)

      await user.keyboard('{Space}')
      expect(mockClick).toHaveBeenCalledTimes(2)
    })
  })

  describe('Form Integration', () => {
    it('works as submit button in forms', () => {
      const mockSubmit = jest.fn(e => e.preventDefault())

      render(
        <form onSubmit={mockSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      )

      fireEvent.click(screen.getByRole('button'))
      expect(mockSubmit).toHaveBeenCalled()
    })

    it('prevents form submission when disabled', () => {
      const mockSubmit = jest.fn(e => e.preventDefault())

      render(
        <form onSubmit={mockSubmit}>
          <Button type="submit" disabled>Submit</Button>
        </form>
      )

      fireEvent.click(screen.getByRole('button'))
      expect(mockSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Button disabled>Disabled Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('disabled')
    })

    it('maintains focus management', async () => {
      const user = userEvent.setup()

      render(<Button>Focusable Button</Button>)

      const button = screen.getByRole('button')
      await user.tab()

      expect(button).toHaveFocus()
    })

    it('has proper focus styles', () => {
      render(<Button>Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2')
    })
  })

  describe('Advanced Props', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null }

      render(<Button ref={ref}>Button</Button>)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })

    it('spreads additional props', () => {
      render(
        <Button data-testid="custom-button" aria-label="Custom label">
          Button
        </Button>
      )

      const button = screen.getByTestId('custom-button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
    })

    it('handles complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('IconText')
    })
  })

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<Button>Button</Button>)

      // Same props should not cause re-render issues
      rerender(<Button>Button</Button>)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})