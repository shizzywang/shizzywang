import { useEffect, useRef, useState } from 'react'

// --- Tuning constants (grouped for quick iteration) ---
const CHARGE_THRESHOLD = 26
const CHARGE_GAIN = 0.9
const CHARGE_DECAY = 0.014
const IDLE_MS = 70
const MIN_VELOCITY = 0.25
const VELOCITY_PEAK_SCALE = 0.00028

const TRIGGER_PROB_BASE = 0.1
const TRIGGER_PROB_SPEED_MULT = 0.0016
const TRIGGER_PROB_MAX = 0.38

const COOLDOWN_MS_MIN = 1000
const COOLDOWN_MS_MAX = 1500

// Touch / no-hover: occasional ambient bursts (same flicker, sparse timing)
const AMBIENT_FIRST_MS_MIN = 6000
const AMBIENT_FIRST_MS_MAX = 12000
const AMBIENT_GAP_MS_MIN = 14000
const AMBIENT_GAP_MS_MAX = 28000
const AMBIENT_VELOCITY = 0.35

const FLICKER_COUNT_MIN = 2
const FLICKER_COUNT_MAX = 4
const FLICKER_ON_MS_MIN = 30
const FLICKER_ON_MS_MAX = 80
const FLICKER_OFF_MS_MIN = 40
const FLICKER_OFF_MS_MAX = 120

const FLICKER_PEAK_MIN = 0.25
const FLICKER_PEAK_MAX = 0.55
const FLICKER_FLASH_PEAK = 0.68
const FLICKER_FLASH_CHANCE = 0.32

type UseMouseChargeOptions = {
  enabled: boolean
}

type FlickerStep = {
  opacity: number
  durationMs: number
}

type BurstState = {
  steps: FlickerStep[]
  stepIndex: number
  stepStartTime: number
}

