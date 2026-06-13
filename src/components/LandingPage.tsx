import { useState } from 'react'
import { useMouseCharge } from '../hooks/useMouseCharge'
import { HeraldicLogo } from './HeraldicLogo'
import { LandingHoverVideo } from './LandingHoverVideo'
import { StackLogo } from './StackLogo'
import { Wordmark } from './Wordmark'
import '../styles/landing.css'

export function LandingPage() {
  const [logoHovered, setLogoHovered] = useState(false)
  const [gHovered, setGHovered] = useState(false)
  const [shizzyHovered, setShizzyHovered] = useState(false)
  const [stackHovered, setStackHovered] = useState(false)
  const { pulseOpacity, burstActive } = useMouseCharge({
    enabled: !logoHovered && !gHovered && !shizzyHovered && !stackHovered,
  })

  return (
    <div
      className={`landing-page${logoHovered ? ' landing-page--dark' : ''}`}
    >
      <LandingHoverVideo active={shizzyHovered} src="/Britannia.mp4" />
      <LandingHoverVideo
        active={stackHovered}
        src="/stack_bg.mp4"
        className="landing-page__video--stack"
      />
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
            stackHovered={stackHovered}
            onGHoverChange={setGHovered}
            onShizzyHoverChange={setShizzyHovered}
          />
          <HeraldicLogo
            gHovered={gHovered}
            shizzyHovered={shizzyHovered}
            stackHovered={stackHovered}
            onLogoHoverChange={setLogoHovered}
          />
          <StackLogo onHoverChange={setStackHovered} />
        </div>
      </main>
    </div>
  )
}
