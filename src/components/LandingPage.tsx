import { useState } from 'react'
import { useGarbEasterEgg } from '../hooks/useGarbEasterEgg'
import { useLandingVideoWarmup } from '../hooks/useLandingVideoWarmup'
import { useMouseCharge } from '../hooks/useMouseCharge'
import { HeraldicLogo } from './HeraldicLogo'
import { LandingHoverVideo } from './LandingHoverVideo'
import { StackLogo } from './StackLogo'
import { Wordmark } from './Wordmark'
import '../styles/landing.css'

const BRITANNIA_SRC = '/Britannia.mp4'
const STACK_SRC = '/stack_bg.mp4'

export function LandingPage() {
  const [logoHovered, setLogoHovered] = useState(false)
  const [gHovered, setGHovered] = useState(false)
  const [shizzyHovered, setShizzyHovered] = useState(false)
  const [stackHovered, setStackHovered] = useState(false)
  const garbEasterEgg = useGarbEasterEgg()
  const { pulseOpacity, burstActive } = useMouseCharge({
    enabled:
      !logoHovered &&
      !gHovered &&
      !shizzyHovered &&
      !stackHovered &&
      !garbEasterEgg.isActive,
  })
  const { registerVideo, isWarm, nudgeWarmup } = useLandingVideoWarmup({
    sources: [BRITANNIA_SRC, STACK_SRC],
  })

  return (
    <div
      className={`landing-page${logoHovered ? ' landing-page--dark' : ''}`}
    >
      <LandingHoverVideo
        active={shizzyHovered}
        src={BRITANNIA_SRC}
        poster="/Britannia.poster.jpg"
        isWarm={isWarm(BRITANNIA_SRC)}
        onVideoElementChange={registerVideo}
      />
      <LandingHoverVideo
        active={stackHovered}
        src={STACK_SRC}
        poster="/stack_bg.poster.jpg"
        isWarm={isWarm(STACK_SRC)}
        onVideoElementChange={registerVideo}
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
            garbQuoteText={garbEasterEgg.displayText}
            garbQuotePhase={
              garbEasterEgg.phase === 'idle' ? null : garbEasterEgg.phase
            }
            onGHoverChange={setGHovered}
            onShizzyHoverChange={setShizzyHovered}
            onShizzyHoverIntent={() => nudgeWarmup(BRITANNIA_SRC)}
          />
          <HeraldicLogo
            gHovered={gHovered}
            shizzyHovered={shizzyHovered}
            stackHovered={stackHovered}
            onLogoHoverChange={setLogoHovered}
            onGarbActivate={garbEasterEgg.onGarbActivate}
            activatedGarbs={garbEasterEgg.activatedGarbs}
            garbFading={garbEasterEgg.isFading}
          />
          <StackLogo
            onHoverChange={setStackHovered}
            onHoverIntent={() => nudgeWarmup(STACK_SRC)}
          />
        </div>
      </main>
    </div>
  )
}
