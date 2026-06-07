import type { AppData } from './types'

const DATA_KEY = 'handover.v1'
const PRO_KEY = 'handover.pro'
const THEME_KEY = 'handover.theme'
const ONBOARD_KEY = 'handover.onboarded'

// Legacy keys from the "Milestone" working name — migrated on first read.
const LEGACY = { data: 'milestone.v1', pro: 'milestone.pro', theme: 'milestone.theme' }

const EMPTY: AppData = { version: 1, properties: [] }

function read(key: string, legacyKey: string): string | null {
  const v = localStorage.getItem(key)
  if (v !== null) return v
  const legacy = localStorage.getItem(legacyKey)
  if (legacy !== null) localStorage.setItem(key, legacy) // migrate forward
  return legacy
}

/**
 * Single repository boundary for all persistence. Today it's localStorage;
 * swapping to Capacitor Preferences / SQLite for iOS happens only here.
 */
export const repo = {
  load(): AppData {
    try {
      const raw = read(DATA_KEY, LEGACY.data)
      if (!raw) return structuredClone(EMPTY)
      const parsed = JSON.parse(raw) as AppData
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.properties)) {
        return structuredClone(EMPTY)
      }
      return parsed
    } catch {
      return structuredClone(EMPTY)
    }
  },

  save(data: AppData) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data))
    } catch {
      /* quota / private mode — fail silently, app stays usable in-session */
    }
  },

  isPro(): boolean {
    return read(PRO_KEY, LEGACY.pro) === 'true'
  },
  setPro(v: boolean) {
    localStorage.setItem(PRO_KEY, String(v))
  },

  getTheme(): 'light' | 'dark' {
    const t = read(THEME_KEY, LEGACY.theme)
    if (t === 'light' || t === 'dark') return t
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  },
  setTheme(t: 'light' | 'dark') {
    localStorage.setItem(THEME_KEY, t)
  },

  isOnboarded(): boolean {
    return localStorage.getItem(ONBOARD_KEY) === 'true'
  },
  setOnboarded(v: boolean) {
    localStorage.setItem(ONBOARD_KEY, String(v))
  },
}
