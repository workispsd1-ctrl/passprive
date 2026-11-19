'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import { MEMBERSHIP_BADGE } from '@/lib/cashbackBadge'
import type { CashbackPlan } from '@/lib/cashback'
import { couponState, fmtMur, offerHeadline, type BillOffer } from '@/lib/payBill'
import type { OrderLine } from '@/lib/orderCollect'
import { cn } from '@/lib/utils'
import { OC_PAGE, OC_UNIT } from './unit'

const PLAN_LABEL: Record<CashbackPlan, string> = { free: 'Free', premiere: 'Plus', black: 'Black' }

/** Figma "Capsule Button": 461.7×93, #D5D5D5 border, radius 59.4, radio 27 (on = 6.75 #FF4800 ring). */
function Capsule({
  icon,
  title,
  sub,
  on,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  on: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-[calc(93.15*var(--u))] min-w-0 items-center gap-[calc(16.2*var(--u))] rounded-full border-[calc(1.35*var(--u))] bg-white px-27 text-left transition-colors disabled:opacity-55 max-lg:h-76 max-lg:gap-12 max-lg:border max-lg:px-18',
        on ? 'border-[#FF4800]' : 'border-[#D5D5D5] hover:border-[#B0B0B0]',
      )}
    >
      <span className='shrink-0'>{icon}</span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-[calc(21.6*var(--u))] leading-[calc(28*var(--u))] font-bold text-[#2C2D32] max-lg:text-[16px] max-lg:leading-22'>{title}</span>
        <span className='block truncate text-[calc(18.9*var(--u))] leading-[calc(25*var(--u))] text-[#2C2D32] max-lg:text-[14px] max-lg:leading-20'>{sub}</span>
      </span>
      <span
        aria-hidden
        className={cn('size-27 shrink-0 rounded-full max-lg:size-22', on ? 'border-[calc(6.75*var(--u))] border-[#FF4800] max-lg:border-[6px]' : 'border-[calc(2.7*var(--u))] border-[#D5D5D5] max-lg:border-2')}
      />
    </button>
  )
}

/** Figma coupon card: 260×265.5, orange 50% border, radius 17.5, logo / headline / note / Apply. */
function CouponCard({ offer, amount, applied, onToggle }: { offer: BillOffer; amount: number; applied: boolean; onToggle: () => void }) {
  const { state, note } = couponState(offer, amount)
  const enabled = state === 'apply'
  return (
    <button
      type='button'
      role='radio'
      aria-checked={applied}
      disabled={!enabled}
      onClick={onToggle}
      className={cn(
        'flex h-[calc(265.5*var(--u))] w-260 shrink-0 flex-col items-center rounded-[calc(17.5*var(--u))] border-2 bg-linear-to-b from-white/50 from-60% to-[#FF5E00]/8 px-38 pt-22 pb-14 text-center shadow-[0_calc(8*var(--u))_calc(10.2*var(--u))_rgba(0,0,0,0.08)] max-lg:h-auto max-lg:w-200 max-lg:px-16 max-lg:pt-16',
        applied ? 'border-[#FF4800]' : 'border-[#FF6213]/50',
      )}
    >
      <span className='flex h-[calc(57.8*var(--u))] items-center max-lg:h-44'>
        {offer.logo ? (
          <Image src={offer.logo} alt='' width={134} height={58} className='h-full w-auto object-contain' />
        ) : (
          <span className='text-[calc(20*var(--u))] font-bold text-[#FF4800] max-lg:text-[16px]'>{offer.title}</span>
        )}
      </span>
      <span className='mt-6 line-clamp-1 text-[calc(26*var(--u))] leading-[calc(38*var(--u))] font-bold text-[#2C2D32] max-lg:text-[18px] max-lg:leading-26'>{offerHeadline(offer)}</span>
      <span className='line-clamp-1 text-[calc(20*var(--u))] leading-[calc(33*var(--u))] tracking-[0.02em] text-[#666666] max-lg:text-[14px] max-lg:leading-22'>{offer.sub || offer.title}</span>
      <span aria-hidden className='mt-auto h-2 w-[calc(194*var(--u))] rounded-full bg-[#FF6213]/25 max-lg:mt-12 max-lg:w-full' />
      <span className={cn('mt-12 text-[calc(22.76*var(--u))] leading-[calc(33*var(--u))] font-bold max-lg:mt-8 max-lg:text-[16px] max-lg:leading-24', enabled ? 'text-[#FF6A30]' : 'line-clamp-1 text-[calc(15*var(--u))] font-medium text-[#8E8E93] max-lg:text-[12px]')}>
        {enabled ? (applied ? 'Applied' : 'Apply') : note}
      </span>
    </button>
  )
}

