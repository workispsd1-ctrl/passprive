'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocation } from '@/lib/context/LocationContext'

/**
 * "We're not here yet" — app parity: components/ServiceAreaGate.jsx (wraps
 * Home). When the location is outside Mauritius the page is swapped for this
 * message with a manual picker and a GPS retry; anywhere in Mauritius, or with
 * no location yet, the page shows as usual.
 */
export function ServiceAreaGate({ children }: { children: React.ReactNode }) {
  const { outsideServiceArea, detecting, detectFromGPS } = useLocation()

  if (!outsideServiceArea) return <>{children}</>

  return (
    <main className='flex min-h-[70vh] items-center justify-center bg-white px-8 py-16 font-(family-name:--font-dm-sans)'>
      {/* GlowEmptyContent: 225px art, 20/27 bold heading, 14/20 subtitle, 56px orange CTA, 15/20 orange link */}
      <div className='flex w-full max-w-sm flex-col items-center text-center'>
        <Image src='/assets/location/empty-location.webp' alt='' width={676} height={672} priority className='size-56.25' />
        <h1 className='mt-2 text-[20px] leading-6.75 font-bold text-[#2C2D32]'>We&apos;re not here yet</h1>
        <p className='mt-1.5 text-[14px] leading-5 text-[#595B61]'>
          PassPrivé is currently available only in Mauritius. Choose a location in Mauritius to explore restaurants, stores and offers.
        </p>
        <Link
          href='/location'
          className='mt-9 flex h-14 w-full items-center justify-center rounded-full bg-[#FF4800] text-[16px] leading-5.5 font-bold text-white transition-opacity hover:opacity-90'
        >
          Select location manually
        </Link>
        <button
          type='button'
          disabled={detecting}
          onClick={detectFromGPS}
          className='mt-4.5 py-1.5 text-[15px] leading-5 font-bold text-[#FF4800] transition-opacity hover:opacity-80 disabled:opacity-60'
        >
          {detecting ? 'Detecting…' : 'Retry auto-detecting location'}
        </button>
      </div>
    </main>
  )
}
