import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { portfolioStats, propertyStats } from '../lib/payments'
import { upcomingDeadlines, type Deadline } from '../lib/deadlines'
import { money, moneyCompact, pct, formatDate, relativeDays } from '../lib/format'
import { Button, Card, ProgressBar, StatusBadge, cx, type Status } from '../ui/primitives'
import { ArrowUpRight, Building, Calendar, Plus, Receipt, Sparkle, TrendingUp, Wallet, Lock } from '../ui/icons'
import { Modal } from '../components/Modal'
import { PropertyForm } from '../components/PropertyForm'
import { UpgradeModal } from '../components/UpgradeModal'
import { Onboarding } from '../components/Onboarding'
import type { Property } from '../lib/types'

export function Dashboard() {
  const { properties, canAddProperty, addProperty, loadSample, onboarded } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const navigate = useNavigate()

  const onAdd = () => (canAddProperty ? setShowForm(true) : setShowUpgrade(true))

  return (
    <div className="flex flex-col gap-8">
      {!onboarded && properties.length === 0 && (
        <Onboarding
          onAddProperty={() => setShowForm(true)}
          onSample={() => navigate(`/property/${loadSample()}`)}
        />
      )}

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">Portfolio</h1>
          <p className="mt-1 text-ink-soft">
            {properties.length === 0
              ? 'Track every off-plan payment in one private place.'
              : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'} in your pipeline.`}
          </p>
        </div>
        <Button onClick={onAdd} className="shrink-0">
          {canAddProperty ? <Plus size={18} /> : <Lock size={16} />}
          Add property
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          onAdd={() => setShowForm(true)}
          onSample={() => navigate(`/property/${loadSample()}`)}
        />
      ) : (
        <>
          <PortfolioSummary properties={properties} />
          <UpcomingDeadlines properties={properties} />
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                Properties
              </h2>
              {properties.length >= 2 && (
                <Link
                  to="/compare"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <TrendingUp size={16} /> Compare all
                </Link>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {properties.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </section>
        </>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New property" size="lg">
        <PropertyForm
          mode="new"
          onCancel={() => setShowForm(false)}
          onSubmitNew={(data) => {
            const id = addProperty(data)
            setShowForm(false)
            navigate(`/property/${id}`)
          }}
        />
      </Modal>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
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
    <Card className="animate-in overflow-hidden p-0">
      <div className="grid gap-px bg-line sm:grid-cols-4">
        <Metric
          icon={<Wallet size={16} />}
          label="Committed"
          value={money(s.totalCommitted, cur)}
        />
        <Metric
          icon={<Building size={16} />}
          label="Equity paid"
          value={money(s.totalPaid, cur)}
          sub={`${pct(s.equityPct)} of value`}
          tone="primary"
        />
        <Metric label="Remaining" value={money(s.totalRemaining, cur)} />
        <Metric
          icon={<TrendingUp size={16} />}
          label="Projected gain"
          value={money(s.projectedGain, cur)}
          tone="gold"
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-line p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-ink-soft">Portfolio equity</span>
            <span className="font-medium text-ink tnum">{pct(s.equityPct)}</span>
          </div>
          <ProgressBar value={s.equityPct} />
        </div>
        {s.next && (
          <Link
            to={`/property/${s.next.property.id}`}
            className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-2 px-4 py-3 transition-colors hover:border-line-strong sm:w-80"
          >
            <div className="min-w-0">
              <div className="text-xs text-ink-faint">Next payment {relativeDays(s.next.payment.dueDate)}</div>
              <div className="truncate text-sm font-medium text-ink">{s.next.property.name}</div>
              <div className="text-xs text-ink-soft tnum">{formatDate(s.next.payment.dueDate)}</div>
            </div>
            <div className="text-right">
              <div className="font-serif text-lg text-ink tnum">
                {moneyCompact(s.next.payment.amount, cur)}
              </div>
              <ArrowUpRight size={16} className="ml-auto text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        )}
      </div>

      {othersCount > 0 && (
        <p className="border-t border-line px-5 py-3 text-xs text-ink-faint">
          Totals shown in {cur}. {othersCount} propert{othersCount > 1 ? 'ies' : 'y'} in other
          currencies not included in this roll-up.
        </p>
      )}
    </Card>
  )
}

function Metric({
  icon,
  label,
  value,
  sub,
  tone = 'ink',
}: {
  icon?: React.ReactNode
  label: string
  value: string
  sub?: string
  tone?: 'ink' | 'primary' | 'gold'
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <div className="flex items-center gap-1.5 text-xs text-ink-soft">
        {icon}
        {label}
      </div>
      <div
        className={cx(
          'mt-1.5 whitespace-nowrap font-serif text-lg tnum sm:text-xl',
          tone === 'primary' && 'text-primary',
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

function UpcomingDeadlines({ properties }: { properties: Property[] }) {
  const items = upcomingDeadlines(properties, 60).slice(0, 5)
  if (!items.length) return null

  const tone = (s: Deadline['status']) =>
    s === 'overdue' ? 'text-over' : s === 'soon' ? 'text-due' : 'text-ink-faint'

  return (
    <Card className="animate-in p-5">
      <div className="mb-2 flex items-center gap-2">
        <Calendar size={16} className="text-ink-soft" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Upcoming</h2>
      </div>
      <ul className="flex flex-col">
        {items.map((d, i) => (
          <Link
            key={`${d.propertyId}-${d.kind}-${i}`}
            to={`/property/${d.propertyId}`}
            className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0 hover:opacity-80"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-soft">
                {d.kind === 'payment' ? <Receipt size={15} /> : <Calendar size={15} />}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm text-ink">
                  {d.label} <span className="text-ink-faint">· {d.propertyName}</span>
                </div>
                <div className={cx('text-xs tnum', tone(d.status))}>
                  {relativeDays(d.date)} · {formatDate(d.date)}
                </div>
              </div>
            </div>
            {d.amount != null && (
              <span className="shrink-0 font-medium text-ink tnum">
                {moneyCompact(d.amount, d.currency)}
              </span>
            )}
          </Link>
        ))}
      </ul>
    </Card>
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
