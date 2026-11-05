import Link from 'next/link'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { t, tMin } from '@/components/sections/dining/designUnit'

/** The way into the menu from a restaurant page — app parity: RestaurantDetails + MenuSection.jsx. */
export function OrderCollectBanner({ href, orderEnabled, count, className }: { href: string; orderEnabled: boolean; count: number; className?: string }) {
  return (
    <Link href={href} className={`flex items-center border border-[#EFEFEF] max-md:[--t:0.8px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:bg-gray-50 ${className ?? ''}`} style={{ gap: tMin(14, 10), padding: tMin(16, 11), borderRadius: t(20) }}>
      <span className='flex shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand' style={{ width: tMin(44, 34), height: tMin(44, 34) }}><ShoppingBag style={{ width: tMin(20, 16), height: tMin(20, 16) }} /></span>
      <span className='min-w-0 flex-1'>
        <span className='block font-(family-name:--font-libre-baskerville) font-bold text-[#2C2D32] italic' style={{ fontSize: tMin(16, 13) }}>{orderEnabled ? 'Order & Collect' : 'Menu'}</span>
        <span className='block text-[#6B6B6B]' style={{ fontSize: tMin(13, 12) }}>{orderEnabled ? `Order from ${count} items and pick up at the restaurant` : `Browse ${count} items`}</span>
      </span>
      <ChevronRight className='shrink-0 text-[#6B6B6B]' style={{ width: tMin(18, 14), height: tMin(18, 14) }} />
    </Link>
  )
}
