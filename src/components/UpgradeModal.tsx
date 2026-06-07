import { Modal } from './Modal'
import { Button } from '../ui/primitives'
import { Check, Sparkle } from '../ui/icons'
import { useStore } from '../store'

const PERKS = [
  'Track unlimited properties',
  'Full portfolio roll-up across your whole pipeline',
  'Equity curve & ROI projector on every property',
  'Everything stays private, on your device',
]

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { unlockPro } = useStore()

  return (
    <Modal open={open} onClose={onClose} title="Handover Pro">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-tint text-gold">
            <Sparkle size={22} />
          </span>
          <div>
            <div className="font-serif text-lg text-ink">Unlock your full portfolio</div>
            <div className="text-sm text-ink-soft">One property is free. Go Pro for the rest.</div>
          </div>
        </div>

        <ul className="flex flex-col gap-2.5">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5 text-[15px] text-ink">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-paid-tint text-paid">
                <Check size={13} />
              </span>
              {perk}
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-line bg-surface-2 p-4 text-center">
          <div className="font-serif text-3xl text-ink tnum">
            $14.99 <span className="text-base font-sans text-ink-soft">one-time</span>
          </div>
          <div className="mt-0.5 text-xs text-ink-faint">No subscription · lifetime unlock</div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            onClick={() => {
              unlockPro()
              onClose()
            }}
          >
            Unlock Pro
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Maybe later
          </Button>
        </div>
        <p className="text-center text-[11px] text-ink-faint">
          Demo build — “Unlock” flips a local flag. Real builds wire this to App Store in-app purchase.
        </p>
      </div>
    </Modal>
  )
}
