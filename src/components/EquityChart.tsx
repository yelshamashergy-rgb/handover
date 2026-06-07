import { useEffect, useRef, useState } from 'react'
import type { Property } from '../lib/types'
import { buildEquitySeries } from '../lib/payments'
import { moneyCompact, formatMonthYear, pct } from '../lib/format'

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(640)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function EquityChart({ property }: { property: Property }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const series = buildEquitySeries(property)

  const H = 248
  const pad = { l: 12, r: 12, t: 18, b: 26 }
  const innerW = Math.max(40, width - pad.l - pad.r)
  const innerH = H - pad.t - pad.b

  const times = series.map((s) => Date.parse(s.date + 'T00:00:00'))
  const t0 = Math.min(...times)
  const t1 = Math.max(...times)
  const maxY = Math.max(1, series[series.length - 1].planned)

  const x = (t: number) => pad.l + (t1 === t0 ? 0 : ((t - t0) / (t1 - t0)) * innerW)
  const y = (v: number) => pad.t + innerH - (v / maxY) * innerH

  const line = (key: 'planned' | 'paid') =>
    series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(times[i]).toFixed(1)} ${y(s[key]).toFixed(1)}`).join(' ')

  const area = (key: 'planned' | 'paid') =>
    `${line(key)} L ${x(times[times.length - 1]).toFixed(1)} ${(pad.t + innerH).toFixed(1)} L ${x(times[0]).toFixed(1)} ${(pad.t + innerH).toFixed(1)} Z`

  const now = Date.now()
  const showNow = now >= t0 && now <= t1
  const nowX = x(now)

  const currentPaid = series[series.length - 1].paid
  const equityPct = (currentPaid / maxY) * 100
  // find the on-curve point at "now" for the marker
  const paidAtNowIdx = series.reduce((acc, _s, i) => (times[i] <= now ? i : acc), 0)
  const markerY = y(series[paidAtNowIdx].paid)

  return (
    <div ref={ref} className="w-full">
      <svg
        width={width}
        height={H}
        viewBox={`0 0 ${width} ${H}`}
        role="img"
        aria-label={`Equity build-up. ${pct(equityPct)} of the property value paid so far.`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="paidFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--c-primary)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="plannedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-gold)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--c-gold)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline */}
        <line
          x1={pad.l}
          y1={pad.t + innerH}
          x2={width - pad.r}
          y2={pad.t + innerH}
          stroke="var(--c-border)"
        />

        {/* planned (full plan) — the goal */}
        <path d={area('planned')} fill="url(#plannedFill)" />
        <path
          d={line('planned')}
          fill="none"
          stroke="var(--c-gold)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          opacity={0.7}
        />

        {/* paid (equity so far) */}
        <path d={area('paid')} fill="url(#paidFill)" />
        <path
          d={line('paid')}
          fill="none"
          stroke="var(--c-primary)"
          strokeWidth={2.5}
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            animation: 'draw 1.1s cubic-bezier(0.22,1,0.36,1) forwards',
          }}
        />

        {/* today marker */}
        {showNow && (
          <>
            <line
              x1={nowX}
              y1={pad.t}
              x2={nowX}
              y2={pad.t + innerH}
              stroke="var(--c-ink-faint)"
              strokeWidth={1}
              strokeDasharray="2 4"
              opacity={0.6}
            />
            <circle cx={nowX} cy={markerY} r={5} fill="var(--c-primary)" stroke="var(--c-surface)" strokeWidth={2.5} />
          </>
        )}

        {/* axis labels */}
        <text x={pad.l} y={H - 6} fontSize="11" fill="var(--c-ink-faint)" className="tnum">
          {formatMonthYear(property.bookingDate)}
        </text>
        <text x={width - pad.r} y={H - 6} fontSize="11" textAnchor="end" fill="var(--c-ink-faint)" className="tnum">
          {formatMonthYear(property.handoverDate)}
        </text>
        <text x={pad.l} y={pad.t - 4} fontSize="11" fill="var(--c-ink-faint)" className="tnum">
          {moneyCompact(maxY, property.currency)}
        </text>
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Equity paid
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-gold" /> Planned to handover
        </span>
        {showNow && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-ink-faint" /> Today
          </span>
        )}
      </div>
    </div>
  )
}
