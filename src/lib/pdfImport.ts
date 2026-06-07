import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { addMonths } from 'date-fns'
import type { Payment, PaymentType } from './types'
import { uid } from './payments'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Extract all text from a PDF, fully in-browser (no upload). */
export async function extractTextFromPDF(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => ('str' in it ? it.str : '')).join(' ') + '\n'
  }
  return text
}

function classify(label: string): PaymentType {
  const l = label.toLowerCase()
  if (/(book|down|reserv|deposit)/.test(l)) return 'downpayment'
  if (/(handover|completion|hand over|on completion)/.test(l)) return 'handover'
  if (/(post.?handover|after handover)/.test(l)) return 'posthandover'
  if (/(dld|fee|oqood|registration)/.test(l)) return 'fee'
  if (/(install|month|quarter|payment)/.test(l)) return 'installment'
  return 'custom'
}

export interface ParseResult {
  payments: Payment[]
  note: string
}

/**
 * Best-effort heuristic parse of a developer payment-plan PDF into a schedule.
 * Imperfect by design — the user reviews/edits the result before importing.
 */
export function parseSchedule(
  text: string,
  opts: { price: number; bookingDate: string; handoverDate: string },
): ParseResult {
  const { price, bookingDate, handoverDate } = opts
  const booking = new Date(bookingDate + 'T00:00:00')
  const handover = new Date(handoverDate + 'T00:00:00')

  // "Label 20%"  or  "20% label"
  const found: { label: string; pct: number; type: PaymentType }[] = []
  const seen = new Set<string>()
  const push = (label: string, pct: number) => {
    const clean = label.replace(/[:\-–•|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40)
    if (!clean || pct <= 0 || pct > 100) return
    const key = `${clean.toLowerCase()}|${pct}`
    if (seen.has(key)) return
    seen.add(key)
    found.push({ label: clean, pct, type: classify(clean) })
  }

  const re1 = /([A-Za-z][A-Za-z /&'()]{2,40}?)\s*[:\-–]?\s*(\d{1,3}(?:\.\d+)?)\s*%/g
  const re2 = /(\d{1,3}(?:\.\d+)?)\s*%\s*(?:on |for |–|-|:)?\s*([A-Za-z][A-Za-z /&'()]{2,40})/g
  let m: RegExpExecArray | null
  while ((m = re1.exec(text))) push(m[1], parseFloat(m[2]))
  if (found.length < 2) while ((m = re2.exec(text))) push(m[2], parseFloat(m[1]))

  // Expand "1% monthly for 40 months" style installments.
  const monthly = text.match(/(\d{1,2}(?:\.\d+)?)\s*%\s*(?:per month|monthly|a month|\/\s*month).{0,30}?(\d{1,3})\s*(?:months|installments|payments)/i)

  const payments: Payment[] = []
  const mk = (label: string, type: PaymentType, pct: number, date: Date) =>
    payments.push({
      id: uid(),
      label,
      type,
      dueDate: iso(date),
      amount: Math.round((price * pct) / 100),
      percentage: Math.round(pct * 10) / 10,
      paid: false,
    })

  const singles = found.filter((f) => f.type !== 'installment')
  const installmentEntries = found.filter((f) => f.type === 'installment')

  const down = singles.find((f) => f.type === 'downpayment')
  if (down) mk(down.label || 'Down payment', 'downpayment', down.pct, booking)

  if (monthly) {
    const pct = parseFloat(monthly[1])
    const count = Math.min(120, parseInt(monthly[2], 10))
    for (let i = 1; i <= count; i++) mk(`Installment ${i}`, 'installment', pct, addMonths(booking, i))
  } else {
    // distribute discrete installments evenly across the build period
    const n = installmentEntries.length
    installmentEntries.forEach((f, i) => {
      const frac = (i + 1) / (n + 1)
      const months = Math.round(frac * monthsBetween(booking, handover))
      mk(f.label || `Installment ${i + 1}`, 'installment', f.pct, addMonths(booking, Math.max(1, months)))
    })
  }

  for (const f of singles) {
    if (f.type === 'downpayment') continue
    if (f.type === 'handover') mk(f.label || 'Handover', 'handover', f.pct, handover)
    else mk(f.label, f.type, f.pct, midpoint(booking, handover))
  }

  payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const totalPct = payments.reduce((s, p) => s + (p.percentage || 0), 0)
  const note = payments.length
    ? `Found ${payments.length} payments totalling ${Math.round(totalPct)}% of price. Review and edit before importing.`
    : 'No payment lines detected. Try a clearer PDF or build the plan manually.'

  return { payments, note }
}

function monthsBetween(a: Date, b: Date): number {
  return Math.max(1, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()))
}
function midpoint(a: Date, b: Date): Date {
  return new Date((a.getTime() + b.getTime()) / 2)
}
