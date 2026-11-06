import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const CARD = 'relative block h-200 w-[min(calc(509*var(--u)),82vw)] shrink-0 snap-start overflow-hidden rounded-[calc(20*var(--u))] lg:w-auto'
// "TOTAL CASH BACK" chip — 12/16 bold, 0.2em tracking, black/40 on a white 1px border
const CHIP = 'absolute top-18 left-24 flex h-24 items-center rounded-[calc(26*var(--u))] border border-white bg-black/40 px-8 text-[calc(12*var(--u))] leading-16 font-bold tracking-[0.2em] text-white uppercase'
const VALUE = 'absolute left-24 text-[calc(32*var(--u))] leading-40 font-bold text-[#FFF0CE] [text-shadow:0_calc(4.15*var(--u))_calc(4.15*var(--u))_rgba(0,0,0,0.1)]'
// the illustration's own backdrop fades into the card gradient on the left
const ART = 'pointer-events-none absolute right-0 bottom-0 aspect-[692/532] h-260 w-auto max-w-none [mask-image:linear-gradient(to_right,transparent,black_35%)]'

function LearnMore() {
  return (
    <span className='absolute top-154 left-24 flex h-22 w-93 items-center justify-center gap-4 rounded-[calc(11.25*var(--u))] bg-white font-(family-name:--font-inter) text-[calc(12*var(--u))] leading-16 font-medium text-[#0044FF]'>
      Learn more
      <ArrowRight className='size-11' strokeWidth={2.4} />
    </span>
  )
}

/** Total cash back · Total savings · Stamp rewards — 3 × (509.33×200), 24 apart. */
export function ProfileStatCards({ credits, stamps, className }: { credits: number; stamps: number; className?: string }) {
  return (
    <div className={cn('scrollbar-hide -mx-16 flex snap-x scroll-px-16 gap-12 overflow-x-auto px-16 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-24 lg:overflow-visible lg:px-0', className)}>
      {/* Cash back */}
      <Link href='/prive-credits' className={cn(CARD, 'bg-[linear-gradient(180deg,#FF4800_-30%,#0044FF_160%)]')}>
        <Image src='/assets/profile/card-cashback.webp' alt='' fill sizes='(min-width: 1024px) 27vw, 82vw' className='object-cover object-right' />
        <span className={CHIP}>Total cash back</span>
        <span className={cn(VALUE, 'top-55')}>{credits.toLocaleString('en-US')}</span>
        <span className='absolute top-98 left-24 flex items-baseline gap-4 text-white'>
          <span className='leading-18'>
            <em className='font-(family-name:--font-libre-baskerville) text-[calc(16.88*var(--u))] font-bold tracking-[calc(-0.85*var(--u))] [text-shadow:0_calc(1.6*var(--u))_calc(1.6*var(--u))_rgba(0,0,0,0.1)]'>Privé</em>{' '}
            <span className='text-[calc(17.94*var(--u))] tracking-[calc(-0.95*var(--u))] text-[#FFF0CE] [text-shadow:0_calc(2.2*var(--u))_calc(2.2*var(--u))_rgba(0,0,0,0.25)]'>Credits</span>
          </span>
          <span className='text-[calc(16*var(--u))] leading-20 font-bold'>earned</span>
        </span>
        <span className='absolute top-124 left-24 text-[calc(13.05*var(--u))] leading-13 tracking-[calc(-0.69*var(--u))] text-white [text-shadow:0_calc(1.6*var(--u))_calc(1.6*var(--u))_rgba(0,0,0,0.25)]'>
          (1 <em className='font-(family-name:--font-libre-baskerville) text-[calc(12.28*var(--u))] font-bold tracking-[calc(-0.62*var(--u))]'>Privé</em>{' '}
          <span className='text-[#FFF0CE]'>Credit</span> = 1 Rs)
        </span>
        <LearnMore />
      </Link>

      {/* Total savings — not tracked yet, same as the profile drawer */}
      <div className={cn(CARD, 'bg-[linear-gradient(180deg,#2C7B44_0%,#FFFFFF_100%)]')}>
        <Image src='/assets/profile/card-savings.webp' alt='' width={692} height={532} className={ART} />
        <span className={CHIP}>Total savings</span>
        <span className={cn(VALUE, 'top-62')}>Coming soon</span>
      </div>

      {/* Stamp rewards */}
      <Link href='/visit-rewards' className={cn(CARD, 'bg-[linear-gradient(180deg,#002280_0%,#FFFFFF_100%)]')}>
        <Image src='/assets/profile/card-stamps.webp' alt='' width={692} height={532} className={ART} />
        <span className={CHIP}>Stamp rewards</span>
        <span className={cn(VALUE, 'top-62')}>{stamps.toLocaleString('en-US')}</span>
        <span className='absolute top-104 left-24 text-[calc(16*var(--u))] leading-15 font-bold text-white'>collected</span>
        <LearnMore />
      </Link>
    </div>
  )
}