function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function buildBurstSteps(velocity: number): FlickerStep[] {
  const speedFactor = Math.min(1, velocity * VELOCITY_PEAK_SCALE)
  const extraFlicker = speedFactor > 0.65 ? 1 : 0
  const count = randInt(FLICKER_COUNT_MIN, FLICKER_COUNT_MAX) + extraFlicker
  const flashIndex =
    Math.random() < FLICKER_FLASH_CHANCE ? randInt(0, count - 1) : -1

  const steps: FlickerStep[] = []

  for (let i = 0; i < count; i += 1) {
    const isFlash = i === flashIndex
    const basePeak =
      FLICKER_PEAK_MIN + (FLICKER_PEAK_MAX - FLICKER_PEAK_MIN) * speedFactor
    const variance = 0.88 + Math.random() * 0.24
    const opacity = isFlash
      ? FLICKER_FLASH_PEAK * variance
      : basePeak * variance

    steps.push({
      opacity,
      durationMs: randBetween(FLICKER_ON_MS_MIN, FLICKER_ON_MS_MAX),
    })

    if (i < count - 1) {
      steps.push({
        opacity: 0,
        durationMs: randBetween(FLICKER_OFF_MS_MIN, FLICKER_OFF_MS_MAX),
      })
    }
  }

  return steps
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useMouseCharge({ enabled }: UseMouseChargeOptions) {
  const [pulseOpacity, setPulseOpacity] = useState(0)
  const [burstActive, setBurstActive] = useState(false)

  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const canHover = useMediaQuery('(hover: hover)')
  const active = enabled && !reducedMotion
  const usePointer = active && canHover
  const useAmbient = active && !canHover

  const lastX = useRef<number | null>(null)
  const lastY = useRef<number | null>(null)
  const lastTime = useRef<number | null>(null)
  const lastMoveTime = useRef(0)
  const charge = useRef(0)
  const cooldownUntil = useRef(0)
  const burst = useRef<BurstState | null>(null)
  const rafId = useRef<number | null>(null)
  const ambientTimeoutId = useRef<number | null>(null)
  const lastTick = useRef<number | null>(null)
  const lastOpacity = useRef(0)
  const hasPointer = useRef(false)

  useEffect(() => {
    if (!active) {
      charge.current = 0
      burst.current = null
      setPulseOpacity(0)
      setBurstActive(false)
      return
    }

    const startBurst = (velocity: number, now: number) => {
      burst.current = {
        steps: buildBurstSteps(velocity),
        stepIndex: 0,
        stepStartTime: now,
      }
      setBurstActive(true)
      charge.current *= 0.3
      cooldownUntil.current =
        now + randBetween(COOLDOWN_MS_MIN, COOLDOWN_MS_MAX)
    }

    const onPointerMove = (event: PointerEvent) => {
      hasPointer.current = true
      const now = performance.now()
      lastMoveTime.current = now

      if (lastX.current === null || lastY.current === null || lastTime.current === null) {
        lastX.current = event.clientX
        lastY.current = event.clientY
        lastTime.current = now
        return
      }

      const dx = event.clientX - lastX.current
      const dy = event.clientY - lastY.current
      const dt = now - lastTime.current

      if (dt > 0) {
        const distance = Math.hypot(dx, dy)
        const velocity = distance / dt

        charge.current += velocity * CHARGE_GAIN
        charge.current = Math.min(charge.current, CHARGE_THRESHOLD * 2.2)

        if (
          !burst.current &&
          velocity >= MIN_VELOCITY &&
          charge.current >= CHARGE_THRESHOLD &&
          now >= cooldownUntil.current
        ) {
          const probability = Math.min(
            TRIGGER_PROB_MAX,
            TRIGGER_PROB_BASE + velocity * TRIGGER_PROB_SPEED_MULT,
          )

          if (Math.random() < probability) {
            startBurst(velocity, now)
          }
        }
      }

      lastX.current = event.clientX
      lastY.current = event.clientY
      lastTime.current = now
    }

    const scheduleAmbient = (delayMs: number) => {
      ambientTimeoutId.current = window.setTimeout(() => {
        ambientTimeoutId.current = null
        if (!burst.current) {
          startBurst(AMBIENT_VELOCITY, performance.now())
        }
        scheduleAmbient(randBetween(AMBIENT_GAP_MS_MIN, AMBIENT_GAP_MS_MAX))
      }, delayMs)
    }

    const tick = (now: number) => {
      const dt = lastTick.current !== null ? now - lastTick.current : 0
      lastTick.current = now

      if (hasPointer.current && dt > 0 && now - lastMoveTime.current > IDLE_MS) {
        charge.current = Math.max(0, charge.current - CHARGE_DECAY * dt)
      }

      let opacity = 0
      const currentBurst = burst.current

      if (currentBurst) {
        const { steps, stepIndex, stepStartTime } = currentBurst
        const step = steps[stepIndex]
        const elapsed = now - stepStartTime

        if (elapsed >= step.durationMs) {
          const nextIndex = stepIndex + 1

          if (nextIndex >= steps.length) {
            burst.current = null
            setBurstActive(false)
            opacity = 0
          } else {
            currentBurst.stepIndex = nextIndex
            currentBurst.stepStartTime = now
            opacity = steps[nextIndex].opacity
          }
        } else {
          opacity = step.opacity
        }
      }

      if (
        Math.abs(lastOpacity.current - opacity) >= 0.0005 ||
        (opacity > 0) !== (lastOpacity.current > 0)
      ) {
        lastOpacity.current = opacity
        setPulseOpacity(opacity)
      }
      rafId.current = requestAnimationFrame(tick)
    }

    if (usePointer) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
    } else if (useAmbient) {
      scheduleAmbient(randBetween(AMBIENT_FIRST_MS_MIN, AMBIENT_FIRST_MS_MAX))
    }

    rafId.current = requestAnimationFrame(tick)

    return () => {
      if (usePointer) {
        window.removeEventListener('pointermove', onPointerMove)
      }
      if (ambientTimeoutId.current !== null) {
        window.clearTimeout(ambientTimeoutId.current)
        ambientTimeoutId.current = null
      }
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
      charge.current = 0
      burst.current = null
      lastX.current = null
      lastY.current = null
      lastTime.current = null
      lastMoveTime.current = 0
      lastTick.current = null
      lastOpacity.current = 0
      hasPointer.current = false
    }
  }, [active, usePointer, useAmbient])

  return { pulseOpacity, burstActive }
}
