import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { projection, propertyStats } from '../lib/payments'
import { moneyCompact, pct, formatDate } from '../lib/format'
import { Card, cx } from '../ui/primitives'
import { ChevronLeft } from '../ui/icons'
import type { Property } from '../lib/types'

const COLS = [
  'Market',
  'Price',
  'Equity',
  'Remaining',
  'Next payment',
  'Proj. value',
  'Gain',
  'Net yield',
  'Service / yr',
] as const

export function Compare() {
  const { properties } = useStore()

  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="inline-flex w-fit items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ChevronLeft size={16} /> Portfolio
      </Link>

      <div>
        <h1 className="font-serif text-3xl text-ink sm:text-4xl">Compare</h1>
        <p className="mt-1 text-ink-soft">Every property side by side. Each shown in its own currency.</p>
      </div>

      {properties.length < 2 ? (
        <Card className="px-6 py-16 text-center text-ink-soft">
          Add a second property to compare.
        </Card>
      ) : (
        <Card className="animate-in overflow-x-auto p-0">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 z-10 bg-surface px-4 py-3 text-left font-medium text-ink-soft">
                  Property
                </th>
                {COLS.map((c) => (
                  <th key={c} className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-soft">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <Row key={p.id} property={p} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

function Row({ property: p }: { property: Property }) {
  const s = propertyStats(p)
  const proj = projection(p)
  const serviceCharge = (p.sizeSqft || 0) * (p.serviceChargePerSqft || 0)
  const cur = p.currency

  return (
    <tr className="border-b border-line transition-colors last:border-0 hover:bg-surface-2">
      <td className="sticky left-0 z-10 bg-surface px-4 py-3 hover:bg-surface-2">
        <Link to={`/property/${p.id}`} className="block">
          <div className="font-serif text-base text-ink">{p.name}</div>
          <div className="text-xs text-ink-faint">{p.developer || 'Off-plan'}</div>
        </Link>
      </td>
      <Cell>{p.market}</Cell>
      <Cell>{moneyCompact(p.purchasePrice, cur)}</Cell>
      <Cell tone="primary">{pct(s.equityPct)}</Cell>
      <Cell>{moneyCompact(s.remainingToPrice, cur)}</Cell>
      <Cell>
        {s.next ? (
          <span className="tnum">
            {moneyCompact(s.next.amount, cur)}
            <span className="block text-[11px] text-ink-faint">{formatDate(s.next.dueDate)}</span>
          </span>
        ) : (
          <span className="text-paid">Done</span>
        )}
      </Cell>
      <Cell tone="gold">{moneyCompact(proj.projectedValue, cur)}</Cell>
      <Cell tone="pos">+{pct(proj.capitalGainPct, 0)}</Cell>
      <Cell>{pct(proj.netYieldPct)}</Cell>
      <Cell>{serviceCharge ? moneyCompact(serviceCharge, cur) : '—'}</Cell>
    </tr>
  )
}

function Cell({
  children,
  tone = 'ink',
}: {
  children: React.ReactNode
  tone?: 'ink' | 'primary' | 'gold' | 'pos'
}) {
  return (
    <td
      className={cx(
        'whitespace-nowrap px-4 py-3 text-right tnum',
        tone === 'primary' && 'text-primary',
        tone === 'gold' && 'text-gold',
        tone === 'pos' && 'text-pos',
        tone === 'ink' && 'text-ink',
      )}
    >
      {children}
    </td>
  )
}
