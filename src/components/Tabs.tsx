import { cx } from '../ui/primitives'

export interface TabDef {
  id: string
  label: string
}

/** Sticky underline tab bar; scrolls horizontally on small screens. */
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
      className="sticky top-16 z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:mx-0 sm:px-0 print:hidden"
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
              'relative whitespace-nowrap px-3.5 py-3 text-sm font-medium transition-colors cursor-pointer',
              on ? 'text-primary' : 'text-ink-soft hover:text-ink',
            )}
          >
            {t.label}
            <span
              className={cx(
                'absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary transition-opacity',
                on ? 'opacity-100' : 'opacity-0',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
