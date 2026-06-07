import { addMonths } from 'date-fns'
import type { Property } from './types'
import { generateSchedule, uid } from './payments'

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** A believable Dubai off-plan property, mid-way through its plan. */
export function sampleProperty(): Property {
  const today = new Date()
  const booking = addMonths(today, -14)
  // 40 monthly installments + handover the month after the last one.
  const handover = addMonths(booking, 41)

  const payments = generateSchedule({
    purchasePrice: 1_850_000,
    bookingDate: iso(booking),
    handoverDate: iso(handover),
    downPaymentPct: 20,
    installmentPct: 1,
    installmentCount: 40,
    frequency: 'monthly',
    includeDldFee: true,
  })

  // Mark everything already due as paid — leaves a clean "next up" ahead.
  const todayISO = iso(today)
  for (const p of payments) {
    if (p.dueDate < todayISO) {
      p.paid = true
      p.paidDate = p.dueDate
    }
  }

  return {
    id: uid(),
    name: 'Marina Vista — Tower 2',
    developer: 'Emaar',
    market: 'Dubai',
    currency: 'AED',
    purchasePrice: 1_850_000,
    bookingDate: iso(booking),
    handoverDate: iso(handover),
    sizeSqft: 850,
    expectedAppreciationPct: 18,
    expectedRentalYieldPct: 7,
    serviceChargePerSqft: 18,
    resaleThresholdPct: 40,
    notes: 'Sea-view 1BR. Sample data — edit or delete anytime.',
    createdAt: new Date().toISOString(),
    payments,
  }
}
