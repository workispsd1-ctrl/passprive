'use client'

import { useRouter } from 'next/navigation'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackBadgeArt } from '@/lib/cashback'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard } from '@/components/sections/home/MerchantCard'
import type { StoreRow } from '@/lib/types/stores'

/** Store / salon rail with the viewer's cashback badge (needs PlanProvider). */
export function StoreRail({ stores, hrefBase }: { stores: StoreRow[]; hrefBase: '/stores' | '/wellness' }) {
  const plan = useUserPlan()
  if (!stores.length) return null
  return (
    <HScroll maxWidthClassName='w-full max-w-none' className='py-2 md:py-3'>
      {stores.map(s => (
        <MerchantCard
          key={s.id}
          href={`${hrefBase}/${s.slug ?? s.id}`}
          saveId={s.id}
          saveType='STORE'
          image={s.cover_image ?? s.logo_url}
          name={s.name}
          meta={s.location_name ?? s.city ?? undefined}
          tagline={[s.category, s.subcategory].filter(Boolean).join(', ') || undefined}
          offerLabel={s.store_offers?.[0]?.discount_value ? `Flat ${s.store_offers[0].discount_value}% OFF` : s.store_offers?.[0]?.badge_text ?? undefined}
          cashbackArt={getCashbackBadgeArt(s, plan)}
        />
      ))}
    </HScroll>
  )
}

/**
 * Sticky bottom action — app parity: PriveCreditsScreen.jsx upgrade bar.
 * Shown only when this plan is an upgrade for the viewer.
 */
export function UpgradeBar({
  planId,
  planName,
  price,
  isLoggedIn,
  ctaBg,
  ctaColor,
}: {
  planId: string
  planName: string
  price: number
  isLoggedIn: boolean
  ctaBg: string
  ctaColor: string
}) {
  const router = useRouter()
  const { promptLogin } = useAuthPrompt()
  return (
    <div className='fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur'>
      <div className='mx-auto flex max-w-3xl items-center justify-between gap-4'>
        <div className='min-w-0'>
          <p className='truncate text-[14px] font-bold text-[#161616]'>{planName}</p>
          <p className='text-[12px] text-[#666666]'>MUR {price.toLocaleString()}/yr</p>
        </div>
        <button
          type='button'
          onClick={() => (isLoggedIn ? router.push(`/membership/checkout?plan=${encodeURIComponent(planId)}`) : promptLogin())}
          className='h-12 shrink-0 rounded-full px-7 text-[14px] font-bold transition-opacity hover:opacity-90'
          style={{ backgroundColor: ctaBg, color: ctaColor }}
        >
          Upgrade to {planName}
        </button>
      </div>
    </div>
  )
}
