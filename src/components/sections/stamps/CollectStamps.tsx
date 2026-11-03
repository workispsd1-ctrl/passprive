import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, CreditCard, Gift, LayoutGrid, Lock, Stamp, type LucideIcon } from 'lucide-react'
import { HScroll } from '@/components/sections/home/HScroll'
import { DESIGN_UNIT, TYPE_SCALE, t } from '@/components/sections/dining/designUnit'
import type { CollectStampsData } from '@/lib/services/visitRewards'
import { giftLabel, stampProgress, type StampCardData } from '@/lib/stamps'
import { cn } from '@/lib/utils'
import { NOTCH_PATH, STAMP_ASSETS, small } from './stampUi'

const A = STAMP_ASSETS

const STEPS: { n: string; Icon: LucideIcon; title: string; body: string }[] = [
  { n: '01', Icon: CreditCard, title: 'Pay at eligible places', body: 'Use PassPrivé to pay at any restaurant, salon or store with the stamp sheet icon.' },
  { n: '02', Icon: Stamp, title: 'Earn a stamp', body: 'Every payment earns you one stamp towards your loyalty sheet.' },
  { n: '03', Icon: LayoutGrid, title: 'Fill your sheet', body: 'Collect all the stamps by paying' },
  { n: '04', Icon: Gift, title: 'Get your reward', body: 'Unlock a free gift, offer, or cash back from your favourite spot after completing the number.' },
]


/** A soft wavy rosette, centred on (60, 60). */
function rosette(radius: number) {
  const points = Array.from({ length: 144 }, (_, i) => {
    const angle = (i / 144) * Math.PI * 2
    const r = radius * (1 + 0.055 * Math.cos(angle * 12))
    return `${(60 + Math.cos(angle) * r).toFixed(2)} ${(60 + Math.sin(angle) * r).toFixed(2)}`
  })
  return `M${points.join('L')}Z`
}
const ROSETTE_OUTER = rosette(52)
const ROSETTE_INNER = rosette(31)

function Medal({ id, className, style }: { id: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 120 158' aria-hidden='true' className={className} style={style}>
      <defs>
        <linearGradient id={`${id}-outer`} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#8F96C4' stopOpacity='0.85' />
          <stop offset='0.65' stopColor='#5F74D2' stopOpacity='0.9' />
          <stop offset='1' stopColor='#2F68F0' />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0' stopColor='#ECECF2' />
          <stop offset='0.55' stopColor='#CDD1E3' />
          <stop offset='1' stopColor='#6F90EA' />
        </linearGradient>
      </defs>
      <path d='M34 92h52v58a5 5 0 0 1-8 4l-18-13-18 13a5 5 0 0 1-8-4z' fill='#2F68F0' />
      <path d={ROSETTE_OUTER} fill={`url(#${id}-outer)`} />
      <path d={ROSETTE_INNER} fill={`url(#${id}-inner)`} stroke='#E9734A' strokeWidth='1.6' />
    </svg>
  )
}

