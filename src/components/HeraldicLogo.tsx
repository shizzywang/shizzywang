import { useState } from 'react'
import type { GarbId } from '../hooks/useGarbEasterEgg'

type HeraldicLogoProps = {
  gHovered: boolean
  shizzyHovered: boolean
  stackHovered: boolean
  onLogoHoverChange: (hovered: boolean) => void
  onGarbActivate: (garb: GarbId) => void
  activatedGarbs: Set<GarbId>
  garbFading: boolean
}

const GARB_IDS: GarbId[] = ['left', 'right', 'bottom']
const GARB_CHAIN: GarbId[] = ['right', 'left', 'bottom']

function prerequisiteGarb(garb: GarbId): GarbId | null {
  const index = GARB_CHAIN.indexOf(garb)
  return index > 0 ? GARB_CHAIN[index - 1] : null
}

export function HeraldicLogo({
  gHovered,
  shizzyHovered,
  stackHovered,
  onLogoHoverChange,
  onGarbActivate,
  activatedGarbs,
  garbFading,
}: HeraldicLogoProps) {
  const [lionHovered, setLionHovered] = useState(false)
  const [hoveredGarbs, setHoveredGarbs] = useState<Set<GarbId>>(() => new Set())

  const className = [
    'heraldic-logo',
    gHovered && 'heraldic-logo--active',
    shizzyHovered && 'heraldic-logo--shizzy-active',
    stackHovered && 'heraldic-logo--stack-active',
    lionHovered && !gHovered && 'heraldic-logo--lion-active',
    garbFading && 'heraldic-logo--garb-fading',
  ]
    .filter(Boolean)
    .join(' ')

  const setGarbHovered = (garb: GarbId, hovered: boolean) => {
    setHoveredGarbs((prev) => {
      const next = new Set(prev)
      if (hovered) next.add(garb)
      else next.delete(garb)
      return next
    })
  }

  const isGarbGold = (garb: GarbId) =>
    activatedGarbs.has(garb) || hoveredGarbs.has(garb)

  const canGarbHoverGlow = (garb: GarbId) => {
    const prereq = prerequisiteGarb(garb)
    if (!prereq) return true
    return isGarbGold(prereq)
  }

  const isGarbLit = (garb: GarbId) => {
    if (activatedGarbs.has(garb)) return true
    if (garbFading) return false
    return hoveredGarbs.has(garb) && canGarbHoverGlow(garb)
  }

  return (
    <div className={className} role="img" aria-label="Shizzywang heraldic shield">
      <div className="heraldic-logo__field" />
      <div className="heraldic-logo__charges" />
      <div className="heraldic-logo__leaves" />
      <div className="heraldic-logo__central-sword" />
      <div className="heraldic-logo__central-sword-handle" />
      <div className="heraldic-logo__lion" />
      <div className="heraldic-logo__side-lions" />
      {GARB_IDS.map((garb) => (
        <div
          key={garb}
          className={[
            'heraldic-logo__garb',
            `heraldic-logo__garb--${garb}`,
            isGarbLit(garb) && 'heraldic-logo__garb--active',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-hidden="true"
        />
      ))}
      <div
        className="heraldic-logo__hit"
        aria-hidden="true"
        onPointerEnter={() => onLogoHoverChange(true)}
        onPointerLeave={() => {
          onLogoHoverChange(false)
          setLionHovered(false)
          setHoveredGarbs(new Set())
        }}
      />
      <div
        className="heraldic-logo__lion-hit"
        aria-hidden="true"
        onPointerEnter={() => setLionHovered(true)}
        onPointerLeave={() => setLionHovered(false)}
      />
      {GARB_IDS.map((garb) => (
        <div
          key={`hit-${garb}`}
          className={`heraldic-logo__garb-hit heraldic-logo__garb-hit--${garb}`}
          aria-hidden="true"
          onPointerEnter={() => {
            if (!canGarbHoverGlow(garb)) return
            setGarbHovered(garb, true)
            onGarbActivate(garb)
          }}
          onPointerLeave={() => setGarbHovered(garb, false)}
        />
      ))}
    </div>
  )
}
