import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Button, cx } from '../ui/primitives'
import { Building, Lock, Sparkle, TrendingUp, X } from '../ui/icons'

interface Step {
  icon: React.ReactNode
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: <Building size={26} />,
    title: 'Welcome to Handover',
    body: 'Your private companion for off-plan property — every payment, fee, and milestone, all the way to handover.',
  },
  {
    icon: <TrendingUp size={26} />,
    title: 'See the whole picture',
    body: 'Track equity as it builds, your true cost after DLD & Oqood fees, projected returns, and exactly when you can resell.',
  },
  {
    icon: <Lock size={26} />,
    title: 'Private by design',
    body: 'No account, no cloud, no tracking. Everything stays on your device — and you can back it up anytime in Settings.',
  },
]

export function Onboarding({
  onAddProperty,
  onSample,
}: {
  onAddProperty: () => void
  onSample: () => void
}) {
  const { completeOnboarding } = useStore()
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const finish = (action: () => void) => {
    completeOnboarding()
    action()
  }

  const s = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome"
        className="relative z-10 w-full overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[var(--shadow-lg)] animate-in sm:max-w-md sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={() => finish(() => {})}
          aria-label="Skip"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-lg text-ink-faint hover:bg-surface-2 hover:text-ink cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* hero */}
        <div className="flex flex-col items-center gap-5 px-6 pb-2 pt-12 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-tint text-primary">
            {s.icon}
          </span>
          <div>
            <h2 className="font-serif text-2xl text-ink">{s.title}</h2>
            <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        </div>

        {/* dots */}
        <div className="flex justify-center gap-1.5 py-5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cx(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-5 bg-primary' : 'w-1.5 bg-line-strong',
              )}
            />
          ))}
        </div>

        {/* actions */}
        <div className="flex flex-col gap-2 border-t border-line p-5">
          {last ? (
            <>
              <Button size="lg" onClick={() => finish(onAddProperty)}>
                Add my property
              </Button>
              <Button variant="ghost" onClick={() => finish(onSample)}>
                <Sparkle size={16} /> Explore with sample data
              </Button>
            </>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => finish(() => {})}>
                Skip
              </Button>
              <Button className="flex-1" onClick={() => setStep((v) => v + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
