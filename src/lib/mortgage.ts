export interface MortgageResult {
  monthly: number
  totalInterest: number
  totalPaid: number
}

/** Standard amortised mortgage. loan in currency, rate annual %, term years. */
export function mortgage(loan: number, ratePct: number, termYrs: number): MortgageResult {
  const n = Math.max(1, Math.round(termYrs * 12))
  const r = ratePct / 100 / 12
  const monthly = r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n))
  const totalPaid = monthly * n
  return { monthly, totalInterest: totalPaid - loan, totalPaid }
}

/** UAE expat LTV cap (first property): 80% under AED 5M, 75% at/above. */
export function ltvCap(price: number): number {
  return price >= 5_000_000 ? 75 : 80
}
