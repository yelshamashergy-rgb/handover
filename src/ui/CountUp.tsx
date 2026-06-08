import { useEffect, useRef, useState } from 'react'

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Remembers the last value animated for a given id, so re-entering a screen
// doesn't replay the count-up unless the value actually changed.
const SEEN = new Map<string, number>()

/** Animate a number to `target` (easeOutCubic, rAF). With `id`, animates from 0
 *  only the first time per session; later mounts start from the last value. */
// eslint-disable-next-line react-refresh/only-export-components
export function useCountUp(target: number, duration = 700, id?: string): number {
  const initial = id && SEEN.has(id) ? (SEEN.get(id) as number) : 0
  const [val, setVal] = useState(() => (reduced() ? target : initial))
  const fromRef = useRef(reduced() ? target : initial)
  const raf = useRef(0)

  useEffect(() => {
    if (reduced()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVal(target)
      fromRef.current = target
      if (id) SEEN.set(id, target)
      return
    }
    const from = fromRef.current
    if (from === target) {
      setVal(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = 1 - Math.pow(1 - t, 3)
      setVal(from + (target - from) * e)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else {
        fromRef.current = target
        if (id) SEEN.set(id, target)
      }
    }
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, id])

  return val
}

/** Count-up text. Used for entrance moments only — not live/functional values. */
export function CountUp({
  value,
  format,
  duration,
  id,
}: {
  value: number
  format: (n: number) => string
  duration?: number
  id?: string
}) {
  const v = useCountUp(value, duration, id)
  return <>{format(v)}</>
}
