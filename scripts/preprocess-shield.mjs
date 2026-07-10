import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { tracePassantGuardantSprite } from './trace-passant-lion.mjs'
import {
  gridToRects,
  rectsToGrid,
  scaleGridNearest,
} from './heraldic-grid.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const publicDir = path.join(rootDir, 'public')
const assetsDir = path.join(rootDir, 'src', 'assets', 'heraldic')

const crestSource = 'shizzywang_crest_side_lions_more_gap_wide_viewport.svg'
const fieldSource = 'heraldic_shield_black_white copy.svg'

const VIEWPORT_W = 2040
const VIEWPORT_H = 1500
const CREST_OFFSET_X = 273
const CREST_OFFSET_Y = 120
// heraldic_shield_black_white copy.svg is 120px left of crest groups in the nested 1254 viewBox
const FIELD_SOURCE_DX = 120

const LION_GROUPS = new Set([
  'lion_body_main',
  'lion_arm',
  'fingers_overlay',
  'held_sword_hilt',
  'held_sword_blade',
])

const CENTRAL_SWORD_GROUPS = new Set(['center_sword'])

const BORDER_GROUPS = ['shield_outer_border', 'shield_inner_border']

const CHARGE_GROUPS = new Set([
  ...BORDER_GROUPS,
  'garb_left',
  'garb_right',
  'garb_bottom',
])

const LEAF_GROUPS = new Set([
  'leaf_top_left',
  'leaf_top_right',
  'leaf_mid_left',
  'leaf_mid_right',
])

const GARB_GROUPS = {
  left: 'garb_left',
  right: 'garb_right',
  bottom: 'garb_bottom',
}

const GARB_HIT_PADDING = 24

// England "in pale": three traced passant-guardant sprites stacked vertically,
// centered in the lower shield field under the existing top lion (ends ~y=560).
const THREE_LION_CENTER_X = 1020
const THREE_LION_FIELD_TOP = 590
const THREE_LION_FIELD_BOTTOM = 1180
const THREE_LION_TARGET_W = 620
const PASSANT_SPRITE_PATH = path.join(assetsDir, 'passant-guardant-sprite.svg')
const ROYAL_ARMS_SVG = path.join(assetsDir, 'royal-arms-reference.svg')

const MASK_HEADER = `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEWPORT_W}" height="${VIEWPORT_H}" viewBox="0 0 ${VIEWPORT_W} ${VIEWPORT_H}" shape-rendering="crispEdges">`

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

const offsetRects = (rects, dx, dy) =>
  rects.map((rect) => ({
    ...rect,
    x: rect.x + dx,
    y: rect.y + dy,
  }))

const toMaskRect = (rect) =>
  `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgb(0,0,0)"/>`

const toWhiteMaskRect = (rect) =>
  `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgb(255,255,255)"/>`

const toClipRect = (rect) =>
  `<rect x="${(rect.x / VIEWPORT_W).toFixed(6)}" y="${(rect.y / VIEWPORT_H).toFixed(6)}" width="${(rect.w / VIEWPORT_W).toFixed(6)}" height="${(rect.h / VIEWPORT_H).toFixed(6)}"/>`

const TAN = '#d2b795'
const WHITE = '#ffffff'
const toTanRect = (rect) =>
  `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${TAN}"/>`
const toFilledRect = (color) => (rect) =>
  `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${color}"/>`

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

