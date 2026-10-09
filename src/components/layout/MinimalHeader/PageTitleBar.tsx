'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { usePageTitle } from './PageTitleContext'

/**
 * Title row under the header on account pages — app parity: the app's
 * sub-screen header (round back button + bold title), e.g. Membership,
 * Wallet, Your bookings. The title comes from <SetPageTitle> on each page.
 */
export function PageTitleBar() {
  const router = useRouter()
  const { title } = usePageTitle()
  if (!title) return null
  return (
    <div className='mx-auto flex w-full max-w-5xl items-center gap-3.5 px-4 pt-6 pb-1 font-(family-name:--font-dm-sans) md:px-6'>
      <button
        type='button'
        aria-label='Back'
        onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 transition-colors hover:bg-black/10'
      >
        <ChevronLeft className='h-6 w-6 text-[#2C2D32]' strokeWidth={2} />
      </button>
      <h1 className='truncate text-[18px] leading-6 font-bold text-[#2C2D32] md:text-[22px]'>{title}</h1>
    </div>
  )
}
