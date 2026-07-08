import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const assetsDir = path.join(rootDir, 'src', 'assets', 'heraldic')
const outputPath = path.join(assetsDir, 'passant-guardant-sprite.svg')

const ROYAL_ARMS_PNG = path.join(
  process.env.HOME,
  '.cursor/projects/Users-dev-shizzywang/assets/Royal_arms_of_England-74fadcc9-98e1-4cc7-ae81-f6ce2cfea28f.png',
)
const MIDDLE_LION_CROP = { left: 47, top: 144, width: 323, height: 114 }

// Crest-friendly trace grid (~180–220 px wide per plan)
const TARGET_W = 200
const TARGET_H = Math.round(
  MIDDLE_LION_CROP.height * (TARGET_W / MIDDLE_LION_CROP.width),
)

const FILL = '#d2b795'

const isGoldPixel = (r, g, b, a = 255) => {
  if (a < 32) return false
  // Gold lion on gules: high R+G, low B
  return r > 150 && g > 110 && b < 130 && r - b > 40
}

const trimGrid = (grid, w, h) => {
  let minX = w
  let maxX = -1
  let minY = h
  let maxY = -1

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (grid[y * w + x]) {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { grid: new Uint8Array(0), w: 0, h: 0 }
  }

  const tw = maxX - minX + 1
  const th = maxY - minY + 1
  const trimmed = new Uint8Array(tw * th)

  for (let y = 0; y < th; y += 1) {
    for (let x = 0; x < tw; x += 1) {
      trimmed[y * tw + x] = grid[(minY + y) * w + (minX + x)]
    }
  }

  return { grid: trimmed, w: tw, h: th }
}

const gridToRects = (grid, w, h) => {
  const rects = []
  for (let y = 0; y < h; y += 1) {
    let x = 0
    while (x < w) {
      while (x < w && !grid[y * w + x]) x += 1
      if (x >= w) break
      const start = x
      while (x < w && grid[y * w + x]) x += 1
      rects.push({ x: start, y, w: x - start, h: 1 })
    }
  }
  return rects
}

export const tracePassantGuardantSprite = async (options = {}) => {
  const sourcePath = options.sourcePath ?? ROYAL_ARMS_PNG
  const targetW = options.targetW ?? TARGET_W

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Royal Arms reference not found: ${sourcePath}`)
  }

  const crop = options.crop ?? MIDDLE_LION_CROP
  const targetH = Math.round(crop.height * (targetW / crop.width))

  const { data, info } = await sharp(sourcePath)
    .extract(crop)
    .resize(targetW, targetH, { kernel: sharp.kernel.nearest })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const grid = new Uint8Array(targetW * targetH)
  const channels = info.channels

  for (let y = 0; y < targetH; y += 1) {
    for (let x = 0; x < targetW; x += 1) {
      const i = (y * targetW + x) * channels
      grid[y * targetW + x] = isGoldPixel(
        data[i],
        data[i + 1],
        data[i + 2],
        channels > 3 ? data[i + 3] : 255,
      )
        ? 1
        : 0
    }
  }

  const trimmed = trimGrid(grid, targetW, targetH)
  const rects = gridToRects(trimmed.grid, trimmed.w, trimmed.h)

  const header = `<svg xmlns="http://www.w3.org/2000/svg" width="${trimmed.w}" height="${trimmed.h}" viewBox="0 0 ${trimmed.w} ${trimmed.h}" shape-rendering="crispEdges">`
  const body = rects
    .map(
      (rect) =>
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${FILL}"/>`,
    )
    .join('')
  const svg = header + body + '</svg>'

  fs.mkdirSync(assetsDir, { recursive: true })
  fs.writeFileSync(outputPath, svg)

  console.log(
    `Traced passant-guardant sprite: ${rects.length} rects, ${trimmed.w}x${trimmed.h}px`,
  )

  return { rects, width: trimmed.w, height: trimmed.h, outputPath }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)

if (isMain) {
  tracePassantGuardantSprite().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
