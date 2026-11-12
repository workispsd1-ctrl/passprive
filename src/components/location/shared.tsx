'use client'

import { ChevronLeft, Loader2, MoreVertical, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn, formatDistanceKm } from '@/lib/utils'

/** Figma "Subtract" pin: orange outline, navy dot, white centre. */
export function PinGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 16 18' fill='none' aria-hidden='true' className={className}>
      <path d='M8 17.1s-6.4-5.3-6.4-10A6.4 6.4 0 0 1 8 .8a6.4 6.4 0 0 1 6.4 6.3c0 4.7-6.4 10-6.4 10Z' stroke='#FF4800' strokeWidth='1.6' strokeLinejoin='round' />
      <circle cx='8' cy='7' r='2.8' fill='#273B4A' />
      <circle cx='8' cy='7' r='1.05' fill='#fff' />
    </svg>
  )
}

/** Figma "Location distance": 52 tile #FFF1EB r12, pin + 12/18 semibold distance, gap 4. */
export function PinBadge({ km }: { km?: number | null }) {
  const label = formatDistanceKm(km)
  return (
    <span className='flex size-52 shrink-0 flex-col items-center justify-center gap-4 rounded-[calc(12*var(--u))] bg-[#FFF1EB]'>
      <PinGlyph className='h-[calc(17.14*var(--u))] w-[calc(15.09*var(--u))]' />
      {label && <span className='text-[calc(12*var(--u))] leading-18 font-semibold text-[#FF4800]'>{label}</span>}
    </span>
  )
}

/** Figma "Desktop header": back + 32/40 title, gap 24, 16 below, 1px #E6E0E9 rule. */
export function PageBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className='flex h-72 items-center gap-24 border-b border-[#E6E0E9] pb-16 max-lg:h-auto max-lg:gap-12 max-lg:pb-12'>
      <button
        type='button'
        aria-label='Back'
        onClick={onBack}
        className='flex h-[calc(39.05*var(--u))] w-40 shrink-0 items-center justify-center rounded-[calc(18.51*var(--u))] bg-[rgba(217,217,217,0.1)] text-[#3E3E3E] transition-colors hover:bg-[#F0F0F0] max-lg:size-36'
      >
        <ChevronLeft className='size-28 max-lg:size-24' strokeWidth={1.6} />
      </button>
      <h1 className='truncate text-[calc(32*var(--u))] leading-40 font-bold text-[#1D1B20] max-lg:text-[20px] max-lg:leading-28'>{title}</h1>
    </header>
  )
}

/** Figma "Search locations": 56 tall pill, 0.5px #E6E0E9, 0/40 padding, 25px icon, gap 12. */
export function SearchField({
  value,
  onChange,
  placeholder,
  small,
  autoFocus,
  loading,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** pinpoint panel: 14/20 text */
  small?: boolean
  autoFocus?: boolean
  loading?: boolean
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])
  return (
    <label className={cn('flex h-56 items-center gap-12 rounded-[calc(28*var(--u))] border-[0.5px] border-[#E6E0E9] px-40 focus-within:border-[#FF4800] max-lg:h-48 max-lg:px-16', className)}>
      {loading ? <Loader2 className='size-25 shrink-0 animate-spin text-[#605D64]' /> : <Search className='size-25 shrink-0 text-[#605D64] max-lg:size-20' strokeWidth={2} />}
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'min-w-0 flex-1 bg-transparent font-medium text-[#1D1B20] outline-none placeholder:text-[#605D64]',
          small ? 'text-[calc(14*var(--u))] leading-20' : 'text-[calc(16*var(--u))] leading-24',
          'max-lg:text-[15px]',
        )}
      />
    </label>
  )
}

