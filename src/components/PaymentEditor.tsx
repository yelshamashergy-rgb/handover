import { useState } from 'react'
import type { Currency, Payment, PaymentType } from '../lib/types'
import { todayISO } from '../lib/format'
import { Modal } from './Modal'
import { Button, Field, cx, inputCls } from '../ui/primitives'
import { Trash } from '../ui/icons'

const TYPES: { value: PaymentType; label: string }[] = [
  { value: 'downpayment', label: 'Down payment' },
  { value: 'installment', label: 'Installment' },
  { value: 'handover', label: 'Handover' },
  { value: 'posthandover', label: 'Post-handover' },
  { value: 'fee', label: 'Fee' },
  { value: 'custom', label: 'Custom' },
]

export function PaymentEditor({
  open,
  onClose,
  mode,
  initial,
  price,
  currency,
  onSave,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  initial?: Payment
  price: number
  currency: Currency
  onSave: (payment: Omit<Payment, 'id'>) => void
  onDelete?: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [type, setType] = useState<PaymentType>(initial?.type ?? 'installment')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? todayISO())
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [paid, setPaid] = useState(initial?.paid ?? false)

  const amt = amount.trim() === '' ? 0 : Number(amount)
  const valid = label.trim() !== '' && amt > 0 && !!dueDate

  function save() {
    if (!valid) return
    onSave({
      label: label.trim(),
      type,
      dueDate,
      amount: amt,
      percentage: price ? Math.round((amt / price) * 1000) / 10 : undefined,
      paid,
      paidDate: paid ? (initial?.paidDate ?? todayISO()) : undefined,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'add' ? 'Add payment' : 'Edit payment'}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Label">
          <input
            className={inputCls}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Installment 12"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select
              className={cx(inputCls, 'cursor-pointer')}
              value={type}
              onChange={(e) => setType(e.target.value as PaymentType)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className={cx(inputCls, 'cursor-pointer')}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>
        <Field
          label={`Amount (${currency})`}
          hint={price && amt > 0 ? `${Math.round((amt / price) * 1000) / 10}% of purchase price` : undefined}
        >
          <input
            className={inputCls}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="18,500"
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="h-4 w-4 accent-[var(--c-primary)]"
          />
          <span className="text-sm text-ink">Already paid</span>
        </label>

        <div className="mt-1 flex items-center gap-3">
          {mode === 'edit' && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                onDelete()
                onClose()
              }}
              aria-label="Delete payment"
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
