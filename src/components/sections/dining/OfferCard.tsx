import { cn } from '@/lib/utils'
import { t } from './designUnit'

/**
 * The Figma "Offers for today" card — 508×208, white, radius 32, soft 20px
 * shadow — shared by the offer cards and the Deals & cashback cards so the
 * two rows on the restaurant page read as one family. Sized in `t` units.
 */
export function OfferCard({
  children,
  className,
  compact = false,
  as: Tag = 'div',
  ...rest
}: {
  children: React.ReactNode
  className?: string
  /** badge-headed cards: 20px top/bottom padding, 12 gap (the frame's cashback card) */
  compact?: boolean
  as?: 'div' | 'button'
} & React.ButtonHTMLAttributes<HTMLElement>) {
  return (
    <Tag
      data-offer-card
      {...rest}
      className={cn('relative flex shrink-0 snap-start flex-col bg-white text-left drop-shadow-[0_0_20px_rgba(0,0,0,0.08)]', className)}
      style={{
        width: t(508),
        height: t(208),
        padding: compact ? `${t(20)} ${t(32)}` : t(32),
        gap: t(compact ? 12 : 24),
        borderRadius: t(32),
        ...rest.style,
      }}
    >
      {children}
    </Tag>
  )
}

/** Card head — icon + 24 Bold uppercase label on the left, `aside` (dots, an action) on the right. */
export function OfferHead({ icon, label, color, aside }: { icon: React.ReactNode; label: string; color: string; aside?: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between' style={{ gap: t(16), minHeight: t(31) }}>
      <span className='flex min-w-0 items-center uppercase' style={{ gap: t(16) }}>
        {icon}
        <span className='truncate font-bold' style={{ fontSize: t(24), color }}>{label}</span>
      </span>
      {aside}
    </div>
  )
}

/** Headline 36 Bold #111 over a 26 #767677 line. */
export function OfferText({ main, sub, className }: { main: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <span className={cn('flex min-w-0 flex-col whitespace-nowrap', className)} style={{ gap: t(8) }}>
      <span className='max-w-full truncate font-bold text-[#111]' style={{ fontSize: t(36) }}>{main}</span>
      {sub && <span className='max-w-full truncate text-[#767677]' style={{ fontSize: t(26) }}>{sub}</span>}
    </span>
  )
}

/** Small pill action in a card head — "Reveal", "Redeem", "Sign in". */
export function OfferAction({ children, onClick, disabled, gradient = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; gradient?: boolean }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap text-white transition-opacity hover:opacity-90 disabled:opacity-60',
        gradient ? 'bg-[linear-gradient(109.78deg,#FF4800,#001FE7)]' : 'bg-[#ff4800]',
      )}
      style={{ height: t(44), padding: `0 ${t(22)}`, gap: t(8), fontSize: t(20) }}
    >
      {children}
    </button>
  )
}
