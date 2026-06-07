import type { Market, UnitType } from './types'

/**
 * Bundled, on-device reference data — typical GROSS rental yields by community.
 * Indicative ranges compiled from 2025 market reports (Bayut, Property Finder,
 * Global Property Guide, brokerage area guides). Yields move slowly, so this ships
 * with the app and is refreshed in a normal release — no backend, no live feed.
 *
 * These are starting points, NOT guarantees or forecasts. Always shown with a range
 * and a "verify" note. Capital appreciation is deliberately NOT benchmarked here —
 * it's a forward forecast, not a stable figure, so it stays a user assumption.
 */

export interface YieldBenchmark {
  area: string
  /** gross % */
  min: number
  typ: number
  max: number
}

const DATA: Record<Market, YieldBenchmark[]> = {
  Dubai: [
    { area: 'International City', min: 8, typ: 9, max: 10 },
    { area: 'Dubai Investment Park', min: 8, typ: 9, max: 10 },
    { area: 'Al Furjan', min: 7.5, typ: 8, max: 8.5 },
    { area: 'Arjan', min: 7.4, typ: 7.8, max: 8.2 },
    { area: 'Jumeirah Village Circle (JVC)', min: 7, typ: 7.8, max: 9 },
    { area: 'Jumeirah Lake Towers (JLT)', min: 6.5, typ: 7, max: 7.5 },
    { area: 'Dubai South', min: 7, typ: 7.5, max: 8 },
    { area: 'Business Bay', min: 5.5, typ: 6.3, max: 6.7 },
    { area: 'Mohammed Bin Rashid City', min: 6, typ: 6.5, max: 7 },
    { area: 'Downtown Dubai', min: 5.5, typ: 6, max: 6.5 },
    { area: 'Dubai Marina', min: 5.5, typ: 6, max: 6.5 },
    { area: 'Dubai Creek Harbour', min: 5.5, typ: 6, max: 6.5 },
    { area: 'Dubai Hills Estate', min: 5, typ: 5.5, max: 6 },
    { area: 'Palm Jumeirah', min: 4.5, typ: 5, max: 5.5 },
  ],
  'Abu Dhabi': [
    { area: 'Al Reef', min: 8.5, typ: 9.5, max: 10 },
    { area: 'Al Reem Island', min: 7, typ: 7.6, max: 7.8 },
    { area: 'Yas Island', min: 6.5, typ: 7.1, max: 7.5 },
    { area: 'Masdar City', min: 6.5, typ: 7, max: 7.5 },
    { area: 'Al Raha', min: 5.5, typ: 6, max: 6.5 },
    { area: 'Saadiyat Island', min: 5, typ: 5.5, max: 6 },
  ],
  Sharjah: [
    { area: 'Al Mamsha', min: 6, typ: 7, max: 8 },
    { area: 'Masaar', min: 6, typ: 7, max: 8 },
    { area: 'Aljada', min: 5.8, typ: 6.2, max: 6.7 },
    { area: 'Muwaileh', min: 5, typ: 6, max: 7 },
    { area: 'Maryam Island', min: 5, typ: 5.8, max: 6.5 },
    { area: 'Al Majaz / Al Khan', min: 5, typ: 5.8, max: 6.5 },
    { area: 'Tilal City', min: 5, typ: 5.6, max: 6 },
  ],
  'Ras Al Khaimah': [
    { area: 'Mina Al Arab', min: 6, typ: 6.5, max: 7 },
    { area: 'Al Marjan Island', min: 5.5, typ: 6, max: 6.5 },
    { area: 'Al Hamra Village', min: 5.5, typ: 6, max: 6.5 },
  ],
  Other: [],
}

/** Fallback when an area isn't in the dataset — emirate-wide average gross yield. */
export const MARKET_AVG_YIELD: Record<Market, number | null> = {
  Dubai: 6.8,
  'Abu Dhabi': 6.5,
  Sharjah: 6.5,
  'Ras Al Khaimah': 5.4,
  Other: null,
}

/**
 * Unit-type yield multipliers, applied to the area's (≈2-bed apartment) baseline.
 * Smaller units yield more, villas/large units less — a large, consistent,
 * well-documented pattern (e.g. Marina studios ~6.5% vs 4-beds ~3.9%). Indicative.
 */
export const UNIT_TYPES: UnitType[] = ['Studio', '1 Bed', '2 Bed', '3 Bed', '4+ Bed', 'Townhouse', 'Villa']

const TYPE_FACTOR: Record<UnitType, number> = {
  Studio: 1.15,
  '1 Bed': 1.05,
  '2 Bed': 1.0,
  '3 Bed': 0.92,
  '4+ Bed': 0.82,
  Townhouse: 0.9,
  Villa: 0.85,
}

export function typeFactor(t?: UnitType): number {
  return t ? TYPE_FACTOR[t] : 1
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function areasFor(market: Market): string[] {
  return DATA[market].map((b) => b.area)
}

export function benchmarkFor(market: Market, area?: string, unitType?: UnitType): YieldBenchmark | null {
  if (!area) return null
  const a = area.trim().toLowerCase()
  if (!a) return null
  const base = DATA[market].find((b) => b.area.toLowerCase() === a) ?? null
  if (!base) return null
  const f = typeFactor(unitType)
  if (f === 1) return base
  return { area: base.area, min: round1(base.min * f), typ: round1(base.typ * f), max: round1(base.max * f) }
}

/** Emirate-average gross yield, type-adjusted — used when no area benchmark matches. */
export function averageYieldFor(market: Market, unitType?: UnitType): number | null {
  const avg = MARKET_AVG_YIELD[market]
  return avg == null ? null : round1(avg * typeFactor(unitType))
}

export function hasBenchmarks(market: Market): boolean {
  return DATA[market].length > 0
}
