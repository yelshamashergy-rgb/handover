import type { CostBreakdown } from '../lib/costs'
import type { Currency } from '../lib/types'
import { money, pct } from '../lib/format'

export function CostList({
  breakdown,
  currency,
  totalLabel = 'Total fees',
  footnote,
}: {
  breakdown: CostBreakdown
  currency: Currency
  totalLabel?: string
  footnote?: string
}) {
  return (
    <div className="flex flex-col">
      {breakdown.lines.map((l) => (
        <div
          key={l.label}
          className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0"
        >
          <span className="text-ink-soft">
            {l.label}
            {l.note && <span className="ml-1.5 text-xs text-ink-faint">{l.note}</span>}
          </span>
          <span className="font-medium text-ink tnum">{money(l.amount, currency)}</span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between pt-2 text-sm">
        <span className="font-medium text-ink">
          {totalLabel}
          <span className="ml-1.5 text-xs text-ink-faint tnum">{pct(breakdown.pctOfBase)}</span>
        </span>
        <span className="font-serif text-lg text-ink tnum">{money(breakdown.total, currency)}</span>
      </div>
      {footnote && <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">{footnote}</p>}
    </div>
  )
}
