/**
 * Regenerate PNG icons from public/icons/rambohq-icon-*-source.svg
 * Run: npm run icons
 */
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')
const iconsDir = join(publicDir, 'icons')

mkdirSync(iconsDir, { recursive: true })

const standardSvg = join(iconsDir, 'rambohq-icon-source.svg')
const maskableSvg = join(iconsDir, 'rambohq-icon-maskable-source.svg')

async function pngFromSvg(svgPath, outPath, size) {
  await sharp(readFileSync(svgPath)).resize(size, size).png({ compressionLevel: 9 }).toFile(outPath)
}

copyFileSync(standardSvg, join(publicDir, 'favicon.svg'))

await pngFromSvg(standardSvg, join(iconsDir, 'icon-192.png'), 192)
await pngFromSvg(standardSvg, join(iconsDir, 'icon-512.png'), 512)
await pngFromSvg(standardSvg, join(publicDir, 'apple-touch-icon.png'), 180)
await pngFromSvg(standardSvg, join(iconsDir, 'favicon-32.png'), 32)
await pngFromSvg(standardSvg, join(iconsDir, 'favicon-16.png'), 16)

await pngFromSvg(maskableSvg, join(iconsDir, 'icon-maskable-192.png'), 192)
await pngFromSvg(maskableSvg, join(iconsDir, 'icon-maskable-512.png'), 512)

console.log('RamboHQ icons generated in public/ and public/icons/')
