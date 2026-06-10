import { useState } from 'react'
import { HeraldicLogo } from './HeraldicLogo'
import { Wordmark } from './Wordmark'
import '../styles/landing.css'

export function LandingPage() {
  const [logoHovered, setLogoHovered] = useState(false)
  const [gHovered, setGHovered] = useState(false)

  return (
    <div
      className={`landing-page${logoHovered ? ' landing-page--dark' : ''}`}
    >
      <div className="landing-page__overlay" aria-hidden="true" />
      <main className="landing-page__content">
        <div className="landing-page__hero">
          <Wordmark gHovered={gHovered} onGHoverChange={setGHovered} />
          <HeraldicLogo
            gHovered={gHovered}
            onLogoHoverChange={setLogoHovered}
          />
        </div>
      </main>
    </div>
  )
}
