// Generates public/icons/icon-512-maskable.png:
// logo centered in the 80% safe zone on a #0B1629 background.
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const SIZE = 512
const SAFE = Math.round(SIZE * 0.8)  // 410px — logo fits inside this
const OFFSET = Math.round((SIZE - SAFE) / 2)  // 51px margin each side

const src = path.join(root, 'public', 'icons', 'icon-512.png')
const out = path.join(root, 'public', 'icons', 'icon-512-maskable.png')

// Resize the logo to fit the safe zone, then composite onto background
const logo = await sharp(src)
  .resize(SAFE, SAFE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer()

await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: { r: 11, g: 22, b: 41, alpha: 255 } },
})
  .composite([{ input: logo, left: OFFSET, top: OFFSET }])
  .png()
  .toFile(out)

console.log(`✓ Generated ${out}`)
