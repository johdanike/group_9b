/* One-off icon generator for "E don happen" PWA. Run: node scripts/generate-icons.mjs */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const PUBLIC = new URL('../public/', import.meta.url).pathname

const GREEN = '#12D900'
const INK = '#303234'

const svg = (size, { rounded = false } = {}) => {
  const r = rounded ? size * 0.22 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${GREEN}"/>
  <rect x="${size * 0.14}" y="${size * 0.14}" width="${size * 0.72}" height="${size * 0.72}" rx="${size * 0.16}" fill="${INK}"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="900"
        font-size="${size * 0.46}" fill="${GREEN}">E</text>
</svg>`
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${GREEN}"/>
  <rect x="9" y="9" width="46" height="46" rx="11" fill="${INK}"/>
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="30" fill="${GREEN}">E</text>
</svg>`

await mkdir(PUBLIC, { recursive: true })

await sharp(Buffer.from(favicon)).toFile(`${PUBLIC}favicon.svg`)

const targets = [
  ['pwa-192x192.png', 192, { rounded: false }],
  ['pwa-512x512.png', 512, { rounded: false }],
  ['maskable-512x512.png', 512, { rounded: false }],
  ['apple-touch-icon.png', 180, { rounded: false }],
  ['favicon-32x32.png', 32, { rounded: false }],
  ['favicon-16x16.png', 16, { rounded: false }],
]

for (const [file, size, opts] of targets) {
  await sharp(Buffer.from(svg(size, opts))).png().toFile(`${PUBLIC}${file}`)
  console.log(`✓ ${file}`)
}
console.log('✓ favicon.svg')
