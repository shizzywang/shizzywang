export const gridToRects = (grid, w, h) => {
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

export const rectsToGrid = (rects, w, h) => {
  const grid = new Uint8Array(w * h)
  for (const rect of rects) {
    for (let dy = 0; dy < rect.h; dy += 1) {
      for (let dx = 0; dx < rect.w; dx += 1) {
        const x = rect.x + dx
        const y = rect.y + dy
        if (x >= 0 && x < w && y >= 0 && y < h) {
          grid[y * w + x] = 1
        }
      }
    }
  }
  return grid
}

export const trimGrid = (grid, w, h) => {
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

export const scaleGridNearest = (grid, srcW, srcH, dstW, dstH) => {
  const out = new Uint8Array(dstW * dstH)
  for (let y = 0; y < dstH; y += 1) {
    const sy = Math.min(srcH - 1, Math.floor((y * srcH) / dstH))
    for (let x = 0; x < dstW; x += 1) {
      const sx = Math.min(srcW - 1, Math.floor((x * srcW) / dstW))
      out[y * dstW + x] = grid[sy * srcW + sx]
    }
  }
  return out
}

export const downsampleGridMajority = (grid, srcW, srcH, blockW, blockH) => {
  const dstW = Math.floor(srcW / blockW)
  const dstH = Math.floor(srcH / blockH)
  const out = new Uint8Array(dstW * dstH)

  for (let y = 0; y < dstH; y += 1) {
    for (let x = 0; x < dstW; x += 1) {
      let count = 0
      for (let by = 0; by < blockH; by += 1) {
        for (let bx = 0; bx < blockW; bx += 1) {
          if (grid[(y * blockH + by) * srcW + (x * blockW + bx)]) {
            count += 1
          }
        }
      }
      out[y * dstW + x] = count >= Math.ceil((blockW * blockH) / 2) ? 1 : 0
    }
  }

  return { grid: out, w: dstW, h: dstH }
}

export const pruneGridIslands = (grid, w, h, minSize = 4) => {
  const visited = new Uint8Array(w * h)
  const out = new Uint8Array(grid)

  const flood = (startX, startY) => {
    const pixels = []
    const stack = [[startX, startY]]

    while (stack.length > 0) {
      const [x, y] = stack.pop()
      const index = y * w + x
      if (x < 0 || x >= w || y < 0 || y >= h) continue
      if (visited[index] || !grid[index]) continue
      visited[index] = 1
      pixels.push(index)
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }

    if (pixels.length >= minSize) {
      for (const index of pixels) out[index] = 1
    }
  }

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const index = y * w + x
      if (grid[index] && !visited[index]) flood(x, y)
    }
  }

  return out
}

export const closeGridHorizontalGaps = (grid, w, h, maxGap = 1) => {
  const out = new Uint8Array(grid)
  for (let y = 0; y < h; y += 1) {
    let runStart = -1
    for (let x = 0; x <= w; x += 1) {
      const filled = x < w && grid[y * w + x]
      if (filled && runStart < 0) {
        runStart = x
      } else if (!filled && runStart >= 0) {
        const runEnd = x - 1
        if (x < w) {
          let nextStart = x
          while (nextStart < w && !grid[y * w + nextStart]) nextStart += 1
          if (nextStart < w && nextStart - runEnd - 1 <= maxGap) {
            for (let fillX = runEnd + 1; fillX < nextStart; fillX += 1) {
              out[y * w + fillX] = 1
            }
          }
        }
        runStart = -1
      }
    }
  }
  return out
}

export const closeGridVerticalGaps = (grid, w, h, maxGap = 1) => {
  const out = new Uint8Array(grid)
  for (let x = 0; x < w; x += 1) {
    let runStart = -1
    for (let y = 0; y <= h; y += 1) {
      const filled = y < h && grid[y * w + x]
      if (filled && runStart < 0) {
        runStart = y
      } else if (!filled && runStart >= 0) {
        const runEnd = y - 1
        if (y < h) {
          let nextStart = y
          while (nextStart < h && !grid[nextStart * w + x]) nextStart += 1
          if (nextStart < h && nextStart - runEnd - 1 <= maxGap) {
            for (let fillY = runEnd + 1; fillY < nextStart; fillY += 1) {
              out[fillY * w + x] = 1
            }
          }
        }
        runStart = -1
      }
    }
  }
  return out
}

const dilateGrid = (grid, w, h) => {
  const out = new Uint8Array(grid)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!grid[y * w + x]) continue
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            out[ny * w + nx] = 1
          }
        }
      }
    }
  }
  return out
}

const erodeGrid = (grid, w, h) => {
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!grid[y * w + x]) continue
      let keep = true
      for (let dy = -1; dy <= 1 && keep; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h || !grid[ny * w + nx]) {
            keep = false
            break
          }
        }
      }
      if (keep) out[y * w + x] = 1
    }
  }
  return out
}

/** Dilate then erode to seal thin stroke channels without growing the silhouette. */
export const morphCloseGrid = (grid, w, h, iterations = 1) => {
  let out = grid
  for (let i = 0; i < iterations; i += 1) out = dilateGrid(out, w, h)
  for (let i = 0; i < iterations; i += 1) out = erodeGrid(out, w, h)
  return out
}

/** Fill empty cells that are fully enclosed (not connected to the grid edge). */
export const fillEnclosedHoles = (grid, w, h) => {
  const visited = new Uint8Array(w * h)
  const stack = []

  const push = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const index = y * w + x
    if (visited[index] || grid[index]) return
    visited[index] = 1
    stack.push(index)
  }

  for (let x = 0; x < w; x += 1) {
    push(x, 0)
    push(x, h - 1)
  }
  for (let y = 0; y < h; y += 1) {
    push(0, y)
    push(w - 1, y)
  }

  while (stack.length > 0) {
    const index = stack.pop()
    const x = index % w
    const y = (index / w) | 0
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)
  }

  const out = new Uint8Array(grid)
  for (let i = 0; i < w * h; i += 1) {
    if (!grid[i] && !visited[i]) out[i] = 1
  }
  return out
}
