'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChevronRight, Minus, Plus, Search } from 'lucide-react'
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

function Stepper({ qty, onAdd, onRemove, name }: { qty: number; onAdd: () => void; onRemove: () => void; name: string }) {
  if (qty === 0) {
    return (
      <button type='button' onClick={onAdd} aria-label={`Add ${name}`} className='h-9 rounded-lg border border-brand px-5 text-sm font-bold text-brand hover:bg-brand-tint'>
        ADD
      </button>
    )
  }
  return (
    <span className='flex h-9 items-center overflow-hidden rounded-lg bg-brand text-white'>
      <button type='button' onClick={onRemove} aria-label={`Remove ${name}`} className='flex h-full w-8 items-center justify-center hover:bg-brand-dark'><Minus className='size-3.5' /></button>
      <span className='w-6 text-center text-sm font-bold' aria-live='polite'>{qty}</span>
      <button type='button' onClick={onAdd} aria-label={`Add another ${name}`} className='flex h-full w-8 items-center justify-center hover:bg-brand-dark'><Plus className='size-3.5' /></button>
    </span>
  )
}

/**
 * Browse the menu, fill a cart, continue to the bill — app parity:
 * OrderCollectScreen.jsx + OrderProductDetailScreen.jsx. `browseOnly` is the
 * same menu without a cart, for restaurants that don't take orders.
 */
export function OrderCollectClient({
  restaurant,
  items,
  browseOnly,
}: {
  restaurant: MerchantCapabilityFields & { id: string; name: string }
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
  const list = useMemo(() => visibleItems(items, query, category, sort), [items, query, category, sort])
  const lines = cartLines(items, cart)
  const total = cartTotal(lines)
  const count = lines.reduce((sum, line) => sum + line.qty, 0)
  const credits = Number(((total * getCashbackPct(restaurant, plan)) / 100).toFixed(2))
  const similar = open ? items.filter(i => i.category === open.category && i.id !== open.id).slice(0, 6) : []

  const stepper = (item: OrderItem) => (
    <Stepper
      name={item.name}
      qty={cart[item.id] ?? 0}
      onAdd={() => setCart(c => changeQty(c, item.id, 1))}
      onRemove={() => setCart(c => changeQty(c, item.id, -1))}
    />
  )

  function proceed() {
    // paying the order needs an account — signed out, log in first and carry on after
    requireLogin(() => {
      try { sessionStorage.setItem(ORDER_CART_KEY, JSON.stringify({ restaurantId: restaurant.id, lines })) } catch { /* private mode — it goes as a plain bill */ }
      router.push(`/pay-bill?restaurant_id=${restaurant.id}&amount=${total}&order=1`)
    })
  }

  return (
    <main className='mx-auto min-h-screen max-w-4xl px-4 pt-6 pb-32 md:px-8'>
      <h1 className='text-2xl font-bold text-[#101010]'>{browseOnly ? 'Menu' : 'Order & Collect'}</h1>
      <p className='mt-1 text-sm text-[#8A8A8E]'>{restaurant.name}</p>

      <div className='relative mt-4'>
        <Search className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8A8A8E]' />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder='Search the menu' aria-label='Search the menu' className='h-11 w-full rounded-xl border border-[#EAEAEA] pr-3 pl-10 text-sm outline-none focus:border-brand' />
      </div>

      <div className='mt-3 flex flex-wrap items-center justify-between gap-3'>
        <div className='scrollbar-hide flex min-w-0 flex-1 gap-2 overflow-x-auto'>
          {categories.map(c => (
            <button key={c} type='button' onClick={() => setCategory(c)} className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold', c === category ? 'border-brand bg-brand text-white' : 'border-[#EAEAEA] text-[#2C2D32] hover:bg-gray-50')}>
              {c}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as OrderSort)} aria-label='Sort by' className='h-9 rounded-lg border border-[#EAEAEA] bg-white px-2 text-[13px] font-medium text-[#2C2D32]'>
          {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      {list.length === 0 && <p className='py-16 text-center text-sm text-[#8A8A8E]'>{items.length ? 'No items match your search.' : 'The menu isn’t available right now.'}</p>}

      <ul className='mt-4 divide-y divide-[#EAEAEA]'>
        {list.map(item => (
          <li key={item.id} className='flex gap-4 py-4'>
            <button type='button' onClick={() => setOpen(item)} className='min-w-0 flex-1 text-left'>
              <span className='flex items-center gap-1.5'>
                <span className={cn('size-2.5 shrink-0 rounded-full', item.isVeg ? 'bg-green-600' : 'bg-red-600')} aria-label={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'} />
                {item.isBestseller && <span className='text-[11px] font-bold text-brand'>Bestseller</span>}
              </span>
              <span className='mt-1 block text-[15px] font-semibold text-[#101010]'>{item.name}</span>
              <span className='mt-0.5 block text-sm font-medium text-[#2C2D32]'>MUR {item.price.toLocaleString('en-US')}</span>
              {item.description && <span className='mt-1 line-clamp-2 block text-[13px] text-[#8A8A8E]'>{item.description}</span>}
            </button>
            <span className='flex w-28 shrink-0 flex-col items-center gap-2'>
              {item.image && (
                <button type='button' onClick={() => setOpen(item)} aria-label={`View ${item.name}`} className='relative block size-24 overflow-hidden rounded-xl bg-gray-100'>
                  <Image src={item.image} alt='' fill sizes='96px' className='object-cover' />
                </button>
              )}
              {!browseOnly && stepper(item)}
            </span>
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onOpenChange={o => { if (!o) setOpen(null) }}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-md'>
          {open && (
            <>
              {open.image && (
                <span className='relative block aspect-4/3 overflow-hidden rounded-xl bg-gray-100'>
                  <Image src={open.image} alt={open.name} fill sizes='420px' className='object-cover' />
                </span>
              )}
              <DialogTitle>{open.name}</DialogTitle>
              <DialogDescription>{open.description || open.category}</DialogDescription>
              <div className='flex items-center justify-between'>
                <span className='text-base font-bold text-[#101010]'>MUR {open.price.toLocaleString('en-US')}</span>
                {!browseOnly && stepper(open)}
              </div>
              {similar.length > 0 && (
                <>
                  <p className='mt-2 text-sm font-bold text-[#101010]'>Similar products</p>
                  <div className='flex flex-col gap-2'>
                    {similar.map(s => (
                      <div key={s.id} className='flex items-center justify-between gap-3'>
                        <button type='button' onClick={() => setOpen(s)} className='min-w-0 text-left'>
                          <span className='block truncate text-sm font-medium text-[#2C2D32]'>{s.name}</span>
                          <span className='block text-xs text-[#8A8A8E]'>MUR {s.price.toLocaleString('en-US')}</span>
                        </button>
                        {!browseOnly && stepper(s)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {!browseOnly && count > 0 && (
        <div className='fixed inset-x-0 bottom-0 z-40 border-t border-[#EAEAEA] bg-white px-4 pt-2.5 pb-4'>
          <div className='mx-auto max-w-4xl'>
            {credits > 0 && <p className='mb-2 text-center text-[13px] text-[#2C2D32]'>Earn <b className='text-brand'>{credits.toLocaleString('en-US')} Privé credits</b> on bill payment</p>}
            <button type='button' onClick={proceed} className='flex h-12 w-full items-center justify-between rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-dark'>
              <span>{count} {count === 1 ? 'item' : 'items'} added</span>
              <span className='flex items-center gap-1'>Continue <ChevronRight className='size-4' /></span>
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
