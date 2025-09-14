/**
 * BackgroundVideo Component
 * Native video with HLS streaming for full styling control and rounded corners
 */

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

function buildHlsUrl() {
  // Support both import.meta.env (Vite) and global.importMeta (Jest tests)
  const env = (typeof importMeta !== 'undefined' && importMeta?.env) ||
              (typeof global !== 'undefined' && global.importMeta?.env) ||
              import.meta.env

  const direct = env.VITE_CF_STREAM_HLS
  if (direct) return direct

  const host = env.VITE_CF_STREAM_SUBDOMAIN
  const id = env.VITE_CF_STREAM_VIDEO_ID

  if (!host || !id) {
    console.error('Missing Cloudflare Stream environment variables')
    return null
  }

  return `https://${host}/${id}/manifest/video.m3u8`
}

export default function BackgroundVideo() {
  const ref = useRef(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    const src = buildHlsUrl()
    if (!src) return

    // iOS/Safari plays HLS natively
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.play().catch(() => {
        // Autoplay blocked - this is expected and fine for background video
      })
      return
    }

    // Other browsers via hls.js
    if (Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 10,
        // Optimize for background video
        startLevel: -1, // Auto quality
        enableWorker: true
      })

      hls.loadSource(src)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked - expected for background video
        })
      })

      return () => {
        hls.destroy()
      }
    }
  }, [])

  return (
    <div className="absolute inset-0 -z-10 overflow-visible">
      {/* Container wrapper to match section width */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center py-8">
        {/* ENHANCED DEPTH + ROUNDED CORNERS */}
        <div className="relative w-full h-[480px] rounded-3xl ring-2 ring-white/20 shadow-2xl shadow-black/30 overflow-hidden
                        outline outline-4 outline-white/10 outline-offset-2 z-10
                        before:absolute before:inset-0 before:ring-1 before:ring-inset before:ring-white/30 before:rounded-3xl before:pointer-events-none">
          <video
            ref={ref}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            aria-hidden="true"
          />
          {/* Subtle scrim to keep text readable */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}