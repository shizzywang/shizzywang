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

function parkAtFirstFrame(video: HTMLVideoElement) {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
  // Never interrupt an in-progress hover play().
  if (!video.paused) return
  try {
    if (video.currentTime > 0.05) video.currentTime = 0
  } catch {
    // Ignore seek errors on freshly loaded media.
  }
}

export function useLandingVideoWarmup({
  sources,
  delayMs = 500,
}: UseLandingVideoWarmupOptions) {
  const videosRef = useRef<VideoMap>({})
  const [warmMap, setWarmMap] = useState<WarmMap>({})
  const warmupInFlightRef = useRef<Record<string, boolean>>({})
  const hardLoadedRef = useRef<Record<string, boolean>>({})

  const setWarm = useCallback((src: string) => {
    setWarmMap((prev) => (prev[src] ? prev : { ...prev, [src]: true }))
  }, [])

  const attachWarmListeners = useCallback(
    (src: string, video: HTMLVideoElement) => {
      if (warmupInFlightRef.current[src]) return
      warmupInFlightRef.current[src] = true

      const maybeSetWarm = () => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          parkAtFirstFrame(video)
        }
        if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          setWarm(src)
        }
        warmupInFlightRef.current[src] = false
      }

      video.addEventListener('canplay', maybeSetWarm, { once: true })
      video.addEventListener('loadeddata', maybeSetWarm, { once: true })

      window.setTimeout(() => {
        warmupInFlightRef.current[src] = false
      }, 6000)
    },
    [setWarm],
  )

  /** Soft warm: never reset the element — only ensure preload is on. */
  const nudgeWarmup = useCallback(
    (src: string) => {
      const video = videosRef.current[src]
      if (!video) return

      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        setWarm(src)
        return
      }

      video.preload = 'auto'

      const alreadyLoading =
        video.readyState > HTMLMediaElement.HAVE_NOTHING ||
        video.networkState === HTMLMediaElement.NETWORK_LOADING

      if (alreadyLoading) {
        attachWarmListeners(src, video)
        return
      }

      // Nothing started yet: soft nudge still avoids load() — idle hard warm will kick.
      attachWarmListeners(src, video)
    },
    [attachWarmListeners, setWarm],
  )

  /** Hard warm: call load() only once when the element has never started. */
  const warmVideo = useCallback(
    (src: string) => {
      const video = videosRef.current[src]
      if (!video) return

      if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        setWarm(src)
        return
      }

      video.preload = 'auto'
      attachWarmListeners(src, video)

      if (
        video.readyState === HTMLMediaElement.HAVE_NOTHING &&
        !hardLoadedRef.current[src]
      ) {
        hardLoadedRef.current[src] = true
        video.load()
      }
    },
    [attachWarmListeners, setWarm],
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
