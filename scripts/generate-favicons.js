#!/usr/bin/env node

/**
 * Generate favicon and PWA assets from logo
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceImage = path.join(__dirname, '../public/branding/logo.png')
const publicDir = path.join(__dirname, '../public')

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'maskable-icon-512x512.png', size: 512, maskable: true }
]

async function generateFavicons() {
  try {
    console.log('🎨 Generating favicon and PWA assets...')

    // Read the source image
    const sourceBuffer = fs.readFileSync(sourceImage)

    // Generate different sizes
    for (const { name, size, maskable } of sizes) {
      const outputPath = path.join(publicDir, name)

      if (maskable) {
        // Add padding for maskable icon (safe area)
        const paddedSize = Math.floor(size * 1.2)
        const padding = Math.floor((paddedSize - size) / 2)

        await sharp(sourceBuffer)
          .resize(size - padding * 2, size - padding * 2, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .resize(size, size)
          .toFile(outputPath)
      } else {
        await sharp(sourceBuffer)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .toFile(outputPath)
      }

      console.log(`  ✅ Generated ${name}`)
    }

    // Create site.webmanifest
    const manifest = {
      name: 'Love & Photos',
      short_name: 'Love & Photos',
      description: 'Connect with professional photographers for your special moments',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      theme_color: '#EC4899',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      orientation: 'portrait-primary'
    }

    fs.writeFileSync(
      path.join(publicDir, 'site.webmanifest'),
      JSON.stringify(manifest, null, 2)
    )
    console.log('  ✅ Generated site.webmanifest')

    // Create browserconfig.xml for Microsoft
    const browserConfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/android-chrome-192x192.png"/>
      <TileColor>#EC4899</TileColor>
    </tile>
  </msapplication>
</browserconfig>`

    fs.writeFileSync(
      path.join(publicDir, 'browserconfig.xml'),
      browserConfig
    )
    console.log('  ✅ Generated browserconfig.xml')

    // Copy SVG as safari-pinned-tab.svg (monochrome version would be ideal)
    fs.copyFileSync(
      path.join(__dirname, '../public/branding/logo.svg'),
      path.join(publicDir, 'safari-pinned-tab.svg')
    )
    console.log('  ✅ Copied safari-pinned-tab.svg')

    console.log('\n✨ All favicon and PWA assets generated successfully!')

  } catch (error) {
    console.error('Error generating favicons:', error)
    process.exit(1)
  }
}

generateFavicons()