/** One row of the Figma "Bill breakdown": 15.93/23 #666, a soft rule between rows. */
function Row({ label, value, accent }: { label: React.ReactNode; value: string; accent?: boolean }) {
  return (
    <div className='flex items-center justify-between gap-16 border-b-[calc(1.4*var(--u))] border-[#F2C9B8]/60 px-22 py-[calc(13.5*var(--u))] text-[calc(15.93*var(--u))] leading-[calc(23*var(--u))] tracking-[0.018em] max-lg:border-b max-lg:px-14 max-lg:py-10 max-lg:text-[14px] max-lg:leading-20'>
      <span className='min-w-0 text-[#666666]'>{label}</span>
      <span className={cn('shrink-0', accent ? 'font-semibold text-[#FF4800]' : 'text-[#666666]')}>{value}</span>
    </div>
  )
}

/**
 * Figma "Pay bill and offers" — the bill for an Order & Collect cart (app
 * parity: OrderBillSummaryScreen.jsx: what the order earns, coupons, the
 * membership upgrade sheet, Privé Credits, the item breakdown and Pay now).
 * PayBillClient owns every amount and handler; this is only the layout.
 */
export function OrderBillSummary({
  name,
  place,
  plan,
  cashbackPct,
  amount,
  toPay,
  earnCredits,
  lines,
  offers,
  selectedId,
  onToggleCoupon,
  discounts,
  upsell,
  onUpgrade,
  credits,
  onBack,
  onPay,
}: {
  name: string
  place: string
  plan: CashbackPlan
  cashbackPct: number
  amount: number
  toPay: number
  earnCredits: number
  lines: OrderLine[] | null
  offers: BillOffer[]
  selectedId: string | null
  onToggleCoupon: (id: string) => void
  /** the breakdown's minus rows, in order */
  discounts: { label: React.ReactNode; value: number }[]
  upsell: { plan: CashbackPlan; amount: number; sub: string } | null
  onUpgrade: () => void
  credits: { enabled: boolean; on: boolean; usable: boolean; sub: string; onToggle: () => void } | null
  onBack: () => void
  onPay: () => void
}) {
  const [allCoupons, setAllCoupons] = useState(false)
  const earn = fmtMur(earnCredits)

  return (
    // the account layout is already full width — no breakout margin here
    <main className={cn(OC_PAGE, OC_UNIT, 'px-172 pt-40 pb-80 md:mt-0 max-lg:px-16 max-lg:pt-12 max-lg:pb-40')}>
      {/* Figma "Desktop header": back, the restaurant (32/40) and its area (16/24) */}
      <header className='flex h-80 items-start max-lg:h-auto'>
        <button type='button' onClick={onBack} aria-label='Back' className='-ml-8 flex size-40 items-center justify-center rounded-full text-[#938F96] transition-colors hover:bg-black/5 max-lg:-ml-10 max-lg:size-36'>
          <ChevronLeft className='size-24' />
        </button>
        <span className='ml-8 min-w-0'>
          <h1 className='truncate text-[calc(32*var(--u))] leading-[calc(40*var(--u))] font-bold text-[#2C2D32] max-lg:text-[22px] max-lg:leading-30'>{name}</h1>
          {place && <p className='mt-6 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#2C2D32] max-lg:mt-0 max-lg:text-[14px] max-lg:leading-20'>{place}</p>}
        </span>
      </header>

      <div className='mt-40 grid grid-cols-[calc(984*var(--u))_minmax(0,1fr)] items-start gap-32 max-lg:mt-16 max-lg:grid-cols-1 max-lg:gap-24'>
        {/* Figma "Offers and rewards" */}
        <div className='min-w-0'>
          <div className='flex items-start gap-[calc(67.5*var(--u))] max-lg:flex-col max-lg:gap-16'>
            {/* Figma "Privé rewards promotion": what this order earns */}
            <div className='relative h-[calc(232.5*var(--u))] w-[calc(538.5*var(--u))] shrink-0 overflow-hidden rounded-[calc(24*var(--u))] bg-linear-to-b from-[#FF4800] from-[-14%] to-[#0044FF] to-[76%] shadow-[0_calc(6*var(--u))_calc(11.85*var(--u))_rgba(0,0,0,0.1)] max-lg:h-180 max-lg:w-full max-lg:rounded-[20px]'>
              <span aria-hidden className='absolute top-[calc(7.5*var(--u))] right-[calc(-17*var(--u))] size-[calc(234.75*var(--u))] rotate-12 rounded-[calc(40*var(--u))] bg-[#FFE695] opacity-90 max-lg:size-150 max-lg:-right-30' />
              <Image src='/assets/membership/Wallet.webp' alt='' width={167} height={167} aria-hidden className='absolute top-[calc(40*var(--u))] right-[calc(20*var(--u))] size-[calc(167*var(--u))] object-contain max-lg:top-24 max-lg:right-0 max-lg:size-110' />
              <span className='absolute top-[calc(16.5*var(--u))] left-[calc(22.5*var(--u))] rounded-full border-[calc(1.5*var(--u))] border-white bg-black/40 px-12 py-[calc(6*var(--u))] text-[calc(15*var(--u))] leading-[calc(20*var(--u))] font-bold tracking-[0.2em] text-white max-lg:top-14 max-lg:left-16 max-lg:border max-lg:px-10 max-lg:py-4 max-lg:text-[11px] max-lg:tracking-[0.12em]'>
                YOU WILL EARN {cashbackPct}% CASH BACK
              </span>
              {plan !== 'free' && (
                <Image src={MEMBERSHIP_BADGE[plan]} alt={`Privé ${PLAN_LABEL[plan]}`} width={116} height={50} className='absolute top-[calc(61.5*var(--u))] left-[calc(22.5*var(--u))] h-[calc(49.5*var(--u))] w-auto max-lg:top-48 max-lg:left-16 max-lg:h-36' />
              )}
              <span className='absolute top-[calc(123*var(--u))] left-[calc(22.5*var(--u))] flex items-baseline gap-10 max-lg:top-92 max-lg:left-16'>
                <span className='text-[calc(46.94*var(--u))] leading-[calc(43*var(--u))] font-extrabold tracking-[-0.05em] text-[#FFF0CE] max-lg:text-[34px] max-lg:leading-34'>{earn}</span>
                <span className='font-(family-name:--font-libre-baskerville) text-[calc(26*var(--u))] leading-[calc(28*var(--u))] font-bold tracking-[-0.05em] text-white italic max-lg:text-[19px]'>Privé</span>
                <span className='text-[calc(27.6*var(--u))] leading-[calc(27*var(--u))] tracking-[-0.05em] text-[#FFF0CE] max-lg:text-[20px]'>Credits</span>
              </span>
              <span className='absolute top-[calc(178.5*var(--u))] left-[calc(28.5*var(--u))] text-[calc(19.13*var(--u))] leading-[calc(19*var(--u))] tracking-[-0.05em] text-white max-lg:top-140 max-lg:left-16 max-lg:text-[14px]'>
                1 <span className='font-(family-name:--font-libre-baskerville) font-bold italic'>Privé</span> <span className='text-[#FFF0CE]'>Credit</span> = 1 MUR
              </span>
            </div>

            {/* "Your bill" and what it earns */}
            <div className='min-w-0 pt-18 max-lg:pt-0'>
              <p className='text-[calc(16*var(--u))] leading-[calc(24*var(--u))] font-bold text-[#2C2D32] max-lg:text-[15px]'>Your bill</p>
              <p className='mt-16 text-[calc(48*var(--u))] leading-[calc(58*var(--u))] font-bold text-[#3AA456] max-lg:mt-4 max-lg:text-[36px] max-lg:leading-44'>MUR {fmtMur(toPay)}</p>
              {earnCredits > 0 && (
                <p className='mt-20 inline-flex h-[calc(36.45*var(--u))] items-center rounded-full bg-linear-to-r from-[#FF4800] to-[#992B00] px-18 text-[calc(15.36*var(--u))] leading-[calc(22*var(--u))] text-[#FFFBFF] max-lg:mt-10 max-lg:h-34 max-lg:px-14 max-lg:text-[13px]'>
                  Wow! You are earning {earn} Privé credits!
                </p>
              )}
            </div>
          </div>

          {offers.length > 0 && (
            <>
              <h2 className='mt-43 text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold text-[#2C2D32] max-lg:mt-28 max-lg:text-[18px] max-lg:leading-24'>Apply coupons and offers</h2>
              <div className='scrollbar-hide mt-24 flex flex-wrap gap-44 max-lg:-mx-16 max-lg:mt-12 max-lg:flex-nowrap max-lg:gap-12 max-lg:overflow-x-auto max-lg:px-16 max-lg:pb-8'>
                {/* desktop folds all but three behind "Check all"; phones scroll the row */}
                {offers.map((o, i) => (
                  <div key={o.id} className={cn(!allCoupons && i >= 3 && 'lg:hidden')}>
                    <CouponCard offer={o} amount={amount} applied={selectedId === o.id} onToggle={() => onToggleCoupon(o.id)} />
                  </div>
                ))}
              </div>
              {offers.length > 3 && (
                <button
                  type='button'
                  onClick={() => setAllCoupons(v => !v)}
                  className='mt-26 ml-[calc(300*var(--u))] flex h-[calc(46.5*var(--u))] w-276 items-center justify-center rounded-full border-[calc(1.5*var(--u))] border-[#E5E5E5] text-[calc(17.07*var(--u))] leading-[calc(24*var(--u))] tracking-[0.018em] text-[#252427] hover:bg-gray-50 max-lg:mx-auto max-lg:h-40 max-lg:border max-lg:hidden'
                >
                  {allCoupons ? 'Show fewer offers' : 'Check all coupons & offers'}
                </button>
              )}
            </>
          )}

          {(upsell || credits?.enabled) && (
            <div className='mt-42 grid grid-cols-2 gap-[calc(42.3*var(--u))] max-lg:mt-24 max-lg:grid-cols-1 max-lg:gap-12'>
              {upsell && (
                <Capsule
                  on={false}
                  onClick={onUpgrade}
                  icon={<Image src={MEMBERSHIP_BADGE[upsell.plan]} alt='' width={97} height={42} className='h-[calc(41.66*var(--u))] w-auto max-lg:h-32' />}
                  title={`Add ${PLAN_LABEL[upsell.plan]} at MUR ${fmtMur(upsell.amount)}`}
                  sub={upsell.sub}
                />
              )}
              {credits?.enabled && (
                <Capsule
                  on={credits.on}
                  disabled={!credits.usable}
                  onClick={credits.onToggle}
                  icon={<Image src='/assets/membership/Wallet.webp' alt='' width={42} height={42} className='size-[calc(42.47*var(--u))] max-lg:size-34' />}
                  title='Use Privé Credits'
                  sub={credits.sub}
                />
              )}
            </div>
          )}
        </div>

        {/* Figma "Bill summary": 560 card, breakdown, earn line, pay */}
        <aside className='rounded-[calc(20*var(--u))] border border-[#E8E8EA] bg-white p-28 lg:sticky lg:top-24 max-lg:rounded-[18px] max-lg:p-16'>
          <h2 className='text-[calc(19.6*var(--u))] leading-[calc(28*var(--u))] font-bold text-[#2C2D32] max-lg:text-[17px] max-lg:leading-24'>Bill summary</h2>
          <div className='mt-15 overflow-hidden rounded-[calc(12.26*var(--u))] border-[calc(1.4*var(--u))] border-[#FF6213]/50 bg-linear-to-b from-white/80 from-60% to-[#FF5E00]/12 shadow-[0_calc(5.6*var(--u))_calc(7.14*var(--u))_rgba(0,0,0,0.08)] max-lg:mt-10 max-lg:rounded-[12px] max-lg:border'>
            <Row label='Total bill amount' value={`MUR ${fmtMur(amount)}`} />
            {lines?.map(l => (
              <Row key={l.id} label={`${l.qty > 1 ? `${l.qty} × ` : ''}${l.name}`} value={`MUR ${fmtMur(l.price * l.qty)}`} />
            ))}
            {discounts.map((d, i) => (
              <Row key={i} label={d.label} value={`-MUR ${fmtMur(d.value)}`} accent />
            ))}
            <div className='flex items-center justify-between gap-16 px-22 py-[calc(14*var(--u))] text-[calc(18.74*var(--u))] leading-[calc(27*var(--u))] font-semibold text-[#2C2D32] max-lg:px-14 max-lg:py-12 max-lg:text-[16px]'>
              To be paid <span>MUR {fmtMur(toPay)}</span>
            </div>
          </div>
          {earnCredits > 0 && (
            <p className='mt-29 text-[calc(14*var(--u))] leading-[calc(20*var(--u))] text-[#2C2D32] max-lg:mt-14 max-lg:text-[13px]'>
              Earn <b>{earn} Privé credits</b> on bill payment
            </p>
          )}
          {/* app parity: OrderBillSummaryScreen "Pay now • MUR …" — the only way to pay */}
          <button
            type='button'
            onClick={onPay}
            disabled={!(toPay > 0)}
            className='mt-32 flex h-[calc(67.2*var(--u))] w-full items-center justify-center rounded-full bg-[#FF4800] px-14 font-(family-name:--font-inter) text-[calc(23.67*var(--u))] leading-[calc(31*var(--u))] font-semibold text-white transition-colors hover:bg-[#E64200] disabled:bg-[#D5D5D5] max-lg:mt-16 max-lg:h-54 max-lg:text-[17px]'
          >
            Pay now • MUR {fmtMur(toPay)}
          </button>
        </aside>
      </div>
    </main>
  )
}
