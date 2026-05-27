import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('./public/icons', { recursive: true })

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="#0a0a0a"/>
  <text x="256" y="340" font-family="Arial Black, sans-serif" font-size="260" font-weight="900"
        fill="#C9A84C" text-anchor="middle">B</text>
</svg>`

const svgBuffer = Buffer.from(svg)

await sharp(svgBuffer).resize(192, 192).png().toFile('./public/icons/icon-192.png')
await sharp(svgBuffer).resize(512, 512).png().toFile('./public/icons/icon-512.png')

console.log('Icons generated.')
