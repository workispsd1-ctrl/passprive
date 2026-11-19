'use client'

import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, CircleAlert, Navigation } from 'lucide-react'
import { fmtMur, type PendingBillPayment } from '@/lib/payBill'
import { cn } from '@/lib/utils'
import { OC_PAGE, OC_UNIT } from './unit'

/**
 * app parity: OrderPlacedScreen's order id — "PCO-" and six digits. The app
 * makes up a random one; here it comes from the payment session, so it stays
 * the same if the page is reloaded.
 */
export function orderIdFor(sessionId: string) {
  let h = 0
  for (const ch of sessionId) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `PCO-${100000 + (h % 900000)}`
}

/** app parity: OrderPlacedScreen handleDirections — the coordinates, else the name and area. */
function directionsUrl(bill: PendingBillPayment) {
  const lat = Number(bill.lat)
  const lng = Number(bill.lng)
  const query = bill.lat != null && bill.lng != null && Number.isFinite(lat) && Number.isFinite(lng)
    ? `${lat},${lng}`
    : [bill.restaurantName, bill.location].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function Detail({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-24 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#2C2D32] max-lg:text-[15px] max-lg:leading-22', strong && 'font-bold')}>
      <span className='min-w-0'>{label}</span>
      <span className='shrink-0 text-right'>{value}</span>
    </div>
  )
}

/**
 * After an Order & Collect payment — app parity: OrderPlacedScreen.jsx (its
 * text, the order type, "15 - 20 mins", a PCO order id, the items and the
 * amount, help, Get directions). Laid out as the Figma "Order confirmation"
 * frame: the green confirmation card beside the order details.
 */
export function OrderPlacedView({ bill }: { bill: PendingBillPayment }) {
  const back = bill.merchantHref || (bill.restaurantId ? `/dining/${bill.restaurantId}` : '/')
  const toBePaid = bill.paidAmount || bill.originalAmount
  return (
    <div className={cn(OC_PAGE, OC_UNIT, 'px-172 pt-40 pb-80 md:mt-0 max-lg:px-16 max-lg:pt-12 max-lg:pb-40')}>
      {/* Figma "Desktop header": the restaurant (32/40) and its area (16/24) */}
      <header className='flex h-80 items-start max-lg:h-auto'>
        <Link href={back} aria-label={`Back to ${bill.restaurantName}`} className='-ml-8 flex size-40 items-center justify-center rounded-full text-[#938F96] transition-colors hover:bg-black/5 max-lg:-ml-10 max-lg:size-36'>
          <ChevronLeft className='size-24' />
        </Link>
        <span className='ml-8 min-w-0'>
          <h1 className='truncate text-[calc(32*var(--u))] leading-[calc(40*var(--u))] font-bold text-[#2C2D32] max-lg:text-[22px] max-lg:leading-30'>{bill.restaurantName}</h1>
          {bill.location && <p className='mt-6 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#2C2D32] max-lg:mt-0 max-lg:text-[14px] max-lg:leading-20'>{bill.location}</p>}
        </span>
      </header>

      <div className='mt-56 grid grid-cols-2 items-start gap-32 max-lg:mt-16 max-lg:grid-cols-1 max-lg:gap-24'>
        {/* Figma "Order placed": #F3FFF6 card, the tick in three greens, 32 + 52 headline */}
        <section className='flex h-736 flex-col items-center rounded-[calc(24*var(--u))] bg-[#F3FFF6] px-80 pt-100 text-center max-lg:h-auto max-lg:rounded-[20px] max-lg:px-20 max-lg:py-40'>
          <span className='flex size-[calc(82.5*var(--u))] items-center justify-center rounded-full bg-[#CEE8D5] max-lg:size-72'>
            <span className='flex size-[calc(70.5*var(--u))] items-center justify-center rounded-full bg-[#9DD1AB] max-lg:size-62'>
              <span className='flex size-[calc(57.5*var(--u))] items-center justify-center rounded-full bg-[#3AA456] text-white max-lg:size-50'>
                <Check className='size-[calc(28*var(--u))] max-lg:size-24' strokeWidth={3} />
              </span>
            </span>
          </span>
          <p className='mt-[calc(61.5*var(--u))] text-[calc(32*var(--u))] leading-[calc(40*var(--u))] font-bold text-[#3AA456] max-lg:mt-24 max-lg:text-[24px] max-lg:leading-32'>Order placed</p>
          <p className='mt-32 text-[calc(52*var(--u))] leading-[calc(60*var(--u))] font-bold text-[#2C7B44] max-lg:mt-12 max-lg:text-[34px] max-lg:leading-40'>
            You&rsquo;ll pay<br />at the store
          </p>
        </section>

        {/* Figma "Order details" */}
        <section className='min-w-0'>
          <h2 className='text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold text-[#2C2D32] max-lg:text-[19px] max-lg:leading-26'>Order details</h2>
          <div className='mt-32 flex flex-col gap-36 max-lg:mt-16 max-lg:gap-16'>
            <Detail label='Order type' value='Order & collect' />
            <Detail label='Estimated ready time' value='15 - 20 mins' />
            <Detail label='Order ID' value={orderIdFor(bill.sessionId)} />
          </div>
          <div className='mt-60 flex flex-col gap-36 max-lg:mt-28 max-lg:gap-16'>
            {bill.orderItems?.map(item => (
              <Detail key={item.id} label={`${item.qty} x ${item.name}`} value={`MUR ${fmtMur(item.price * item.qty)}`} />
            ))}
            <Detail label='To be paid' value={`MUR ${fmtMur(toBePaid)}`} strong />
          </div>

          {/* Figma "Payment support" */}
          <Link href='/help' className='mt-100 flex h-90 items-center justify-between gap-16 rounded-[calc(18*var(--u))] bg-[#FFF1CF] px-24 max-lg:mt-32 max-lg:h-auto max-lg:rounded-[16px] max-lg:px-16 max-lg:py-14'>
            <span className='text-[calc(18*var(--u))] leading-[calc(24*var(--u))] font-medium max-lg:text-[15px] max-lg:leading-22'>
              <span className='block text-[#252525]'>Need help with this payment?</span>
              <span className='flex items-center gap-2 text-[#FF4800]'>Contact help &amp; support <ChevronRight className='size-16' /></span>
            </span>
            <CircleAlert className='size-[calc(40*var(--u))] shrink-0 text-[#E0A64B] max-lg:size-26' />
          </Link>

          <a
            href={directionsUrl(bill)}
            target='_blank'
            rel='noreferrer'
            className='mt-30 flex h-72 items-center justify-center gap-12 rounded-full bg-[#FF4800] text-[calc(24*var(--u))] leading-[calc(31*var(--u))] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-[#E64200] max-lg:mt-16 max-lg:h-54 max-lg:text-[17px]'
          >
            Get directions <Navigation className='size-[calc(30*var(--u))] max-lg:size-20' />
          </a>
        </section>
      </div>
    </div>
  )
}
