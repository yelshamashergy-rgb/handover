import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useAddProperty } from '../components/Layout'
import { portfolioStats, propertyStats } from '../lib/payments'
import { money, moneyCompact, pct, formatDate, relativeDays } from '../lib/format'
import { Button, Card, ProgressBar, StatusBadge, cx, type Status } from '../ui/primitives'
import { ArrowUpRight, Building, Plus, Sparkle } from '../ui/icons'
import { Onboarding } from '../components/Onboarding'
import { EquityRing } from '../components/EquityRing'
import { CountUp } from '../ui/CountUp'
import type { Property } from '../lib/types'

export function Dashboard() {
  const { properties, loadSample, onboarded } = useStore()
  const requestAdd = useAddProperty()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-7">
      {!onboarded && properties.length === 0 && (
        <Onboarding onAddProperty={requestAdd} onSample={() => navigate(`/property/${loadSample()}`)} />
      )}

      <header className="pt-1">
        <p className="text-sm text-ink-faint">Your portfolio</p>
        <h1 className="font-serif text-3xl text-ink">Handover</h1>
      </header>

      {properties.length === 0 ? (
        <EmptyState onAdd={requestAdd} onSample={() => navigate(`/property/${loadSample()}`)} />
      ) : (
        <>
          <PortfolioSummary properties={properties} />
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Properties</h2>
            <div className="flex flex-col gap-4">
              {properties.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function PortfolioSummary({ properties }: { properties: Property[] }) {
  // Summing across currencies is meaningless — roll up the dominant currency only.
  const counts = properties.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] || 0) + 1
    return acc
  }, {})
  const cur = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as Property['currency']
  const subset = properties.filter((p) => p.currency === cur)
  const othersCount = properties.length - subset.length
  const s = portfolioStats(subset)

  return (
    <Card className="animate-in flex flex-col gap-5 p-5">
      {/* hero */}
      <div className="flex items-center gap-5">
        <EquityRing pct={s.equityPct} label="equity" id="home-ring" />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-ink-faint">Equity paid</div>
          <div className="whitespace-nowrap font-serif text-2xl leading-tight text-ink tnum">
            <CountUp value={s.totalPaid} format={(n) => money(n, cur)} id="home-equity" />
          </div>
          <div className="mt-1 text-sm text-ink-soft tnum">
            of {moneyCompact(s.totalCommitted, cur)} committed
          </div>
        </div>
      </div>

      {/* supporting */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
        <Mini label="Remaining" value={<CountUp value={s.totalRemaining} format={(n) => moneyCompact(n, cur)} id="home-remaining" />} />
        <Mini label="Proj. value" value={<CountUp value={s.projectedValue} format={(n) => moneyCompact(n, cur)} id="home-projvalue" />} />
        <Mini
          label="Proj. gain"
          value={<CountUp value={s.projectedGain} format={(n) => moneyCompact(n, cur)} id="home-projgain" />}
          tone="gold"
        />
      </div>

      {/* next payment */}
      {s.next && (
        <Link
          to={`/property/${s.next.property.id}`}
          className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 px-4 py-3 transition-colors hover:border-line-strong active:scale-[0.99]"
        >
          <div className="min-w-0">
            <div className="text-xs text-ink-faint">Next payment {relativeDays(s.next.payment.dueDate)}</div>
            <div className="truncate text-sm font-medium text-ink">{s.next.property.name}</div>
            <div className="text-xs text-ink-soft tnum">{formatDate(s.next.payment.dueDate)}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-right">
            <span className="whitespace-nowrap font-serif text-lg text-ink tnum">
              {moneyCompact(s.next.payment.amount, cur)}
            </span>
            <ArrowUpRight size={16} className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>
      )}

      {othersCount > 0 && (
        <p className="text-xs text-ink-faint">
          Totals shown in {cur}. {othersCount} propert{othersCount > 1 ? 'ies' : 'y'} in other
          currencies not included.
        </p>
      )}
      <p className="text-[11px] text-ink-faint">Projected figures are illustrative, not advice.</p>
    </Card>
  )
}

function Mini({
  label,
  value,
  tone = 'ink',
}: {
  label: string
  value: React.ReactNode
  tone?: 'ink' | 'gold'
}) {
  return (
    <div className="bg-surface px-3 py-3 text-center">
      <div className="text-[11px] text-ink-soft">{label}</div>
      <div
        className={cx(
          'mt-0.5 whitespace-nowrap font-serif text-base tnum',
          tone === 'gold' ? 'text-gold' : 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  )
}

function PropertyCard({ property, index = 0 }: { property: Property; index?: number }) {
  const s = propertyStats(property)
  let status: Status = 'upcoming'
  if (s.overdue.length) status = 'overdue'
  else if (s.dueSoon.length) status = 'due'
  else if (!s.next) status = 'paid'

  return (
    <Link
      to={`/property/${property.id}`}
      className="group block animate-in transition-transform active:scale-[0.99]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Card className="flex h-full flex-col gap-4 p-5 transition-[box-shadow,border] duration-200 hover:border-line-strong hover:shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-serif text-xl text-ink">{property.name}</div>
            <div className="text-sm text-ink-soft">{property.developer || 'Off-plan'}</div>
          </div>
          <StatusBadge status={status} label={status === 'paid' ? 'Complete' : undefined} />
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-ink-faint">Equity paid</div>
            <div className="font-serif text-2xl text-ink tnum">{pct(s.equityPct)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-faint">Value</div>
            <div className="font-medium text-ink tnum">{moneyCompact(property.purchasePrice, property.currency)}</div>
          </div>
        </div>

        <ProgressBar value={s.equityPct} />

        <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-sm">
          {s.next ? (
            <>
              <span className="text-ink-soft">
                Next · <span className="tnum">{formatDate(s.next.dueDate)}</span>
              </span>
              <span className="font-medium text-ink tnum">
                {moneyCompact(s.next.amount, property.currency)}
              </span>
            </>
          ) : (
            <span className="text-paid">Fully paid</span>
          )}
        </div>
      </Card>
    </Link>
  )
}

function EmptyState({ onAdd, onSample }: { onAdd: () => void; onSample: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-5 px-6 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-tint text-primary">
        <Building size={28} />
      </span>
      <div>
        <h2 className="font-serif text-2xl text-ink">No properties yet</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-ink-soft">
          Add your first off-plan purchase to map out every payment, watch equity build, and
          project your return.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onAdd}>
          <Plus size={18} /> Add property
        </Button>
        <Button size="lg" variant="outline" onClick={onSample}>
          <Sparkle size={16} /> Explore with sample data
        </Button>
      </div>
    </Card>
  )
}
