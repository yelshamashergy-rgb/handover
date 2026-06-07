import { useState } from 'react'
import type { Property } from '../lib/types'
import { propertyStats } from '../lib/payments'
import { mortgage, ltvCap } from '../lib/mortgage'
import { money, pct } from '../lib/format'
import { cx, inputCls } from '../ui/primitives'

export function MortgageCalculator({ property }: { property: Property }) {
  const cur = property.currency
  const price = property.purchasePrice
  const s = propertyStats(property)
  const equityPaid = s.paidTowardPrice
  const remaining = s.remainingToPrice

  const cap = ltvCap(price)
  const [ltv, setLtv] = useState(Math.min(75, cap))
  const [rate, setRate] = useState(4.5)
  const [term, setTerm] = useState(25)

  const maxMortgage = (price * ltv) / 100
  const financed = Math.min(maxMortgage, remaining)
  const cashAtHandover = Math.max(0, remaining - maxMortgage)
  const { monthly, totalInterest } = mortgage(financed, rate, term)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink">Loan-to-value</span>
            <span className="font-serif text-xl text-primary tnum">{pct(ltv, 0)}</span>
          </div>
          <input
            type="range"
            min={40}
            max={cap}
            step={1}
            value={ltv}
            onChange={(e) => setLtv(Number(e.target.value))}
            aria-label="Loan-to-value"
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-faint tnum">
            <span>40%</span>
            <span>cap {cap}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Interest rate %</span>
            <input
              className={inputCls}
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Term (years)</span>
            <input
              className={inputCls}
              inputMode="numeric"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
            />
          </label>
        </div>

        <p className="text-xs leading-relaxed text-ink-faint">
          UAE first-property caps for expats: ~80% LTV under AED 5M, ~75% at/above. You’ve paid{' '}
          {money(equityPaid, cur)} so far; a mortgage covers the rest at handover. Illustrative — not a
          loan offer.
        </p>
      </div>

      <div className="grid grid-cols-2 content-start gap-3">
        <Result label={`Max mortgage (${pct(ltv, 0)})`} value={money(maxMortgage, cur)} />
        <Result label="Financed at handover" value={money(financed, cur)} tone="gold" />
        <Result
          label="Cash needed at handover"
          value={cashAtHandover > 0 ? money(cashAtHandover, cur) : 'Covered'}
          tone={cashAtHandover > 0 ? 'ink' : 'pos'}
        />
        <Result label="Total interest" value={money(totalInterest, cur)} />
        <Result label="Monthly repayment" value={money(monthly, cur)} tone="primary" big />
      </div>
    </div>
  )
}

function Result({
  label,
  value,
  tone = 'ink',
  big,
}: {
  label: string
  value: string
  tone?: 'ink' | 'pos' | 'primary' | 'gold'
  big?: boolean
}) {
  return (
    <div className={cx('rounded-xl bg-surface-2 px-4 py-3.5', big && 'col-span-2')}>
      <div className="text-xs text-ink-soft">{label}</div>
      <div
        className={cx(
          'mt-1 font-serif tnum',
          big ? 'text-3xl' : 'text-xl',
          tone === 'pos' && 'text-pos',
          tone === 'primary' && 'text-primary',
          tone === 'gold' && 'text-gold',
          tone === 'ink' && 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  )
}
