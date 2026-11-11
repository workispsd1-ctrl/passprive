'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronRight, Tag } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import type { MerchantCapabilityFields } from '@/lib/cashback'
import type { BillOffer } from '@/lib/payBill'
import { computeSampleBill, sampleBase } from '@/lib/sampleBill'
import { cn } from '@/lib/utils'
import type { DiscountCaps } from '@/lib/services/membershipCaps'
import type { RestaurantDeal } from '@/lib/deals'
import { stampColor } from '@/lib/stamps'
import { SampleBillDialog } from './sampleBill/SampleBillDialog'
import { t, tMin } from './designUnit'

const CARD = 'relative bg-white drop-shadow-[0_8px_23.8px_rgba(0,0,0,0.1)]'

/** "Collect stamps here" — how far the member is, linking to the stamp card. */
export function StampSideCard({ href, image, visits, total }: { href: string; image: string | null; visits: number; total: number }) {
  return (
    <Link href={href} className={`${CARD} flex hover:bg-gray-50`} style={{ padding: tMin(14, 10), gap: tMin(14, 10), borderRadius: t(20) }}>
      <span className='relative shrink-0 overflow-hidden rounded-xl bg-gray-100' style={{ width: tMin(120, 72), height: tMin(104, 72) }}>
        {image && <Image src={image} alt='' fill sizes='120px' className='object-cover' />}
      </span>
      <span className='min-w-0 flex-1'>
        <span className='flex items-center justify-between font-semibold text-[#252427]' style={{ fontSize: tMin(15, 13), gap: 6 }}>
          Collect stamps here
          <ChevronRight className='shrink-0 text-[#666]' style={{ width: tMin(16, 13), height: tMin(16, 13) }} />
        </span>
        <span className='block text-[#767677]' style={{ marginTop: t(3), fontSize: tMin(12, 11) }}>Win a reward after {total} stamp collections</span>
        <span className='flex flex-wrap' style={{ marginTop: tMin(8, 6), gap: tMin(4, 3) }}>
          {Array.from({ length: total }).map((_, i) => (
            i < visits ? (
              <span key={i} className='flex items-center justify-center rounded-full text-white' style={{ width: tMin(17, 13), height: tMin(17, 13), backgroundColor: stampColor(i, total) }}>
                <Check strokeWidth={3.4} style={{ width: tMin(10, 8), height: tMin(10, 8) }} />
              </span>
            ) : (
              <span key={i} className='rounded-full border border-[#d9d9d9]' style={{ width: tMin(17, 13), height: tMin(17, 13) }} />
            )
          ))}
        </span>
        <span className='flex items-center font-medium text-[#2c2d32]' style={{ marginTop: tMin(8, 6), gap: tMin(6, 4), fontSize: tMin(12, 11) }}>
          <Image src='/assets/stamps/repeat-reward.webp' alt='' width={88} height={102} className='object-contain' style={{ width: tMin(14, 11), height: tMin(16, 13) }} />
          {visits} / {total} visits
        </span>
      </span>
    </Link>
  )
}

const money = (n: number) => `MUR ${Math.round(Number(n) || 0).toLocaleString('en-US')}`

/** app parity: SampleBill.jsx savingsLine */
function savingsLine(bill: { saved: number; credits: number }) {
  if (bill.saved > 0 && bill.credits > 0) return `${money(bill.saved)} + get ${bill.credits} Privé Credits`
  if (bill.saved > 0) return money(bill.saved)
  return `${bill.credits} Privé Credits`
}

/** The ticket's scalloped edge — a row of white bites (app: Scallops, 12px). */
function Scallops({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <span
      aria-hidden='true'
      className='pointer-events-none absolute inset-x-0 h-3'
      style={{
        [edge]: -6,
        backgroundImage: 'radial-gradient(circle, #fff 5.5px, transparent 6px)',
        backgroundSize: '12.4px 12px',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center',
      }}
    />
  )
}

/**
 * "Sample Bill" — app parity: SampleBill.jsx (the inline ticket: estimated
 * bill for 2 guests, what you pay, "Save up to" and "Calculate savings on any
 * bill amount", which opens the full sample bill). Only where bills can be
 * paid (app: showPayBillCta); hidden when there's nothing to save or earn.
 */
