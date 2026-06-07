import type { ButtonHTMLAttributes, ReactNode } from 'react'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

/* ----------------------------------------------------------------- Button */

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'gold'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-ink hover:bg-primary-strong shadow-sm border border-transparent',
  gold: 'bg-gold text-white hover:brightness-95 shadow-sm border border-transparent',
  outline:
    'bg-surface text-ink border border-line-strong hover:border-ink-faint hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-surface-2 border border-transparent',
  danger: 'bg-transparent text-over border border-transparent hover:bg-over-tint',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-[15px] gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center font-medium cursor-pointer select-none',
        'transition-[background,color,border,transform,filter] duration-150 ease-[var(--ease-out)] active:scale-[0.97]',
        'disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------- Card */

export function Card({
  children,
  className,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: React.ElementType
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cx(
        'bg-surface border border-line rounded-[var(--radius-card)] shadow-[var(--shadow-sm)]',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* ----------------------------------------------------------- StatusBadge */

export type Status = 'paid' | 'due' | 'overdue' | 'upcoming'

const STATUS: Record<Status, { label: string; cls: string; dot: string }> = {
  paid: { label: 'Paid', cls: 'bg-paid-tint text-paid', dot: 'bg-paid' },
  due: { label: 'Due soon', cls: 'bg-due-tint text-due', dot: 'bg-due' },
  overdue: { label: 'Overdue', cls: 'bg-over-tint text-over', dot: 'bg-over' },
  upcoming: { label: 'Upcoming', cls: 'bg-surface-2 text-ink-soft', dot: 'bg-ink-faint' },
}

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const s = STATUS[status]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        s.cls,
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', s.dot)} />
      {label ?? s.label}
    </span>
  )
}

/* ----------------------------------------------------------- ProgressBar */

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('h-2 rounded-full bg-surface-2 overflow-hidden', className)}>
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* -------------------------------------------------------------- Segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex rounded-xl bg-surface-2 p-1 border border-line">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'h-9 px-3.5 text-sm font-medium rounded-lg transition-colors cursor-pointer',
            value === o.value ? 'bg-surface text-ink shadow-[var(--shadow-sm)]' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Field */

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-faint">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'h-11 w-full rounded-xl bg-surface border border-line-strong px-3.5 text-[15px] text-ink ' +
  'placeholder:text-ink-faint focus:border-primary outline-none transition-colors tnum'
