import { useEffect, useRef, useState } from 'react'
import { useMouseCharge } from '../hooks/useMouseCharge'
import { HeraldicLogo } from './HeraldicLogo'
import { Wordmark } from './Wordmark'
import '../styles/landing.css'

function revealAfterFirstFrame(video: HTMLVideoElement, onReveal: () => void) {
  if ('requestVideoFrameCallback' in video) {
    video.requestVideoFrameCallback(() => onReveal())
  } else {
    requestAnimationFrame(() => onReveal())
  }
}

export function LandingPage() {
  const [logoHovered, setLogoHovered] = useState(false)
  const [gHovered, setGHovered] = useState(false)
  const [shizzyHovered, setShizzyHovered] = useState(false)
  const [videoMounted, setVideoMounted] = useState(false)
  const [videoRevealed, setVideoRevealed] = useState(false)
  const [videoExiting, setVideoExiting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoRevealedRef = useRef(false)
  const { pulseOpacity, burstActive } = useMouseCharge({
    enabled: !logoHovered && !gHovered && !shizzyHovered,
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video || !shizzyHovered) return

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
  }, [shizzyHovered])

  useEffect(() => {
    if (shizzyHovered) return

    videoRef.current?.pause()

    if (!videoRevealedRef.current) {
      setVideoExiting(false)
      setVideoMounted(false)
      return
    }

    setVideoExiting(true)
    setVideoRevealed(false)
  }, [shizzyHovered])

  const handleScrimTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (event.propertyName !== 'opacity' || shizzyHovered || videoRevealed) return
    videoRevealedRef.current = false
    setVideoExiting(false)
    setVideoMounted(false)
  }

  return (
    <div
      className={`landing-page${logoHovered ? ' landing-page--dark' : ''}`}
    >
      <div
        className={[
          'landing-page__video',
          videoMounted && 'landing-page__video--mounted',
          videoRevealed && 'landing-page__video--active',
          videoExiting && 'landing-page__video--exiting',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          src="/Britannia.mp4"
          muted
          loop
          playsInline
          preload="auto"
        />
        <div
          className="landing-page__video__scrim"
          aria-hidden="true"
          onTransitionEnd={handleScrimTransitionEnd}
        />
      </div>
      <div
        className={[
          'landing-page__overlay',
          !logoHovered && burstActive && 'landing-page__overlay--pulse',
        ]
          .filter(Boolean)
          .join(' ')}
        style={logoHovered ? undefined : { opacity: pulseOpacity }}
        aria-hidden="true"
      />
      <main className="landing-page__content">
        <div className="landing-page__hero">
          <Wordmark
            gHovered={gHovered}
            shizzyHovered={shizzyHovered}
            onGHoverChange={setGHovered}
            onShizzyHoverChange={setShizzyHovered}
          />
          <HeraldicLogo
            gHovered={gHovered}
            shizzyHovered={shizzyHovered}
            onLogoHoverChange={setLogoHovered}
          />
        </div>
      </main>
    </div>
  )
}
