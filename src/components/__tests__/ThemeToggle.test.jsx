import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ThemeProvider } from '@contexts/ThemeContext'
import ThemeToggle from '@components/ThemeToggle'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

// Mock CSS variables
Object.defineProperty(document.documentElement, 'classList', {
  value: {
    add: jest.fn(),
    remove: jest.fn()
  },
  writable: true
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue('light')
    jest.clearAllMocks()
  })

  it('renders theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    expect(screen.getByLabelText(/switch to dark mode/i)).toBeInTheDocument()
  })

  it('toggles between light and dark themes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByLabelText(/switch to dark mode/i)

    // Click to switch to dark mode
    fireEvent.click(button)

    expect(screen.getByLabelText(/switch to light mode/i)).toBeInTheDocument()
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('applies correct CSS classes to document', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')

    // Initial state should add 'light' class
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('light')

    // Click to toggle
    fireEvent.click(button)

    // Should remove old and add new
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light', 'dark')
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark')
  })

  it('persists theme preference in localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button')

    fireEvent.click(button)

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
  })
})