import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public', 'icon.svg'))
const pub = join(root, 'public')

const targets = [
  ['icon-1024.png', 1024], // App Store / marketing
  ['apple-touch-icon.png', 180],
  ['pwa-512.png', 512],
  ['pwa-192.png', 192],
  ['favicon-32.png', 32],
]

for (const [name, size] of targets) {
  // flatten() drops the alpha channel — Apple rejects the 1024 marketing icon if it
  // has alpha/transparency. The icon is full-bleed emerald, so this is lossless.
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .flatten({ background: '#0E5C4A' })
    .png()
    .toFile(join(pub, name))
  console.log(`✓ ${name} (${size}px)`)
}
