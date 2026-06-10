type HeraldicLogoProps = {
  gHovered: boolean
  onLogoHoverChange: (hovered: boolean) => void
}

export function HeraldicLogo({ gHovered, onLogoHoverChange }: HeraldicLogoProps) {
  return (
    <div
      className={`heraldic-logo${gHovered ? ' heraldic-logo--active' : ''}`}
      onPointerEnter={() => onLogoHoverChange(true)}
      onPointerLeave={() => onLogoHoverChange(false)}
      role="img"
      aria-label="Shizzywang heraldic shield"
    >
      <div className="heraldic-logo__field" />
      <div className="heraldic-logo__outline" />
      <div className="heraldic-logo__lion" />
      <div className="heraldic-logo__sword" />
      <div className="heraldic-logo__charges" />
    </div>
  )
}
