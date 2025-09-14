/**
 * BackgroundVideo Component Unit Tests
 * Tests for Cloudflare Stream video background implementation
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BackgroundVideo } from '../ui/BackgroundVideo'

// Mock console.log and console.warn to avoid test noise
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('BackgroundVideo', () => {
  it('renders Cloudflare Stream iframe with correct URL', () => {
    render(<BackgroundVideo />)

    const iframe = document.querySelector('iframe')

    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src')
    expect(iframe.getAttribute('src')).toContain('customer-rgn1u11lvoqolqnf.cloudflarestream.com')
    expect(iframe.getAttribute('src')).toContain('fddc4c08277c2b42e0f4484e32228d6a')
    expect(iframe.getAttribute('src')).toContain('muted=true')
    expect(iframe.getAttribute('src')).toContain('autoplay=true')
    expect(iframe.getAttribute('src')).toContain('loop=true')
    expect(iframe.getAttribute('src')).toContain('controls=false')
  })

  it('renders iframe with correct styling and attributes', () => {
    render(<BackgroundVideo />)

    const iframe = document.querySelector('iframe')

    expect(iframe).toHaveAttribute('aria-hidden', 'true')
    expect(iframe).toHaveAttribute('allowFullScreen', 'false')
    expect(iframe).toHaveAttribute('allow')
    expect(iframe.getAttribute('allow')).toContain('autoplay')

    // Check inline styles
    const styles = iframe.style
    expect(styles.border).toBe('none')
    expect(styles.position).toBe('absolute')
    expect(styles.height).toBe('100%')
    expect(styles.width).toBe('100%')
    expect(styles.pointerEvents).toBe('none')
  })

  it('renders with proper container positioning and z-index', () => {
    const { container } = render(<BackgroundVideo />)

    const videoContainer = container.firstChild

    expect(videoContainer).toHaveClass('absolute', 'inset-0', '-z-10', 'overflow-hidden')
  })

  it('applies custom className when provided', () => {
    const customClass = 'custom-video-class'
    const { container } = render(<BackgroundVideo className={customClass} />)

    const videoContainer = container.firstChild

    expect(videoContainer).toHaveClass(customClass)
  })

  it('uses custom videoId when provided', () => {
    const customVideoId = 'custom-video-id-12345'
    render(<BackgroundVideo videoId={customVideoId} />)

    const iframe = document.querySelector('iframe')

    expect(iframe.getAttribute('src')).toContain(customVideoId)
  })

  it('renders fallback poster image when iframe fails', async () => {
    const customPoster = 'https://example.com/custom-poster.jpg'
    render(<BackgroundVideo poster={customPoster} />)

    // Simulate iframe error by triggering the error handler
    const component = screen.getByRole('generic', { hidden: true })
    const iframe = document.querySelector('iframe')

    // Trigger error handler
    if (iframe && iframe.onError) {
      iframe.onError()
    }

    await waitFor(() => {
      const fallbackDiv = document.querySelector('div[style*="backgroundImage"]')
      expect(fallbackDiv).toBeInTheDocument()
      expect(fallbackDiv).toHaveAttribute('aria-label', 'Background image of photography scene')
    })
  })

  it('shows development indicator when Cloudflare Stream fails in development', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(<BackgroundVideo />)

    const iframe = document.querySelector('iframe')

    // Simulate iframe error
    if (iframe && iframe.onError) {
      iframe.onError()
    }

    await waitFor(() => {
      const indicator = screen.queryByText(/Cloudflare Stream failed/)
      expect(indicator).toBeInTheDocument()
    })

    process.env.NODE_ENV = originalEnv
  })

  it('does not show development indicator in production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(<BackgroundVideo />)

    const iframe = document.querySelector('iframe')

    // Simulate iframe error
    if (iframe && iframe.onError) {
      iframe.onError()
    }

    await waitFor(() => {
      const indicator = screen.queryByText(/Cloudflare Stream failed/)
      expect(indicator).not.toBeInTheDocument()
    })

    process.env.NODE_ENV = originalEnv
  })
})

describe('BackgroundVideo Integration', () => {
  it('integrates properly within CTA section container', () => {
    // Test that the component works within a relative positioned container
    const { container } = render(
      <section className="relative min-h-[600px] isolate">
        <BackgroundVideo />
        <div className="relative z-20">Content</div>
      </section>
    )

    const section = container.firstChild
    const videoContainer = section.querySelector('.absolute.inset-0.-z-10')
    const content = section.querySelector('.relative.z-20')

    expect(section).toHaveClass('relative')
    expect(videoContainer).toBeInTheDocument()
    expect(content).toBeInTheDocument()
  })
})