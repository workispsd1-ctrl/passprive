'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Share, UtensilsCrossed } from 'lucide-react'
import type { OrderItem } from '@/lib/orderCollect'
import { cn } from '@/lib/utils'

export const mur = (n: number) => `MUR ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`

/** The product page of one menu item. */
export const productHref = (slug: string, item: Pick<OrderItem, 'id'>) => `/dining/${slug}/order/${encodeURIComponent(item.id)}`

/**
 * Figma "Add or quantity": ADD — 76×36 pill, #2247FF outline, 14/18 ExtraBold —
 * turning into the solid blue − qty + stepper once added. `size='lg'` is the
 * similar-products card's (106×50, 19.6/26).
 */
export function QtyControl({ qty, name, onAdd, onRemove, size = 'md' }: { qty: number; name: string; onAdd: () => void; onRemove: () => void; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-50 w-106 text-[calc(19.6*var(--u))] leading-[calc(26*var(--u))] max-lg:h-40 max-lg:w-88 max-lg:text-[16px]' : 'h-36 w-76 text-[calc(14*var(--u))] leading-[calc(18*var(--u))] max-lg:h-32 max-lg:w-68 max-lg:text-[13px]'
  if (qty === 0) {
    return (
      <button
        type='button'
        onClick={onAdd}
        aria-label={`Add ${name}`}
        className={cn(box, 'flex shrink-0 items-center justify-center rounded-full border border-[#2247FF] bg-white font-extrabold text-[#2247FF] transition-colors hover:bg-[#2247FF]/5')}
      >
        ADD
      </button>
    )
  }
  return (
    <span className={cn(box, 'flex shrink-0 items-center justify-between overflow-hidden rounded-full bg-[#2247FF] font-extrabold text-white')}>
      <button type='button' onClick={onRemove} aria-label={`Remove one ${name}`} className='flex h-full flex-1 items-center justify-center hover:bg-black/10'>−</button>
      <span aria-live='polite' className='min-w-[1ch] text-center'>{qty}</span>
      <button type='button' onClick={onAdd} aria-label={`Add another ${name}`} className='flex h-full flex-1 items-center justify-center hover:bg-black/10'>+</button>
    </span>
  )
}

export function VegMark({ veg }: { veg: boolean }) {
  return (
    <span
      role='img'
      aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={cn('flex size-16 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-white max-lg:size-14', veg ? 'border-[#217C00]' : 'border-[#D32F2F]')}
    >
      <span className={cn('size-6 rounded-full max-lg:size-5', veg ? 'bg-[#217C00]' : 'bg-[#D32F2F]')} />
    </span>
  )
}

/** A menu photo on the Figma #E6E6E6 tile, or a soft placeholder when the item has none. */
export function ItemImage({ src, sizes, className }: { src: string | null; sizes: string; className?: string }) {
  return (
    <span className={cn('relative block overflow-hidden bg-[#E6E6E6]', className)}>
      {src ? (
        <Image src={src} alt='' fill sizes={sizes} className='object-cover' />
      ) : (
        <span className='absolute inset-0 flex items-center justify-center text-[#B2B2B2]'>
          <UtensilsCrossed className='size-1/3' strokeWidth={1.4} />
        </span>
      )}
    </span>
  )
}

/** Share a page — the system sheet where there is one, else the link is copied. */
export async function shareLink(title: string, path: string) {
  const url = new URL(path, window.location.origin).toString()
  try {
    if (navigator.share) { await navigator.share({ title, url }); return 'shared' as const }
    await navigator.clipboard.writeText(url)
    return 'copied' as const
  } catch {
    return 'cancelled' as const
  }
}

export function ShareButton({ title, path, className, iconClassName }: { title: string; path: string; className?: string; iconClassName?: string }) {
  return (
    <button
      type='button'
      onClick={() => { void shareLink(title, path) }}
      aria-label={`Share ${title}`}
      className={cn('flex items-center justify-center rounded-full text-[#B2B2B2] transition-colors hover:text-[#595B61]', className)}
    >
      <Share className={iconClassName} strokeWidth={2} />
    </button>
  )
}

/**
 * Figma "Product grid" card: 376×320, #E8E8EA border, radius 16; the 160 photo
 * tile (radius 24) centred 16 from the top, share top-right, name (16/24 Bold)
 * at 194, price (16/24) at 224, and the veg/bestseller marks beside ADD on
 * the bottom row. (The Figma rating chip and "50 ML" size need data the menu
 * doesn't have.)
 */
export function ProductCard({
  item,
  href,
  qty,
  onAdd,
  onRemove,
  browseOnly,
}: {
  item: OrderItem
  href: string
  qty: number
  onAdd: () => void
  onRemove: () => void
  browseOnly: boolean
}) {
  return (
    <li className='relative flex h-320 flex-col rounded-[calc(16*var(--u))] border border-[#E8E8EA] bg-white px-20 pt-16 pb-20 shadow-[0_calc(4*var(--u))_calc(12*var(--u))_rgba(0,0,0,0.02)] max-lg:h-auto max-lg:rounded-[14px] max-lg:px-12 max-lg:pt-12 max-lg:pb-12'>
      <ShareButton title={item.name} path={href} className='absolute top-16 right-16 size-24 max-lg:top-10 max-lg:right-10 max-lg:size-22' iconClassName='size-full' />
      <Link href={href} className='group flex flex-col' aria-label={item.name}>
        <ItemImage
          src={item.image}
          sizes='(min-width: 1024px) 9vw, 40vw'
          className='mx-auto size-160 rounded-[calc(24*var(--u))] transition-transform duration-300 group-hover:scale-[1.03] max-lg:size-112 max-lg:rounded-[18px]'
        />
        <span className='mt-18 truncate text-[calc(16*var(--u))] leading-[calc(24*var(--u))] font-bold text-[#2C2D32] max-lg:mt-10 max-lg:text-[14px] max-lg:leading-20'>{item.name}</span>
        <span className='mt-6 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#2C2D32] max-lg:mt-2 max-lg:text-[14px] max-lg:leading-20'>{mur(item.price)}</span>
      </Link>
      <div className='mt-auto flex items-center justify-between gap-8 max-lg:mt-10'>
        <span className='flex min-w-0 items-center gap-6'>
          <VegMark veg={item.isVeg} />
          {item.isBestseller && (
            <span className='truncate rounded-full bg-[#FFF1EB] px-8 py-2 text-[calc(11*var(--u))] font-semibold text-[#FF4800] max-lg:text-[10px]'>Bestseller</span>
          )}
        </span>
        {!browseOnly && <QtyControl qty={qty} name={item.name} onAdd={onAdd} onRemove={onRemove} />}
      </div>
    </li>
  )
}
