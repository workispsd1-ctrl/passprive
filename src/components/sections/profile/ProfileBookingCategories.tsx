import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TILE_UNIT } from './units'

const TILES = [
  { label: 'Dining', image: '/assets/nav/dining.webp', w: 190, h: 211, href: '/bookings?tab=dining' },
  { label: 'Wellness', image: '/assets/nav/wellness.webp', w: 165, h: 214, href: '/bookings?tab=wellness' },
  { label: 'Explore', image: '/assets/nav/tourist.webp', w: 275, h: 233, href: '/bookings' },
  { label: 'Shopping', image: '/assets/nav/shopping.webp', w: 162, h: 210, href: '/bookings?tab=shopping' },
]

/** "Bookings & transactions" — 172×172 tiles, 30 apart, then the "View all" pill on the right. */
export function ProfileBookingCategories({ className }: { className?: string }) {
  return (
    <section className={className}>
      <h2 className='text-[calc(24*var(--u))] leading-28 font-bold text-[#2C2D32]'>Bookings &amp; transactions</h2>

      {/* phones: a swipeable row; the padding keeps the tile shadows from being clipped */}
      <div className='mt-20'>
        <div className='scrollbar-hide -mx-16 -my-24 flex gap-18 overflow-x-auto px-16 py-24 lg:m-0 lg:gap-30 lg:overflow-visible lg:p-0'>
          {TILES.map(t => (
            <Link
              key={t.label}
              href={t.href}
              className={cn(
                'flex size-172 shrink-0 flex-col items-center justify-center gap-17 rounded-[calc(20.65*var(--u))] bg-[linear-gradient(180deg,rgba(255,255,255,0)_34.4%,#FFFFFF_100%)] shadow-[0_calc(6.6*var(--u))_calc(15.2*var(--u))_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-2',
                TILE_UNIT,
              )}
            >
              <Image
                src={t.image}
                alt=''
                width={t.w}
                height={t.h}
                className='h-101.5 w-91.25 object-contain drop-shadow-[0_calc(5.29*var(--u))_calc(5.29*var(--u))_rgba(0,0,0,0.1)]'
              />
              <span className='text-center text-[calc(19.82*var(--u))] leading-22 font-bold text-[#383838]'>{t.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className='mt-26 flex justify-end'>
        <Link
          href='/bookings'
          className='flex h-43 w-300 items-center justify-between rounded-[calc(27*var(--u))] border border-[#D5D5D5] bg-white px-20 text-[calc(14*var(--u))] leading-18 font-bold text-[#2C2D32] transition-colors hover:bg-[#FAFAFA]'
        >
          View all bookings &amp; transactions
          <ChevronRight className='size-18 text-[#8E8E93]' strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  )
}
