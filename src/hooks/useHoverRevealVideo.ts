import { useEffect, useRef, useState } from 'react'

function revealAfterFirstFrame(video: HTMLVideoElement, onReveal: () => void) {
  if ('requestVideoFrameCallback' in video) {
    video.requestVideoFrameCallback(() => onReveal())
  } else {
    requestAnimationFrame(() => onReveal())
  }
}

export function useHoverRevealVideo(active: boolean, isWarm: boolean) {
  const [videoRevealed, setVideoRevealed] = useState(false)
  const [videoExiting, setVideoExiting] = useState(false)
  const [videoFallbackVisible, setVideoFallbackVisible] = useState(false)
  const [videoWarmReveal, setVideoWarmReveal] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoRevealedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !active) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let cancelled = false

    videoRevealedRef.current = false
    setVideoExiting(false)
    setVideoWarmReveal(isWarm)
    setVideoFallbackVisible(!isWarm)

    const reveal = () => {
      if (!cancelled) {
        videoRevealedRef.current = true
        setVideoRevealed(true)
        setVideoFallbackVisible(false)
      }
    }

    const onPlaying = () => {
      if (!cancelled) {
        setVideoFallbackVisible(false)
      }
      if (reducedMotion) {
        reveal()
        return
      }
      revealAfterFirstFrame(video, reveal)
    }

    const onPlaybackFailure = () => {
      if (!cancelled) {
        setVideoFallbackVisible(true)
        // Ensure we don't keep the luxury scrim around during failures.
        setVideoRevealed(false)
        videoRevealedRef.current = false
      }
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      void video.play().then(onPlaying).catch(onPlaybackFailure)
    } else {
      video.addEventListener('playing', onPlaying, { once: true })
      void video.play().catch(onPlaybackFailure)
    }

    video.addEventListener('error', onPlaybackFailure)
    video.addEventListener('stalled', onPlaybackFailure)

    return () => {
      cancelled = true
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('error', onPlaybackFailure)
      video.removeEventListener('stalled', onPlaybackFailure)
    }
  }, [active, isWarm])

  useEffect(() => {
    if (active) return

    videoRef.current?.pause()

    if (!videoRevealedRef.current) {
      setVideoExiting(false)
      setVideoFallbackVisible(false)
      setVideoWarmReveal(false)
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
    setVideoFallbackVisible(false)
    setVideoWarmReveal(false)
  }

  return {
    videoRef,
    videoRevealed,
    videoExiting,
    videoFallbackVisible,
    videoWarmReveal,
    handleScrimTransitionEnd,
  }
}
