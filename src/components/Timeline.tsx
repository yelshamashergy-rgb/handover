import type { Payment, Property } from '../lib/types'
import { daysBetween, formatDate, money, relativeDays } from '../lib/format'
import { cx, type Status } from '../ui/primitives'
import { Check, Pencil, Plus, Receipt } from '../ui/icons'

function statusOf(p: Payment): Status {
  if (p.paid) return 'paid'
  const d = daysBetween(new Date(), new Date(p.dueDate + 'T00:00:00'))
  if (d < 0) return 'overdue'
  if (d <= 14) return 'due'
  return 'upcoming'
}

const NODE: Record<Status, string> = {
  paid: 'bg-paid border-paid text-white',
  overdue: 'bg-over-tint border-over text-over',
  due: 'bg-due-tint border-due text-due',
  upcoming: 'bg-surface border-line-strong text-ink-faint',
}

export function Timeline({
  property,
  onToggle,
  onEditPayment,
  onAddPayment,
}: {
  property: Property
  onToggle: (paymentId: string) => void
  onEditPayment: (payment: Payment) => void
  onAddPayment: () => void
}) {
  const payments = property.payments
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  return (
    <div>
      <ol className="relative">
        <span className="absolute left-[15px] top-3 bottom-3 w-px bg-line" aria-hidden="true" />

        {payments.map((p) => {
          const status = statusOf(p)
          const isPaid = status === 'paid'
          const emphasize = status === 'overdue' || status === 'due'
          return (
            <li key={p.id} className="relative flex gap-4 pb-1">
              <div className="relative z-10 mt-3 shrink-0">
                <span
                  className={cx(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                    NODE[status],
                  )}
                >
                  {isPaid ? <Check size={16} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
              </div>

              <div className="group flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl px-3 py-2.5 hover:bg-surface-2 transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{p.label}</span>
                    {typeof p.percentage === 'number' && (
                      <span className="text-xs text-ink-faint tnum">{p.percentage}%</span>
                    )}
                  </div>
                  <div className="text-sm text-ink-soft tnum">
                    {formatDate(p.dueDate)}
                    {!isPaid && (
                      <span
                        className={cx(
                          'ml-2',
                          status === 'overdue' ? 'text-over' : status === 'due' ? 'text-due' : 'text-ink-faint',
                        )}
                      >
                        · {relativeDays(p.dueDate)}
                      </span>
                    )}
                    {isPaid && p.paidDate && <span className="ml-2 text-paid">· paid {formatDate(p.paidDate)}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="mr-1 font-serif text-lg text-ink tnum">{money(p.amount, property.currency)}</span>
                  <button
                    type="button"
                    onClick={() => onEditPayment(p)}
                    aria-label={`Edit ${p.label}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-surface hover:text-ink cursor-pointer transition-colors print:hidden"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(p.id)}
                    aria-pressed={isPaid}
                    aria-label={isPaid ? `Mark ${p.label} as unpaid` : `Mark ${p.label} as paid`}
                    className={cx(
                      'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium cursor-pointer transition-colors active:scale-[0.98] print:hidden',
                      isPaid
                        ? 'border-line text-ink-soft hover:bg-surface hover:text-ink'
                        : emphasize
                          ? 'border-primary bg-primary text-primary-ink hover:bg-primary-strong'
                          : 'border-line-strong text-ink hover:border-primary hover:text-primary',
                    )}
                  >
                    {isPaid ? (
                      'Undo'
                    ) : (
                      <>
                        <Receipt size={15} /> Mark paid
                      </>
                    )}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={onAddPayment}
        className="mt-2 ml-[3px] inline-flex items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-primary hover:text-primary cursor-pointer transition-colors print:hidden"
      >
        <Plus size={16} /> Add payment
      </button>
    </div>
  )
}
