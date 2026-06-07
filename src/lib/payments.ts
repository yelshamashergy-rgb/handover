import { addMonths } from 'date-fns'
import type { PlanInput, Payment, Property } from './types'
import { daysBetween } from './format'

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.abs(Date.parse(new Date().toISOString())).toString(36) + Math.floor(performance.now()).toString(36)
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/**
 * Build a full dated payment schedule from a high-level plan.
 * Handover absorbs the rounding remainder so the plan balances to the price exactly.
 */
export function generateSchedule(input: PlanInput): Payment[] {
  const { purchasePrice: price, bookingDate, handoverDate } = input
  const booking = new Date(bookingDate + 'T00:00:00')
  const payments: Payment[] = []

  if (input.includeDldFee) {
    payments.push({
      id: uid(),
      label: 'DLD Fee (4%)',
      type: 'fee',
      dueDate: bookingDate,
      amount: Math.round(price * 0.04),
      percentage: 4,
      paid: false,
    })
  }

  const downAmount = Math.round((price * input.downPaymentPct) / 100)
  payments.push({
    id: uid(),
    label: 'Down payment',
    type: 'downpayment',
    dueDate: bookingDate,
    amount: downAmount,
    percentage: input.downPaymentPct,
    paid: false,
  })

  const step = input.frequency === 'monthly' ? 1 : 3
  const instAmount = Math.round((price * input.installmentPct) / 100)
  let allocated = downAmount
  for (let i = 1; i <= input.installmentCount; i++) {
    const due = addMonths(booking, i * step)
    payments.push({
      id: uid(),
      label: `Installment ${i}`,
      type: 'installment',
      dueDate: iso(due),
      amount: instAmount,
      percentage: input.installmentPct,
      paid: false,
    })
    allocated += instAmount
  }

  const handoverAmount = price - allocated
  if (handoverAmount > 0) {
    payments.push({
      id: uid(),
      label: 'Handover',
      type: 'handover',
      dueDate: handoverDate,
      amount: handoverAmount,
      percentage: round2((handoverAmount / price) * 100),
      paid: false,
    })
  }

  return payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function allocatedPct(input: PlanInput): number {
  return round2(input.downPaymentPct + input.installmentPct * input.installmentCount)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/* ---------------------------------------------------------------- stats */

export interface PropertyStats {
  paidTowardPrice: number
  remainingToPrice: number
  equityPct: number
  totalPlanned: number
  totalPaid: number
  progressPct: number
  paidCount: number
  totalCount: number
  next?: Payment
  overdue: Payment[]
  dueSoon: Payment[]
}

const towardPrice = (p: Payment) => p.type !== 'fee'

export function propertyStats(p: Property, today = new Date()): PropertyStats {
  const paidTowardPrice = p.payments
    .filter((x) => x.paid && towardPrice(x))
    .reduce((s, x) => s + x.amount, 0)
  const totalPaid = p.payments.filter((x) => x.paid).reduce((s, x) => s + x.amount, 0)
  const totalPlanned = p.payments.reduce((s, x) => s + x.amount, 0)
  const unpaid = p.payments.filter((x) => !x.paid).sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const overdue = unpaid.filter((x) => daysBetween(today, new Date(x.dueDate + 'T00:00:00')) < 0)
  const dueSoon = unpaid.filter((x) => {
    const d = daysBetween(today, new Date(x.dueDate + 'T00:00:00'))
    return d >= 0 && d <= 14
  })

  return {
    paidTowardPrice,
    remainingToPrice: Math.max(0, p.purchasePrice - paidTowardPrice),
    equityPct: p.purchasePrice ? (paidTowardPrice / p.purchasePrice) * 100 : 0,
    totalPlanned,
    totalPaid,
    progressPct: totalPlanned ? (totalPaid / totalPlanned) * 100 : 0,
    paidCount: p.payments.filter((x) => x.paid).length,
    totalCount: p.payments.length,
    next: unpaid[0],
    overdue,
    dueSoon,
  }
}

/* ------------------------------------------------------------- projection */

export interface Projection {
  projectedValue: number
  capitalGain: number
  capitalGainPct: number
  grossAnnualRent: number
  serviceCharge: number
  netAnnualRent: number
  netYieldPct: number
  /** total first-year return at handover: capital gain + one year net rent */
  totalReturn: number
  totalReturnPct: number
}

export function projection(p: Property): Projection {
  const projectedValue = p.purchasePrice * (1 + p.expectedAppreciationPct / 100)
  const capitalGain = projectedValue - p.purchasePrice
  const grossAnnualRent = (p.purchasePrice * p.expectedRentalYieldPct) / 100
  const serviceCharge = (p.sizeSqft || 0) * (p.serviceChargePerSqft || 0)
  const netAnnualRent = grossAnnualRent - serviceCharge
  const totalReturn = capitalGain + netAnnualRent
  return {
    projectedValue,
    capitalGain,
    capitalGainPct: p.expectedAppreciationPct,
    grossAnnualRent,
    serviceCharge,
    netAnnualRent,
    netYieldPct: p.purchasePrice ? (netAnnualRent / p.purchasePrice) * 100 : 0,
    totalReturn,
    totalReturnPct: p.purchasePrice ? (totalReturn / p.purchasePrice) * 100 : 0,
  }
}

/* -------------------------------------------------------------- portfolio */

export interface PortfolioStats {
  totalCommitted: number
  totalPaid: number
  totalRemaining: number
  equityPct: number
  overdueCount: number
  next?: { property: Property; payment: Payment }
  projectedValue: number
  projectedGain: number
}

export function portfolioStats(properties: Property[], today = new Date()): PortfolioStats {
  let totalCommitted = 0
  let totalPaid = 0
  let totalRemaining = 0
  let overdueCount = 0
  let projectedValue = 0
  let projectedGain = 0
  let next: PortfolioStats['next']

  for (const p of properties) {
    const s = propertyStats(p, today)
    totalCommitted += p.purchasePrice
    totalPaid += s.paidTowardPrice
    totalRemaining += s.remainingToPrice
    overdueCount += s.overdue.length
    const proj = projection(p)
    projectedValue += proj.projectedValue
    projectedGain += proj.capitalGain
    if (s.next) {
      if (!next || s.next.dueDate < next.payment.dueDate) {
        next = { property: p, payment: s.next }
      }
    }
  }

  return {
    totalCommitted,
    totalPaid,
    totalRemaining,
    equityPct: totalCommitted ? (totalPaid / totalCommitted) * 100 : 0,
    overdueCount,
    next,
    projectedValue,
    projectedGain,
  }
}

/* ---------------------------------------------------------- equity series */

export interface EquityPoint {
  date: string
  planned: number
  paid: number
}

/** Cumulative equity-toward-price over the life of the plan, for the curve chart. */
export function buildEquitySeries(p: Property): EquityPoint[] {
  const pts = p.payments
    .filter(towardPrice)
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  let planned = 0
  let paid = 0
  const series: EquityPoint[] = [{ date: p.bookingDate, planned: 0, paid: 0 }]
  for (const pay of pts) {
    planned += pay.amount
    if (pay.paid) paid += pay.amount
    series.push({ date: pay.dueDate, planned, paid })
  }
  return series
}