export function SampleBillCard({
  costForTwo: listedCost,
  offers,
  caps,
  merchant,
  payHref,
  bookHref,
  dealRows,
  className,
}: {
  costForTwo: number | null
  offers: BillOffer[]
  caps: DiscountCaps
  merchant: MerchantCapabilityFields
  payHref: string | null
  bookHref: string | null
  dealRows: RestaurantDeal[]
  className?: string
}) {
  const plan = useUserPlan()
  const [billOpen, setBillOpen] = useState(false)
  // app: listedCost falls back to 2000 when the restaurant has none
  const cost = listedCost && listedCost > 0 ? listedCost : 2000
  const subtotal = sampleBase(cost, offers.filter(o => o.source === 'MERCHANT'))
  const bill = useMemo(
    () => computeSampleBill({ subtotal, merchant, offers, dealRows, plan, caps }),
    [subtotal, merchant, offers, dealRows, plan, caps],
  )
  if (!payHref || (bill.saved <= 0 && bill.credits <= 0)) return null

  return (
    // phones: the app's fixed sizes; md+: the design scale (--t), floored for laptops
    <section className={cn('flex flex-col gap-3 font-(family-name:--font-dm-sans) text-[14px] md:text-[length:max(12px,calc(14*var(--t)))]', className)}>
      {/* css.txt "Sample Bill": 16/22 Regular */}
      <h2 className='text-center text-[16px] leading-[1.375] text-[#2c2d32] md:text-[length:max(13px,calc(16*var(--t)))]'>Sample Bill</h2>
      <div className='relative overflow-hidden bg-[#FFF3EC] text-[#1C1C1E]'>
        <Scallops edge='top' />
        <div className='flex flex-col gap-3 px-4 pt-5.5 pb-3.5 md:px-[max(10px,calc(16*var(--t)))]'>
          <div className='flex items-center justify-between gap-3'>
            <span className='min-w-0'>Estimated bill for 2 guests</span>
            <span className='shrink-0 font-medium'>{money(bill.subtotal)}</span>
          </div>
          <div className='flex items-center justify-between gap-3'>
            <span className='min-w-0'>You pay</span>
            <span className='shrink-0 font-medium'>{money(bill.youPay)}</span>
          </div>
          <span className='h-px bg-black/8' />
          <div className='flex items-center justify-between gap-3'>
            <span className='flex shrink-0 items-center gap-2 font-medium whitespace-nowrap text-[#FF6A30]'>
              <Tag className='size-4 shrink-0 fill-[#FF6A30]' />
              {bill.saved > 0 ? 'Save up to' : 'Earn'}
            </span>
            <span className='min-w-0 rounded bg-[#FF6A30] px-2 py-1 text-right text-[13px] font-bold text-white md:text-[length:max(11px,calc(13*var(--t)))]'>{savingsLine(bill)}</span>
          </div>
        </div>
        <button
          type='button'
          onClick={() => setBillOpen(true)}
          className='flex w-full items-center justify-center gap-1.5 bg-[#FFE6D9] pt-3 pb-4.5 font-bold transition-colors hover:bg-[#FFDCCB]'
        >
          Calculate savings on any bill amount
          <ChevronRight className='size-4 shrink-0' strokeWidth={2.5} />
        </button>
        <Scallops edge='bottom' />
      </div>
      <SampleBillDialog
        open={billOpen}
        onClose={() => setBillOpen(false)}
        merchant={merchant}
        costForTwo={cost}
        offers={offers}
        dealRows={dealRows}
        caps={caps}
        bookHref={bookHref}
        payHref={payHref}
      />
    </section>
  )
}

/** "Have queries or need help?" — Figma "Help and support": #FFF1CF, the faint "!" badge on the right. */
export function HelpSideCard() {
  return (
    <Link
      href='/help'
      className='flex items-center justify-between bg-[#FFF1CF] font-(family-name:--font-dm-sans) font-medium leading-5 transition-colors hover:bg-[#FFEBB8]'
      style={{ minHeight: tMin(60, 52), padding: `${tMin(10, 8)} ${tMin(24, 14)}`, borderRadius: t(12), gap: 12, fontSize: tMin(14, 13) }}
    >
      <span className='flex min-w-0 flex-col'>
        <span className='text-[#2c2d32]'>Have queries or need help?</span>
        <span className='flex items-center gap-2 text-[#FF4800]'>
          Contact help &amp; support
          <ChevronRight className='size-3.5 shrink-0' strokeWidth={2.5} />
        </span>
      </span>
      <span aria-hidden='true' className='flex size-10.5 shrink-0 items-center justify-center rounded-full border-2 border-[#FFE29E] text-[28px] leading-none text-[#FFD887]'>!</span>
    </Link>
  )
}
