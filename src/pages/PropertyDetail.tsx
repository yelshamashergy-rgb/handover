import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { propertyStats } from '../lib/payments'
import { purchaseCosts, marketHasFees, marketIsEstimate } from '../lib/costs'
import { money, pct, formatDate, relativeDays } from '../lib/format'
import { exportPaymentsCSV } from '../lib/export'
import type { Payment } from '../lib/types'
import { Button, Card, ProgressBar, cx } from '../ui/primitives'
import { Alert, ChevronLeft, Download, Printer, Sparkle, Trash, Wallet } from '../ui/icons'
import { CostList } from '../components/CostList'

// pdf.js is heavy — load the importer (and pdf.js) only when actually used.
const SmartImport = lazy(() =>
  import('../components/SmartImport').then((m) => ({ default: m.SmartImport })),
)
import { EquityChart } from '../components/EquityChart'
import { RoiProjector } from '../components/RoiProjector'
import { ResaleCalculator } from '../components/ResaleCalculator'
import { DocumentVault } from '../components/DocumentVault'
import { Timeline } from '../components/Timeline'
import { Modal } from '../components/Modal'
import { PropertyForm } from '../components/PropertyForm'
import { PaymentEditor } from '../components/PaymentEditor'

export function PropertyDetail() {
  const { id = '' } = useParams()
  const {
    getProperty,
    updateProperty,
    deleteProperty,
    togglePaid,
    addPayment,
    updatePayment,
    deletePayment,
    addDocument,
    updateDocument,
    deleteDocument,
    setReconciliation,
  } = useStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [paymentModal, setPaymentModal] = useState<{ mode: 'add' | 'edit'; payment?: Payment } | null>(null)
  const [importing, setImporting] = useState(false)

  const property = getProperty(id)

  if (!property) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="font-serif text-2xl text-ink">Property not found</p>
        <Link to="/" className="text-primary hover:underline">
          Back to portfolio
        </Link>
      </div>
    )
  }

  const s = propertyStats(property)

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 text-sm text-ink-soft hover:text-ink"
      >
        <ChevronLeft size={16} /> Portfolio
      </Link>

      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">{property.name}</h1>
          <p className="mt-1 text-ink-soft tnum">
            {property.developer && <span>{property.developer} · </span>}
            {property.area && <span>{property.area} · </span>}
            Handover {formatDate(property.handoverDate)}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)} aria-label="Delete property">
            <Trash size={18} />
          </Button>
        </div>
      </div>

      {s.overdue.length > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-over/30 bg-over-tint px-4 py-3 text-sm text-over">
          <Alert size={18} />
          {s.overdue.length} payment{s.overdue.length > 1 ? 's' : ''} overdue — total{' '}
          <span className="font-medium tnum">
            {money(
              s.overdue.reduce((a, b) => a + b.amount, 0),
              property.currency,
            )}
          </span>
        </div>
      )}

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Purchase price" value={money(property.purchasePrice, property.currency)} />
        <Stat
          label="Equity paid"
          value={pct(s.equityPct)}
          sub={money(s.paidTowardPrice, property.currency)}
          tone="primary"
        />
        <Stat label="Remaining" value={money(s.remainingToPrice, property.currency)} />
        <Stat
          label="Next payment"
          value={s.next ? money(s.next.amount, property.currency) : '—'}
          sub={s.next ? relativeDays(s.next.dueDate) : 'Fully paid'}
        />
      </div>

      {/* cost to acquire */}
      {marketHasFees(property.market) &&
        (() => {
          const costs = purchaseCosts(property.purchasePrice, property.market)
          const cash = property.purchasePrice + costs.total
          return (
            <Card className="animate-in p-5 sm:p-6">
              <div className="mb-1 flex items-center gap-2">
                <Wallet size={18} className="text-ink-soft" />
                <h2 className="font-serif text-xl text-ink">Cost to acquire</h2>
              </div>
              <p className="mb-4 text-sm text-ink-soft">
                Government fees &amp; charges on top of the price, in {property.market}.
              </p>
              <CostList
                breakdown={costs}
                currency={property.currency}
                totalLabel="Acquisition fees"
                footnote={
                  marketIsEstimate(property.market)
                    ? `Estimated standard ${property.market} rates — fees vary by buyer type and periodic promotions. Verify with the authority.`
                    : 'Standard Dubai DLD rates — verify current fees before transacting.'
                }
              />
              <div className="mt-3 flex items-center justify-between rounded-xl bg-primary-tint px-4 py-3">
                <span className="text-sm font-medium text-primary">Total cash to acquire</span>
                <span className="font-serif text-xl text-primary tnum">{money(cash, property.currency)}</span>
              </div>
            </Card>
          )
        })()}

      {/* equity chart */}
      <Card className="animate-in p-5 sm:p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">Equity build-up</h2>
          <span className="text-sm text-ink-soft tnum">
            {pct(s.progressPct)} of plan settled
          </span>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          {s.paidCount} of {s.totalCount} payments made.
        </p>
        <ProgressBar value={s.progressPct} className="mb-5" />
        <EquityChart property={property} />
      </Card>

      {/* projector */}
      <Card className="animate-in p-5 sm:p-6">
        <h2 className="mb-1 font-serif text-xl text-ink">Return projector</h2>
        <p className="mb-5 text-sm text-ink-soft">
          Drag to model appreciation and yield. Saved automatically.
        </p>
        <RoiProjector property={property} onChange={(patch) => updateProperty(property.id, patch)} />
      </Card>

      {/* resale / flip */}
      <Card className="animate-in p-5 sm:p-6">
        <h2 className="mb-1 font-serif text-xl text-ink">Resale &amp; flip</h2>
        <p className="mb-5 text-sm text-ink-soft">
          Assignment economics before handover — eligibility, premium, and net return.
        </p>
        <ResaleCalculator
          property={property}
          onThresholdChange={(p) => updateProperty(property.id, { resaleThresholdPct: p })}
        />
      </Card>

      {/* timeline */}
      <Card className="animate-in p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-ink">Payment schedule</h2>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => setImporting(true)}>
              <Sparkle size={16} /> Import PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportPaymentsCSV(property)}>
              <Download size={16} /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={16} /> Print
            </Button>
          </div>
        </div>
        <Timeline
          property={property}
          onToggle={(pid) => togglePaid(property.id, pid)}
          onEditPayment={(p) => setPaymentModal({ mode: 'edit', payment: p })}
          onAddPayment={() => setPaymentModal({ mode: 'add' })}
        />
      </Card>

      {/* documents */}
      <Card className="animate-in p-5 sm:p-6">
        <h2 className="mb-1 font-serif text-xl text-ink">Document vault</h2>
        <p className="mb-5 text-sm text-ink-soft">
          SPA, Oqood, NOC &amp; receipts — stored privately on your device.
        </p>
        <DocumentVault
          property={property}
          onAdd={(d) => addDocument(property.id, d)}
          onUpdate={(id, patch) => updateDocument(property.id, id, patch)}
          onDelete={(id) => deleteDocument(property.id, id)}
          onReconcile={(patch) => setReconciliation(property.id, patch)}
        />
      </Card>

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit property" size="lg">
        <PropertyForm
          mode="edit"
          property={property}
          onCancel={() => setEditing(false)}
          onSubmitEdit={(patch) => {
            updateProperty(property.id, patch)
            setEditing(false)
          }}
        />
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete property?">
        <div className="flex flex-col gap-5">
          <p className="text-ink-soft">
            This permanently removes <span className="font-medium text-ink">{property.name}</span>{' '}
            and its payment history from this device. This can’t be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
            <Button
              className="flex-1 bg-over hover:brightness-95"
              onClick={() => {
                deleteProperty(property.id)
                navigate('/')
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {paymentModal && (
        <PaymentEditor
          open
          mode={paymentModal.mode}
          initial={paymentModal.payment}
          price={property.purchasePrice}
          currency={property.currency}
          onClose={() => setPaymentModal(null)}
          onSave={(data) => {
            if (paymentModal.mode === 'add') addPayment(property.id, data)
            else if (paymentModal.payment) updatePayment(property.id, paymentModal.payment.id, data)
          }}
          onDelete={
            paymentModal.mode === 'edit' && paymentModal.payment
              ? () => deletePayment(property.id, paymentModal.payment!.id)
              : undefined
          }
        />
      )}

      {importing && (
        <Suspense fallback={null}>
          <SmartImport
            open
            onClose={() => setImporting(false)}
            property={property}
            onImport={(payments) => updateProperty(property.id, { payments })}
          />
        </Suspense>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  tone = 'ink',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'ink' | 'primary'
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-ink-soft">{label}</div>
      <div
        className={cx(
          'mt-1 font-serif text-xl tnum',
          tone === 'primary' ? 'text-primary' : 'text-ink',
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-ink-faint tnum">{sub}</div>}
    </Card>
  )
}
