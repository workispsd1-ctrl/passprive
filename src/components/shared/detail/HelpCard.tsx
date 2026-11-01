import Link from 'next/link'
import { ChevronRight, LifeBuoy } from 'lucide-react'
import { cn } from '@/lib/utils'

/** "Have queries or need help?" — app parity: FigmaHelpSupportCard / ServiceAboutSection's help row. */
export function HelpCard({ className }: { className?: string }) {
  return (
    <Link
      href='/support'
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border border-gray-100 bg-[#FFFBF2] px-5 py-4.5 font-(family-name:--font-dm-sans) transition-colors hover:border-amber-200',
        className,
      )}
    >
      <span className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600'>
        <LifeBuoy className='size-5.5' />
      </span>
      <span className='min-w-0 flex-1 basis-48'>
        <span className='block text-[15px] font-bold text-gray-900'>Have queries or need help?</span>
        <span className='block text-[13px] text-gray-500'>Our team usually replies within a few hours.</span>
      </span>
      <span className='ml-15 flex shrink-0 items-center gap-0.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-brand shadow-sm sm:ml-0'>
        Contact us <ChevronRight className='size-4' />
      </span>
    </Link>
  )
}
