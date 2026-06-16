import { useHoverRevealVideo } from '../hooks/useHoverRevealVideo'

type LandingHoverVideoProps = {
  active: boolean
  src: string
  poster?: string
  isWarm: boolean
  onVideoElementChange?: (src: string, node: HTMLVideoElement | null) => void
  className?: string
}

export function LandingHoverVideo({
  active,
  src,
  poster,
  isWarm,
  onVideoElementChange,
  className,
}: LandingHoverVideoProps) {
  const {
    videoRef,
    videoRevealed,
    videoExiting,
    videoFallbackVisible,
    videoWarmReveal,
    handleScrimTransitionEnd,
  } = useHoverRevealVideo(active, isWarm)

  const shouldBeVisible = active || videoExiting || videoFallbackVisible

  return (
    <div
      className={[
        'landing-page__video',
        shouldBeVisible && 'landing-page__video--mounted',
        videoRevealed && 'landing-page__video--active',
        videoExiting && 'landing-page__video--exiting',
        videoFallbackVisible && 'landing-page__video--fallback',
        videoWarmReveal && 'landing-page__video--warm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <video
        ref={(node) => {
          videoRef.current = node
          onVideoElementChange?.(src, node)
        }}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="auto"
      />
      <div
        className="landing-page__video__scrim"
        aria-hidden="true"
        onTransitionEnd={handleScrimTransitionEnd}
      />
    </div>
  )
}
