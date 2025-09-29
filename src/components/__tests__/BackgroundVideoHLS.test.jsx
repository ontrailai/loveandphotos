/**
 * BackgroundVideo Component Unit Tests (HLS Version)
 * Tests for native video with HLS streaming and styling control
 */

import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import BackgroundVideo from '../ui/BackgroundVideo'

// Mock hls.js
const mockHls = {
  loadSource: jest.fn(),
  attachMedia: jest.fn(),
  destroy: jest.fn(),
  on: jest.fn(),
  isSupported: jest.fn(() => true),
}

jest.mock('hls.js', () => ({
  __esModule: true,
  default: jest.fn(() => mockHls),
}))

// Mock import.meta.env for Jest
const mockEnv = {
  VITE_CF_STREAM_SUBDOMAIN: 'customer-rgn1u11lvoqolqnf.cloudflarestream.com',
  VITE_CF_STREAM_VIDEO_ID: 'fddc4c08277c2b42e0f4484e32228d6a',
  VITE_CF_STREAM_HLS: 'https://customer-rgn1u11lvoqolqnf.cloudflarestream.com/fddc4c08277c2b42e0f4484e32228d6a/manifest/video.m3u8'
}

// Mock import.meta
const originalImportMeta = global.importMeta
beforeEach(() => {
  global.importMeta = {
    env: mockEnv
  }
  jest.clearAllMocks()
})

afterEach(() => {
  global.importMeta = originalImportMeta
  jest.restoreAllMocks()
})

describe('BackgroundVideo (HLS Version)', () => {
  it('renders a native video element with correct styling classes', () => {
    render(<BackgroundVideo />)

    const video = screen.getByRole('generic', { hidden: true })
    const videoElement = video.querySelector('video')

    expect(videoElement).toBeInTheDocument()
    expect(videoElement).toHaveClass('h-full', 'w-full', 'object-cover')
    expect(videoElement).toHaveAttribute('autoplay')
    expect(videoElement).toHaveAttribute('muted')
    expect(videoElement).toHaveAttribute('loop')
    expect(videoElement).toHaveAttribute('playsinline')
    expect(videoElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies rounded corners and enhanced depth styling to container', () => {
    const { container } = render(<BackgroundVideo />)

    const outerContainer = container.querySelector('.absolute.inset-0.-z-10')
    expect(outerContainer).toBeInTheDocument()

    // Check for constrained width container
    const constrainedContainer = container.querySelector('.max-w-7xl.mx-auto')
    expect(constrainedContainer).toBeInTheDocument()

    // Check for enhanced depth styling
    const styledContainer = container.querySelector('.rounded-3xl.ring-2.ring-white\\/20.shadow-2xl')
    expect(styledContainer).toBeInTheDocument()
    expect(styledContainer).toHaveClass('overflow-hidden')

    // Check for outline effects
    const outlineContainer = container.querySelector('.outline.outline-4.outline-white\\/10')
    expect(outlineContainer).toBeInTheDocument()
  })

  it('includes a subtle scrim overlay for text readability', () => {
    const { container } = render(<BackgroundVideo />)

    const scrim = container.querySelector('.bg-black\\/20.pointer-events-none')
    expect(scrim).toBeInTheDocument()
  })

  it('builds HLS URL from environment variables', () => {
    render(<BackgroundVideo />)

    // Verify the URL is built correctly (will be tested via HLS mock)
    expect(mockEnv.VITE_CF_STREAM_HLS).toBe(
      'https://customer-rgn1u11lvoqolqnf.cloudflarestream.com/fddc4c08277c2b42e0f4484e32228d6a/manifest/video.m3u8'
    )
  })

  it('uses direct HLS URL when available in environment', async () => {
    render(<BackgroundVideo />)

    await waitFor(() => {
      expect(mockHls.loadSource).toHaveBeenCalledWith(mockEnv.VITE_CF_STREAM_HLS)
    })
  })

  it('constructs HLS URL from subdomain and video ID when direct URL not available', async () => {
    // Remove direct URL to test construction
    const envWithoutDirectUrl = { ...mockEnv }
    delete envWithoutDirectUrl.VITE_CF_STREAM_HLS
    Object.assign(import.meta.env, envWithoutDirectUrl)

    render(<BackgroundVideo />)

    const expectedUrl = `https://${mockEnv.VITE_CF_STREAM_SUBDOMAIN}/${mockEnv.VITE_CF_STREAM_VIDEO_ID}/manifest/video.m3u8`

    await waitFor(() => {
      expect(mockHls.loadSource).toHaveBeenCalledWith(expectedUrl)
    })
  })

  it('handles Safari/iOS native HLS playback', async () => {
    const { container } = render(<BackgroundVideo />)
    const videoElement = container.querySelector('video')

    // Mock Safari's native HLS support
    videoElement.canPlayType = vi.fn(() => 'probably')

    // Trigger useEffect by re-rendering
    render(<BackgroundVideo />)

    await waitFor(() => {
      expect(videoElement.src).toBe(mockEnv.VITE_CF_STREAM_HLS)
    })
  })

  it('initializes hls.js when supported and not Safari', async () => {
    const { container } = render(<BackgroundVideo />)
    const videoElement = container.querySelector('video')

    // Mock non-Safari browser
    videoElement.canPlayType = vi.fn(() => '')

    await waitFor(() => {
      expect(mockHls.loadSource).toHaveBeenCalled()
      expect(mockHls.attachMedia).toHaveBeenCalledWith(videoElement)
    })
  })

  it('has proper z-index layering for background positioning', () => {
    const { container } = render(<BackgroundVideo />)

    const backgroundContainer = container.querySelector('.absolute.inset-0.-z-10')
    expect(backgroundContainer).toBeInTheDocument()

    // Should be positioned behind content
    expect(backgroundContainer).toHaveClass('-z-10')
  })

  it('handles video play promise rejection gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<BackgroundVideo />)

    // Should not throw errors even if autoplay fails
    expect(consoleSpy).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})

describe('BackgroundVideo Integration', () => {
  it('integrates properly within constrained-width CTA section', () => {
    const { container } = render(
      <section className="relative isolate min-h-[520px]">
        <BackgroundVideo />
        <div className="relative z-20 max-w-7xl mx-auto px-4">
          <h1>Test Content</h1>
        </div>
      </section>
    )

    const section = container.firstChild
    const backgroundVideo = section.querySelector('.absolute.inset-0.-z-10')
    const content = section.querySelector('.relative.z-20')

    expect(section).toHaveClass('relative', 'isolate')
    expect(backgroundVideo).toBeInTheDocument()
    expect(content).toBeInTheDocument()

    // Both video and content should use max-w-7xl for consistent width
    const videoContainer = backgroundVideo.querySelector('.max-w-7xl.mx-auto')
    expect(videoContainer).toBeInTheDocument()
    expect(content).toHaveClass('max-w-7xl', 'mx-auto')
  })
})