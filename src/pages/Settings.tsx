import { useRef, useState } from 'react'
import { useStore } from '../store'
import { Button, Card, cx } from '../ui/primitives'
import { Check, Download, Moon, Sun } from '../ui/icons'

export function Settings() {
  const { theme, toggleTheme, pro, properties, exportData, importData } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function onExport() {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `handover-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setMsg({ ok: true, text: 'Backup downloaded.' })
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const res = importData(await file.text())
    setMsg(res.ok ? { ok: true, text: 'Backup restored.' } : { ok: false, text: res.error || 'Failed.' })
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl text-ink">Settings</h1>

      <Card className="flex flex-col gap-4 p-5">
        <Title>Appearance</Title>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink">Theme</span>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-3.5 text-sm font-medium text-ink hover:bg-surface-2 cursor-pointer"
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <Title>Your data</Title>
        <p className="text-sm text-ink-soft">
          Everything is stored privately on this device. Back it up so you don’t lose it if you change
          phone or clear your browser.
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={onExport}>
            <Download size={16} /> Export backup
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
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
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <Title>Plan</Title>
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
      </Card>

      <p className="text-center text-xs text-ink-faint">Handover · From booking to keys.</p>
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">{children}</h2>
}
