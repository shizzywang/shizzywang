import type { GarbPhase } from '../hooks/useGarbEasterEgg'

type WordmarkProps = {
  gHovered: boolean
  shizzyHovered: boolean
  stackHovered: boolean
  garbQuoteText: string | null
  garbQuotePhase: Exclude<GarbPhase, 'idle'> | null
  onGHoverChange: (hovered: boolean) => void
  onShizzyHoverChange: (hovered: boolean) => void
  onShizzyHoverIntent?: () => void
}

export function Wordmark({
  gHovered,
  shizzyHovered,
  stackHovered,
  garbQuoteText,
  garbQuotePhase,
  onGHoverChange,
  onShizzyHoverChange,
  onShizzyHoverIntent,
}: WordmarkProps) {
  const showQuote = garbQuoteText !== null

  return (
    <h1
      className={[
        'wordmark',
        shizzyHovered && 'wordmark--shizzy-active',
        stackHovered && 'wordmark--stack-active',
        showQuote && 'wordmark--garb-quote',
        garbQuotePhase === 'fading' && 'wordmark--garb-fading',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="wordmark__brand" aria-hidden={showQuote}>
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
      </span>
      {showQuote && (
        <span className="wordmark__quote" aria-live="polite">
          {garbQuoteText}
        </span>
      )}
    </h1>
  )
}
