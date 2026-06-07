import type { Market, Property } from './types'

/**
 * UAE transaction-cost engine. Static rate tables — pure local calc, no backend.
 * Dubai is corroborated against DLD eservices + major brokers (2025-26).
 * Abu Dhabi / Sharjah / RAK are standard published rates but vary by buyer type,
 * split conventions, and periodic promotions — flagged `estimate` so the UI can
 * tell the user to verify. Rates change rarely; update this one file when they do.
 */

export interface CostLine {
  label: string
  amount: number
  note?: string
}

export interface CostBreakdown {
  lines: CostLine[]
  total: number
  /** total as % of the reference amount (price or sale price) */
  pctOfBase: number
}

interface Rates {
  govPct: number
  govLabel: string
  govNote?: string
  /** off-plan developer/initial registration (tiered by unit price) */
  developerRegUnder500k: number
  developerRegFrom500k: number
  developerRegLabel: string
  fixedAdmin: number
  fixedAdminLabel: string
  /** resale: dedicated trustee transfer office (Dubai); others fold into admin */
  hasResaleTrustee: boolean
  trusteeUnder500k: number
  trusteeFrom500k: number
  /** resale: seller-side transfer/registration admin */
  resaleTransferAdmin: number
  resaleTransferLabel: string
  servicesVatPct: number
  agencyPct: number
  estimate: boolean
}

const RATES: Record<Market, Rates | null> = {
  Dubai: {
    govPct: 4,
    govLabel: 'DLD registration (4%)',
    developerRegUnder500k: 3000,
    developerRegFrom500k: 3000,
    developerRegLabel: 'Oqood registration',
    fixedAdmin: 620,
    fixedAdminLabel: 'Title deed / admin',
    hasResaleTrustee: true,
    trusteeUnder500k: 2000,
    trusteeFrom500k: 4000,
    resaleTransferAdmin: 4000,
    resaleTransferLabel: 'Oqood transfer admin',
    servicesVatPct: 5,
    agencyPct: 2,
    estimate: false,
  },
  'Abu Dhabi': {
    govPct: 2,
    govLabel: 'Registration fee (2%)',
    govNote: 'often split with seller',
    developerRegUnder500k: 2000,
    developerRegFrom500k: 4000,
    developerRegLabel: 'Developer registration',
    fixedAdmin: 1000,
    fixedAdminLabel: 'Title deed / admin',
    hasResaleTrustee: false,
    trusteeUnder500k: 0,
    trusteeFrom500k: 0,
    resaleTransferAdmin: 4000,
    resaleTransferLabel: 'Transfer admin',
    servicesVatPct: 5,
    agencyPct: 2,
    estimate: true,
  },
  Sharjah: {
    govPct: 2,
    govLabel: 'Registration fee (2%)',
    govNote: 'buyer share; higher for non-GCC',
    developerRegUnder500k: 0,
    developerRegFrom500k: 0,
    developerRegLabel: 'Developer registration',
    fixedAdmin: 790,
    fixedAdminLabel: 'Title deed / admin',
    hasResaleTrustee: false,
    trusteeUnder500k: 0,
    trusteeFrom500k: 0,
    resaleTransferAdmin: 2000,
    resaleTransferLabel: 'Transfer admin',
    servicesVatPct: 5,
    agencyPct: 2,
    estimate: true,
  },
  'Ras Al Khaimah': {
    govPct: 4,
    govLabel: 'Registration fee (4%)',
    govNote: '2–4%, usually buyer',
    developerRegUnder500k: 0,
    developerRegFrom500k: 0,
    developerRegLabel: 'Off-plan registration',
    fixedAdmin: 1000,
    fixedAdminLabel: 'Title deed / admin',
    hasResaleTrustee: false,
    trusteeUnder500k: 0,
    trusteeFrom500k: 0,
    resaleTransferAdmin: 2000,
    resaleTransferLabel: 'Transfer admin',
    servicesVatPct: 5,
    agencyPct: 2,
    estimate: true,
  },
  Other: null,
}

const round = (n: number) => Math.round(n)

/** Up-front cost to acquire — what the buyer actually needs beyond the price. */
export function purchaseCosts(
  price: number,
  market: Market,
  opts: { includeAgency?: boolean } = {},
): CostBreakdown {
  const r = RATES[market]
  const lines: CostLine[] = []
  if (r) {
    lines.push({ label: r.govLabel, amount: round((price * r.govPct) / 100), note: r.govNote })
    const devReg = price >= 500_000 ? r.developerRegFrom500k : r.developerRegUnder500k
    if (devReg) lines.push({ label: r.developerRegLabel, amount: devReg, note: 'off-plan' })
    if (r.fixedAdmin) lines.push({ label: r.fixedAdminLabel, amount: r.fixedAdmin })
    if (opts.includeAgency && r.agencyPct) {
      const agency = (price * r.agencyPct) / 100
      lines.push({
        label: `Agency commission (${r.agencyPct}%)`,
        amount: round(agency * (1 + r.servicesVatPct / 100)),
        note: 'incl. VAT',
      })
    }
  }
  const total = lines.reduce((s, l) => s + l.amount, 0)
  return { lines, total, pctOfBase: price ? (total / price) * 100 : 0 }
}

/** Seller-side costs when assigning/reselling off-plan before handover. */
export function resaleCosts(salePrice: number, market: Market): CostBreakdown {
  const r = RATES[market]
  const lines: CostLine[] = []
  if (r) {
    const agency = (salePrice * r.agencyPct) / 100
    lines.push({
      label: `Agency commission (${r.agencyPct}%)`,
      amount: round(agency * (1 + r.servicesVatPct / 100)),
      note: 'incl. VAT',
    })
    lines.push({ label: 'Developer NOC fee', amount: 1050, note: 'typical; AED 500–5,000' })
    if (r.hasResaleTrustee) {
      const trustee = salePrice >= 500_000 ? r.trusteeFrom500k : r.trusteeUnder500k
      lines.push({
        label: 'Trustee transfer fee',
        amount: round(trustee * (1 + r.servicesVatPct / 100)),
        note: 'incl. VAT',
      })
    }
    if (r.resaleTransferAdmin) lines.push({ label: r.resaleTransferLabel, amount: r.resaleTransferAdmin })
  }
  const total = lines.reduce((s, l) => s + l.amount, 0)
  return { lines, total, pctOfBase: salePrice ? (total / salePrice) * 100 : 0 }
}

/** Default developer resale threshold (% paid before assignment allowed). */
export function defaultResaleThreshold(developer?: string): number {
  const d = (developer || '').toLowerCase()
  if (d.includes('damac')) return 35
  if (d.includes('emaar') || d.includes('sobha') || d.includes('nakheel')) return 40
  return 40
}

export function marketHasFees(market: Market): boolean {
  return RATES[market] !== null
}

/** Whether a market's rates are approximate (vary by buyer type / promotions). */
export function marketIsEstimate(market: Market): boolean {
  return RATES[market]?.estimate ?? false
}

/** Convenience for property detail. */
export function propertyPurchaseCosts(p: Property, includeAgency = false): CostBreakdown {
  return purchaseCosts(p.purchasePrice, p.market, { includeAgency })
}
