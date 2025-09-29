import React from 'react'
import { clsx } from 'clsx'

export default function PageHero({
  title,
  subtitle,
  align = 'center',
}) {
  const innerAlign = align === 'left' ? 'text-left' : 'text-center'
  const wrapperAlign = align === 'left' ? 'items-start' : 'items-center'

  return (
    <section className="bg-background">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="relative overflow-hidden rounded-3xl border border-border">
          {/* Theme-aware soft glow inside the hero frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 to-transparent dark:from-white/10" />
          {/* Optional subtle backdrop for depth; stays dark-friendly */}
          <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_50%_-20%,rgba(255,255,255,0.06),transparent_60%)] dark:bg-[radial-gradient(80%_120%_at_50%_-20%,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className={clsx('relative mx-auto max-w-4xl py-10 md:py-14 flex flex-col gap-3', wrapperAlign, innerAlign)}>
            <h1 className={clsx(
              'font-bold tracking-tight text-foreground',
              // clamp: 28px → 44px
              'text-[clamp(28px,4vw,44px)] leading-[1.1]'
            )}>
              {title}
            </h1>
            {subtitle ? (
              <p className={clsx('text-muted-foreground max-w-2xl', innerAlign)}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}