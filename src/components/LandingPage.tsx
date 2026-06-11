import { useEffect, useRef, useState } from 'react'
import { useMouseCharge } from '../hooks/useMouseCharge'
import { HeraldicLogo } from './HeraldicLogo'
import { Wordmark } from './Wordmark'
import '../styles/landing.css'

export function LandingPage() {
  const [logoHovered, setLogoHovered] = useState(false)
  const [gHovered, setGHovered] = useState(false)
  const [shizzyHovered, setShizzyHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { pulseOpacity, burstActive } = useMouseCharge({
    enabled: !logoHovered && !gHovered && !shizzyHovered,
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (shizzyHovered) {
      if (!reducedMotion) {
        video.play().catch(() => {})
      }
    } else {
      video.pause()
    }
  }, [shizzyHovered])

  return (
    <div
      className={`landing-page${logoHovered ? ' landing-page--dark' : ''}`}
    >
      <div
        className={[
          'landing-page__video',
          shizzyHovered && 'landing-page__video--active',
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
          preload="metadata"
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
