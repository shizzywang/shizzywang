type WordmarkProps = {
  gHovered: boolean
  shizzyHovered: boolean
  stackHovered: boolean
  onGHoverChange: (hovered: boolean) => void
  onShizzyHoverChange: (hovered: boolean) => void
  onShizzyHoverIntent?: () => void
}

export function Wordmark({
  gHovered,
  shizzyHovered,
  stackHovered,
  onGHoverChange,
  onShizzyHoverChange,
  onShizzyHoverIntent,
}: WordmarkProps) {
  return (
    <h1
      className={[
        'wordmark',
        shizzyHovered && 'wordmark--shizzy-active',
        stackHovered && 'wordmark--stack-active',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        className="wordmark__shizzy"
        onPointerEnter={() => {
          onShizzyHoverIntent?.()
          onShizzyHoverChange(true)
        }}
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
