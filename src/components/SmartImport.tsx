import { useRef, useState } from 'react'
import type { Payment, Property } from '../lib/types'
import { extractTextFromPDF, parseSchedule } from '../lib/pdfImport'
import { money, formatDate } from '../lib/format'
import { Modal } from './Modal'
import { Button, cx } from '../ui/primitives'
import { Alert, Sparkle, Trash, X } from '../ui/icons'

type Phase = 'idle' | 'parsing' | 'review' | 'error'

export function SmartImport({
  open,
  onClose,
  property,
  onImport,
}: {
  open: boolean
  onClose: () => void
  property: Property
  onImport: (payments: Payment[]) => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [note, setNote] = useState('')
  const [rows, setRows] = useState<Payment[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setPhase('idle')
    setNote('')
    setRows([])
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhase('parsing')
    try {
      const text = await extractTextFromPDF(file)
      const result = parseSchedule(text, {
        price: property.purchasePrice,
        bookingDate: property.bookingDate,
        handoverDate: property.handoverDate,
      })
      setRows(result.payments)
      setNote(result.note)
      setPhase(result.payments.length ? 'review' : 'error')
    } catch {
      setNote('Could not read that PDF. It may be scanned (image-only) or protected.')
      setPhase('error')
    }
  }

  const totalPct = rows.reduce((s, r) => s + (r.percentage || 0), 0)

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Import payment plan"
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl bg-primary-tint px-4 py-3 text-sm text-primary">
          <Sparkle size={18} className="mt-0.5 shrink-0" />
          <span>
            Drop a developer payment-plan PDF — it’s read <strong>entirely on your device</strong> and
            turned into a schedule you can review before importing. Nothing is uploaded.
          </span>
        </div>

        {phase === 'idle' && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line-strong px-6 py-12 text-center hover:border-primary cursor-pointer transition-colors"
          >
            <span className="font-medium text-ink">Choose a PDF</span>
            <span className="text-sm text-ink-faint">payment plan / SPA schedule</span>
          </button>
        )}

        {phase === 'parsing' && (
          <div className="px-6 py-12 text-center text-ink-soft">Reading PDF on device…</div>
        )}

        {phase === 'error' && (
          <div className="flex items-center gap-2.5 rounded-xl border border-due/30 bg-due-tint px-4 py-3 text-sm text-due">
            <Alert size={18} /> {note}
          </div>
        )}

        {phase === 'review' && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">{note}</span>
              <span
                className={cx(
                  'tnum font-medium',
                  Math.round(totalPct) === 100 ? 'text-paid' : 'text-due',
                )}
              >
                {Math.round(totalPct)}%
              </span>
            </div>
            <ul className="flex max-h-72 flex-col overflow-y-auto rounded-xl border border-line">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{r.label}</div>
                    <div className="text-xs text-ink-faint tnum">
                      {formatDate(r.dueDate)} · {r.percentage}%
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink tnum">{money(r.amount, property.currency)}</span>
                    <button
                      type="button"
                      onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                      aria-label={`Remove ${r.label}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-surface-2 hover:text-over cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-faint">
              This <strong>replaces</strong> the current schedule. You can fine-tune any row afterwards.
            </p>
          </>
        )}

        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onFile} />

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          {phase === 'review' ? (
            <Button
              className="flex-1"
              disabled={!rows.length}
              onClick={() => {
                onImport(rows)
                reset()
                onClose()
              }}
            >
              Import {rows.length} payments
            </Button>
          ) : phase === 'error' ? (
            <Button className="flex-1" onClick={reset}>
              Try another
            </Button>
          ) : null}
        </div>
        {phase === 'review' && (
          <button
            type="button"
            onClick={() => setRows([])}
            className="-mt-1 text-center text-xs text-ink-faint hover:text-ink"
          >
            <Trash size={12} className="mr-1 inline" /> Clear all
          </button>
        )}
      </div>
    </Modal>
  )
}
