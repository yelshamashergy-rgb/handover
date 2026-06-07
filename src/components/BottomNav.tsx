import { useLocation, useNavigate } from 'react-router-dom'
import { Bars, Calendar, Home, Plus, Settings } from '../ui/icons'
import { cx } from '../ui/primitives'

interface Item {
  to: string
  label: string
  icon: React.ReactNode
  match: (p: string) => boolean
}

const ITEMS: Item[] = [
  { to: '/', label: 'Home', icon: <Home size={22} />, match: (p) => p === '/' || p.startsWith('/property') },
  { to: '/upcoming', label: 'Upcoming', icon: <Calendar size={22} />, match: (p) => p.startsWith('/upcoming') },
  { to: '/compare', label: 'Compare', icon: <Bars size={22} />, match: (p) => p.startsWith('/compare') },
  { to: '/settings', label: 'Settings', icon: <Settings size={22} />, match: (p) => p.startsWith('/settings') },
]

export function BottomNav({ onAdd }: { onAdd: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Render 2 items, the raised Add, then 2 items.
  const left = ITEMS.slice(0, 2)
  const right = ITEMS.slice(2)

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 print:hidden">
      <div
        className="mx-auto max-w-[480px] px-4"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="pointer-events-auto flex h-16 items-stretch justify-between rounded-[20px] border border-line bg-surface/90 px-2 shadow-[var(--shadow-lg)] backdrop-blur-xl">
          {left.map((it) => (
            <NavBtn key={it.to} item={it} active={it.match(pathname)} onClick={() => navigate(it.to)} />
          ))}

          <div className="flex items-center">
            <button
              type="button"
              onClick={onAdd}
              aria-label="Add property"
              className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-ink shadow-[0_10px_24px_-6px_var(--c-primary)] ring-4 ring-bg transition-transform active:scale-95 cursor-pointer"
            >
              <Plus size={26} />
            </button>
          </div>

          {right.map((it) => (
            <NavBtn key={it.to} item={it} active={it.match(pathname)} onClick={() => navigate(it.to)} />
          ))}
        </div>
      </div>
    </nav>
  )
}

function NavBtn({ item, active, onClick }: { item: Item; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl transition-[color,transform] active:scale-90 cursor-pointer',
        active ? 'text-primary' : 'text-ink-faint hover:text-ink-soft',
      )}
    >
      <span className={cx('transition-transform', active && '-translate-y-px')}>{item.icon}</span>
      <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
    </button>
  )
}
