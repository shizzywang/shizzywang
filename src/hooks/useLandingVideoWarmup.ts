import { useCallback, useEffect, useRef, useState } from 'react'

type WarmMap = Record<string, boolean>
type VideoMap = Record<string, HTMLVideoElement | null>

type UseLandingVideoWarmupOptions = {
  sources: string[]
  delayMs?: number
}

type IdleCallbackHandle = number
type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: IdleCallback,
    options?: { timeout: number },
  ) => IdleCallbackHandle
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void
}

export function useLandingVideoWarmup({
  sources,
  delayMs = 1600,
}: UseLandingVideoWarmupOptions) {
  const videosRef = useRef<VideoMap>({})
  const [warmMap, setWarmMap] = useState<WarmMap>({})
  const warmupInFlightRef = useRef<Record<string, boolean>>({})

  const setWarm = useCallback((src: string) => {
    setWarmMap((prev) => (prev[src] ? prev : { ...prev, [src]: true }))
  }, [])

  const ensureWarm = useCallback(
    (src: string) => {
      const video = videosRef.current[src]
      if (!video) return

      // Fast path: already buffered enough.
      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        setWarm(src)
        return
      }

      // Avoid stacking repeated warmup work during rapid pointer movement.
      if (warmupInFlightRef.current[src]) return
      warmupInFlightRef.current[src] = true

      const maybeSetWarm = () => {
        if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) setWarm(src)
        warmupInFlightRef.current[src] = false
      }

      const onCanPlay = () => maybeSetWarm()
      const onLoadedData = () => maybeSetWarm()

      video.addEventListener('canplay', onCanPlay, { once: true })
      video.addEventListener('loadeddata', onLoadedData, { once: true })

      // Kick the buffering pipeline without playing (playing can fight hover reveal).
      video.preload = 'auto'
      video.load()

      // Safety: if events never fire, don't keep the in-flight flag forever.
      window.setTimeout(() => {
        warmupInFlightRef.current[src] = false
      }, 6000)
    },
    [setWarm],
  )

  const warmVideo = useCallback(
    (src: string) => {
      ensureWarm(src)
    },
    [ensureWarm],
  )

  const nudgeWarmup = useCallback(
    (src: string) => {
      // Intent warmup must be non-destructive: never seek/pause/reset the element.
      ensureWarm(src)
    },
    [ensureWarm],
  )

  const registerVideo = useCallback(
    (src: string, node: HTMLVideoElement | null) => {
      videosRef.current[src] = node
      if (!node) return
      if (node.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        setWarm(src)
      }
    },
    [setWarm],
  )

  useEffect(() => {
    const win = window as WindowWithIdleCallback
    let timeoutId = 0
    let idleId: IdleCallbackHandle | undefined

    const runWarmup = () => {
      for (const src of sources) {
        warmVideo(src)
      }
    }

    timeoutId = window.setTimeout(() => {
      if (typeof win.requestIdleCallback === 'function') {
        idleId = win.requestIdleCallback(() => runWarmup(), { timeout: 1000 })
        return
      }
      runWarmup()
    }, delayMs)

    return () => {
      window.clearTimeout(timeoutId)
      if (idleId && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId)
      }
    }
  }, [delayMs, sources, warmVideo])

  const isWarm = useCallback((src: string) => Boolean(warmMap[src]), [warmMap])

  return {
    registerVideo,
    isWarm,
    warmVideo,
    nudgeWarmup,
  }
}
