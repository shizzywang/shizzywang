import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const publicDir = path.join(rootDir, 'public')

const source = 'heraldic_shield_black_white copy.svg'
const detailsDest = 'heraldic-shield.svg'
const fieldDest = 'heraldic-shield-field.svg'

const rectRe =
  /<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="rgb\((\d+),(\d+),(\d+)\)"\/>/g

const inputPath = path.join(rootDir, source)
const original = fs.readFileSync(inputPath, 'utf8')

const rects = []
for (const match of original.matchAll(rectRe)) {
  rects.push({
    x: Number(match[1]),
    y: Number(match[2]),
    w: Number(match[3]),
    h: Number(match[4]),
    r: Number(match[5]),
    g: Number(match[6]),
    b: Number(match[7]),
  })
}

const isBlack = (rect) => rect.r === 0 && rect.g === 0 && rect.b === 0
const isWhite = (rect) => rect.r === 255 && rect.g === 255 && rect.b === 255

const blackRects = rects.filter(isBlack)
const minX = Math.min(...blackRects.map((r) => r.x))
const maxX = Math.max(...blackRects.map((r) => r.x + r.w))
const minY = Math.min(...blackRects.map((r) => r.y))
const maxY = Math.max(...blackRects.map((r) => r.y + r.h))

const isInsideShield = (rect) =>
  rect.x >= minX &&
  rect.x + rect.w <= maxX &&
  rect.y >= minY &&
  rect.y + rect.h <= maxY

const toRectTag = (rect) =>
  `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgb(0,0,0)"/>`

const header = original.slice(0, original.indexOf('<rect'))
const footer = '</svg>'

const detailRects = rects.filter(isBlack)
const fieldRects = rects.filter((rect) => isWhite(rect) && isInsideShield(rect))

const details = header + detailRects.map(toRectTag).join('') + footer
const field = header + fieldRects.map(toRectTag).join('') + footer

fs.writeFileSync(path.join(publicDir, detailsDest), details)
fs.writeFileSync(path.join(publicDir, fieldDest), field)

console.log(`Processed ${detailsDest}: ${detailRects.length} detail pixels`)
console.log(`Processed ${fieldDest}: ${fieldRects.length} interior field pixels`)
console.log(`Shield bounds: x=${minX}-${maxX}, y=${minY}-${maxY}`)
