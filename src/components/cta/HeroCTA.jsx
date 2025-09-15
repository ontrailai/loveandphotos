/**
 * HeroCTA Component - Simplified Full-Bleed Version
 * Single polished full-bleed card on white page background
 */

import { Link } from 'react-router-dom'
import BackgroundVideo from './BackgroundVideo'

export default function HeroCTA() {
  return (
    <section className="bg-background py-10 md:py-14">
      {/* Full-bleed STYLE: centered card on a WHITE page background */}
      <div className="relative isolate mx-auto max-w-6xl aspect-[21/9] overflow-hidden rounded-3xl shadow-xl shadow-black/20 ring-1 ring-white/10">
        <BackgroundVideo />
        {/* Scrim inside the video frame only */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/30" />

        {/* Overlay content */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="mx-auto max-w-4xl text-center px-4">
            <h2 className="text-white font-bold tracking-tight text-[clamp(28px,4vw,44px)] leading-[1.1] drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]">
              Forever Starts Here
            </h2>

            <div className="mt-6">
              <Link
                to="/photographers"
                aria-label="Browse photographers and reserve your date"
                className="inline-flex items-center justify-center rounded-xl bg-white/90 hover:bg-white text-gray-900 px-6 py-3 text-sm md:text-base font-medium ring-1 ring-white/20 shadow-lg shadow-black/10 transition-all hover:scale-105"
              >
                Reserve Date <span className="ml-2">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}