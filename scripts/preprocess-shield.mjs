import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const publicDir = path.join(rootDir, 'public')

const crestSource = 'shizzywang_crest.svg'
const fieldSource = 'heraldic_shield_black_white copy.svg'

const LION_GROUPS = new Set([
  'lion_body_main',
  'lion_arm',
  'fingers_overlay',
  'held_sword_hilt',
  'held_sword_blade',
])

const CENTRAL_SWORD_GROUPS = new Set(['center_sword'])

const CHARGE_GROUPS = new Set([
  'shield_outer_border',
  'shield_inner_border',
  'leaf_top_left',
  'leaf_top_right',
  'leaf_mid_left',
  'leaf_mid_right',
  'garb_left',
  'garb_right',
  'garb_bottom',
])

const MASK_HEADER =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254" shape-rendering="crispEdges">'

const rectTagRe = /<rect\b[^>]*\/?>/gi
const attrRe = (name) => new RegExp(`\\b${name}="([^"]+)"`)

const parseRectTag = (tag) => {
  const read = (name) => {
    const match = tag.match(attrRe(name))
    return match ? Number(match[1]) : NaN
  }

  return {
    x: read('x'),
    y: read('y'),
    w: read('width'),
    h: read('height'),
  }
}

const toMaskRect = (rect) =>
  `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgb(0,0,0)"/>`

const toWhiteMaskRect = (rect) =>
  `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgb(255,255,255)"/>`

const extractGroupById = (svg, groupId) => {
  const idPattern = new RegExp(`<g\\b[^>]*\\bid="${groupId}"[^>]*>`, 'i')
  const match = idPattern.exec(svg)
  if (!match) return ''

  let depth = 1
  let index = match.index + match[0].length
  const start = index

  while (index < svg.length && depth > 0) {
    const rest = svg.slice(index)
    if (rest.startsWith('<g')) {
      depth += 1
      index = svg.indexOf('>', index) + 1
      continue
    }
    if (rest.startsWith('</g>')) {
      depth -= 1
      if (depth === 0) break
      index += 4
      continue
    }
    index += 1
  }

  return svg.slice(start, index)
}

const collectRectsFromGroup = (svg, groupId) => {
  const content = extractGroupById(svg, groupId)
  if (!content) {
    console.warn(`Warning: group "${groupId}" not found`)
    return []
  }

  const rects = []
  for (const tag of content.matchAll(rectTagRe)) {
    const rect = parseRectTag(tag[0])
    if (Number.isFinite(rect.x) && Number.isFinite(rect.y)) {
      rects.push(rect)
    }
  }
  return rects
}

const collectRectsFromGroups = (svg, groupIds) =>
  groupIds.flatMap((groupId) => collectRectsFromGroup(svg, groupId))

const writeMask = (filename, rects, toTag = toMaskRect) => {
  const svg = MASK_HEADER + rects.map(toTag).join('') + '</svg>'
  fs.writeFileSync(path.join(publicDir, filename), svg)
  return rects.length
}

const crestPath = path.join(rootDir, crestSource)
const crestSvg = fs.readFileSync(crestPath, 'utf8')

const lionRects = collectRectsFromGroups(crestSvg, [...LION_GROUPS])
const centralSwordRects = collectRectsFromGroups(crestSvg, [...CENTRAL_SWORD_GROUPS])
const chargesRects = collectRectsFromGroups(crestSvg, [...CHARGE_GROUPS])
const allChargeRects = [...chargesRects, ...lionRects, ...centralSwordRects]

const fieldInputPath = path.join(rootDir, fieldSource)
const fieldOriginal = fs.readFileSync(fieldInputPath, 'utf8')
const legacyRectRe =
  /<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="rgb\((\d+),(\d+),(\d+)\)"\/>/g

const legacyRects = []
for (const match of fieldOriginal.matchAll(legacyRectRe)) {
  legacyRects.push({
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

const blackRects = legacyRects.filter(isBlack)
const shieldMinX = Math.min(...blackRects.map((rect) => rect.x))
const shieldMaxX = Math.max(...blackRects.map((rect) => rect.x + rect.w))
const shieldMinY = Math.min(...blackRects.map((rect) => rect.y))
const shieldMaxY = Math.max(...blackRects.map((rect) => rect.y + rect.h))

const isInsideShield = (rect) =>
  rect.x >= shieldMinX &&
  rect.x + rect.w <= shieldMaxX &&
  rect.y >= shieldMinY &&
  rect.y + rect.h <= shieldMaxY

const fieldRects = legacyRects.filter(
  (rect) => isWhite(rect) && isInsideShield(rect),
)

const outputs = [
  ['heraldic-shield-field.svg', fieldRects, toWhiteMaskRect],
  ['heraldic-shield-charges.svg', chargesRects, toMaskRect],
  ['heraldic-lion.svg', lionRects, toMaskRect],
  ['heraldic-central-sword.svg', centralSwordRects, toMaskRect],
  ['heraldic-shield.svg', allChargeRects, toMaskRect],
]

for (const [filename, rects, toTag] of outputs) {
  const count = writeMask(filename, rects, toTag)
  console.log(`Processed ${filename}: ${count} pixels`)
}

const lionHitBounds = lionRects.reduce(
  (bounds, rect) => ({
    minX: Math.min(bounds.minX, rect.x),
    maxX: Math.max(bounds.maxX, rect.x + rect.w),
    minY: Math.min(bounds.minY, rect.y),
    maxY: Math.max(bounds.maxY, rect.y + rect.h),
  }),
  { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
)

const canvas = 1254
const lionHit = {
  top: ((lionHitBounds.minY / canvas) * 100).toFixed(1),
  left: ((lionHitBounds.minX / canvas) * 100).toFixed(1),
  width: (((lionHitBounds.maxX - lionHitBounds.minX) / canvas) * 100).toFixed(1),
  height: (((lionHitBounds.maxY - lionHitBounds.minY) / canvas) * 100).toFixed(1),
}

console.log(
  `Shield bounds: x=${shieldMinX}-${shieldMaxX}, y=${shieldMinY}-${shieldMaxY}`,
)
console.log(
  `Suggested lion-hit: top=${lionHit.top}%; left=${lionHit.left}%; width=${lionHit.width}%; height=${lionHit.height}%`,
)

const obsolete = [
  'heraldic-shield-rest.svg',
  'heraldic-shield-figures.svg',
  'heraldic-held-blade.svg',
  'heraldic-shield-outline.svg',
  'heraldic-sword.svg',
  'heraldic-charges.svg',
]

for (const filename of obsolete) {
  const filePath = path.join(publicDir, filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`Removed ${filename}`)
  }
}
