import { useRef, useState } from 'react'
import { useStore } from '../store'
import { Modal } from './Modal'
import { Button, cx } from '../ui/primitives'
import { Check, Download, Moon, Sun } from '../ui/icons'

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, toggleTheme, pro, properties, exportData, importData } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function onExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `handover-backup-${stamp}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setMsg({ ok: true, text: 'Backup downloaded.' })
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const res = importData(text)
    setMsg(res.ok ? { ok: true, text: 'Backup restored.' } : { ok: false, text: res.error || 'Failed.' })
    e.target.value = ''
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-6">
        {/* appearance */}
        <Section title="Appearance">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Theme</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-medium text-ink hover:bg-surface-2 cursor-pointer"
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </div>
        </Section>

        {/* data */}
        <Section title="Your data">
          <p className="text-sm text-ink-soft">
            Everything is stored privately on this device. Back it up so you don’t lose it if you
            change phone or clear your browser.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={onExport}>
              <Download size={16} /> Export backup
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => fileRef.current?.click()}>
              Restore from file
            </Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
          </div>
          {msg && (
            <div
              className={cx(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                msg.ok ? 'bg-paid-tint text-paid' : 'bg-over-tint text-over',
              )}
            >
              {msg.ok && <Check size={15} />}
              {msg.text}
            </div>
          )}
          <p className="text-xs text-ink-faint tnum">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'} stored.
          </p>
        </Section>

        {/* plan */}
        <Section title="Plan">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink">Current plan</span>
            <span
              className={cx(
                'rounded-full px-2.5 py-1 text-xs font-medium',
                pro ? 'bg-gold-tint text-gold' : 'bg-surface-2 text-ink-soft',
              )}
            >
              {pro ? 'Handover Pro' : 'Free'}
            </span>
          </div>
        </Section>
      </div>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{title}</h3>
      {children}
    </section>
  )
}
