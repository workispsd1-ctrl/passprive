'use client'

import { BadgePercent, Globe, Navigation, Phone } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { cn } from '@/lib/utils'
import type { HoursRow } from '@/lib/openingHours'
import { useOpenStatus } from './OpeningHours'
import { directionsUrl } from './MerchantActions'
import { AuthLink } from '@/components/shared/AuthLink'

export type CtaAction = { label: string; href: string; primary?: boolean }

/** "Earn 3% cashback on bill payment" — app parity: the bottom bar's cashback overlay. */
function CashbackLine({ merchant, className }: { merchant: MerchantCapabilityFields; className?: string }) {
  const pct = getCashbackPct(merchant, useUserPlan())
  if (!(pct > 0)) return null
  return (
    <p className={cn('flex items-center gap-1.5 text-[12.5px] text-gray-600', className)}>
      <BadgePercent className='size-4 shrink-0 text-brand' />
      <span>
        Earn <span className='font-bold text-brand'>{pct}% cashback</span> on bill payment
      </span>
    </p>
  )
}

function CtaButtons({ actions, size }: { actions: CtaAction[]; size: string }) {
  return actions.map(a => (
    // Book a table / Pay bill need an account — log in first when signed out
    <AuthLink
      key={a.href}
      href={a.href}
      className={cn(
        'flex flex-1 items-center justify-center rounded-full font-bold transition-colors',
        size,
        a.primary !== false
          ? 'bg-brand text-white shadow-[0_6px_16px_rgba(255,72,0,0.25)] hover:bg-brand-dark'
          : 'border border-brand text-brand hover:bg-brand-tint',
      )}
    >
      {a.label}
    </AuthLink>
  ))
}

/** Desktop sidebar action card — app parity: the sticky bottom actions ("Book a table" / "Pay bill"). */
export function CtaCard({
  title,
  subtitle,
  actions,
  merchant,
}: {
  title: string
  subtitle: string
  actions: CtaAction[]
  merchant: MerchantCapabilityFields
}) {
  if (!actions.length) return null
  return (
    <div className='rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]'>
      <h2 className='text-[18px] font-bold tracking-[-0.2px] text-gray-900'>{title}</h2>
      <p className='mt-1 text-[13px] leading-5 text-gray-500'>{subtitle}</p>
      <CashbackLine merchant={merchant} className='mt-4' />
      <div className='mt-5 flex flex-col gap-2.5'>
        <CtaButtons actions={actions} size='py-3.5 text-[15px]' />
      </div>
    </div>
  )
}

/** The same actions pinned to the bottom on phones. */
export function CtaMobileBar({ actions, merchant }: { actions: CtaAction[]; merchant: MerchantCapabilityFields }) {
  if (!actions.length) return null
  return (
    <div className='fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur md:hidden'>
      <CashbackLine merchant={merchant} className='mb-2 justify-center' />
      <div className='flex gap-3'>
        <CtaButtons actions={actions} size='py-3 text-[15px]' />
      </div>
    </div>
  )
}

/** Status, address, phone and website at a glance — desktop sidebar. */
export function QuickInfoCard({
  hours,
  address,
  lat,
  lng,
  phone,
  website,
  name,
}: {
  hours: HoursRow[]
  address: string
  lat?: number | null
  lng?: number | null
  phone?: string | null
  website?: string | null
  name: string
}) {
  const { status } = useOpenStatus(hours)
  const row = 'flex items-start gap-3 py-3 text-[13px] first:pt-0 last:pb-0'
  if (!status && !address && !phone && !website) return null
  return (
    <div className='rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]'>
      <p className='mb-3 text-[15px] font-bold text-gray-900'>Good to know</p>
      <div className='divide-y divide-gray-100'>
        {status && (
          <p className={row}>
            <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', status.isOpen ? 'bg-[#1BA94C]' : 'bg-[#E5484D]')} />
            <span>
              <span className={cn('font-semibold', status.isOpen ? 'text-[#167C3B]' : 'text-[#C2410C]')}>
                {status.isOpen ? 'Open now' : 'Closed'}
              </span>
              <span className='text-gray-500'> · {status.detail}</span>
            </span>
          </p>
        )}
        {address && (
          <a href={directionsUrl(lat, lng, address || name)} target='_blank' rel='noopener noreferrer' className={cn(row, 'group')}>
            <Navigation className='mt-0.5 size-4 shrink-0 text-gray-400 group-hover:text-brand' />
            <span className='text-gray-600'>
              {address}
              <span className='mt-0.5 block font-semibold text-brand'>Get directions</span>
            </span>
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className={cn(row, 'group')}>
            <Phone className='mt-0.5 size-4 shrink-0 text-gray-400 group-hover:text-brand' />
            <span className='font-medium text-gray-700 group-hover:text-brand'>{phone}</span>
          </a>
        )}
        {website && (
          <a href={website} target='_blank' rel='noreferrer' className={cn(row, 'group')}>
            <Globe className='mt-0.5 size-4 shrink-0 text-gray-400 group-hover:text-brand' />
            <span className='truncate font-medium text-gray-700 group-hover:text-brand'>
              {website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
            </span>
          </a>
        )}
      </div>
    </div>
  )
}
