import { useEffect, useRef, useState } from 'react'

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Animate a number from its previous value to `target` (easeOutCubic, rAF). */
export function useCountUp(target: number, duration = 700): number {
  const [val, setVal] = useState(() => (reduced() ? target : 0))
  const fromRef = useRef(reduced() ? target : 0)
  const raf = useRef(0)

  useEffect(() => {
    if (reduced()) {
      setVal(target)
      fromRef.current = target
      return
    }
    const from = fromRef.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = 1 - Math.pow(1 - t, 3)
      setVal(from + (target - from) * e)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return val
}

/** Count-up text. Used for entrance moments only — not live/functional values. */
export function CountUp({
  value,
  format,
  duration,
}: {
  value: number
  format: (n: number) => string
  duration?: number
}) {
  const v = useCountUp(value, duration)
  return <>{format(v)}</>
}
