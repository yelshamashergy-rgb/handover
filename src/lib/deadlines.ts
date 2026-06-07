import type { Currency, Property } from './types'
import { daysBetween } from './format'

export type DeadlineKind = 'payment' | 'document'
export type DeadlineStatus = 'overdue' | 'soon' | 'upcoming'

export interface Deadline {
  propertyId: string
  propertyName: string
  kind: DeadlineKind
  label: string
  date: string
  amount?: number
  currency: Currency
  status: DeadlineStatus
}

function statusFor(date: string, today: Date): DeadlineStatus {
  const d = daysBetween(today, new Date(date + 'T00:00:00'))
  if (d < 0) return 'overdue'
  if (d <= 14) return 'soon'
  return 'upcoming'
}

/** All upcoming/overdue payment and document deadlines across the portfolio. */
export function upcomingDeadlines(properties: Property[], withinDays = 90, today = new Date()): Deadline[] {
  const out: Deadline[] = []

  for (const p of properties) {
    for (const pay of p.payments) {
      if (pay.paid) continue
      const d = daysBetween(today, new Date(pay.dueDate + 'T00:00:00'))
      if (d <= withinDays) {
        out.push({
          propertyId: p.id,
          propertyName: p.name,
          kind: 'payment',
          label: pay.label,
          date: pay.dueDate,
          amount: pay.amount,
          currency: p.currency,
          status: statusFor(pay.dueDate, today),
        })
      }
    }
    for (const doc of p.documents || []) {
      if (!doc.expiryDate) continue
      const d = daysBetween(today, new Date(doc.expiryDate + 'T00:00:00'))
      if (d <= withinDays) {
        out.push({
          propertyId: p.id,
          propertyName: p.name,
          kind: 'document',
          label: `${doc.type} expires`,
          date: doc.expiryDate,
          currency: p.currency,
          status: statusFor(doc.expiryDate, today),
        })
      }
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date))
}
