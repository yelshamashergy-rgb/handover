export type Currency = 'AED' | 'USD' | 'GBP' | 'EUR' | 'SAR'

export type Market = 'Dubai' | 'Abu Dhabi' | 'Sharjah' | 'Ras Al Khaimah' | 'Other'

export type UnitType = 'Studio' | '1 Bed' | '2 Bed' | '3 Bed' | '4+ Bed' | 'Townhouse' | 'Villa'

export type DocType = 'SPA' | 'Oqood' | 'NOC' | 'Escrow receipt' | 'Title deed' | 'Passport/ID' | 'Other'

export interface PropertyDocument {
  id: string
  type: DocType
  label: string
  /** issue or reference date */
  issueDate?: string
  /** expiry date — drives reminders (e.g. NOC 30-day validity) */
  expiryDate?: string
  reference?: string
  notes?: string
  /** key into IndexedDB blob store, if a file is attached */
  fileKey?: string
  fileName?: string
  addedAt: string
}

export type SnagStatus = 'pending' | 'ok' | 'issue'

export interface SnagItem {
  id: string
  label: string
  status: SnagStatus
  note?: string
}

/** Oqood-vs-SPA reconciliation checklist state */
export interface Reconciliation {
  nameMatches?: boolean
  unitMatches?: boolean
  priceMatches?: boolean
  oqoodRegistered?: boolean
}

export type PaymentType =
  | 'downpayment'
  | 'installment'
  | 'handover'
  | 'posthandover'
  | 'fee'
  | 'custom'

export type Frequency = 'monthly' | 'quarterly'

export interface Payment {
  id: string
  label: string
  type: PaymentType
  dueDate: string // ISO yyyy-mm-dd
  amount: number
  /** % of purchase price — for display only */
  percentage?: number
  paid: boolean
  paidDate?: string
}

export interface Property {
  id: string
  name: string
  developer: string
  market: Market
  area?: string
  unitType?: UnitType
  currency: Currency
  purchasePrice: number
  /** booking date — anchors the payment schedule */
  bookingDate: string
  handoverDate: string
  sizeSqft?: number
  /** ROI assumptions */
  expectedAppreciationPct: number
  expectedRentalYieldPct: number
  serviceChargePerSqft?: number
  /** % of price that must be paid before the developer allows resale (Emaar ~40, Damac ~30) */
  resaleThresholdPct?: number
  notes?: string
  documents?: PropertyDocument[]
  reconciliation?: Reconciliation
  snagging?: SnagItem[]
  createdAt: string
  payments: Payment[]
}

export interface AppData {
  version: 1
  properties: Property[]
}

/** Inputs for the Payment Plan Architect */
export interface PlanInput {
  purchasePrice: number
  bookingDate: string
  handoverDate: string
  downPaymentPct: number
  installmentPct: number
  installmentCount: number
  frequency: Frequency
  /** Dubai Land Department fee — 4% of price, due at booking */
  includeDldFee: boolean
}
