import { useMemo, useState } from 'react'
import { addMonths } from 'date-fns'
import type { Currency, Frequency, Market, Property, UnitType } from '../lib/types'
import { allocatedPct, generateSchedule } from '../lib/payments'
import { defaultResaleThreshold } from '../lib/costs'
import { areasFor, benchmarkFor, UNIT_TYPES } from '../lib/benchmarks'
import { money, pct, todayISO, toISODate } from '../lib/format'
import { Button, Field, Segmented, cx, inputCls } from '../ui/primitives'
import { Alert } from '../ui/icons'

const CURRENCIES: Currency[] = ['AED', 'USD', 'GBP', 'EUR', 'SAR']
const MARKETS: Market[] = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Other']

// Major UAE off-plan developers — autocomplete only; free text still allowed.
const DEVELOPERS = [
  'Emaar',
  'Damac',
  'Sobha',
  'Nakheel',
  'Aldar',
  'Meraas',
  'Dubai Properties',
  'Azizi',
  'Danube',
  'Binghatti',
  'Ellington',
  'Select Group',
  'Omniyat',
  'Deyaar',
  'Samana',
  'Object 1',
  'Reportage',
  'Nshama',
  'MAG',
  'Bloom',
  'Modon',
  'Arada',
  'Alef',
  'RAK Properties',
]

const iso = toISODate

export type NewPropertyData = Omit<Property, 'id' | 'createdAt'>

interface FormState {
  name: string
  developer: string
  market: Market
  area: string
  unitType: string
  currency: Currency
  purchasePrice: string
  bookingDate: string
  handoverDate: string
  sizeSqft: string
  serviceChargePerSqft: string
  expectedAppreciationPct: string
  expectedRentalYieldPct: string
  notes: string
  // plan
  downPaymentPct: string
  installmentPct: string
  installmentCount: string
  frequency: Frequency
  includeDldFee: boolean
}

function initial(p?: Property): FormState {
  const today = todayISO()
  return {
    name: p?.name ?? '',
    developer: p?.developer ?? '',
    market: p?.market ?? 'Dubai',
    area: p?.area ?? '',
    unitType: p?.unitType ?? '',
    currency: p?.currency ?? 'AED',
    purchasePrice: p ? String(p.purchasePrice) : '',
    bookingDate: p?.bookingDate ?? today,
    handoverDate: p?.handoverDate ?? iso(addMonths(new Date(), 24)),
    sizeSqft: p?.sizeSqft ? String(p.sizeSqft) : '',
    serviceChargePerSqft: p?.serviceChargePerSqft ? String(p.serviceChargePerSqft) : '',
    expectedAppreciationPct: p ? String(p.expectedAppreciationPct) : '15',
    expectedRentalYieldPct: p ? String(p.expectedRentalYieldPct) : '7',
    notes: p?.notes ?? '',
    downPaymentPct: '20',
    installmentPct: '1',
    installmentCount: '40',
    frequency: 'monthly',
    includeDldFee: true,
  }
}

const num = (s: string) => (s.trim() === '' ? 0 : Number(s))

interface PlanTemplate {
  label: string
  hint: string
  downPaymentPct: string
  installmentPct: string
  installmentCount: string
  frequency: Frequency
}

// Standard Dubai off-plan structures (handover absorbs the remainder).
const TEMPLATES: PlanTemplate[] = [
  { label: '1% Monthly', hint: '20% down · 1%×40', downPaymentPct: '20', installmentPct: '1', installmentCount: '40', frequency: 'monthly' },
  { label: '50 / 50', hint: '10% down · 5%×8 qtr', downPaymentPct: '10', installmentPct: '5', installmentCount: '8', frequency: 'quarterly' },
  { label: '60 / 40', hint: '20% down · 5%×8 qtr', downPaymentPct: '20', installmentPct: '5', installmentCount: '8', frequency: 'quarterly' },
  { label: '80 / 20', hint: '20% down · 5%×12 qtr', downPaymentPct: '20', installmentPct: '5', installmentCount: '12', frequency: 'quarterly' },
]

