import { cx } from '../ui/primitives'

export interface TabDef {
  id: string
  label: string
}

/** App-style segmented pill scroller. */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Property sections"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 print:hidden"
      style={{ scrollbarWidth: 'none' }}
    >
      {tabs.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cx(
              'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
              on
                ? 'bg-primary text-primary-ink shadow-[var(--shadow-sm)]'
                : 'bg-surface-2 text-ink-soft hover:text-ink',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
