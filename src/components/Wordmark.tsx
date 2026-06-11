type WordmarkProps = {
  gHovered: boolean
  shizzyHovered: boolean
  onGHoverChange: (hovered: boolean) => void
  onShizzyHoverChange: (hovered: boolean) => void
}

export function Wordmark({
  gHovered,
  shizzyHovered,
  onGHoverChange,
  onShizzyHoverChange,
}: WordmarkProps) {
  return (
    <h1 className={`wordmark${shizzyHovered ? ' wordmark--shizzy-active' : ''}`}>
      <span
        className="wordmark__shizzy"
        onPointerEnter={() => onShizzyHoverChange(true)}
        onPointerLeave={() => onShizzyHoverChange(false)}
      >
        shizzy
      </span>
      wan
      <span
        className={`wordmark__letter-g${gHovered ? ' wordmark__letter-g--active' : ''}`}
        onPointerEnter={() => onGHoverChange(true)}
        onPointerLeave={() => onGHoverChange(false)}
      >
        g
      </span>
    </h1>
  )
}