export function PropertyForm({
  mode,
  property,
  onSubmitNew,
  onSubmitEdit,
  onCancel,
}: {
  mode: 'new' | 'edit'
  property?: Property
  onSubmitNew?: (data: NewPropertyData) => void
  onSubmitEdit?: (patch: Partial<Property>) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<FormState>(() => initial(property))
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }))

  const price = num(f.purchasePrice)
  const planInput = {
    purchasePrice: price,
    bookingDate: f.bookingDate,
    handoverDate: f.handoverDate,
    downPaymentPct: num(f.downPaymentPct),
    installmentPct: num(f.installmentPct),
    installmentCount: Math.round(num(f.installmentCount)),
    frequency: f.frequency,
    includeDldFee: f.includeDldFee,
  }

  const allocated = allocatedPct(planInput)
  const handoverPct = Math.round((100 - allocated) * 100) / 100
  const planValid = price > 0 && allocated <= 100 && planInput.installmentCount >= 0

  const preview = useMemo(() => {
    if (mode !== 'new' || !planValid) return null
    const sched = generateSchedule(planInput)
    return {
      count: sched.length,
      first: sched.find((p) => p.type === 'downpayment'),
      handover: sched.find((p) => p.type === 'handover'),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, planValid, f.purchasePrice, f.downPaymentPct, f.installmentPct, f.installmentCount, f.frequency, f.includeDldFee, f.bookingDate, f.handoverDate])

  const baseValid = f.name.trim() !== '' && price > 0 && f.handoverDate > f.bookingDate
  const unit = f.unitType ? (f.unitType as UnitType) : undefined
  const areaBenchmark = benchmarkFor(f.market, f.area, unit)
  const suggestYield = (area: string, unitType: string) => {
    const b = benchmarkFor(f.market, area, unitType ? (unitType as UnitType) : undefined)
    return b ? String(b.typ) : null
  }

  function submit() {
    if (!baseValid) return
    const shared = {
      name: f.name.trim(),
      developer: f.developer.trim(),
      market: f.market,
      area: f.area.trim() || undefined,
      unitType: f.unitType ? (f.unitType as UnitType) : undefined,
      currency: f.currency,
      purchasePrice: price,
      resaleThresholdPct: property?.resaleThresholdPct ?? defaultResaleThreshold(f.developer),
      bookingDate: f.bookingDate,
      handoverDate: f.handoverDate,
      sizeSqft: f.sizeSqft ? num(f.sizeSqft) : undefined,
      serviceChargePerSqft: f.serviceChargePerSqft ? num(f.serviceChargePerSqft) : undefined,
      expectedAppreciationPct: num(f.expectedAppreciationPct),
      expectedRentalYieldPct: num(f.expectedRentalYieldPct),
      notes: f.notes.trim() || undefined,
    }
    if (mode === 'new') {
      if (!planValid) return
      onSubmitNew?.({ ...shared, payments: generateSchedule(planInput) })
    } else {
      onSubmitEdit?.(shared)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex flex-col gap-7"
    >
      {/* Property */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Property</SectionTitle>
        <Field label="Project name">
          <input
            className={inputCls}
            value={f.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Creek Horizon — Tower B"
            autoFocus
          />
        </Field>
        <Field label="Developer" hint="Sets the typical resale threshold.">
          <input
            className={inputCls}
            list="hb-developers"
            value={f.developer}
            onChange={(e) => set('developer', e.target.value)}
            placeholder="Emaar, Damac…"
          />
          <datalist id="hb-developers">
            {DEVELOPERS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Market" hint="Sets local fees & rules.">
            <select
              className={cx(inputCls, 'cursor-pointer')}
              value={f.market}
              onChange={(e) => set('market', e.target.value as Market)}
            >
              {MARKETS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Currency">
            <select
              className={cx(inputCls, 'cursor-pointer')}
              value={f.currency}
              onChange={(e) => set('currency', e.target.value as Currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Area / community"
          hint={
            areaBenchmark
              ? `Typical gross yield ≈ ${areaBenchmark.min}–${areaBenchmark.max}% — applied ${pct(areaBenchmark.typ)}`
              : 'Pick a community to auto-suggest a rental yield.'
          }
        >
          <input
            className={inputCls}
            list="hb-areas"
            value={f.area}
            placeholder="e.g. Dubai Marina"
            onChange={(e) => {
              const v = e.target.value
              const y = suggestYield(v, f.unitType)
              setF((s) => ({ ...s, area: v, ...(y ? { expectedRentalYieldPct: y } : {}) }))
            }}
          />
          <datalist id="hb-areas">
            {areasFor(f.market).map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </Field>
        <Field label="Purchase price" hint="The full contract price.">
          <input
            className={inputCls}
            inputMode="numeric"
            value={f.purchasePrice}
            onChange={(e) => set('purchasePrice', e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="1,850,000"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Booking date">
            <input
              type="date"
              className={cx(inputCls, 'cursor-pointer')}
              value={f.bookingDate}
              onChange={(e) => set('bookingDate', e.target.value)}
            />
          </Field>
          <Field label="Expected handover">
            <input
              type="date"
              className={cx(inputCls, 'cursor-pointer')}
              value={f.handoverDate}
              onChange={(e) => set('handoverDate', e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Property type" hint="Adjusts the yield benchmark.">
            <select
              className={cx(inputCls, 'cursor-pointer')}
              value={f.unitType}
              onChange={(e) => {
                const v = e.target.value
                const y = suggestYield(f.area, v)
                setF((s) => ({ ...s, unitType: v, ...(y ? { expectedRentalYieldPct: y } : {}) }))
              }}
            >
              <option value="">Unspecified</option>
              {UNIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Size (sqft)" hint="Optional — enables net-yield.">
            <input
              className={inputCls}
              inputMode="numeric"
              value={f.sizeSqft}
              onChange={(e) => set('sizeSqft', e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="850"
            />
          </Field>
        </div>
        <Field label="Service charge / sqft / yr" hint="Optional — enables net yield.">
          <input
            className={inputCls}
            inputMode="numeric"
            value={f.serviceChargePerSqft}
            onChange={(e) => set('serviceChargePerSqft', e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="18"
          />
        </Field>
      </section>

      {/* Payment plan architect — new only */}
      {mode === 'new' && (
        <section className="flex flex-col gap-4">
          <SectionTitle>Payment plan</SectionTitle>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-ink-faint">Quick start from a common structure</span>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => {
                const active =
                  f.downPaymentPct === t.downPaymentPct &&
                  f.installmentPct === t.installmentPct &&
                  f.installmentCount === t.installmentCount &&
                  f.frequency === t.frequency
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() =>
                      setF((s) => ({
                        ...s,
                        downPaymentPct: t.downPaymentPct,
                        installmentPct: t.installmentPct,
                        installmentCount: t.installmentCount,
                        frequency: t.frequency,
                      }))
                    }
                    className={cx(
                      'flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer',
                      active
                        ? 'border-primary bg-primary-tint'
                        : 'border-line-strong hover:border-primary',
                    )}
                  >
                    <span className={cx('text-sm font-medium', active ? 'text-primary' : 'text-ink')}>
                      {t.label}
                    </span>
                    <span className="text-[11px] text-ink-faint tnum">{t.hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Down payment %">
              <input
                className={inputCls}
                inputMode="decimal"
                value={f.downPaymentPct}
                onChange={(e) => set('downPaymentPct', e.target.value.replace(/[^0-9.]/g, ''))}
              />
            </Field>
            <Field label="Frequency">
              <Segmented
                value={f.frequency}
                onChange={(v) => set('frequency', v)}
                options={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                ]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Installment % (each)">
              <input
                className={inputCls}
                inputMode="decimal"
                value={f.installmentPct}
                onChange={(e) => set('installmentPct', e.target.value.replace(/[^0-9.]/g, ''))}
              />
            </Field>
            <Field label="Number of installments">
              <input
                className={inputCls}
                inputMode="numeric"
                value={f.installmentCount}
                onChange={(e) => set('installmentCount', e.target.value.replace(/[^0-9]/g, ''))}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
            <input
              type="checkbox"
              checked={f.includeDldFee}
              onChange={(e) => set('includeDldFee', e.target.checked)}
              className="h-4 w-4 accent-[var(--c-primary)]"
            />
            <span className="text-sm text-ink">
              Add 4% Dubai Land Department fee <span className="text-ink-faint">(due at booking)</span>
            </span>
          </label>

          {/* allocation readout */}
          <div
            className={cx(
              'flex items-center justify-between rounded-xl px-4 py-3 text-sm',
              allocated > 100 ? 'bg-over-tint text-over' : 'bg-primary-tint text-primary',
            )}
          >
            {allocated > 100 ? (
              <span className="flex items-center gap-2">
                <Alert size={16} /> Allocated {allocated}% exceeds 100%
              </span>
            ) : (
              <span className="tnum">
                Allocated {allocated}% · Handover absorbs {handoverPct}%
              </span>
            )}
            {preview && (
              <span className="text-ink-soft tnum">
                {preview.count} payments
              </span>
            )}
          </div>

          {preview?.first && preview.handover && (
            <p className="text-xs text-ink-faint tnum">
              First: {money(preview.first.amount, f.currency)} · Handover:{' '}
              {money(preview.handover.amount, f.currency)}
            </p>
          )}
        </section>
      )}

      {/* ROI assumptions */}
      <section className="flex flex-col gap-4">
        <SectionTitle>Return assumptions</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Appreciation by handover %">
            <input
              className={inputCls}
              inputMode="decimal"
              value={f.expectedAppreciationPct}
              onChange={(e) => set('expectedAppreciationPct', e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </Field>
          <Field label="Gross rental yield %">
            <input
              className={inputCls}
              inputMode="decimal"
              value={f.expectedRentalYieldPct}
              onChange={(e) => set('expectedRentalYieldPct', e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </Field>
        </div>
      </section>

      {mode === 'edit' && (
        <p className="-mt-2 text-xs text-ink-faint">
          Editing details won’t rebuild your existing payment schedule.
        </p>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex gap-3 border-t border-line bg-surface/95 px-5 py-4 backdrop-blur">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={!baseValid || (mode === 'new' && !planValid)}>
          {mode === 'new' ? 'Create property' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{children}</h3>
  )
}
