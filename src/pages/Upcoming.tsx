import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { upcomingDeadlines, type Deadline } from '../lib/deadlines'
import { moneyCompact, formatDate, formatMonthYear, relativeDays } from '../lib/format'
import { Card, cx } from '../ui/primitives'
import { Calendar, Receipt } from '../ui/icons'

export function Upcoming() {
  const { properties } = useStore()
  const items = upcomingDeadlines(properties, 365)

  // group by month
  const groups: { key: string; label: string; items: Deadline[] }[] = []
  for (const d of items) {
    const label = formatMonthYear(d.date)
    let g = groups.find((x) => x.label === label)
    if (!g) {
      g = { key: label, label, items: [] }
      groups.push(g)
    }
    g.items.push(d)
  }

  const tone = (s: Deadline['status']) =>
    s === 'overdue' ? 'text-over' : s === 'soon' ? 'text-due' : 'text-ink-faint'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Upcoming</h1>
        <p className="mt-1 text-ink-soft">Payments and document deadlines across your portfolio.</p>
      </div>

      {items.length === 0 ? (
        <Card className="px-6 py-16 text-center text-ink-soft">
          Nothing due in the next year. You’re all caught up.
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{g.label}</h2>
            <Card className="stagger divide-y divide-line p-0">
              {g.items.map((d, i) => (
                <Link
                  key={`${d.propertyId}-${i}`}
                  to={`/property/${d.propertyId}`}
                  style={{ ['--i']: Math.min(i, 8) } as React.CSSProperties}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2 active:scale-[0.99]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-soft">
                      {d.kind === 'payment' ? <Receipt size={16} /> : <Calendar size={16} />}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">{d.label}</div>
                      <div className="truncate text-xs text-ink-faint">{d.propertyName}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {d.amount != null && (
                      <div className="font-medium text-ink tnum">{moneyCompact(d.amount, d.currency)}</div>
                    )}
                    <div className={cx('text-xs tnum', tone(d.status))}>
                      {relativeDays(d.date)} · {formatDate(d.date)}
                    </div>
                  </div>
                </Link>
              ))}
            </Card>
          </section>
        ))
      )}
    </div>
  )
}
