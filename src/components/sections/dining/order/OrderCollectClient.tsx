'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Search, SlidersHorizontal, Utensils } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { ORDER_CART_KEY, cartLines, cartTotal, visibleItems, type OrderItem, type OrderSort } from '@/lib/orderCollect'
import { cn } from '@/lib/utils'
import { OC_PAGE, OC_UNIT } from './unit'
import { ProductCard, mur, productHref, shareLink } from './OrderParts'
import { useOrderCart } from './useOrderCart'

const SORT_OPTIONS: { key: OrderSort; label: string }[] = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
]

/** Closes a popover on a click outside `ref` or Escape. */
function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) close() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close, ref])
}

/** Figma "Filters and categories" chip: 33.75 tall, #B0B0B0 border, radius 16.875, 15/23. */
const CHIP =
  'flex h-[calc(33.75*var(--u))] shrink-0 items-center gap-8 rounded-full border-[calc(1.25*var(--u))] bg-white/77 px-10 text-[calc(15*var(--u))] leading-[calc(23*var(--u))] whitespace-nowrap transition-colors max-lg:h-34 max-lg:border max-lg:px-12 max-lg:text-[14px]'

/** A chip's dropdown: white card, Figma "Categories menu" shadow. */
const MENU_CARD =
  'absolute z-30 mt-8 min-w-224 overflow-hidden rounded-[calc(20*var(--u))] bg-white py-8 shadow-[0_calc(16.4*var(--u))_calc(43.8*var(--u))_rgba(0,0,0,0.15)] max-lg:rounded-[16px]'

function MenuOption({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type='button'
      role='menuitemcheckbox'
      aria-checked={on}
      onClick={onClick}
      className={cn('flex w-full items-center justify-between gap-16 px-18 py-10 text-left text-[calc(15*var(--u))] transition-colors hover:bg-[#FFF3EE] max-lg:text-[14px]', on ? 'font-semibold text-[#FF4800]' : 'text-[#2C2D32]')}
    >
      {children}
      {on && <Check className='size-16 shrink-0' />}
    </button>
  )
}

