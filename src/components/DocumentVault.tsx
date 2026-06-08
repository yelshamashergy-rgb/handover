import { useState } from 'react'
import type { Property, PropertyDocument, Reconciliation } from '../lib/types'
import { daysBetween, formatDate, relativeDays } from '../lib/format'
import { getFileURL } from '../lib/filestore'
import { cx } from '../ui/primitives'
import { Check, Download, Pencil, Plus, Receipt } from '../ui/icons'
import { DocumentEditor } from './DocumentEditor'

const CHECKS: { key: keyof Reconciliation; label: string }[] = [
  { key: 'nameMatches', label: 'Buyer name matches SPA' },
  { key: 'unitMatches', label: 'Unit number matches' },
  { key: 'priceMatches', label: 'Price matches SPA' },
  { key: 'oqoodRegistered', label: 'Oqood registered with DLD' },
]

export function DocumentVault({
  property,
  onAdd,
  onUpdate,
  onDelete,
  onReconcile,
}: {
  property: Property
  onAdd: (doc: Omit<PropertyDocument, 'id' | 'addedAt'>) => void
  onUpdate: (docId: string, patch: Partial<PropertyDocument>) => void
  onDelete: (docId: string) => void
  onReconcile: (patch: Partial<Reconciliation>) => void
}) {
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; doc?: PropertyDocument } | null>(null)
  const docs = property.documents || []
  const rec = property.reconciliation || {}
  const done = CHECKS.filter((c) => rec[c.key]).length

  async function viewFile(key: string) {
    const url = await getFileURL(key)
    if (!url) return
    window.open(url, '_blank')
    // free the blob URL once the new tab has had time to load it
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* reconciliation */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-sm font-medium text-ink">Oqood ↔ SPA reconciliation</h3>
          <span className="text-xs text-ink-faint tnum">{done}/{CHECKS.length}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHECKS.map((c) => {
            const on = !!rec[c.key]
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onReconcile({ [c.key]: !on })}
                className={cx(
                  'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer',
                  on ? 'border-paid bg-paid-tint text-paid' : 'border-line text-ink-soft hover:border-line-strong',
                )}
              >
                <span
                  className={cx(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-md border',
                    on ? 'border-paid bg-paid text-white' : 'border-line-strong',
                  )}
                >
                  {on && <Check size={13} />}
                </span>
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* documents */}
      <div>
        <h3 className="mb-2.5 text-sm font-medium text-ink">Documents</h3>
        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-soft">
            No documents yet. Store your SPA, Oqood, NOC and escrow receipts here.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {docs.map((d) => {
              const expDays = d.expiryDate ? daysBetween(new Date(), new Date(d.expiryDate + 'T00:00:00')) : null
              const expiring = expDays !== null && expDays <= 14
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-soft">
                      <Receipt size={17} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-ink">{d.label}</span>
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-soft">
                          {d.type}
                        </span>
                      </div>
                      <div className="text-xs text-ink-faint tnum">
                        {d.reference && <span>{d.reference} · </span>}
                        {d.issueDate && <span>issued {formatDate(d.issueDate)}</span>}
                        {d.expiryDate && (
                          <span className={cx(expiring ? (expDays! < 0 ? 'text-over' : 'text-due') : 'text-ink-faint')}>
                            {d.issueDate ? ' · ' : ''}expires {relativeDays(d.expiryDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {d.fileKey && (
                      <button
                        type="button"
                        onClick={() => viewFile(d.fileKey!)}
                        aria-label={`Open ${d.label}`}
                        className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-surface-2 hover:text-ink cursor-pointer"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setModal({ mode: 'edit', doc: d })}
                      aria-label={`Edit ${d.label}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-surface-2 hover:text-ink cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setModal({ mode: 'add' })}
          className="mt-2 inline-flex items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-primary hover:text-primary cursor-pointer transition-colors"
        >
          <Plus size={16} /> Add document
        </button>
      </div>

      {modal && (
        <DocumentEditor
          open
          mode={modal.mode}
          initial={modal.doc}
          onClose={() => setModal(null)}
          onSave={(data) => {
            if (modal.mode === 'add') onAdd(data)
            else if (modal.doc) onUpdate(modal.doc.id, data)
          }}
          onDelete={modal.mode === 'edit' && modal.doc ? () => onDelete(modal.doc!.id) : undefined}
        />
      )}
    </div>
  )
}
