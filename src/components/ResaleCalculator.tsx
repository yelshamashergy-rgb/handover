import { useState } from 'react'
import type { Property } from '../lib/types'
import { propertyStats } from '../lib/payments'
import { resaleCosts, marketHasFees, marketIsEstimate } from '../lib/costs'
import { money, pct } from '../lib/format'
import { Check, Lock } from '../ui/icons'
import { cx, inputCls } from '../ui/primitives'
import { CostList } from './CostList'

export function ResaleCalculator({
  property,
  onThresholdChange,
}: {
  property: Property
  onThresholdChange: (pct: number) => void
}) {
  const s = propertyStats(property)
  const cur = property.currency
  const P = property.purchasePrice
  const E = s.paidTowardPrice
  const threshold = property.resaleThresholdPct ?? 40

  const [marketValue, setMarketValue] = useState(() =>
    Math.round(P * (1 + property.expectedAppreciationPct / 100)),
  )

  const paidPct = P ? (E / P) * 100 : 0
  const eligible = paidPct >= threshold
  const neededToReach = Math.max(0, (threshold / 100) * P - E)

  const premium = marketValue - P
  const costs = resaleCosts(marketValue, property.market)
  const netProfit = premium - costs.total
  const roiOnCash = E ? (netProfit / E) * 100 : 0
  const upliftPct = P ? ((marketValue - P) / P) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      {/* eligibility */}
      <div
        className={cx(
          'flex items-start gap-3 rounded-xl px-4 py-3.5',
          eligible ? 'bg-paid-tint' : 'bg-due-tint',
        )}
      >
        <span
          className={cx(
            'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full',
            eligible ? 'bg-paid text-white' : 'bg-due text-white',
          )}
        >
          {eligible ? <Check size={16} /> : <Lock size={15} />}
        </span>
        <div className="text-sm">
          <div className={cx('font-medium', eligible ? 'text-paid' : 'text-due')}>
            {eligible ? 'Eligible to resell' : 'Not yet eligible to resell'}
          </div>
          <div className="text-ink-soft tnum">
            {pct(paidPct)} paid · developer allows resale from {threshold}%
            {!eligible && (
              <> · pay {money(neededToReach, cur)} more to unlock</>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* inputs */}
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between text-sm font-medium text-ink">
              Current market value
              <span className={cx('tnum', upliftPct >= 0 ? 'text-pos' : 'text-neg')}>
                {upliftPct >= 0 ? '+' : ''}
                {pct(upliftPct)}
              </span>
            </span>
            <input
              className={inputCls}
              inputMode="numeric"
              value={marketValue}
              onChange={(e) => setMarketValue(Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Developer resale threshold %</span>
            <input
              className={inputCls}
              inputMode="numeric"
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
            />
            <span className="text-xs text-ink-faint">Emaar/Sobha ≈ 40% · Damac ≈ 30–35%.</span>
          </label>

          {marketHasFees(property.market) && (
            <div className="rounded-xl bg-surface-2 p-4">
              <div className="mb-1 text-xs font-medium text-ink-soft">Selling costs (you pay)</div>
              <CostList
                breakdown={costs}
                currency={cur}
                totalLabel="Total selling costs"
                footnote={
                  marketIsEstimate(property.market)
                    ? `Estimated ${property.market} rates — verify before transacting.`
                    : undefined
                }
              />
            </div>
          )}
        </div>

        {/* results */}
        <div className="grid grid-cols-2 content-start gap-3">
          <Result label="Resale premium" value={money(premium, cur)} tone={premium >= 0 ? 'pos' : 'neg'} />
          <Result label="Cash invested" value={money(E, cur)} sub={`${pct(paidPct)} of price`} />
          <Result
            label="Net profit after costs"
            value={money(netProfit, cur)}
            tone={netProfit >= 0 ? 'pos' : 'neg'}
            big
          />
          <Result
            label="Return on cash"
            value={`${roiOnCash >= 0 ? '+' : ''}${pct(roiOnCash)}`}
            tone={roiOnCash >= 0 ? 'pos' : 'neg'}
            big
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-ink-faint">
        Assignment economics: you recover your {money(E, cur)} cash in and net the premium less selling
        costs; the buyer assumes the remaining {money(s.remainingToPrice, cur)}. The 4% DLD transfer is
        normally the buyer’s. Illustrative — not financial or legal advice.
      </p>
    </div>
  )
}

function Result({
  label,
  value,
  sub,
  tone = 'ink',
  big,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'ink' | 'pos' | 'neg'
  big?: boolean
}) {
  return (
    <div className={cx('rounded-xl bg-surface-2 px-4 py-3.5', big && 'col-span-2 sm:col-span-1')}>
      <div className="text-xs text-ink-soft">{label}</div>
      <div
        className={cx(
          'mt-1 font-serif tnum',
          big ? 'text-2xl' : 'text-xl',
          tone === 'pos' && 'text-pos',
          tone === 'neg' && 'text-neg',
          tone === 'ink' && 'text-ink',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-ink-faint tnum">{sub}</div>}
    </div>
  )
}
