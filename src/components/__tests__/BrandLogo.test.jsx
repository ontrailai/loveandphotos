/**
 * BrandLogo Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import BrandLogo, { BrandLogoCompact, BrandLogoText } from '../BrandLogo'

describe('BrandLogo', () => {
  it('renders with default props', () => {
    render(<BrandLogo />)
    const logo = screen.getByLabelText('Love & Photos')
    expect(logo).toBeInTheDocument()
  })

  it('renders with custom alt text', () => {
    render(<BrandLogo alt="Custom alt text" />)
    const logo = screen.getByAltText('Custom alt text')
    expect(logo).toBeInTheDocument()
  })

  it('renders as a link when href is provided', () => {
    render(<BrandLogo href="/" />)
    const link = screen.getByRole('link', { name: /Love & Photos - Go to homepage/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders as a button when onClick is provided', () => {
    const handleClick = vi.fn()
    render(<BrandLogo onClick={handleClick} />)
    const button = screen.getByRole('button', { name: /Love & Photos/i })
    expect(button).toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<BrandLogo size="xs" />)
    let container = screen.getByLabelText('Love & Photos')
    expect(container.querySelector('img')).toHaveClass('h-6')

    rerender(<BrandLogo size="2xl" />)
    container = screen.getByLabelText('Love & Photos')
    expect(container.querySelector('img')).toHaveClass('h-20')
  })

  it('renders icon variant without text', () => {
    render(<BrandLogo variant="icon" />)
    const text = screen.queryByText('Love & Photos')
    expect(text).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<BrandLogo className="custom-class" />)
    const container = screen.getByLabelText('Love & Photos')
    expect(container).toHaveClass('custom-class')
  })

  it('renders with proper accessibility attributes', () => {
    render(<BrandLogo focusable={false} />)
    const img = screen.getByAltText('Love & Photos logo')
    expect(img).toHaveAttribute('tabIndex', '-1')
  })

  it('uses PNG fallback on SVG error', () => {
    const { container } = render(<BrandLogo />)
    const img = container.querySelector('img')

    // Initially should try to load SVG
    expect(img).toHaveAttribute('src', '/branding/logo.svg')

    // Simulate error
    img.dispatchEvent(new Event('error'))

    // Should now use PNG
    setTimeout(() => {
      expect(img).toHaveAttribute('src', '/branding/logo.png')
    }, 0)
  })
})

describe('BrandLogoCompact', () => {
  it('renders without text', () => {
    render(<BrandLogoCompact />)
    const text = screen.queryByText('Love & Photos')
    expect(text).not.toBeInTheDocument()
  })
})

describe('BrandLogoText', () => {
  it('renders only text without image', () => {
    render(<BrandLogoText />)
    const text = screen.getByText('Love & Photos')
    expect(text).toBeInTheDocument()

    const img = screen.queryByRole('img')
    expect(img).not.toBeInTheDocument()
  })

  it('applies theme classes correctly', () => {
    const { rerender } = render(<BrandLogoText theme="light" />)
    let text = screen.getByText('Love & Photos')
    expect(text).toHaveClass('text-dusty-900')

    rerender(<BrandLogoText theme="dark" />)
    text = screen.getByText('Love & Photos')
    expect(text).toHaveClass('text-white')
  })
})