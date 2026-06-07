import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useStore } from '../store'
import { Moon, Sun } from '../ui/icons'

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useStore()
  return (
    <div className="grain relative min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-ink shadow-[var(--shadow-sm)]">
              <Logo />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg text-ink">Handover</span>
              <span className="text-[11px] tracking-wide text-ink-faint">OFF-PLAN TRACKER</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-soft hover:bg-surface-2 hover:text-ink cursor-pointer transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8">{children}</main>
    </div>
  )
}

function Logo() {
  // Key mark — "from booking to keys".
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7.5" r="4.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 11.75V20M12 15.5h2.6M12 18h1.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
