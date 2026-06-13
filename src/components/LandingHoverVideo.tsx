import { useHoverRevealVideo } from '../hooks/useHoverRevealVideo'

type LandingHoverVideoProps = {
  active: boolean
  src: string
  className?: string
}

export function LandingHoverVideo({
  active,
  src,
  className,
}: LandingHoverVideoProps) {
  const {
    videoRef,
    videoMounted,
    videoRevealed,
    videoExiting,
    handleScrimTransitionEnd,
  } = useHoverRevealVideo(active)

  return (
    <div
      className={[
        'landing-page__video',
        videoMounted && 'landing-page__video--mounted',
        videoRevealed && 'landing-page__video--active',
        videoExiting && 'landing-page__video--exiting',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        src={src}
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
