import type { Currency } from './types'

const SYMBOL: Record<Currency, string> = {
  AED: 'AED',
  USD: '$',
  GBP: '£',
  EUR: '€',
  SAR: 'SAR',
}

/** Full currency, e.g. "AED 1,250,000" */
export function money(amount: number, currency: Currency): string {
  const n = Math.round(amount)
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(n)
  const sym = SYMBOL[currency]
  // Word-symbols (AED/SAR) lead with a space; glyphs hug the number.
  return sym.length > 1 ? `${sym} ${formatted}` : `${sym}${formatted}`
}

/** Compact currency, e.g. "AED 1.25M" — for tight spaces */
export function moneyCompact(amount: number, currency: Currency): string {
  const sym = SYMBOL[currency]
  const abs = Math.abs(amount)
  let body: string
  if (abs >= 1_000_000) body = (amount / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  else if (abs >= 1_000) body = (amount / 1_000).toFixed(1).replace(/\.?0+$/, '') + 'K'
  else body = String(Math.round(amount))
  return sym.length > 1 ? `${sym} ${body}` : `${sym}${body}`
}

export function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatMonthYear(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** "in 12 days" / "5 days ago" / "today" */
export function relativeDays(iso: string, from: Date = new Date()): string {
  const days = daysBetween(from, new Date(iso + 'T00:00:00'))
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  if (days > 0) return `in ${days} days`
  return `${Math.abs(days)} days ago`
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime()
  return Math.round(ms / 86_400_000)
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Format a Date as YYYY-MM-DD using its LOCAL calendar date.
 * Never use `toISOString().slice(0,10)` on a local-midnight Date — in positive
 * UTC offsets (UAE = UTC+4) that rolls back to the previous day.
 */
export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function todayISO(): string {
  return toISODate(new Date())
}
