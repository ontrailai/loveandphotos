/**
 * Simple Test
 * Basic test to verify Jest and React Testing Library setup
 */

import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'

describe('Simple Test Suite', () => {
  it('renders a basic component', () => {
    const TestComponent = () => <div>Hello World</div>

    render(<TestComponent />)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('performs basic assertions', () => {
    expect(true).toBe(true)
    expect(1 + 1).toBe(2)
    expect('hello').toMatch(/hello/)
  })

  it('tests array operations', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
    expect(arr[0]).toBe(1)
  })
})