import { useEffect, useRef, useState } from 'react'

function revealAfterFirstFrame(video: HTMLVideoElement, onReveal: () => void) {
  if ('requestVideoFrameCallback' in video) {
    video.requestVideoFrameCallback(() => onReveal())
  } else {
    requestAnimationFrame(() => onReveal())
  }
}

export function useHoverRevealVideo(active: boolean) {
  const [videoMounted, setVideoMounted] = useState(false)
  const [videoRevealed, setVideoRevealed] = useState(false)
  const [videoExiting, setVideoExiting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoRevealedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !active) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cancelled = false

    videoRevealedRef.current = false
    setVideoExiting(false)
    setVideoMounted(true)

    const reveal = () => {
      if (!cancelled) {
        videoRevealedRef.current = true
        setVideoRevealed(true)
      }
    }

    const onPlaying = () => {
      if (reducedMotion) {
        reveal()
        return
      }
      revealAfterFirstFrame(video, reveal)
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      void video.play().then(onPlaying).catch(() => {})
    } else {
      video.addEventListener('playing', onPlaying, { once: true })
      void video.play().catch(() => {})
    }

    return () => {
      cancelled = true
      video.removeEventListener('playing', onPlaying)
    }
  }, [active])

  useEffect(() => {
    if (active) return

    videoRef.current?.pause()

    if (!videoRevealedRef.current) {
      setVideoExiting(false)
      setVideoMounted(false)
      return
    }

    setVideoExiting(true)
    setVideoRevealed(false)
  }, [active])

  const handleScrimTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (event.propertyName !== 'opacity' || active || videoRevealed) return
    videoRevealedRef.current = false
    setVideoExiting(false)
    setVideoMounted(false)
  }

  return {
    videoRef,
    videoMounted,
    videoRevealed,
    videoExiting,
    handleScrimTransitionEnd,
  }
}
