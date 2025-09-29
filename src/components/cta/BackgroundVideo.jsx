/**
 * BackgroundVideo Component - Simplified for Aspect Ratio Layout
 * Native video with HLS streaming that fills the container completely
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

  // Simple video element that fills the container completely
  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
      aria-hidden="true"
    />
  )
}