const boundsFromRects = (rects) =>
  rects.reduce(
    (bounds, rect) => ({
      minX: Math.min(bounds.minX, rect.x),
      maxX: Math.max(bounds.maxX, rect.x + rect.w),
      minY: Math.min(bounds.minY, rect.y),
      maxY: Math.max(bounds.maxY, rect.y + rect.h),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  )

const boundsToHitPercent = (bounds, padding = 0) => {
  const minX = Math.max(0, bounds.minX - padding)
  const minY = Math.max(0, bounds.minY - padding)
  const maxX = Math.min(VIEWPORT_W, bounds.maxX + padding)
  const maxY = Math.min(VIEWPORT_H, bounds.maxY + padding)

  return {
    top: ((minY / VIEWPORT_H) * 100).toFixed(1),
    left: ((minX / VIEWPORT_W) * 100).toFixed(1),
    width: (((maxX - minX) / VIEWPORT_W) * 100).toFixed(1),
    height: (((maxY - minY) / VIEWPORT_H) * 100).toFixed(1),
  }
}

const writeSvg = (dir, filename, rects, toTag = toMaskRect) => {
  const svg = MASK_HEADER + rects.map(toTag).join('') + '</svg>'
  fs.writeFileSync(path.join(dir, filename), svg)
  return rects.length
}

const writeMask = (filename, rects, toTag = toMaskRect) =>
  writeSvg(publicDir, filename, rects, toTag)

const placeRects = (rects, anchorX, anchorY, align = 'topleft') => {
  const bounds = boundsFromRects(rects)
  const centerX = (bounds.minX + bounds.maxX) / 2
  const dx =
    align === 'topcenter' ? anchorX - centerX : anchorX - bounds.minX
  const dy = anchorY - bounds.minY
  return rects.map((rect) => ({
    ...rect,
    x: Math.round(rect.x + dx),
    y: Math.round(rect.y + dy),
    w: rect.w,
    h: rect.h,
  }))
}

const loadPassantSpriteRects = (svg) => {
  const rects = []
  for (const tag of svg.matchAll(rectTagRe)) {
    const rect = parseRectTag(tag[0])
    if (Number.isFinite(rect.x) && Number.isFinite(rect.y)) {
      rects.push(rect)
    }
  }
  return rects
}

const generateThreePassantLions = (spriteRects, spriteW, spriteH) => {
  const fieldH = THREE_LION_FIELD_BOTTOM - THREE_LION_FIELD_TOP

  const scaleByWidth = THREE_LION_TARGET_W / spriteW
  const lionHAtWidth = spriteH * scaleByWidth
  const gapAtWidth = (fieldH - lionHAtWidth * 3) / 4
  const minGap = 28
  const targetW = Math.round(
    gapAtWidth >= minGap
      ? THREE_LION_TARGET_W
      : spriteW * ((fieldH - minGap * 4) / (spriteH * 3)),
  )
  const targetH = Math.round(spriteH * (targetW / spriteW))

  const spriteGrid = rectsToGrid(spriteRects, spriteW, spriteH)
  const scaledGrid = scaleGridNearest(spriteGrid, spriteW, spriteH, targetW, targetH)
  const lionRects = gridToRects(scaledGrid, targetW, targetH)

  const lionH = targetH
  const remaining = fieldH - lionH * 3
  const gap = remaining / 4
  const tops = [0, 1, 2].map(
    (i) => THREE_LION_FIELD_TOP + gap + i * (lionH + gap),
  )

  const placed = tops.flatMap((y) =>
    placeRects(lionRects, THREE_LION_CENTER_X, y, 'topcenter'),
  )

  const badHeights = placed.filter((rect) => rect.h !== 1).length
  if (badHeights > 0) {
    console.warn(
      `Warning: three-lion output has ${badHeights} rects with height != 1`,
    )
  }

  return placed
}

fs.mkdirSync(assetsDir, { recursive: true })

if (fs.existsSync(ROYAL_ARMS_SVG)) {
  await tracePassantGuardantSprite({ sourcePath: ROYAL_ARMS_SVG })
} else if (!fs.existsSync(PASSANT_SPRITE_PATH)) {
  throw new Error(
    `Missing ${PASSANT_SPRITE_PATH} and ${ROYAL_ARMS_SVG}; add royal-arms-reference.svg or run trace-passant-lion.mjs.`,
  )
} else {
  console.log('Using existing passant-guardant-sprite.svg')
}

const passantSpriteSvg = fs.readFileSync(PASSANT_SPRITE_PATH, 'utf8')
const passantSpriteRects = loadPassantSpriteRects(passantSpriteSvg)
const spriteViewBox = passantSpriteSvg.match(
  /viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/,
)
const spriteW = spriteViewBox ? Number(spriteViewBox[1]) : boundsFromRects(passantSpriteRects).maxX
const spriteH = spriteViewBox ? Number(spriteViewBox[2]) : boundsFromRects(passantSpriteRects).maxY
console.log(
  `Loaded passant-guardant sprite: ${passantSpriteRects.length} rects (${spriteW}x${spriteH})`,
)

const crestPath = path.join(rootDir, crestSource)
const crestSvg = fs.readFileSync(crestPath, 'utf8')

const lionRects = offsetRects(
  collectRectsFromGroups(crestSvg, [...LION_GROUPS]),
  CREST_OFFSET_X,
  CREST_OFFSET_Y,
)
const centralSwordRects = offsetRects(
  collectRectsFromGroups(crestSvg, [...CENTRAL_SWORD_GROUPS]),
  CREST_OFFSET_X,
  CREST_OFFSET_Y,
)
// The central sword points down: hilt (pommel, grip, crossguard) sits above the
// blade. Everything above this y boundary is the handle, which can be tinted
// independently (e.g. gold) while the blade stays argent.
const CENTRAL_SWORD_HANDLE_MAX_Y = 701
const centralSwordHandleRects = centralSwordRects.filter(
  (rect) => rect.y + rect.h <= CENTRAL_SWORD_HANDLE_MAX_Y,
)
const borderRects = offsetRects(
  collectRectsFromGroups(crestSvg, BORDER_GROUPS),
  CREST_OFFSET_X,
  CREST_OFFSET_Y,
)
const chargesRects = offsetRects(
  collectRectsFromGroups(crestSvg, [...CHARGE_GROUPS]),
  CREST_OFFSET_X,
  CREST_OFFSET_Y,
)
const leafRects = offsetRects(
  collectRectsFromGroups(crestSvg, [...LEAF_GROUPS]),
  CREST_OFFSET_X,
  CREST_OFFSET_Y,
)
const threeLionRects = generateThreePassantLions(
  passantSpriteRects,
  spriteW,
  spriteH,
)
const garbRectsById = Object.fromEntries(
  Object.entries(GARB_GROUPS).map(([key, groupId]) => [
    key,
    offsetRects(collectRectsFromGroup(crestSvg, groupId), CREST_OFFSET_X, CREST_OFFSET_Y),
  ]),
)
const allChargeRects = [...chargesRects, ...leafRects, ...lionRects, ...centralSwordRects]
const shizzyChargeRects = [
  ...borderRects,
  ...leafRects,
  ...lionRects,
  ...threeLionRects,
]

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

const fieldRects = offsetRects(
  legacyRects.filter((rect) => isWhite(rect) && isInsideShield(rect)),
  CREST_OFFSET_X + FIELD_SOURCE_DX,
  CREST_OFFSET_Y,
)

const outputs = [
  ['heraldic-shield-field.svg', fieldRects, toWhiteMaskRect],
  ['heraldic-shield-charges.svg', chargesRects, toMaskRect],
  ['heraldic-leaves.svg', leafRects, toMaskRect],
  ['heraldic-lion.svg', lionRects, toMaskRect],
  ['heraldic-central-sword.svg', centralSwordRects, toMaskRect],
  ['heraldic-central-sword-handle.svg', centralSwordHandleRects, toMaskRect],
  ['heraldic-three-lions.svg', threeLionRects, toMaskRect],
  ['heraldic-shield.svg', allChargeRects, toMaskRect],
]

for (const [filename, rects, toTag] of outputs) {
  const count = writeMask(filename, rects, toTag)
  console.log(`Processed ${filename}: ${count} pixels`)
}

const assetOutputs = [
  ['heraldic-shield-filled.svg', allChargeRects, toTanRect],
  ['heraldic-shizzy-filled.svg', shizzyChargeRects, toFilledRect(WHITE)],
]

for (const [filename, rects, toTag] of assetOutputs) {
  const count = writeSvg(assetsDir, filename, rects, toTag)
  console.log(`Processed src/assets/heraldic/${filename}: ${count} pixels`)
}

for (const [key, rects] of Object.entries(garbRectsById)) {
  const filename = `heraldic-garb-${key}.svg`
  const count = writeMask(filename, rects, toMaskRect)
  console.log(`Processed ${filename}: ${count} pixels`)
}

const crestHitRects = [...fieldRects, ...allChargeRects]
const crestHitSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWPORT_W} ${VIEWPORT_H}">` +
  '<defs><clipPath id="crestClip" clipPathUnits="objectBoundingBox">' +
  crestHitRects.map(toClipRect).join('') +
  '</clipPath></defs></svg>'
fs.writeFileSync(path.join(publicDir, 'heraldic-crest-hit.svg'), crestHitSvg)
console.log(`Processed heraldic-crest-hit.svg: ${crestHitRects.length} pixels`)

const lionHitBounds = boundsFromRects(lionRects)

const faviconPadding = 12
const faviconViewBox = [
  lionHitBounds.minX - faviconPadding,
  lionHitBounds.minY - faviconPadding,
  lionHitBounds.maxX - lionHitBounds.minX + faviconPadding * 2,
  lionHitBounds.maxY - lionHitBounds.minY + faviconPadding * 2,
].join(' ')
const faviconHeader = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="${faviconViewBox}" shape-rendering="crispEdges">`
const faviconSvg = faviconHeader + lionRects.map(toTanRect).join('') + '</svg>'
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg)
console.log(`Processed favicon.svg: ${lionRects.length} pixels`)

const lionHit = {
  top: ((lionHitBounds.minY / VIEWPORT_H) * 100).toFixed(1),
  left: ((lionHitBounds.minX / VIEWPORT_W) * 100).toFixed(1),
  width: (((lionHitBounds.maxX - lionHitBounds.minX) / VIEWPORT_W) * 100).toFixed(1),
  height: (((lionHitBounds.maxY - lionHitBounds.minY) / VIEWPORT_H) * 100).toFixed(1),
}

console.log(
  `Shield bounds: x=${shieldMinX}-${shieldMaxX}, y=${shieldMinY}-${shieldMaxY}`,
)
console.log(
  `Suggested lion-hit: top=${lionHit.top}%; left=${lionHit.left}%; width=${lionHit.width}%; height=${lionHit.height}%`,
)
console.log(`Processed heraldic-three-lions.svg: ${threeLionRects.length} pixels`)

for (const [key, rects] of Object.entries(garbRectsById)) {
  const garbHit = boundsToHitPercent(boundsFromRects(rects), GARB_HIT_PADDING)
  console.log(
    `Suggested garb-hit--${key}: top=${garbHit.top}%; left=${garbHit.left}%; width=${garbHit.width}%; height=${garbHit.height}%`,
  )
}

const obsoletePublic = [
  'heraldic-shield-rest.svg',
  'heraldic-shield-figures.svg',
  'heraldic-held-blade.svg',
  'heraldic-shield-outline.svg',
  'heraldic-sword.svg',
  'heraldic-charges.svg',
  'heraldic-side-lions.svg',
  'heraldic-shield-filled.svg',
]

for (const filename of obsoletePublic) {
  const filePath = path.join(publicDir, filename)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    console.log(`Removed public/${filename}`)
  }
}
