import { useState } from 'react'

type HeraldicLogoProps = {
  gHovered: boolean
  shizzyHovered: boolean
  stackHovered: boolean
  onLogoHoverChange: (hovered: boolean) => void
}

export function HeraldicLogo({
  gHovered,
  shizzyHovered,
  stackHovered,
  onLogoHoverChange,
}: HeraldicLogoProps) {
  const [lionHovered, setLionHovered] = useState(false)

  const className = [
    'heraldic-logo',
    gHovered && 'heraldic-logo--active',
    shizzyHovered && 'heraldic-logo--shizzy-active',
    stackHovered && 'heraldic-logo--stack-active',
    lionHovered && !gHovered && 'heraldic-logo--lion-active',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} role="img" aria-label="Shizzywang heraldic shield">
      <div className="heraldic-logo__field" />
      <div className="heraldic-logo__charges" />
      <div className="heraldic-logo__leaves" />
      <div className="heraldic-logo__central-sword" />
      <div className="heraldic-logo__lion" />
      <div className="heraldic-logo__side-lions" />
      <div
        className="heraldic-logo__hit"
        aria-hidden="true"
        onPointerEnter={() => onLogoHoverChange(true)}
        onPointerLeave={() => {
          onLogoHoverChange(false)
          setLionHovered(false)
        }}
      />
      <div
        className="heraldic-logo__lion-hit"
        aria-hidden="true"
        onPointerEnter={() => setLionHovered(true)}
        onPointerLeave={() => setLionHovered(false)}
      />
    </div>
  )
}
