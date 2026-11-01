'use client'

import Link from 'next/link'
import { BadgePercent } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { canBook, canPayBill, getCashbackPct } from '@/lib/cashback'
import type { ServiceStore } from '@/lib/types/stores'

function CashbackLine({ store }: { store: ServiceStore }) {
  const pct = getCashbackPct(store, useUserPlan())
  return (
    <p className='flex items-center gap-1.5 text-[12.5px] text-gray-600'>
      <BadgePercent className='size-4 shrink-0 text-brand' />
      {canPayBill(store) ? (
        <span>
          Earn {pct > 0 ? <span className='font-bold text-brand'>{pct}% cashback</span> : 'cashback'} on bill payment
        </span>
      ) : (
        <span>Bill-payment cashback is coming soon here</span>
      )}
    </p>
  )
}

function bookHref(store: ServiceStore) {
  return `/wellness/${store.slug ?? store.id}/book`
}

/**
 * Desktop sidebar card — app parity: ServiceStoreDetails.jsx bottom actions
 * ("Book a Slot" / "Pay bill"), shown only when the merchant supports either.
 * Store bill payment still lives in the app.
 */
export function ServiceBookingCard({ store, hasServices }: { store: ServiceStore; hasServices: boolean }) {
  const showBook = canBook(store) && hasServices
  if (!showBook && !canPayBill(store)) return null
  return (
    <div className='rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'>
      <h2 className='text-[18px] font-bold tracking-[-0.2px] text-gray-900'>{showBook ? 'Book a slot' : 'Pay your bill'}</h2>
      <p className='mt-1 text-[13px] leading-5 text-gray-500'>
        {showBook
          ? `Pick your services and a time at ${store.name}.`
          : `Pay with Privé Credits or card at ${store.name} in the PassPrivé app.`}
      </p>
      <div className='mt-4'><CashbackLine store={store} /></div>
      {showBook && (
        <Link
          href={bookHref(store)}
          className='mt-5 block rounded-full bg-brand py-3.5 text-center text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(255,72,0,0.25)] transition-colors hover:bg-brand-dark'
        >
          Book a slot
        </Link>
      )}
    </div>
  )
}

/** The same action pinned to the bottom on phones. */
export function ServiceBookingBar({ store, hasServices }: { store: ServiceStore; hasServices: boolean }) {
  const showBook = canBook(store) && hasServices
  if (!showBook && !canPayBill(store)) return null
  return (
    <div className='fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur md:hidden'>
      <div className='mb-2 flex justify-center'><CashbackLine store={store} /></div>
      {showBook ? (
        <Link href={bookHref(store)} className='block rounded-full bg-brand py-3 text-center text-[15px] font-bold text-white'>
          Book a slot
        </Link>
      ) : (
        <p className='text-center text-[12px] text-gray-500'>Pay your bill with Privé Credits in the PassPrivé app.</p>
      )}
    </div>
  )
}
