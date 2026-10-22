import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const src = 'public/cclife-logo.webp'

await sharp(src).resize(512, 512).png().toFile('public/icons/icon-512.png')
await sharp(src).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(src).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png')
await sharp(src).resize(32,  32 ).png().toFile('public/favicon.png')

console.log('Icons generated.')
