import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getMembershipPlans, getUserMembership } from '@/lib/services/subscription'
import { getNewRestaurants } from '@/lib/services/dining'
import { getActiveStores, getWellnessStores } from '@/lib/services/stores'
import { getUserCoords } from '@/lib/location'
import { scopeStoresToRadius } from '@/lib/nearby'
import { amountOf, canUpgradeTo, currentPlanOf, dealsPoint, tierOf, visualOf } from '@/lib/membershipPlans'
import { HScroll } from '@/components/sections/home/HScroll'
import { FeedRestaurantCard } from '@/components/sections/dining/FeedRestaurantCard'
import { StoreRail, UpgradeBar } from './PlanExtras'

async function loadPlan(id: string) {
  const plans = await getMembershipPlans()
  return { plans, plan: plans.find(p => p.id === id) ?? null }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { plan } = await loadPlan(id)
  return plan ? { title: `${plan.plan_name.trim()} membership`, robots: { index: false } } : {}
}

// app parity: PriveCreditsScreen.jsx HERO_CONFIG (hero art) — CMS hero/badge override it
const HERO_BG: Record<string, string> = {
  black: '/membership/hero-black.webp',
  plus: '/membership/hero-plus.webp',
  free: '/membership/hero-free.webp',
}

const EXPLORE = [
  { key: 'dining', title: 'Explore Restaurants', icon: '/nav/dining.webp', prefix: 'Explore all in', bold: 'Dining', href: '/dining' },
  { key: 'stores', title: 'Explore stores near you', icon: '/nav/shopping.webp', prefix: 'Checkout stuff in', bold: 'Shopping', href: '/stores' },
  { key: 'wellness', title: 'Explore salons near you', icon: '/nav/wellness.webp', prefix: 'See all salons in', bold: 'Wellness', href: '/wellness' },
] as const

/**
 * "Know more" for a membership plan — app parity: Membership → Know more →
 * PriveCreditsScreen.jsx with that plan: tier hero, how it works, FAQ link,
 * explore rails and an upgrade bar.
 */
