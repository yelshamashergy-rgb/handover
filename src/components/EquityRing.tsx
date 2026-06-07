import { useCountUp } from '../ui/CountUp'

/** Animated circular progress dial — the Home hero metric. Draws + counts from 0. */
export function EquityRing({
  pct,
  size = 108,
  stroke = 10,
  label,
  id,
}: {
  pct: number
  size?: number
  stroke?: number
  label?: string
  id?: string
}) {
  const v = useCountUp(Math.min(100, Math.max(0, pct)), 900, id)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - v / 100)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface-2)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--c-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="48%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-[var(--c-ink)] font-serif tnum"
        style={{ fontSize: size * 0.26 }}
      >
        {Math.round(v)}%
      </text>
      {label && (
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--c-ink-faint)]"
          style={{ fontSize: size * 0.1 }}
        >
          {label}
        </text>
      )}
    </svg>
  )
}
