import { useCallback, useEffect, useRef, useState } from 'react'

export type GarbId = 'left' | 'right' | 'bottom'
export type GarbPhase = 'idle' | 'typing' | 'hang' | 'fading'

export const GARB_PHRASES = [
  'All shall be well',
  'All shall be well, and all shall be well',
  'All shall be well, and all shall be well, and all manner of things shall be well.',
] as const

const TYPE_MS = 45
const HANG_MS = 1000
const FADE_MS = 1950

const GARB_ORDER: GarbId[] = ['right', 'left', 'bottom']

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useGarbEasterEgg() {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<GarbPhase>('idle')
  const [displayText, setDisplayText] = useState('')
  const [activatedGarbs, setActivatedGarbs] = useState<Set<GarbId>>(() => new Set())

  const progressRef = useRef(progress)
  const phaseRef = useRef(phase)
  const displayTextRef = useRef(displayText)
  const targetTextRef = useRef('')
  const typeTimerRef = useRef<number | null>(null)
  const hangTimerRef = useRef<number | null>(null)
  const fadeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    progressRef.current = progress
    phaseRef.current = phase
    displayTextRef.current = displayText
  }, [progress, phase, displayText])

  const clearTypeTimer = useCallback(() => {
    if (typeTimerRef.current !== null) {
      window.clearInterval(typeTimerRef.current)
      typeTimerRef.current = null
    }
  }, [])

  const clearHangTimer = useCallback(() => {
    if (hangTimerRef.current !== null) {
      window.clearTimeout(hangTimerRef.current)
      hangTimerRef.current = null
    }
  }, [])

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTypeTimer()
    clearHangTimer()
    clearFadeTimer()
    targetTextRef.current = ''
    setProgress(0)
    setPhase('idle')
    setDisplayText('')
    setActivatedGarbs(new Set())
  }, [clearFadeTimer, clearHangTimer, clearTypeTimer])

  const startFade = useCallback(() => {
    clearHangTimer()
    clearTypeTimer()
    setPhase('fading')
    fadeTimerRef.current = window.setTimeout(() => {
      reset()
    }, FADE_MS)
  }, [clearHangTimer, clearTypeTimer, reset])

  const startHang = useCallback(() => {
    clearHangTimer()
    setPhase('hang')
    hangTimerRef.current = window.setTimeout(() => {
      startFade()
    }, HANG_MS)
  }, [clearHangTimer, startFade])

  const syncDisplayToTarget = useCallback(() => {
    const target = targetTextRef.current
    setDisplayText(target)
    if (target.length === 0) return
    startHang()
  }, [startHang])

  const startTypewriter = useCallback(() => {
    clearTypeTimer()

    if (prefersReducedMotion()) {
      syncDisplayToTarget()
      return
    }

    setPhase('typing')
    typeTimerRef.current = window.setInterval(() => {
      const target = targetTextRef.current
      const current = displayTextRef.current

      if (current.length >= target.length) {
        clearTypeTimer()
        startHang()
        return
      }

      setDisplayText(target.slice(0, current.length + 1))
    }, TYPE_MS)
  }, [clearTypeTimer, startHang, syncDisplayToTarget])

  const advanceTo = useCallback(
    (nextProgress: number, garb: GarbId) => {
      clearHangTimer()
      targetTextRef.current = GARB_PHRASES[nextProgress - 1]
      setProgress(nextProgress)
      setActivatedGarbs((prev) => new Set([...prev, garb]))

      const current = displayTextRef.current
      const target = targetTextRef.current

      if (current.length >= target.length) {
        if (phaseRef.current === 'hang') {
          startHang()
        }
        return
      }

      if (phaseRef.current === 'hang' || phaseRef.current === 'typing') {
        startTypewriter()
      }
    },
    [clearHangTimer, startHang, startTypewriter],
  )

  const onGarbActivate = useCallback(
    (garb: GarbId) => {
      const currentProgress = progressRef.current
      const currentPhase = phaseRef.current
      const expectedGarb = GARB_ORDER[currentProgress]

      if (garb !== expectedGarb) return

      if (currentProgress === 0 && currentPhase === 'idle') {
        targetTextRef.current = GARB_PHRASES[0]
        setProgress(1)
        setActivatedGarbs(new Set([garb]))
        setDisplayText('')
        startTypewriter()
        return
      }

      if (currentProgress === 1 && (currentPhase === 'typing' || currentPhase === 'hang')) {
        advanceTo(2, 'left')
        return
      }

      if (currentProgress === 2 && (currentPhase === 'typing' || currentPhase === 'hang')) {
        advanceTo(3, 'bottom')
      }
    },
    [advanceTo, startTypewriter],
  )

  useEffect(
    () => () => {
      clearTypeTimer()
      clearHangTimer()
      clearFadeTimer()
    },
    [clearFadeTimer, clearHangTimer, clearTypeTimer],
  )

  return {
    displayText: phase === 'idle' ? null : displayText,
    phase,
    isActive: phase !== 'idle',
    isFading: phase === 'fading',
    activatedGarbs,
    onGarbActivate,
  }
}