/**
 * Browse the menu, fill a cart, continue to the bill — app parity:
 * OrderCollectScreen.jsx (search, sort, category sheet from the floating
 * MENU button, cart → OrderBillSummary). UI from the Figma "Flow - Order &
 * Collect" frames: Coffee menu (4 across), with the cart ("Your order" beside a
 * 3-across grid), the MENU button and its categories list. `browseOnly` is
 * the same menu without a cart.
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
  const { cart, add, remove } = useOrderCart(restaurant.id, items)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<OrderSort>('recommended')
  const [vegOnly, setVegOnly] = useState(false)
  const [bestOnly, setBestOnly] = useState(false)
  const [open, setOpen] = useState<null | 'filter' | 'sort' | 'more' | 'categories'>(null)
  const [notice, setNotice] = useState('')

  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const close = useMemo(() => () => setOpen(null), [])
  useDismiss(open === 'filter', close, filterRef)
  useDismiss(open === 'sort', close, sortRef)
  useDismiss(open === 'more', close, moreRef)
  useDismiss(open === 'categories', close, catRef)

  const slug = restaurant.slug ?? restaurant.id
  const categories = useMemo(() => [...new Set(items.map(i => i.category))], [items])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of items) m.set(i.category, (m.get(i.category) ?? 0) + 1)
    return m
  }, [items])
  const list = useMemo(
    () => visibleItems(items, query, category, sort).filter(i => (!vegOnly || i.isVeg) && (!bestOnly || i.isBestseller)),
    [items, query, category, sort, vegOnly, bestOnly],
  )

  const lines = cartLines(items, cart)
  const total = cartTotal(lines)
  const count = lines.reduce((sum, line) => sum + line.qty, 0)
  const credits = Number(((total * getCashbackPct(restaurant, plan)) / 100).toFixed(2))
  const withCart = !browseOnly && count > 0
  const filtered = vegOnly || bestOnly

  function pickCategory(c: string) {
    setCategory(cur => (cur === c ? 'All' : c))
    setOpen(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function shareMenu() {
    setOpen(null)
    const result = await shareLink(`${restaurant.name} · Order & Collect`, `/dining/${slug}/order`)
    if (result === 'copied') {
      setNotice('Link copied')
      setTimeout(() => setNotice(''), 2000)
    }
  }

  function proceed() {
    // paying the order needs an account — signed out, log in first and carry on after
    requireLogin(() => {
      try { sessionStorage.setItem(ORDER_CART_KEY, JSON.stringify({ restaurantId: restaurant.id, lines })) } catch { /* private mode — it goes as a plain bill */ }
      router.push(`/pay-bill?restaurant_id=${restaurant.id}&amount=${total}&order=1`)
    })
  }

  const continueButton = (
    <button
      type='button'
      onClick={proceed}
      className='flex h-54 w-full items-center justify-between rounded-full bg-[#FF4800] px-16 text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-[#E64200] max-lg:h-52 max-lg:px-20 max-lg:text-[16px]'
    >
      <span>{count} {count === 1 ? 'item' : 'items'} added</span>
      <span className='flex items-center gap-4'>Continue <ChevronRight className='size-20' /></span>
    </button>
  )

  return (
    <main className={cn(OC_PAGE, OC_UNIT, 'px-172 pt-40 pb-160 max-lg:px-16 max-lg:pt-12 max-lg:pb-200')}>
      {/* Figma "Desktop header": back + "Order & Collect" (H1 32/40), divider */}
      <header className='flex h-64 items-start border-b border-[#EBEBED] max-lg:h-auto max-lg:pb-12'>
        <Link href={`/dining/${slug}`} aria-label={`Back to ${restaurant.name}`} className='-ml-8 flex size-40 items-center justify-center rounded-full text-[#938F96] transition-colors hover:bg-black/5 max-lg:-ml-10 max-lg:size-36'>
          <ChevronLeft className='size-24' />
        </Link>
        <h1 className='ml-8 text-[calc(32*var(--u))] leading-[calc(40*var(--u))] font-bold text-[#2C2D32] max-lg:text-[22px] max-lg:leading-36'>
          {browseOnly ? 'Menu' : 'Order & Collect'}
        </h1>
      </header>

      {/* Figma "Search and filters": search 580 + options 50, then the chips 32 to the right */}
      <div className='mt-28 flex items-center gap-32 max-lg:mt-14 max-lg:flex-col max-lg:items-stretch max-lg:gap-12'>
        <div className='flex shrink-0 items-center gap-10'>
          <label className='flex h-50 w-580 items-center gap-10 rounded-full border-[calc(1.25*var(--u))] border-[#F2F2F2] bg-[#D9D9D9]/10 px-15 focus-within:border-[#FF4800] max-lg:h-46 max-lg:w-auto max-lg:flex-1 max-lg:border'>
            <Search className='size-26 shrink-0 text-[#595B61] max-lg:size-20' strokeWidth={1.6} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search items'
              aria-label={`Search ${restaurant.name}'s menu`}
              className='h-full min-w-0 flex-1 bg-transparent text-[calc(15*var(--u))] font-medium tracking-[0.008em] text-[#2C2D32] outline-none placeholder:text-[#595B61] max-lg:text-[14px]'
            />
          </label>
          <div ref={moreRef} className='relative'>
            <button
              type='button'
              onClick={() => setOpen(o => (o === 'more' ? null : 'more'))}
              aria-haspopup='menu'
              aria-expanded={open === 'more'}
              aria-label='More options'
              className='flex size-50 items-center justify-center rounded-[calc(23*var(--u))] bg-[#D9D9D9]/10 text-[#595B61] transition-colors hover:bg-[#D9D9D9]/30 max-lg:size-46 max-lg:rounded-[22px]'
            >
              <MoreVertical className='size-28 max-lg:size-22' />
            </button>
            {open === 'more' && (
              <div role='menu' className={cn(MENU_CARD, 'right-0')}>
                <button type='button' role='menuitem' onClick={shareMenu} className='flex w-full px-18 py-10 text-left text-[calc(15*var(--u))] text-[#2C2D32] hover:bg-[#FFF3EE] max-lg:text-[14px]'>Share this menu</button>
                <Link role='menuitem' href={`/dining/${slug}`} className='flex w-full px-18 py-10 text-left text-[calc(15*var(--u))] text-[#2C2D32] hover:bg-[#FFF3EE] max-lg:text-[14px]'>View restaurant</Link>
              </div>
            )}
          </div>
        </div>

        <div className='flex min-w-0 flex-1 items-center gap-[calc(8.75*var(--u))] max-lg:gap-8'>
          <div ref={filterRef} className='relative shrink-0'>
            <button
              type='button'
              onClick={() => setOpen(o => (o === 'filter' ? null : 'filter'))}
              aria-haspopup='menu'
              aria-expanded={open === 'filter'}
              className={cn(CHIP, 'font-semibold', filtered ? 'border-[#FF4800] text-[#FF4800]' : 'border-[#B0B0B0] text-[#454040]')}
            >
              Filter <SlidersHorizontal className='size-20 max-lg:size-16' strokeWidth={1.8} />
            </button>
            {open === 'filter' && (
              <div role='menu' className={cn(MENU_CARD, 'left-0')}>
                <MenuOption on={vegOnly} onClick={() => setVegOnly(v => !v)}>Veg only</MenuOption>
                <MenuOption on={bestOnly} onClick={() => setBestOnly(v => !v)}>Bestsellers</MenuOption>
              </div>
            )}
          </div>
          <div ref={sortRef} className='relative shrink-0'>
            <button
              type='button'
              onClick={() => setOpen(o => (o === 'sort' ? null : 'sort'))}
              aria-haspopup='menu'
              aria-expanded={open === 'sort'}
              className={cn(CHIP, 'font-semibold', sort !== 'recommended' ? 'border-[#FF4800] text-[#FF4800]' : 'border-[#B0B0B0] text-[#454040]')}
            >
              {sort === 'recommended' ? 'Sort By' : SORT_OPTIONS.find(o => o.key === sort)?.label}
              <ChevronDown className={cn('size-16 transition-transform', open === 'sort' && 'rotate-180')} strokeWidth={2.2} />
            </button>
            {open === 'sort' && (
              <div role='menu' className={cn(MENU_CARD, 'left-0')}>
                {SORT_OPTIONS.map(o => (
                  <MenuOption key={o.key} on={o.key === sort} onClick={() => { setSort(o.key); setOpen(null) }}>{o.label}</MenuOption>
                ))}
              </div>
            )}
          </div>
          {/* only the category chips scroll, so the Filter / Sort menus aren't clipped */}
          <div className='scrollbar-hide flex min-w-0 flex-1 items-center gap-[calc(8.75*var(--u))] overflow-x-auto max-lg:-mr-16 max-lg:gap-8 max-lg:pr-16'>
          {categories.map(c => {
            const on = c === category
            return (
              <button
                key={c}
                type='button'
                onClick={() => pickCategory(c)}
                aria-pressed={on}
                className={cn(CHIP, on ? 'border-[#FF4800] text-[#FF4800]' : 'border-[#B0B0B0] text-[#454040] hover:border-[#8E8E93]')}
              >
                {c}
              </button>
            )
          })}
          </div>
        </div>
      </div>

      {/* Figma "Product grid": 376×320 cards, 24 apart — 4 across, or 3 beside "Your order" */}
      <div className={cn('mt-32 max-lg:mt-16', withCart && 'lg:grid lg:grid-cols-[minmax(0,1fr)_calc(368*var(--u))] lg:items-start lg:gap-32')}>
        <div className='min-w-0'>
          {list.length === 0 ? (
            <p className='py-80 text-center text-[calc(16*var(--u))] text-[#8E8E93] max-lg:text-[14px]'>
              {query.trim() || filtered || category !== 'All' ? 'No items match your search.' : 'The menu isn’t available right now.'}
            </p>
          ) : (
            <ul className={cn('grid gap-24 max-lg:grid-cols-2 max-lg:gap-12', withCart ? 'lg:grid-cols-3' : 'lg:grid-cols-4')}>
              {list.map(item => (
                <ProductCard
                  key={item.id}
                  item={item}
                  href={productHref(slug, item)}
                  qty={cart[item.id] ?? 0}
                  onAdd={() => add(item.id)}
                  onRemove={() => remove(item.id)}
                  browseOnly={browseOnly}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Figma "Order summary": 368 wide, sticky beside the grid on desktop */}
        {withCart && (
          <aside className='hidden lg:sticky lg:top-24 lg:block'>
            <div className='rounded-[calc(16*var(--u))] border border-[#E8E8EA] bg-white p-24'>
              <h2 className='text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold text-[#2C2D32]'>Your order</h2>
              <ul className='mt-28 flex max-h-[40vh] flex-col gap-16 overflow-y-auto'>
                {lines.map(line => (
                  <li key={line.id} className='flex items-start justify-between gap-16 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#2C2D32]'>
                    <span className='min-w-0'>{line.qty} × {line.name}</span>
                    <span className='shrink-0'>{mur(line.price * line.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className='mt-36 flex justify-between gap-16 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] font-bold text-[#2C2D32]'>
                To be paid <span>{mur(total)}</span>
              </p>
              {credits > 0 && (
                <p className='mt-40 text-center font-(family-name:--font-inter) text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-semibold text-[#424144]'>
                  Earn <span className='text-[#2247FF]'>{credits.toLocaleString('en-US')} Privé credits</span> on bill payment
                </p>
              )}
              <div className={credits > 0 ? 'mt-16' : 'mt-40'}>{continueButton}</div>
            </div>
          </aside>
        )}
      </div>

      {/* Figma "Menu shortcut": the 80 MENU button bottom-right, its categories list above it */}
      {categories.length > 1 && (
        <div
          ref={catRef}
          className={cn('fixed right-172 bottom-40 z-30 max-lg:right-16', withCart ? 'max-lg:bottom-136' : 'max-lg:bottom-24')}
        >
          {open === 'categories' && (
            <div
              role='menu'
              aria-label='Menu categories'
              className='absolute right-0 bottom-96 max-h-[60vh] w-368 overflow-y-auto rounded-[calc(25.2*var(--u))] bg-white px-25 py-10 shadow-[0_calc(16.4*var(--u))_calc(43.8*var(--u))_rgba(0,0,0,0.15)] max-lg:bottom-76 max-lg:w-[min(320px,calc(100vw-32px))] max-lg:rounded-[22px] max-lg:px-20'
            >
              {categories.map(c => (
                <button
                  key={c}
                  type='button'
                  role='menuitemradio'
                  aria-checked={c === category}
                  onClick={() => pickCategory(c)}
                  className={cn(
                    'flex h-[calc(60.5*var(--u))] w-full items-center justify-between gap-16 border-b-[calc(1.26*var(--u))] border-[#F1F1F1] text-left text-[calc(17.64*var(--u))] leading-[calc(23*var(--u))] font-semibold last:border-b-0 max-lg:h-52 max-lg:border-b max-lg:text-[16px]',
                    c === category ? 'text-[#FF4800]' : 'text-[#1A1A1A] hover:text-[#FF4800]',
                  )}
                >
                  <span className='truncate'>{c}</span>
                  <span>{counts.get(c) ?? 0}</span>
                </button>
              ))}
            </div>
          )}
          <button
            type='button'
            onClick={() => setOpen(o => (o === 'categories' ? null : 'categories'))}
            aria-haspopup='menu'
            aria-expanded={open === 'categories'}
            className='flex size-80 flex-col items-center justify-center rounded-full border border-white/22 bg-white text-[#535353] shadow-[0_calc(2*var(--u))_calc(6*var(--u))_rgba(0,0,0,0.2)] transition-transform hover:scale-105 max-lg:size-64'
          >
            <Utensils className='size-32 max-lg:size-24' strokeWidth={1.8} />
            <span className='text-[calc(12*var(--u))] leading-[calc(16*var(--u))] font-extrabold max-lg:text-[11px]'>MENU</span>
          </button>
        </div>
      )}

      {/* phones and tablets — the cart as a bottom bar */}
      {withCart && (
        <div className='fixed inset-x-0 bottom-0 z-40 border-t border-[#EBEBED] bg-white px-16 pt-10 pb-16 lg:hidden'>
          {credits > 0 && (
            <p className='mb-8 text-center font-(family-name:--font-inter) text-[13px] font-semibold text-[#424144]'>
              Earn <span className='text-[#2247FF]'>{credits.toLocaleString('en-US')} Privé credits</span> on bill payment
            </p>
          )}
          {continueButton}
        </div>
      )}

      {notice && (
        <p role='status' className='fixed bottom-140 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#2C2D32] px-16 py-8 text-[14px] text-white'>{notice}</p>
      )}
    </main>
  )
}
