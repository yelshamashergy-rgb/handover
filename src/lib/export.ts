import type { Property } from './types'

function csvCell(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Download the property's payment schedule as a CSV file. */
export function exportPaymentsCSV(property: Property) {
  const header = ['Label', 'Type', 'Due date', `Amount (${property.currency})`, '% of price', 'Status', 'Paid date']
  const rows = property.payments
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((p) => [
      p.label,
      p.type,
      p.dueDate,
      p.amount,
      p.percentage ?? '',
      p.paid ? 'Paid' : 'Unpaid',
      p.paidDate ?? '',
    ])

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug(property.name)}-schedule.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'property'
}
