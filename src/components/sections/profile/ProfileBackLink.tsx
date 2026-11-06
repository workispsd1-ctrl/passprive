'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

/** "‹ Back" — 24/31 semibold #FF4800, chevron in a 40×40 box. */
export function ProfileBackLink() {
  const router = useRouter()
  return (
    <button
      type='button'
      onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
      className='-ml-11 flex h-40 items-center gap-2 text-[calc(24*var(--u))] leading-31 font-semibold text-[#FF4800] hover:opacity-80'
    >
      <ChevronLeft className='size-40' strokeWidth={1.8} />
      Back
    </button>
  )
}
