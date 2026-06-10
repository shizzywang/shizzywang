import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const publicDir = path.join(rootDir, 'public')

const source = 'heraldic_shield_black_white copy.svg'

// Tunable classification bounds for splitting black pixels into mask layers.
const OUTLINE_INSET = 45
const LION = { minX: 280, maxX: 980, minY: 100, maxY: 520 }
const CENTRAL_SWORD = { minX: 590, maxX: 670, minY: 380, maxY: 920 }
const HELD_SWORD = { minX: 660, maxX: 780, minY: 160, maxY: 420 }

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
const shieldMinX = Math.min(...blackRects.map((r) => r.x))
const shieldMaxX = Math.max(...blackRects.map((r) => r.x + r.w))
const shieldMinY = Math.min(...blackRects.map((r) => r.y))
const shieldMaxY = Math.max(...blackRects.map((r) => r.y + r.h))

const isInsideShield = (rect) =>
  rect.x >= shieldMinX &&
  rect.x + rect.w <= shieldMaxX &&
  rect.y >= shieldMinY &&
  rect.y + rect.h <= shieldMaxY

const inBounds = (p, bounds) =>
  p.x >= bounds.minX &&
  p.x <= bounds.maxX &&
  p.y >= bounds.minY &&
  p.y <= bounds.maxY

const isOutline = (p) =>
  p.x <= shieldMinX + OUTLINE_INSET || p.x >= shieldMaxX - OUTLINE_INSET

const isCentralSword = (p) => !isOutline(p) && inBounds(p, CENTRAL_SWORD)

const isHeldSword = (p) => !isOutline(p) && inBounds(p, HELD_SWORD)

const isLion = (p) =>
  !isOutline(p) && !isCentralSword(p) && !isHeldSword(p) && inBounds(p, LION)

const classifyBlack = (p) => {
  if (isOutline(p)) return 'outline'
  if (isCentralSword(p)) return 'sword'
  if (isHeldSword(p)) return 'sword'
  if (isLion(p)) return 'lion'
  return 'charges'
}

const toRectTag = (rect) =>
  `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgb(0,0,0)"/>`

const header = original.slice(0, original.indexOf('<rect'))
const footer = '</svg>'

const writeMask = (filename, layerRects) => {
  const svg = header + layerRects.map(toRectTag).join('') + footer
  fs.writeFileSync(path.join(publicDir, filename), svg)
  return layerRects.length
}

const fieldRects = rects.filter((rect) => isWhite(rect) && isInsideShield(rect))
const outlineRects = []
const lionRects = []
const swordRects = []
const chargesRects = []

for (const rect of blackRects) {
  const layer = classifyBlack(rect)
  if (layer === 'outline') outlineRects.push(rect)
  else if (layer === 'lion') lionRects.push(rect)
  else if (layer === 'sword') swordRects.push(rect)
  else chargesRects.push(rect)
}

const outputs = [
  ['heraldic-shield-field.svg', fieldRects],
  ['heraldic-shield-outline.svg', outlineRects],
  ['heraldic-lion.svg', lionRects],
  ['heraldic-sword.svg', swordRects],
  ['heraldic-charges.svg', chargesRects],
]

for (const [filename, layerRects] of outputs) {
  const count = writeMask(filename, layerRects)
  console.log(`Processed ${filename}: ${count} pixels`)
}

console.log(
  `Shield bounds: x=${shieldMinX}-${shieldMaxX}, y=${shieldMinY}-${shieldMaxY}`,
)
