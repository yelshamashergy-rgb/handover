import { useRef, useState } from 'react'
import type { DocType, PropertyDocument } from '../lib/types'
import { putFile, deleteFile } from '../lib/filestore'
import { uid } from '../lib/payments'
import { Modal } from './Modal'
import { Button, Field, cx, inputCls } from '../ui/primitives'
import { Trash } from '../ui/icons'

const TYPES: DocType[] = ['SPA', 'Oqood', 'NOC', 'Escrow receipt', 'Title deed', 'Passport/ID', 'Other']

export function DocumentEditor({
  open,
  onClose,
  mode,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  initial?: PropertyDocument
  onSave: (doc: Omit<PropertyDocument, 'id' | 'addedAt'>) => void
  onDelete?: () => void
}) {
  const [type, setType] = useState<DocType>(initial?.type ?? 'SPA')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [reference, setReference] = useState(initial?.reference ?? '')
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? '')
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [fileKey, setFileKey] = useState(initial?.fileKey)
  const [fileName, setFileName] = useState(initial?.fileName)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const valid = label.trim() !== ''

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const key = fileKey ?? uid()
    await putFile(key, file)
    setFileKey(key)
    setFileName(file.name)
  }

  async function save() {
    if (!valid || saving) return
    setSaving(true)
    onSave({
      type,
      label: label.trim(),
      reference: reference.trim() || undefined,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes.trim() || undefined,
      fileKey,
      fileName,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'add' ? 'Add document' : 'Edit document'}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select
              className={cx(inputCls, 'cursor-pointer')}
              value={type}
              onChange={(e) => {
                const t = e.target.value as DocType
                setType(t)
                if (!label.trim()) setLabel(t)
              }}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reference no.">
            <input className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        </div>
        <Field label="Label">
          <input
            className={inputCls}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. SPA — Unit 1203"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Issue date">
            <input
              type="date"
              className={cx(inputCls, 'cursor-pointer')}
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </Field>
          <Field label="Expiry date" hint="Drives reminders (e.g. NOC).">
            <input
              type="date"
              className={cx(inputCls, 'cursor-pointer')}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Attachment" hint="Stored privately on this device.">
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" className="hidden" onChange={onPickFile} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {fileName ? 'Replace file' : 'Choose file'}
            </Button>
            {fileName && (
              <span className="flex items-center gap-2 text-sm text-ink-soft">
                <span className="max-w-[180px] truncate">{fileName}</span>
                <button
                  type="button"
                  className="text-ink-faint hover:text-over"
                  onClick={() => {
                    if (fileKey) void deleteFile(fileKey)
                    setFileKey(undefined)
                    setFileName(undefined)
                  }}
                  aria-label="Remove file"
                >
                  <Trash size={14} />
                </button>
              </span>
            )}
          </div>
        </Field>

        <Field label="Notes">
          <textarea
            className={cx(inputCls, 'h-20 resize-none py-2.5')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        <div className="mt-1 flex items-center gap-3">
          {mode === 'edit' && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (fileKey) void deleteFile(fileKey)
                onDelete()
                onClose()
              }}
              aria-label="Delete document"
            >
              <Trash size={18} />
            </Button>
          )}
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={!valid}>
            {mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