export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ plans, plan }, { data: { user } }, coords] = await Promise.all([loadPlan(id), supabase.auth.getUser(), getUserCoords()])
  if (!plan) notFound()

  const [membership, restaurants, allStores, salons] = await Promise.all([
    user ? getUserMembership(user.id) : Promise.resolve(null),
    getNewRestaurants(10, coords),
    getActiveStores().then(s => scopeStoresToRadius(s, coords)),
    getWellnessStores().then(s => scopeStoresToRadius(s, coords)),
  ])
  const stores = allStores.filter(s => (s.category ?? '').trim().toLowerCase() !== 'salon & wellness').slice(0, 10)

  const tier = tierOf(plan)
  const v = visualOf(plan)
  const price = amountOf(plan.amount)
  const cashback = plan.cashback_label?.trim() || (plan.cashback != null ? `${plan.cashback}%` : '0.5%')
  const current = currentPlanOf(plans, membership)
  const isCurrent = current ? current.id === plan.id : tier === 'free'
  const showUpgrade = !isCurrent && price > 0 && canUpgradeTo(plan, current)
  const heroBg = HERO_BG[tier] ?? null

  // app parity: PriveCreditsScreen.jsx buildHowItWorks
  const steps = [
    'Pay your bill with PassPrivé',
    `Earn up to ${cashback} cashback as Privé Credits instantly`,
    dealsPoint(plan),
    'Redeem on next payment on any bill (shopping, dining or wellness)',
    'Use the Privé Credits on top of all other offers & coupons',
  ]

  return (
    <main className={`min-h-screen bg-white font-(family-name:--font-dm-sans) ${showUpgrade ? 'pb-28' : 'pb-16'}`}>
      {/* Hero — the app's centred phone hero, adapted: a contained banner with
          the app's gold headline on the tier art (darkened for legibility) and,
          on desktop, a membership card for the plan on the right. */}
      <section className='mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-6'>
        <div className='relative overflow-hidden rounded-[28px]' style={{ backgroundColor: v.baseColor }}>
          {heroBg && <Image src={heroBg} alt='' fill className='scale-110 object-cover blur-[2px]' sizes='(max-width: 1200px) 100vw, 1152px' priority />}
          <div className='absolute inset-0 bg-linear-to-r from-black/70 via-black/45 to-black/20' />

          <div className='relative grid items-center gap-10 px-6 py-8 md:grid-cols-[1.15fr_1fr] md:px-12 md:py-12'>
            <div>
              <Link href='/membership' className='inline-flex items-center gap-1 text-[13px] font-semibold text-white/75 hover:text-white'>
                <ChevronLeft className='h-4 w-4' /> All plans
              </Link>

              <div className='mt-6'>
                {v.badge ? (
                  <Image src={v.badge} alt={plan.plan_name.trim()} width={308} height={132} className='h-11 w-auto' />
                ) : (
                  <span className='text-[24px] font-bold tracking-[0.4px] text-white'>{plan.plan_name.trim()}</span>
                )}
              </div>

              <h1 className='mt-5 text-[34px] leading-[1.1] font-medium tracking-[-0.6px] text-[#FDE5AA] md:text-[48px]'>
                Earn <em className='font-(family-name:--font-libre-baskerville) font-bold'>Privé</em> Credits
                <span className='block'>as you spend</span>
              </h1>

              <div className='my-5 h-px max-w-sm bg-white/40' />

              <p className='inline-flex rounded-full bg-white/15 px-4 py-2 text-[14px] font-semibold text-white backdrop-blur'>
                Get {cashback} cashback on every bill you pay
              </p>

              <div className='mt-6 flex flex-wrap items-center gap-3'>
                {price > 0 ? (
                  <p className='text-white'>
                    <span className='text-[26px] font-bold'>MUR {price.toLocaleString()}</span>
                    <span className='text-[16px] font-bold'>/yr</span>
                    {v.originalAmount && <span className='ml-2 text-[14px] text-white/55 line-through'>MUR {v.originalAmount.toLocaleString()}</span>}
                  </p>
                ) : (
                  <p className='text-[26px] font-bold text-white'>Free</p>
                )}
                {isCurrent && user && (
                  <span className='rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur'>Your current plan</span>
                )}
              </div>
            </div>

            {/* Membership card (desktop) */}
            <div className='hidden justify-center md:flex'>
              <div
                className='relative aspect-[1.6] w-full max-w-sm -rotate-3 overflow-hidden rounded-3xl border-[1.5px] shadow-[0_24px_60px_rgba(0,0,0,0.45)]'
                style={{ borderColor: v.borderColor, backgroundColor: v.baseColor }}
              >
                {heroBg && <Image src={heroBg} alt='' fill className='object-cover' sizes='384px' />}
                <div className='absolute inset-0 bg-linear-to-b from-white/5 via-black/10 to-black/50' />
                <div className='relative flex h-full flex-col justify-between p-6'>
                  <div className='flex items-start justify-between'>
                    {v.badge ? (
                      <Image src={v.badge} alt='' width={308} height={132} className='h-9 w-auto' />
                    ) : (
                      <span className='text-[18px] font-bold text-white'>{plan.plan_name.trim()}</span>
                    )}
                    <span className='text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase'>Member</span>
                  </div>
                  <div>
                    <p className='text-[40px] leading-none font-extrabold text-white'>{cashback}</p>
                    <p className='mt-1 text-[13px] text-white/75'>cashback as Privé Credits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className='mx-auto max-w-3xl px-4 md:px-8'>
        {/* How it works — app parity: dot timeline */}
        <section className='mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]'>
          <h2 className='text-[18px] font-bold text-[#161616]'>How it works</h2>
          <ol className='mt-4'>
            {steps.map((step, i) => (
              <li key={step} className='flex gap-3'>
                <span className='flex flex-col items-center'>
                  <span className='mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand' />
                  {i < steps.length - 1 && <span className='w-px flex-1 bg-brand/25' />}
                </span>
                <span className='pb-4 text-[14px] leading-5 text-[#424144]'>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ — app parity: "Check all FAQs" */}
        <Link href='/faq' className='mt-4 flex items-center justify-between rounded-2xl border border-gray-200 px-5 py-4 hover:bg-gray-50'>
          <span>
            <span className='block text-[14px] text-[#424144]'>Have more questions regarding Privé Credits?</span>
            <span className='text-[14px] font-semibold text-brand'>Check all FAQs</span>
          </span>
          <ChevronRight className='h-5 w-5 text-brand' />
        </Link>
      </div>

      {/* Explore rails */}
      {EXPLORE.map(e => {
        const rail =
          e.key === 'dining' ? (
            restaurants.length > 0 && (
              <HScroll maxWidthClassName='w-full max-w-none' className='py-2 md:py-3'>
                {restaurants.map(r => <FeedRestaurantCard key={r.id} r={r} />)}
              </HScroll>
            )
          ) : (
            <StoreRail stores={e.key === 'stores' ? stores : salons.slice(0, 10)} hrefBase={e.key === 'stores' ? '/stores' : '/wellness'} />
          )
        return (
          <section key={e.key} className='mx-auto mt-8 max-w-7xl'>
            <h2 className='px-4 text-[19px] font-bold text-[#0D141C] md:px-8 md:text-[20px]'>{e.title}</h2>
            {rail}
            <div className='px-4 md:px-8'>
              <Link href={e.href} className='mx-auto flex max-w-md items-center gap-3 rounded-full border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400'>
                <Image src={e.icon} alt='' width={28} height={28} className='h-7 w-7 object-contain' />
                <span className='flex-1 text-[14px] text-[#2C2D32]'>
                  {e.prefix} <span className='font-bold'>{e.bold}</span>
                </span>
                <ChevronRight className='h-5 w-5 text-[#2C2D32]' />
              </Link>
            </div>
          </section>
        )
      })}

      {user && (
        <div className='mx-auto mt-10 max-w-3xl px-4 md:px-8'>
          <Link href='/prive-credits' className='flex items-center justify-between rounded-2xl bg-brand-tint px-5 py-4 text-[14px] font-semibold text-[#161616] hover:bg-brand-tint-strong'>
            See your Privé Credits balance & transactions
            <ChevronRight className='h-5 w-5 text-brand' />
          </Link>
        </div>
      )}

      {showUpgrade && (
        <UpgradeBar
          planId={plan.id}
          planName={plan.plan_name.trim()}
          price={price}
          isLoggedIn={!!user}
          ctaBg={v.ctaBg ?? '#FF5200'}
          ctaColor={v.ctaColor ?? '#FFFFFF'}
        />
      )}
    </main>
  )
}
