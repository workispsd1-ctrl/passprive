'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowDownUp, Check, ChevronDown, ChevronRight, Minus, Plus, Search, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import {
  ORDER_CART_KEY,
  cartLines,
  cartTotal,
  changeQty,
  visibleItems,
  type OrderCart,
  type OrderItem,
  type OrderSort,
} from '@/lib/orderCollect'
import { cn } from '@/lib/utils'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'

const SORT_OPTIONS: { key: OrderSort; label: string }[] = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
]

const mur = (n: number) => `MUR ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`

function Stepper({ qty, onAdd, onRemove, name, size = 'md' }: { qty: number; onAdd: () => void; onRemove: () => void; name: string; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-7 min-w-20 [&_button]:w-7' : 'h-10 min-w-24'
  if (qty === 0) {
    return (
      <button
        type='button'
        onClick={onAdd}
        aria-label={`Add ${name}`}
        className={cn(h, 'rounded-full border-[1.5px] border-brand bg-white px-5 text-sm font-bold text-brand transition-colors hover:bg-brand-tint')}
      >
        ADD
      </button>
    )
  }
  return (
    <span className={cn(h, 'flex items-center justify-between overflow-hidden rounded-full bg-brand text-white')}>
      <button type='button' onClick={onRemove} aria-label={`Remove ${name}`} className='flex h-full w-9 items-center justify-center hover:bg-brand-dark'><Minus className='size-3.5' /></button>
      <span className='min-w-5 text-center text-sm font-bold' aria-live='polite'>{qty}</span>
      <button type='button' onClick={onAdd} aria-label={`Add another ${name}`} className='flex h-full w-9 items-center justify-center hover:bg-brand-dark'><Plus className='size-3.5' /></button>
    </span>
  )
}

/** "Sort: Recommended ⌄" pill with its own menu — the site's dropdown, not the browser's. */
function SortMenu({ value, onChange }: { value: OrderSort; onChange: (v: OrderSort) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = SORT_OPTIONS.find(o => o.key === value) ?? SORT_OPTIONS[0]

  // close on a click outside or Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const sorted = value !== 'recommended'
  return (
    <div ref={ref} className='relative shrink-0'>
      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        aria-haspopup='listbox'
        aria-expanded={open}
        className={cn(
          'flex h-12 w-full items-center gap-2 rounded-full border px-5 text-sm font-semibold whitespace-nowrap transition-colors sm:w-auto',
          sorted ? 'border-brand bg-brand-tint text-brand' : 'border-[#EAEAEA] bg-white text-[#2C2D32] hover:border-[#D5D5D5]',
        )}
      >
        <ArrowDownUp className='size-4 shrink-0' />
        <span className='font-medium text-[#8A8A8E]'>Sort:</span>
        <span className='flex-1 text-left'>{current.label}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul role='listbox' aria-label='Sort by' className='absolute right-0 z-30 mt-2 w-full min-w-56 overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white py-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)] sm:w-auto'>
          {SORT_OPTIONS.map(o => {
            const on = o.key === value
            return (
              <li key={o.key}>
                <button
                  type='button'
                  role='option'
                  aria-selected={on}
                  onClick={() => { onChange(o.key); setOpen(false) }}
                  className={cn('flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#FFF3EE]', on ? 'font-semibold text-brand' : 'text-[#2C2D32]')}
                >
                  {o.label}
                  {on && <Check className='size-4 shrink-0' />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function VegMark({ veg }: { veg: boolean }) {
  return (
    <span
      aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={cn('flex size-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-white', veg ? 'border-green-600' : 'border-red-600')}
    >
      <span className={cn('size-1.5 rounded-full', veg ? 'bg-green-600' : 'bg-red-600')} />
    </span>
  )
}

/** A dish photo, or a soft placeholder when the menu item has none. */
function DishImage({ item, sizes, className }: { item: OrderItem; sizes: string; className?: string }) {
  return (
    <span className={cn('relative block overflow-hidden bg-[#FFF3EE]', className)}>
      {item.image ? (
        <Image src={item.image} alt='' fill sizes={sizes} className='object-cover transition-transform duration-500 group-hover:scale-[1.04]' />
      ) : (
        <span className='absolute inset-0 flex items-center justify-center text-[#FFB899]'>
          <UtensilsCrossed className='size-10' strokeWidth={1.4} />
        </span>
      )}
    </span>
  )
}

/**
 * Browse the menu, fill a cart, continue to the bill — app parity:
 * OrderCollectScreen.jsx + OrderProductDetailScreen.jsx (cart, totals and the
 * hand-off to Pay bill). Laid out for the website: the restaurant on top, then
 * categories / dish grid / cart side by side on desktop; stacked on phones with
 * a bottom bar. `browseOnly` is the same menu without a cart.
 */
export function OrderCollectClient({
  restaurant,
  items,
  browseOnly,
}: {
  restaurant: MerchantCapabilityFields & { id: string; name: string; slug?: string | null; cover_image?: string | null; area?: string | null; city?: string | null }
  items: OrderItem[]
  browseOnly: boolean
}) {
  const router = useRouter()
  const { requireLogin } = useAuthPrompt()
  const plan = useUserPlan()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<OrderSort>('recommended')
  const [cart, setCart] = useState<OrderCart>({})
  const [open, setOpen] = useState<OrderItem | null>(null)

  const categories = useMemo(() => ['All', ...new Set(items.map(i => i.category))], [items])
  const counts = useMemo(() => {
    const m = new Map<string, number>([['All', items.length]])
    for (const i of items) m.set(i.category, (m.get(i.category) ?? 0) + 1)
    return m
  }, [items])
  const list = useMemo(() => visibleItems(items, query, category, sort), [items, query, category, sort])
  // "All" in menu order shows each category as its own section; a search or a price sort is one grid
  const sections = useMemo(() => {
    if (category !== 'All' || sort !== 'recommended' || query.trim()) return [{ title: category === 'All' ? '' : category, items: list }]
    const by = new Map<string, OrderItem[]>()
    for (const i of list) by.set(i.category, [...(by.get(i.category) ?? []), i])
    return [...by].map(([title, group]) => ({ title, items: group }))
  }, [list, category, sort, query])

  const lines = cartLines(items, cart)
  const total = cartTotal(lines)
  const count = lines.reduce((sum, line) => sum + line.qty, 0)
  const credits = Number(((total * getCashbackPct(restaurant, plan)) / 100).toFixed(2))
  const similar = open ? items.filter(i => i.category === open.category && i.id !== open.id).slice(0, 6) : []
  const backHref = `/dining/${restaurant.slug ?? restaurant.id}`
  const place = [restaurant.area, restaurant.city].filter(Boolean).join(', ')

  const add = (id: string) => setCart(c => changeQty(c, id, 1))
  const remove = (id: string) => setCart(c => changeQty(c, id, -1))
  const stepper = (item: OrderItem, size?: 'sm' | 'md') => (
    <Stepper name={item.name} qty={cart[item.id] ?? 0} onAdd={() => add(item.id)} onRemove={() => remove(item.id)} size={size} />
  )

  function proceed() {
    // paying the order needs an account — signed out, log in first and carry on after
    requireLogin(() => {
      try { sessionStorage.setItem(ORDER_CART_KEY, JSON.stringify({ restaurantId: restaurant.id, lines })) } catch { /* private mode — it goes as a plain bill */ }
      router.push(`/pay-bill?restaurant_id=${restaurant.id}&amount=${total}&order=1`)
    })
  }

  return (
    // breaks out of the site's 1280px column, like the restaurant page
    <main className='min-h-screen bg-[#FAFAFA] pb-32 font-(family-name:--font-dm-sans) md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:[--u:calc(100vw/1920)] lg:pb-16'>
      {/* restaurant header */}
      <section className='relative overflow-hidden bg-[#1A1311] text-white'>
        {restaurant.cover_image && (
          <Image src={restaurant.cover_image} alt='' fill priority sizes='100vw' className='object-cover opacity-45' />
        )}
        <span aria-hidden='true' className='absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent' />
        <div className='relative flex flex-col gap-4 px-4 pt-6 pb-8 md:px-[max(32px,calc(172*var(--u)))] md:pt-16 md:pb-10'>
          <Link href={backHref} className='flex w-fit items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm hover:bg-white/25'>
            <ArrowLeft className='size-4' /> Back to restaurant
          </Link>
          <div>
            <p className='text-sm font-semibold tracking-[0.14em] text-[#FFB899] uppercase'>{browseOnly ? 'Menu' : 'Order & Collect'}</p>
            <h1 className='mt-1 text-3xl font-bold md:text-5xl'>{restaurant.name}</h1>
            {place && <p className='mt-2 text-sm text-white/80 md:text-base'>{place}</p>}
            {!browseOnly && <p className='mt-3 max-w-xl text-sm text-white/80 md:text-base'>Order ahead, pay the bill on PassPrivé and collect it from the counter.</p>}
          </div>
        </div>
      </section>

      {/* same side margins as the restaurant page (172 at 1920, never under 32px) */}
      <div className='px-4 md:px-[max(32px,calc(172*var(--u)))]'>
        <div className={cn('flex flex-col gap-8 pt-6 lg:grid lg:items-start lg:gap-8 lg:pt-8', browseOnly ? 'lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]' : 'lg:grid-cols-[180px_minmax(0,1fr)_260px] xl:grid-cols-[220px_minmax(0,1fr)_290px] 2xl:grid-cols-[260px_minmax(0,1fr)_320px]')}>
          {/* categories — a card like "Your order" on desktop (sticky, scrolls inside), chips on phones */}
          <nav aria-label='Menu categories' className='lg:sticky lg:top-6'>
            <div className='lg:overflow-hidden lg:rounded-2xl lg:border lg:border-[#F0F0F0] lg:bg-white lg:shadow-[0_2px_12px_rgba(0,0,0,0.05)]'>
              <p className='hidden border-b border-[#F3F3F3] px-4 py-3 text-[15px] font-bold text-[#101010] lg:block'>Menu</p>
              <div className='scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:gap-0 lg:overflow-y-auto lg:px-0 lg:py-1.5'>
                {categories.map(c => {
                  const on = c === category
                  return (
                    <button
                      key={c}
                      type='button'
                      onClick={() => setCategory(c)}
                      aria-current={on ? 'true' : undefined}
                      className={cn(
                        // phones: pill chips — desktop: rows with an orange bar on the picked one
                        'relative flex shrink-0 items-center justify-between gap-2 rounded-full border px-4 py-2 text-left text-sm font-semibold transition-colors',
                        'lg:rounded-none lg:border-0 lg:py-2.5 lg:pr-4 lg:pl-5 lg:text-[13px]',
                        on
                          ? 'border-brand bg-brand text-white lg:bg-[#FFF5F0] lg:text-brand lg:before:absolute lg:before:inset-y-1.5 lg:before:left-0 lg:before:w-[3px] lg:before:rounded-r-full lg:before:bg-brand'
                          : 'border-[#EAEAEA] bg-white text-[#2C2D32] hover:bg-gray-50 lg:font-medium lg:text-[#5B5A5A] lg:hover:bg-[#FAFAFA] lg:hover:text-[#101010]',
                      )}
                    >
                      <span className='truncate'>{c}</span>
                      <span
                        className={cn(
                          'hidden min-w-6 rounded-full px-1.5 py-px text-center text-[11px] font-semibold lg:inline',
                          on ? 'bg-brand text-white' : 'bg-[#F3F3F3] text-[#8A8A8E]',
                        )}
                      >
                        {counts.get(c) ?? 0}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* dishes */}
          <section className='min-w-0'>
            {/* search + sort stick at the side cards' level (24px); the page colour above and behind
                them hides the dishes as they scroll up, so everything disappears at one line */}
            <div className='sticky top-0 z-20 -mt-6 flex flex-col gap-3 bg-[#FAFAFA] pt-6 pb-4 sm:flex-row sm:items-center'>
              <div className='relative flex-1'>
                <Search className='pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#8A8A8E]' />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search ${restaurant.name}'s menu`}
                  aria-label='Search the menu'
                  className='h-12 w-full rounded-full border border-[#EAEAEA] bg-white pr-4 pl-11 text-sm outline-none focus:border-brand'
                />
              </div>
              <SortMenu value={sort} onChange={setSort} />
            </div>

            {list.length === 0 && (
              <p className='py-20 text-center text-sm text-[#8A8A8E]'>{items.length ? 'No dishes match your search.' : 'The menu isn’t available right now.'}</p>
            )}

            {sections.map(s => (
              <div key={s.title || 'all'} className='mt-8 first:mt-6'>
                {s.title && (
                  <h2 className='mb-4 flex items-baseline gap-2 text-xl font-bold text-[#101010]'>
                    {s.title} <span className='text-sm font-medium text-[#8A8A8E]'>{s.items.length}</span>
                  </h2>
                )}
                <ul className='grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] lg:gap-5'>
                  {s.items.map(item => (
                    <li key={item.id} className='group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)]'>
                      <button type='button' onClick={() => setOpen(item)} aria-label={`View ${item.name}`} className='block'>
                        <DishImage item={item} sizes='(min-width: 1536px) 22vw, (min-width: 640px) 40vw, 92vw' className='aspect-4/3' />
                      </button>
                      <div className='flex flex-1 flex-col p-4'>
                        <span className='flex items-center gap-2'>
                          <VegMark veg={item.isVeg} />
                          {item.isBestseller && <span className='rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand'>Bestseller</span>}
                        </span>
                        <button type='button' onClick={() => setOpen(item)} className='mt-2 text-left'>
                          <span className='line-clamp-1 text-base font-bold text-[#101010]'>{item.name}</span>
                          {item.description && <span className='mt-1 line-clamp-2 block text-[13px] leading-5 text-[#8A8A8E]'>{item.description}</span>}
                        </button>
                        <div className='mt-auto flex items-center justify-between gap-3 pt-4'>
                          <span className='text-base font-bold text-[#101010]'>{mur(item.price)}</span>
                          {!browseOnly && stepper(item)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* cart — sticky beside the menu on desktop */}
          {!browseOnly && (
            <aside className='hidden lg:sticky lg:top-6 lg:block'>
              <div className='rounded-2xl border border-[#F0F0F0] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]'>
                <h2 className='flex items-center gap-2 text-[15px] font-bold text-[#101010]'>
                  <ShoppingBag className='size-4 text-brand' /> Your order
                  {count > 0 && <span className='ml-auto text-xs font-medium text-[#8A8A8E]'>{count} {count === 1 ? 'item' : 'items'}</span>}
                </h2>
                {lines.length === 0 ? (
                  <p className='mt-3 rounded-xl bg-[#FAFAFA] px-3 py-4 text-center text-[13px] leading-5 text-[#8A8A8E]'>
                    Your cart is empty.<br />Add dishes to order ahead.
                  </p>
                ) : (
                  <>
                    <ul className='mt-3 flex max-h-[40vh] flex-col divide-y divide-[#F3F3F3] overflow-y-auto pr-1'>
                      {lines.map(line => (
                        <li key={line.id} className='flex items-center gap-2.5 py-2.5 first:pt-0'>
                          <VegMark veg={line.isVeg} />
                          <span className='min-w-0 flex-1'>
                            <span className='block truncate text-[13px] font-semibold text-[#2C2D32]'>{line.name}</span>
                            <span className='block text-xs text-[#8A8A8E]'>{mur(line.price * line.qty)}</span>
                          </span>
                          {stepper(line, 'sm')}
                        </li>
                      ))}
                    </ul>
                    <div className='mt-3 flex items-center justify-between border-t border-dashed border-[#EAEAEA] pt-3'>
                      <span className='text-[13px] font-medium text-[#5B5A5A]'>Item total</span>
                      <span className='text-base font-bold text-[#101010]'>{mur(total)}</span>
                    </div>
                    {credits > 0 && (
                      <p className='mt-2 text-xs text-[#5B5A5A]'>
                        Earn <b className='text-[#0248F6]'>{credits.toLocaleString('en-US')} Privé credits</b> on bill payment
                      </p>
                    )}
                    <button type='button' onClick={proceed} className='mt-3 flex h-10 w-full items-center justify-center gap-1 rounded-full bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-dark'>
                      Continue to pay <ChevronRight className='size-4' />
                    </button>
                  </>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* dish details */}
      <Dialog open={!!open} onOpenChange={o => { if (!o) setOpen(null) }}>
        <DialogContent className='max-h-[88vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl'>
          {open && (
            <div className='grid md:grid-cols-2'>
              <DishImage item={open} sizes='(min-width: 768px) 384px, 92vw' className='aspect-4/3 md:aspect-auto md:min-h-full' />
              <div className='flex flex-col gap-3 p-6'>
                <span className='flex items-center gap-2'>
                  <VegMark veg={open.isVeg} />
                  {open.isBestseller && <span className='rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-bold text-brand'>Bestseller</span>}
                </span>
                <DialogTitle className='text-2xl font-bold text-[#101010]'>{open.name}</DialogTitle>
                <DialogDescription className='text-sm leading-6 text-[#5B5A5A]'>{open.description || open.category}</DialogDescription>
                <div className='flex items-center justify-between gap-3 pt-1'>
                  <span className='text-xl font-bold text-[#101010]'>{mur(open.price)}</span>
                  {!browseOnly && stepper(open)}
                </div>
                {similar.length > 0 && (
                  <div className='mt-3 border-t border-[#EAEAEA] pt-4'>
                    <p className='text-sm font-bold text-[#101010]'>More from {open.category}</p>
                    <div className='mt-3 flex flex-col gap-3'>
                      {similar.map(s => (
                        <div key={s.id} className='flex items-center gap-3'>
                          <button type='button' onClick={() => setOpen(s)} className='group flex min-w-0 flex-1 items-center gap-3 text-left'>
                            <DishImage item={s} sizes='48px' className='size-12 shrink-0 rounded-lg' />
                            <span className='min-w-0'>
                              <span className='block truncate text-sm font-semibold text-[#2C2D32]'>{s.name}</span>
                              <span className='block text-xs text-[#8A8A8E]'>{mur(s.price)}</span>
                            </span>
                          </button>
                          {!browseOnly && stepper(s, 'sm')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* phones and tablets — the cart as a bottom bar */}
      {!browseOnly && count > 0 && (
        <div className='fixed inset-x-0 bottom-0 z-40 border-t border-[#EAEAEA] bg-white px-4 pt-2.5 pb-4 lg:hidden'>
          <div className='mx-auto max-w-3xl'>
            {credits > 0 && <p className='mb-2 text-center text-[13px] text-[#2C2D32]'>Earn <b className='text-[#0248F6]'>{credits.toLocaleString('en-US')} Privé credits</b> on bill payment</p>}
            <button type='button' onClick={proceed} className='flex h-12 w-full items-center justify-between rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark'>
              <span>{count} {count === 1 ? 'item' : 'items'} · {mur(total)}</span>
              <span className='flex items-center gap-1'>Continue <ChevronRight className='size-4' /></span>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