/** Figma "Use current location" / "Add new address": white pill, 1px #E6E0E9, 16/24 semibold, orange icon, gap 8. */
export function ActionPill({ icon, children, onClick, disabled, className }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-56 items-center justify-center gap-8 rounded-[calc(28*var(--u))] border border-[#E6E0E9] bg-white px-12 text-[calc(16*var(--u))] leading-24 font-semibold whitespace-nowrap text-[#1D1B20] transition-colors hover:bg-[#FFF8F5] disabled:opacity-60 max-lg:h-48 max-lg:text-[14px]',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/** Figma "Confirm & proceed" / "Save address": 56 tall #FF4800 pill, 16/24 bold white. */
export function PrimaryButton({ children, onClick, disabled, className }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-56 w-full items-center justify-center rounded-[calc(28*var(--u))] bg-[#FF4800] px-16 py-12 text-[calc(16*var(--u))] leading-24 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 max-lg:h-52',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** Figma "Heading/H4/Bold" section title: 20/28 bold. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className='text-[calc(20*var(--u))] leading-28 font-bold text-[#1D1B20] max-lg:text-[18px]'>{children}</h2>
}

/** Figma "Address list": white card, 1px #E6E0E9, r20. */
export function ListCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('overflow-hidden rounded-[calc(20*var(--u))] border border-[#E6E0E9] bg-white', className)}>{children}</div>
}

export const Divider = () => <div className='mx-24 h-px bg-[#E6E0E9]' />

export type AddressItem = { key: string; title: string; address: string; km?: number | null; selected?: boolean }

/**
 * One address in a list card — app parity: AddressCard. Figma: 52 badge at
 * 24/20, title 16/24 bold + SELECTED tag, address 14/20 (2 lines), ⋮ at the right.
 */
export function AddressRow({
  item,
  first,
  onSelect,
  onRemove,
}: {
  item: AddressItem
  first: boolean
  onSelect: () => void
  onRemove?: () => void
}) {
  const [menu, setMenu] = useState(false)
  return (
    <div className={cn('relative flex items-start gap-16 px-24 pb-32 transition-colors hover:bg-[#FFFAF7] max-lg:px-16 max-lg:pb-20', first ? 'pt-20' : 'pt-8 max-lg:pt-16')}>
      <button type='button' onClick={onSelect} className='absolute inset-0' aria-label={`Use ${item.title}`} />
      <PinBadge km={item.km} />
      <div className={cn('pointer-events-none relative min-w-0 flex-1', onRemove && 'pr-12')}>
        <div className='flex items-center gap-8'>
          <p className='truncate text-[calc(16*var(--u))] leading-24 font-bold text-[#1D1B20]'>{item.title}</p>
          {item.selected && (
            <span className='shrink-0 rounded-[calc(11*var(--u))] bg-[#F0FAF2] px-7 py-2 text-[calc(12*var(--u))] leading-18 font-bold text-[#337A4D]'>SELECTED</span>
          )}
        </div>
        {item.address && <p className='mt-8 line-clamp-2 text-[calc(14*var(--u))] leading-20 text-[#605D64]'>{item.address}</p>}
      </div>
      {onRemove && (
        <div className='relative -mr-8 shrink-0'>
          <button
            type='button'
            aria-label={`Options for ${item.title}`}
            aria-expanded={menu}
            onClick={() => setMenu(v => !v)}
            className='flex size-32 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#F3F3F3]'
          >
            <MoreVertical className='size-18' strokeWidth={2} />
          </button>
          {menu && (
            <>
              <button type='button' aria-label='Close menu' className='fixed inset-0 z-10 cursor-default' onClick={() => setMenu(false)} />
              <div className='absolute top-36 right-0 z-20 w-180 overflow-hidden rounded-[calc(12*var(--u))] border border-[#E6E0E9] bg-white py-4 shadow-lg max-lg:w-160'>
                <button
                  type='button'
                  onClick={() => { setMenu(false); onRemove() }}
                  className='w-full px-16 py-10 text-left text-[calc(14*var(--u))] leading-20 font-semibold text-[#D92D20] hover:bg-[#FEF3F2] max-lg:text-[14px]'
                >
                  Remove address
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** A titled list card of addresses; renders nothing when empty. */
export function AddressSection({
  title,
  items,
  onSelect,
  onRemove,
  footer,
}: {
  title: string
  items: AddressItem[]
  onSelect: (key: string) => void
  onRemove?: (key: string) => void
  footer?: React.ReactNode
}) {
  if (!items.length) return null
  return (
    <section className='flex min-w-0 flex-col gap-16'>
      <SectionTitle>{title}</SectionTitle>
      <ListCard>
        {items.map((item, i) => (
          <div key={item.key}>
            {i > 0 && <Divider />}
            <AddressRow item={item} first={i === 0} onSelect={() => onSelect(item.key)} onRemove={onRemove ? () => onRemove(item.key) : undefined} />
          </div>
        ))}
        {footer}
      </ListCard>
    </section>
  )
}