function Hero() {
  return (
    <section
      className='relative overflow-hidden text-white'
      style={{ background: 'radial-gradient(60% 130% at 0% 0%, #A5472D 0%, rgba(165,71,45,0) 62%), radial-gradient(45% 130% at 100% 100%, #C2552B 0%, rgba(194,85,43,0) 65%), radial-gradient(35% 90% at 100% 0%, #7A3A40 0%, rgba(122,58,64,0) 70%), #050F5C' }}
    >
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8' style={{ minHeight: t(360) }}>
        <h1 className='font-light' style={{ fontSize: small(52, 26), lineHeight: 1.2 }}>
          Collect stamps,
          <span className='block font-(family-name:--font-libre-baskerville) font-bold italic' style={{ fontSize: small(62, 30) }}>
            <span className='text-[#FFD9C7]'>unlock</span> rewards
          </span>
        </h1>
        <div className='relative flex shrink-0 items-end' aria-hidden='true' style={{ paddingTop: t(36), paddingBottom: t(30) }}>
          <Medal id='m-left' style={{ width: t(190), marginRight: t(-58) }} />
          <Medal id='m-mid' className='relative z-1' style={{ width: t(220), marginBottom: t(46) }} />
          <Medal id='m-right' style={{ width: t(190), marginLeft: t(-58) }} />
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className='mx-auto max-w-7xl py-6 md:py-10'>
      <h2 className='px-4 text-[19px] font-bold text-[#0D141C] md:px-8 md:text-[20px] xl:text-[22px] 2xl:text-[26px] min-[120rem]:text-[32px]'>How it works</h2>
      <ol className='scrollbar-hide flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pt-4 pb-5 md:grid md:grid-cols-4 md:overflow-visible md:px-8 lg:gap-4 min-[120rem]:gap-6'>
        {STEPS.map(({ n, Icon, title, body }) => (
          <li key={n} className='w-64 shrink-0 snap-start rounded-2xl border border-[#F0F0F0] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] md:w-auto' style={{ padding: `max(14px, ${t(24)})` }}>
            <div className='flex items-center justify-between'>
              <span className='flex items-center justify-center rounded-full bg-[#E9561F] text-white' style={{ width: small(42, 32), height: small(42, 32) }}>
                <Icon style={{ width: small(22, 16), height: small(22, 16) }} />
              </span>
              <span className='rounded-full bg-[#E9561F] font-semibold text-white' style={{ fontSize: small(14, 11), padding: `${t(2)} ${small(12, 8)}` }}>{n}</span>
            </div>
            <p className='font-semibold text-[#1A1A1A]' style={{ marginTop: small(22, 14), fontSize: small(16, 13) }}>{title}</p>
            <p className='text-[#7A7A7A]' style={{ marginTop: t(6), fontSize: small(14, 12), lineHeight: 1.4 }}>{body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function StampCard({ card, icon, columns, priority }: { card: StampCardData; icon?: string; /** the rail's cards per row; omit to fill a grid cell */ columns?: 3 | 4; priority?: boolean }) {
  const { visits, total, complete } = stampProgress(card)
  return (
    <Link
      href={card.href}
      className={cn(
        'block shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-md:w-64',
        columns === 4 && 'md:w-[calc((100%-3*var(--gap))/4)]',
        columns === 3 && 'md:w-[calc((100%-2*var(--gap))/3)]',
        !columns && 'max-md:w-full',
      )}
    >
      <span className='relative block bg-gray-100' style={{ height: small(220, 150) }}>
        <Image src={card.image} alt={card.name} fill priority={priority} className='object-cover' sizes={columns === 4 ? '(min-width: 768px) 25vw, 256px' : '(min-width: 768px) 33vw, 256px'} />
        {icon && (
          <span className='absolute bottom-0 left-0' style={{ width: small(62, 48), height: small(57, 44) }}>
            <svg viewBox='0 0 62 58' className='absolute inset-0 size-full' aria-hidden='true'><path d={NOTCH_PATH} fill='#fff' /></svg>
            <Image src={icon} alt='' width={21} height={28} className='absolute object-contain' style={{ left: '16%', top: '46%', width: '36%', height: '50%' }} />
          </span>
        )}
      </span>
      <span className='block' style={{ padding: `${small(14, 10)} ${small(18, 12)}` }}>
        <span className='block truncate font-semibold text-[#1A1A1A]' style={{ fontSize: small(16, 13) }}>{card.name}</span>
        <span className='block truncate text-[#7A7A7A]' style={{ marginTop: t(2), fontSize: small(14, 12) }}>{card.location}</span>
      </span>
      <span className='block border-t border-[#EFEFEF]' style={{ padding: `${small(14, 10)} ${small(18, 12)}` }}>
        <span className='flex items-center' style={{ gap: small(8, 6) }}>
          <Image src={`${A}/repeat-reward.webp`} alt='' width={88} height={102} className='object-contain' style={{ width: small(20, 16), height: small(24, 19) }} />
          <span className='flex-1 font-medium text-[#2C2D32]' style={{ fontSize: small(14, 12) }}>{visits} / {total} visits</span>
          <Lock className={complete ? 'text-[#F2620F]' : 'text-[#6B7280]'} style={{ width: small(18, 14), height: small(18, 14) }} />
        </span>
        <span className='mt-2 inline-block max-w-full truncate rounded-full bg-[#FFEDE5] font-semibold text-[#F2620F]' style={{ fontSize: small(13, 11), padding: `${small(4, 3)} ${small(12, 9)}` }}>
          {giftLabel(card)}
        </span>
      </span>
    </Link>
  )
}

function Section({ title, cards, icon, prefix, word, href, columns }: { title: string; cards: StampCardData[]; icon: string; prefix: string; word: string; href: string; columns: 3 | 4 }) {
  if (!cards.length) return null
  return (
    <div className='pb-4 md:pb-8'>
      <HScroll title={title} className='py-0! md:py-0!' gapClassName='gap-3 [--gap:12px] lg:gap-4 lg:[--gap:16px] min-[120rem]:gap-6 min-[120rem]:[--gap:24px]'>
        {cards.map((card, i) => <StampCard key={card.id} card={card} icon={icon} columns={columns} priority={columns === 4 && i < 4} />)}
      </HScroll>
      <div className='mt-1 flex justify-center px-4'>
        <Link href={href} className='flex items-center justify-between rounded-full border border-[#D9D9D9] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:bg-gray-50' style={{ width: small(340, 260), padding: `${small(8, 7)} ${small(20, 14)}`, gap: small(12, 8), fontSize: small(15, 13) }}>
          <Image src={icon} alt='' width={190} height={211} className='object-contain' style={{ width: small(32, 24), height: small(32, 24) }} />
          <span className='flex-1 text-[#2C2D32]'>{prefix} <b className='font-semibold'>{word}</b></span>
          <ChevronRight className='text-[#6B7280]' style={{ width: small(20, 16), height: small(20, 16) }} />
        </Link>
      </div>
    </div>
  )
}

/** Figma "Collect stamps" — what, how and where to collect. Data and links follow the app's CollectStampsScreen. */
export function CollectStamps({ data }: { data: CollectStampsData }) {
  return (
    <main
      className={cn('min-h-screen bg-white pb-16 font-(family-name:--font-dm-sans) max-md:[--t:0.62px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
    >
      <Hero />
      <HowItWorks />
      <Section title='Collect at Restaurants' cards={data.restaurants} icon={`${A}/dining.webp`} prefix='Explore all in' word='Dining' href='/visit-rewards?mode=sheets' columns={4} />
      <Section title='Collect at Salons & Spas' cards={data.salons} icon={`${A}/wellness.webp`} prefix='See all salons in' word='Wellness' href='/visit-rewards?mode=sheets' columns={3} />
      <Section title='Collect at Stores' cards={data.stores} icon={`${A}/shopping.webp`} prefix='Checkout stuff in' word='Shopping' href='/visit-rewards?mode=sheets' columns={3} />
    </main>
  )
}
