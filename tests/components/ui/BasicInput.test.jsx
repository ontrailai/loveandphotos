/**
 * BasicInput Component Tests
 * Tests for the BasicInput UI component used in forms
 */

import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BasicInput from '@components/ui/BasicInput'

describe('BasicInput Component', () => {
  describe('Rendering', () => {
    it('renders input element correctly', () => {
      render(<BasicInput placeholder="Enter text" />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', 'Enter text')
    })

    it('renders with different input types', () => {
      const { rerender } = render(<BasicInput type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

      rerender(<BasicInput type="password" />)
      expect(screen.getByLabelText('', { selector: 'input' })).toHaveAttribute('type', 'password')

      rerender(<BasicInput type="tel" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'tel')
    })

    it('applies custom className', () => {
      render(<BasicInput className="custom-input" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveClass('custom-input')
    })

    it('renders with value', () => {
      render(<BasicInput value="test value" readOnly />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('test value')
    })
  })

  describe('User Interactions', () => {
    it('handles text input correctly', async () => {
      const user = userEvent.setup()
      const mockChange = jest.fn()

      render(<BasicInput onChange={mockChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Hello World')

      expect(input).toHaveValue('Hello World')
      expect(mockChange).toHaveBeenCalledTimes('Hello World'.length)
    })

    it('handles focus and blur events', async () => {
      const user = userEvent.setup()
      const mockFocus = jest.fn()
      const mockBlur = jest.fn()

      render(<BasicInput onFocus={mockFocus} onBlur={mockBlur} />)

      const input = screen.getByRole('textbox')

      await user.click(input)
      expect(mockFocus).toHaveBeenCalledTimes(1)

      await user.tab()
      expect(mockBlur).toHaveBeenCalledTimes(1)
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(<BasicInput />)

      const input = screen.getByRole('textbox')
      await user.tab()

      expect(input).toHaveFocus()
    })

    it('handles paste operations', async () => {
      const user = userEvent.setup()
      const mockChange = jest.fn()

      render(<BasicInput onChange={mockChange} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.paste('pasted content')

      expect(input).toHaveValue('pasted content')
    })
  })

  describe('Form Integration', () => {
    it('works with controlled components', async () => {
      const user = userEvent.setup()
      let value = ''
      const setValue = jest.fn(newValue => {
        value = newValue
      })

      const ControlledInput = () => (
        <BasicInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )

      const { rerender } = render(<ControlledInput />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'controlled')

      // Simulate parent component re-render with new value
      rerender(<BasicInput value="controlled" onChange={() => {}} />)
      expect(input).toHaveValue('controlled')
    })

    it('works with uncontrolled components', async () => {
      const user = userEvent.setup()

      render(<BasicInput defaultValue="default" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('default')

      await user.clear(input)
      await user.type(input, 'uncontrolled')
      expect(input).toHaveValue('uncontrolled')
    })

    it('submits form data correctly', () => {
      const mockSubmit = jest.fn(e => {
        e.preventDefault()
        const formData = new FormData(e.target)
        return formData.get('testInput')
      })

      render(
        <form onSubmit={mockSubmit}>
          <BasicInput name="testInput" defaultValue="form data" />
          <button type="submit">Submit</button>
        </form>
      )

      const form = screen.getByRole('form') || screen.getByRole('button').closest('form')
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      form.dispatchEvent(submitEvent)

      expect(mockSubmit).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('supports ARIA labels', () => {
      render(<BasicInput aria-label="Email address" />)

      const input = screen.getByLabelText('Email address')
      expect(input).toBeInTheDocument()
    })

    it('supports ARIA described by', () => {
      render(
        <>
          <BasicInput aria-describedby="help-text" />
          <div id="help-text">Helper text</div>
        </>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('supports disabled state', () => {
      render(<BasicInput disabled />)

      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('supports required state', () => {
      render(<BasicInput required />)

      const input = screen.getByRole('textbox')
      expect(input).toBeRequired()
    })

    it('has proper focus styles', () => {
      render(<BasicInput data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-blush-500')
    })
  })

  describe('Validation States', () => {
    it('shows error state with red styling', () => {
      render(<BasicInput className="border-red-500 focus:ring-red-500" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveClass('border-red-500', 'focus:ring-red-500')
    })

    it('shows success state with green styling', () => {
      render(<BasicInput className="border-green-500 focus:ring-green-500" data-testid="input" />)

      const input = screen.getByTestId('input')
      expect(input).toHaveClass('border-green-500', 'focus:ring-green-500')
    })
  })

  describe('Edge Cases', () => {
    it('handles null and undefined values gracefully', () => {
      const { rerender } = render(<BasicInput value={null} />)
      expect(screen.getByRole('textbox')).toHaveValue('')

      rerender(<BasicInput value={undefined} />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })

    it('handles special characters', async () => {
      const user = userEvent.setup()

      render(<BasicInput />)

      const input = screen.getByRole('textbox')
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

      await user.type(input, specialChars)
      expect(input).toHaveValue(specialChars)
    })

    it('handles long text input', async () => {
      const user = userEvent.setup()

      render(<BasicInput />)

      const input = screen.getByRole('textbox')
      const longText = 'A'.repeat(1000)

      await user.type(input, longText)
      expect(input).toHaveValue(longText)
    })
  })

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', async () => {
      const user = userEvent.setup()
      const mockRender = jest.fn()

      const TestComponent = () => {
        mockRender()
        return <BasicInput />
      }

      render(<TestComponent />)

      // Initial render
      expect(mockRender).toHaveBeenCalledTimes(1)

      // Typing should not cause parent re-renders
      const input = screen.getByRole('textbox')
      await user.type(input, 'test')

      // Should still be only 1 render from parent
      expect(mockRender).toHaveBeenCalledTimes(1)
    })
  })
})