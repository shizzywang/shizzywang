type HeraldicLogoProps = {
  gHovered: boolean
  onLogoHoverChange: (hovered: boolean) => void
}

export function HeraldicLogo({ gHovered, onLogoHoverChange }: HeraldicLogoProps) {
  return (
    <div
      className={`heraldic-logo${gHovered ? ' heraldic-logo--gold' : ''}`}
      onPointerEnter={() => onLogoHoverChange(true)}
      onPointerLeave={() => onLogoHoverChange(false)}
      role="img"
      aria-label="Shizzywang heraldic shield"
    >
      <div className="heraldic-logo__field" />
      <div className="heraldic-logo__details" />
    </div>
  )
}
