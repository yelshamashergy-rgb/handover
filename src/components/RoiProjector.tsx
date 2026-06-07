import type { Property } from '../lib/types'
import { projection } from '../lib/payments'
import { money, pct } from '../lib/format'
import { cx } from '../ui/primitives'

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="font-serif text-xl text-primary tnum">{pct(value, value % 1 === 0 ? 0 : 1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      <div className="mt-1 flex justify-between text-[11px] text-ink-faint tnum">
        <span>{pct(min, 0)}</span>
        <span>{pct(max, 0)}</span>
      </div>
    </div>
  )
}

function Result({
  label,
  value,
  tone = 'ink',
  sub,
}: {
  label: string
  value: string
  tone?: 'ink' | 'pos' | 'gold'
  sub?: string
}) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3.5">
      <div className="text-xs text-ink-soft">{label}</div>
      <div
        className={cx(
          'mt-1 font-serif text-2xl tnum',
          tone === 'pos' && 'text-pos',
          tone === 'gold' && 'text-gold',
          tone === 'ink' && 'text-ink',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-ink-faint tnum">{sub}</div>}
    </div>
  )
}

export function RoiProjector({
  property,
  onChange,
}: {
  property: Property
  onChange: (patch: Partial<Property>) => void
}) {
  const proj = projection(property)
  const cur = property.currency

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Slider
          label="Capital appreciation by handover"
          value={property.expectedAppreciationPct}
          min={0}
          max={60}
          step={1}
          onChange={(v) => onChange({ expectedAppreciationPct: v })}
        />
        <Slider
          label="Gross rental yield (annual)"
          value={property.expectedRentalYieldPct}
          min={0}
          max={12}
          step={0.5}
          onChange={(v) => onChange({ expectedRentalYieldPct: v })}
        />
        <p className="text-xs leading-relaxed text-ink-faint">
          Projections are illustrative, based on your assumptions — not financial advice.
          {property.sizeSqft && property.serviceChargePerSqft
            ? ` Net rent is after ${money(proj.serviceCharge, cur)} annual service charge.`
            : ' Add size & service charge in Edit for net-of-charges figures.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Result label="Projected value at handover" value={money(proj.projectedValue, cur)} tone="gold" />
        <Result
          label="Capital gain"
          value={money(proj.capitalGain, cur)}
          tone="pos"
          sub={`+${pct(proj.capitalGainPct, 0)} on purchase`}
        />
        <Result label="Gross rent / year" value={money(proj.grossAnnualRent, cur)} />
        <Result
          label="Net yield"
          value={pct(proj.netYieldPct)}
          sub={`${money(proj.netAnnualRent, cur)} / yr`}
        />
      </div>
    </div>
  )
}
