import { useState } from 'react'
import type { Property, SnagItem, SnagStatus } from '../lib/types'
import { snaggingTemplate } from '../lib/snagging'
import { uid } from '../lib/payments'
import { Button, ProgressBar, cx } from '../ui/primitives'
import { Alert, Check, Plus } from '../ui/icons'

export function SnaggingChecklist({
  property,
  onChange,
}: {
  property: Property
  onChange: (items: SnagItem[]) => void
}) {
  const items = property.snagging
  const [custom, setCustom] = useState('')

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line-strong px-6 py-10 text-center">
        <p className="max-w-sm text-sm text-ink-soft">
          Inspect your unit at handover and log every defect. Start from the standard checklist or
          build your own.
        </p>
        <Button onClick={() => onChange(snaggingTemplate())}>Start handover checklist</Button>
      </div>
    )
  }

  const checked = items.filter((i) => i.status !== 'pending').length
  const issues = items.filter((i) => i.status === 'issue').length

  const set = (id: string, patch: Partial<SnagItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const toggle = (id: string, status: SnagStatus) => {
    const cur = items.find((i) => i.id === id)
    set(id, { status: cur?.status === status ? 'pending' : status })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-ink-soft tnum">
            {checked} of {items.length} inspected
          </span>
          {issues > 0 && <span className="font-medium text-over tnum">{issues} issue{issues > 1 ? 's' : ''}</span>}
        </div>
        <ProgressBar value={(checked / items.length) * 100} />
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.id} className="rounded-xl border border-line px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className={cx('text-sm', i.status === 'issue' ? 'text-ink' : 'text-ink')}>{i.label}</span>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => toggle(i.id, 'ok')}
                  aria-label={`Mark ${i.label} OK`}
                  className={cx(
                    'grid h-8 w-8 place-items-center rounded-lg border transition-colors cursor-pointer',
                    i.status === 'ok'
                      ? 'border-paid bg-paid text-white'
                      : 'border-line text-ink-faint hover:border-paid hover:text-paid',
                  )}
                >
                  <Check size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => toggle(i.id, 'issue')}
                  aria-label={`Flag ${i.label}`}
                  className={cx(
                    'grid h-8 w-8 place-items-center rounded-lg border transition-colors cursor-pointer',
                    i.status === 'issue'
                      ? 'border-over bg-over text-white'
                      : 'border-line text-ink-faint hover:border-over hover:text-over',
                  )}
                >
                  <Alert size={15} />
                </button>
              </div>
            </div>
            {i.status === 'issue' && (
              <input
                value={i.note ?? ''}
                onChange={(e) => set(i.id, { note: e.target.value })}
                placeholder="Describe the defect…"
                className="mt-2 h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-over outline-none"
              />
            )}
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const label = custom.trim()
          if (!label) return
          onChange([...items, { id: uid(), label, status: 'pending' }])
          setCustom('')
        }}
        className="flex gap-2"
      >
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add a custom item…"
          className="h-10 flex-1 rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary outline-none"
        />
        <Button type="submit" variant="outline" size="sm" disabled={!custom.trim()}>
          <Plus size={16} /> Add
        </Button>
      </form>
    </div>
  )
}
