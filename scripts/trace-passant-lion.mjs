import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import {
  downsampleGridMajority,
  fillEnclosedHoles,
  gridToRects,
  morphCloseGrid,
  pruneGridIslands,
  trimGrid,
} from './heraldic-grid.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const assetsDir = path.join(rootDir, 'src', 'assets', 'heraldic')
const outputPath = path.join(assetsDir, 'passant-guardant-sprite.svg')
const ROYAL_ARMS_SVG = path.join(assetsDir, 'royal-arms-reference.svg')

const SHIELD_W = 409.65
const SHIELD_H = 478.32
// Middle lion band (same proportions as PNG trace)
const MIDDLE_LION_FRAC = {
  left: 47 / 410,
  top: 144 / 478,
  width: 323 / 410,
  height: 114 / 478,
}

const RASTER_W = 600
const DOWNSAMPLE_BLOCK = 3
const TARGET_W = 200
const FILL = '#d2b795'

// Gules field of the Royal Arms — everything else in the crop is lion.
const isGulesPixel = (r, g, b, a = 255) =>
  a >= 128 && r > 140 && g < 100 && b < 100 && r - g > 60

const isLionPixel = (r, g, b, a = 255) =>
  a >= 128 && !isGulesPixel(r, g, b, a)

const rasterToGrid = (data, w, h, channels) => {
  const grid = new Uint8Array(w * h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * channels
      grid[y * w + x] = isLionPixel(
        data[i],
        data[i + 1],
        data[i + 2],
        channels > 3 ? data[i + 3] : 255,
      )
        ? 1
        : 0
    }
  }
  return grid
}

const solidifyLionGrid = (grid, w, h, closeIterations) => {
  let out = pruneGridIslands(grid, w, h, 8)
  out = morphCloseGrid(out, w, h, closeIterations)
  out = fillEnclosedHoles(out, w, h)
  return out
}

const writeSpriteSvg = (rects, w, h) => {
  const header = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">`
  const body = rects
    .map(
      (rect) =>
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="${FILL}"/>`,
    )
    .join('')
  const svg = header + body + '</svg>'
  fs.mkdirSync(assetsDir, { recursive: true })
  fs.writeFileSync(outputPath, svg)
}

export const tracePassantGuardantSprite = async (options = {}) => {
  const sourcePath = options.sourcePath ?? ROYAL_ARMS_SVG
  const targetW = options.targetW ?? TARGET_W

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Royal Arms reference not found: ${sourcePath}`)
  }

  const rasterH = Math.round(SHIELD_H * (RASTER_W / SHIELD_W))
  const crop = {
    left: Math.round(MIDDLE_LION_FRAC.left * RASTER_W),
    top: Math.round(MIDDLE_LION_FRAC.top * rasterH),
    width: Math.round(MIDDLE_LION_FRAC.width * RASTER_W),
    height: Math.round(MIDDLE_LION_FRAC.height * rasterH),
  }

  // Nearest-neighbor avoids Lanczos bleed that punches holes through thin strokes.
  const { data, info } = await sharp(sourcePath)
    .resize(RASTER_W, rasterH, { kernel: sharp.kernel.nearest })
    .extract(crop)
    .resize(targetW * DOWNSAMPLE_BLOCK, null, {
      kernel: sharp.kernel.nearest,
    })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const hiW = info.width
  const hiH = info.height
  let grid = rasterToGrid(data, hiW, hiH, info.channels)
  grid = solidifyLionGrid(grid, hiW, hiH, 2)

  const down = downsampleGridMajority(
    grid,
    hiW,
    hiH,
    DOWNSAMPLE_BLOCK,
    DOWNSAMPLE_BLOCK,
  )
  const cleaned = solidifyLionGrid(down.grid, down.w, down.h, 1)

  const trimmed = trimGrid(cleaned, down.w, down.h)
  const rects = gridToRects(trimmed.grid, trimmed.w, trimmed.h)
  writeSpriteSvg(rects, trimmed.w, trimmed.h)

  const nonH1 = rects.filter((rect) => rect.h !== 1).length
  if (nonH1 > 0) {
    console.warn(`Warning: sprite has ${nonH1} rects with height != 1`)
  }

  console.log(
    `Traced passant-guardant sprite: ${rects.length} rects, ${trimmed.w}x${trimmed.h}px (from SVG)`,
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
