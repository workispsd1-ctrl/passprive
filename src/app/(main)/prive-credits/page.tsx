import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserMembership } from '@/lib/services/subscription'
import { getWalletBalance, getWalletTransactions } from '@/lib/services/wallet'
import { CreditsTransactions } from './CreditsTransactions'

export const metadata: Metadata = {
  title: 'Privé Credits',
  description: 'Earn cashback as Privé Credits every time you pay your bill with PassPrivé, and redeem it on your next payment.',
}

// app parity: PriveCreditsScreen.jsx HERO_CONFIG + buildHowItWorks
const HERO = {
  black: { bg: '/membership/hero-black.webp', badge: '/membership/BlackBadge.webp', cashback: '3%' },
  plus: { bg: '/membership/hero-plus.webp', badge: '/membership/PlusBadge.webp', cashback: '1.5%' },
  free: { bg: '/membership/hero-free.webp', badge: '/membership/FreeBadge.webp', cashback: '0.5%' },
} as const

const EXPLORE = [
  { href: '/dining', icon: '/nav/dining.webp', prefix: 'Explore', bold: 'Restaurants' },
  { href: '/stores', icon: '/nav/shopping.webp', prefix: 'Explore stores', bold: 'near you' },
  { href: '/wellness', icon: '/nav/wellness.webp', prefix: 'Explore salons', bold: 'near you' },
]

/** Privé Credits explainer + the member's credit history — app parity: PriveCreditsScreen.jsx. */
export default async function PriveCreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [membership, balance, transactions] = user
    ? await Promise.all([getUserMembership(user.id), getWalletBalance(user.id), getWalletTransactions(user.id)])
    : [null, null, []]

  // same tier rule as the header badge (Header.tsx)
  const raw = (membership?.membership_tier ?? 'none').toLowerCase()
  const tier: keyof typeof HERO = raw === 'none' ? 'free' : raw.includes('black') ? 'black' : 'plus'
  const hero = HERO[tier]

  const steps = [
    'Pay your bill with PassPrivé',
    `Earn up to ${hero.cashback} cashback as Privé Credits instantly`,
    'Redeem on your next payment on any bill (shopping, dining or wellness)',
    'Use Privé Credits on top of all other offers & coupons',
  ]

  return (
    <main className='min-h-screen bg-white pb-20 md:pb-10'>
      <div className='mx-auto max-w-3xl px-4 pt-6 md:px-8'>
        {/* Hero */}
        <section className='relative overflow-hidden rounded-3xl bg-gray-900 px-6 py-8 text-white md:px-10 md:py-10'>
          <Image src={hero.bg} alt='' fill className='object-cover' sizes='768px' priority />
          <div className='relative'>
            <Image src={hero.badge} alt='' width={308} height={132} className='h-9 w-auto' />
            <h1 className='mt-5 text-[34px] leading-tight md:text-[44px]'>
              <em className='font-(family-name:--font-libre-baskerville) font-bold italic'>Privé</em> Credits
            </h1>
            <p className='mt-1 text-[18px] text-white/90 md:text-[20px]'>as you spend</p>
            <p className='mt-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-[14px] font-semibold backdrop-blur'>
              Get {hero.cashback} cashback on every bill you pay
            </p>
            {balance && (
              <p className='mt-5 text-[14px] text-white/80'>
                Your balance <span className='ml-1 text-[22px] font-extrabold text-white'>Rs {Math.round(balance.balance).toLocaleString('en-US')}</span>
              </p>
            )}
          </div>
        </section>

        {tier !== 'black' && (
          <Link
            href='/membership'
            className='mt-4 flex items-center justify-between rounded-2xl border border-brand/20 bg-brand-tint px-5 py-4 text-[14px] font-semibold text-gray-900 hover:bg-brand-tint-strong'
          >
            Upgrade your membership to earn up to 3% cashback
            <ChevronRight className='h-4 w-4 text-brand' />
          </Link>
        )}

        {/* How it works */}
        <section className='mt-8'>
          <h2 className='text-[20px] font-bold text-gray-900'>How it works</h2>
          <ol className='mt-4 space-y-3'>
            {steps.map((s, i) => (
              <li key={s} className='flex items-start gap-3'>
                <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white'>{i + 1}</span>
                <span className='pt-0.5 text-[15px] text-gray-700'>{s}</span>
              </li>
            ))}
          </ol>
          <Link href='/faq' className='mt-5 flex items-center justify-between rounded-2xl border border-gray-200 px-5 py-4 hover:bg-gray-50'>
            <span>
              <span className='block text-[14px] text-gray-600'>Have more questions regarding Privé Credits?</span>
              <span className='text-[14px] font-semibold text-brand'>Check all FAQs</span>
            </span>
            <ChevronRight className='h-4 w-4 text-gray-400' />
          </Link>
        </section>

        {/* Explore */}
        <section className='mt-8 grid gap-3 md:grid-cols-3'>
          {EXPLORE.map(e => (
            <Link key={e.href} href={e.href} className='flex items-center gap-3 rounded-full border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400'>
              <Image src={e.icon} alt='' width={28} height={28} className='h-7 w-7 object-contain' />
              <span className='flex-1 text-[14px] text-gray-700'>
                {e.prefix} <span className='font-bold text-gray-900'>{e.bold}</span>
              </span>
              <ChevronRight className='h-4 w-4 text-gray-500' />
            </Link>
          ))}
        </section>

        {/* Transactions */}
        <section className='mt-10'>
          <h2 className='text-[20px] font-bold text-gray-900'>Transactions</h2>
          {user ? (
            <CreditsTransactions transactions={transactions} />
          ) : (
            <p className='mt-3 rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500'>
              Log in to see the Privé Credits you’ve earned and used.
            </p>
          )}
        </section>
      </div>
    </main>
  )
}
