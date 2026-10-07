'use client'

import Link from 'next/link'
import { Info } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { canBook, canPayBill, getCashbackPct } from '@/lib/cashback'
import type { ServiceStore } from '@/lib/types/stores'

function CashbackLine({ store }: { store: ServiceStore }) {
  const pct = getCashbackPct(store, useUserPlan())
  return (
    <p className='flex items-center gap-1 text-[12px] text-gray-600'>
      {canPayBill(store) ? (
        <span>
          Earn {pct > 0 ? <span className='font-bold text-[#FF4800]'>{pct}% cashback</span> : 'cashback'} on bill payment
        </span>
      ) : (
        <span>Earn cashback on bill payment (Coming soon)</span>
      )}
      <Info className='h-3.5 w-3.5 text-gray-400' />
    </p>
  )
}

/**
 * app parity: ServiceStoreDetails.jsx bottom actions ("Book a Slot" /
 * "Pay bill"), shown only when the merchant supports either. "Book a slot"
 * opens the web booking flow; store bill payment still lives in the app.
 */
export function ServiceBookingCard({ store, hasServices }: { store: ServiceStore; hasServices: boolean }) {
  const showBook = canBook(store)
  const showPay = canPayBill(store)
  if (!showBook && !showPay) return null

  const bookButton = showBook && hasServices && (
    <Link
      href={`/wellness/${store.slug ?? store.id}/book`}
      className='block w-full rounded-xl bg-gray-900 py-3.5 text-center text-[14px] font-bold text-white transition-colors hover:bg-black'
    >
      Book a slot
    </Link>
  )

  return (
    <>
      <div className='sticky top-20 hidden pt-4 md:block'>
        <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
          <div>
            <h2 className='text-[17px] font-extrabold text-gray-900'>
              {showBook ? 'Book a slot' : 'Pay your bill'}
            </h2>
            <p className='mt-1 text-sm text-gray-500'>
              {showBook
                ? `Pick your services and a time at ${store.name}.`
                : `Pay with PP points or cash at ${store.name} in the PassPrivé app.`}
            </p>
          </div>
          <CashbackLine store={store} />
          {bookButton}
        </div>
      </div>

      <div className='fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white p-4 shadow-lg md:hidden'>
        <div className='mb-2 flex justify-center'>
          <CashbackLine store={store} />
        </div>
        {bookButton || (
          <p className='text-center text-[12px] text-gray-500'>Pay your bill with PP points or cash in the PassPrivé app.</p>
        )}
      </div>
    </>
  )
}
