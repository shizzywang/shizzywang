type WordmarkProps = {
  gHovered: boolean
  onGHoverChange: (hovered: boolean) => void
}

export function Wordmark({ gHovered, onGHoverChange }: WordmarkProps) {
  return (
    <h1 className="wordmark">
      shizzywan
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
