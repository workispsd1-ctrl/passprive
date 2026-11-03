import Link from 'next/link'
import { ChevronRight, ShoppingBag } from 'lucide-react'

/** The way into the menu from a restaurant page — app parity: RestaurantDetails + MenuSection.jsx. */
export function OrderCollectBanner({ href, orderEnabled, count, className }: { href: string; orderEnabled: boolean; count: number; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-2xl border border-[#EFEFEF] bg-white p-4 shadow-[4px_4px_47px_rgba(0,0,0,0.08)] hover:bg-gray-50 ${className ?? ''}`}>
      <span className='flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand'><ShoppingBag className='size-5' /></span>
      <span className='min-w-0 flex-1'>
        <span className='block font-(family-name:--font-libre-baskerville) text-base font-bold text-[#2C2D32] italic'>{orderEnabled ? 'Order & Collect' : 'Menu'}</span>
        <span className='block text-[13px] text-[#6B6B6B]'>{orderEnabled ? `Order from ${count} items and pick up at the restaurant` : `Browse ${count} items`}</span>
      </span>
      <ChevronRight className='size-5 shrink-0 text-[#6B6B6B]' />
    </Link>
  )
}
