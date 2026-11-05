'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useUserPlan } from '@/lib/context/PlanContext'
import type { CashbackPlan } from '@/lib/cashback'
import type { DiscountCaps } from '@/lib/services/membershipCaps'
import type { ReceiptMerchantState } from '@/lib/services/receipts'
import { formatPct } from '@/lib/receipts'
import { cn } from '@/lib/utils'

const AUTOSCROLL_MS = 4000
const SERIF = 'font-(family-name:--font-libre-baskerville)'

const pct = (v: number) => `${Number(v.toFixed(1))}%`

/**
 * Tier banner copy — app parity: RestaurantDetails.jsx tierUpsellCopy. XYZ is
 * what the next tier keeps of the merchant's own % offer, ABC is Black's.
 */
function tierCopy(plan: CashbackPlan, offerPct: number, caps: DiscountCaps) {
  const off = (t: keyof DiscountCaps) => (offerPct > 0 ? (offerPct * caps[t]) / 100 : 0)
  const black = off('black')
  const plus = off('premiere')
  const mine = off(plan)
  const doubled = mine > 0 && Math.abs(black / mine - 2) < 0.05

  if (plan === 'black') {
    return {
      headline: `You're getting ${offerPct > 0 ? `${pct(black)} OFF*` : 'the full discount*'}`,
      supporting: 'That’s the entire merchant discount, plus 3% cashback with PassPrivé Black.',
    }
  }
  if (plan === 'premiere') {
    return {
      headline: `With Black, you'll get ${offerPct > 0 ? `${pct(black)} OFF*` : 'more OFF*'}`,
      supporting: offerPct > 0
        ? `You get ${pct(plus)} OFF today. Get ${pct(black)} OFF and 3% cashback with PassPrivé Black.`
        : 'Get the full merchant discount and 3% cashback with PassPrivé Black.',
    }
  }
  return {
    headline: `With Plus, you'll get ${offerPct > 0 ? `${pct(plus)} OFF*` : 'more OFF*'}`,
    supporting: offerPct > 0
      ? `Get ${pct(black)} OFF${doubled ? ' (that’s double!)' : ''} and 3% cashback with PassPrivé Black.`
      : 'Get the full merchant discount and 3% cashback with PassPrivé Black.',
  }
}

/** "Keep More of Every Discount" — app parity: tierUpsellSheet in an InformationSheet. */
function UpsellSheet({ open, onClose, plan, caps }: { open: boolean; onClose: () => void; plan: CashbackPlan; caps: DiscountCaps }) {
  const current = (t: CashbackPlan) => (t === plan ? ' (Current)' : '')
  const points = [
    `Free${current('free')}: Keep ${pct(caps.free)} of the discount`,
    `Plus${current('premiere')}: Keep ${pct(caps.premiere)} of the discount`,
    `Black${current('black')}: Keep ${pct(caps.black)} of the discount + earn 3% instant cashback`,
    'Upgrade your membership to claim higher savings!',
  ]
  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className='gap-0 rounded-3xl bg-white p-6 font-(family-name:--font-dm-sans) sm:max-w-md'>
        <DialogTitle className='text-[20px] font-bold text-[#161616]'>Keep More of Every Discount</DialogTitle>
        <DialogDescription className='mt-2 text-[14px] leading-5 text-[#5B5A5A]'>
          Merchant savings are split based on your membership tier. The higher your tier, the more merchant savings you keep.
        </DialogDescription>
        <ul className='mt-4 space-y-2.5'>
          {points.map(p => (
            <li key={p} className='flex gap-2.5 text-[14px] leading-5 text-[#2C2D32]'>
              <Check className='mt-0.5 size-4 shrink-0 text-[#3AA456]' /> {p}
            </li>
          ))}
        </ul>
        <Link
          href='/membership'
          onClick={onClose}
          className='mt-6 flex h-12 items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark'
        >
          See All Plans
        </Link>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Banners under the deals on a Preferred Partner's page — app parity:
 * RestaurantDetails.jsx UpsellBannerPager: "Earn Nx more with Black" (when the
 * receipt quote says Black earns more) and the tier banner on the Merchant-Cap
 * art. Auto-advances every 4s, always rightward, pausing while the visitor is
 * interacting; either banner opens the "Keep More of Every Discount" sheet.
 * Hidden for Black members and non-preferred merchants.
 */
export function UpsellBannerPager({
  merchantType,
  merchantId,
  kind,
  offerPct,
  caps,
  className,
  variant = 'default',
}: {
  merchantType: string | null | undefined
  merchantId: string
  kind: 'restaurant' | 'store'
  /** the merchant's first percentage offer — what the tiers share */
  offerPct: number
  caps: DiscountCaps
  className?: string
  /** 'figma' — the salon page's bright "Earn 6x more cashback" banner */
  variant?: 'default' | 'figma'
}) {
  const plan = useUserPlan()
  const show = String(merchantType ?? '').toLowerCase() === 'preferred' && plan !== 'black'
  const [quote, setQuote] = useState<ReceiptMerchantState['quote']>(null)
  const [page, setPage] = useState(0)
  const [sheet, setSheet] = useState(false)
  const [hover, setHover] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show) return
    let active = true
    fetch(`/api/receipts/merchant?${kind === 'store' ? 'storeId' : 'restaurantId'}=${merchantId}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: ReceiptMerchantState | null) => { if (active && data) setQuote(data.quote) })
      .catch(() => {})
    return () => { active = false }
  }, [show, kind, merchantId])

  // app parity: EarnMoreBanner shows only when Black earns more than the member's tier
  const earnMore = !!quote && quote.tier !== 'black' && quote.blackPct > quote.pct && quote.pct > 0
  const count = earnMore ? 2 : 1

  const goTo = useCallback((i: number, smooth = true) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollTo({ left: i * rail.clientWidth, behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // autoplay — always rightward; wrapping to the first is an instant jump (app parity)
  useEffect(() => {
    if (count < 2 || sheet || hover) return
    const id = setInterval(() => {
      const next = (Math.round((railRef.current?.scrollLeft ?? 0) / (railRef.current?.clientWidth || 1)) + 1) % count
      goTo(next, next !== 0)
    }, AUTOSCROLL_MS)
    return () => clearInterval(id)
  }, [count, sheet, hover, goTo])

  if (!show) return null
  const copy = tierCopy(plan, offerPct, caps)

  return (
    <div
      className={cn('font-(family-name:--font-dm-sans)', className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={() => setHover(true)}
      onTouchEnd={() => setHover(false)}
    >
      <div
        ref={railRef}
        onScroll={e => setPage(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth || 1)))}
        className='scrollbar-hide flex snap-x snap-mandatory overflow-x-auto'
        aria-roledescription='carousel'
      >
        {earnMore && variant === 'figma' && (
          <button
            type='button'
            onClick={() => setSheet(true)}
            aria-label={`Earn ${Math.round(quote.blackPct / quote.pct)}x more cashback`}
            className='relative flex aspect-358/73 w-full shrink-0 snap-start items-center justify-between overflow-hidden rounded-xl bg-[linear-gradient(95deg,#EF7A2C,#F39A2F_55%,#EE5A24)] pr-3.5 pl-4 text-left text-white'
          >
            <span className='min-w-0'>
              <span className='block truncate text-[17px] leading-5 font-bold'>
                Earn {Math.round(quote.blackPct / quote.pct)}x <span className={`${SERIF} font-normal italic`}>more</span> cashback
              </span>
              <span className='mt-0.5 block truncate text-[11.5px] 2xl:text-[12.5px] leading-4'>{formatPct(quote.blackPct)} Privé Credits on every payment</span>
              <span className='mt-1 block text-[10.5px] text-white/85'>
                1 <span className={`${SERIF} italic`}>Privé</span>Credit = MUR 1
              </span>
            </span>
            <span className='shrink-0 mb-2.5 self-end rounded-full bg-[#2247FF] px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap 2xl:px-3 2xl:text-[12.5px]'>Claim now →</span>
            {/* the coin's art says "6x" */}
            {Math.round(quote.blackPct / quote.pct) === 6 && <Image src='/assets/merchant-detail/earn-coin.png' alt='' width={47} height={47} className='absolute -top-1 right-1.5 size-7' />}
          </button>
        )}
        {earnMore && variant === 'default' && (
          <button
            type='button'
            onClick={() => setSheet(true)}
            aria-label={`Earn ${Math.round(quote.blackPct / quote.pct)}x more with Black`}
            className='relative flex aspect-358/73 w-full shrink-0 snap-start items-center justify-between overflow-hidden rounded-xl bg-[linear-gradient(135deg,#E46A12,#B5370A_60%,#A52E06)] pr-3.5 pl-4 text-left text-white'
          >
            <Image src='/assets/deals/deal-coin.png' alt='' width={18} height={18} className='absolute -top-1.5 -left-1.5' />
            <Image src='/assets/deals/deal-coin.png' alt='' width={18} height={18} className='absolute -right-1.5 -bottom-1.5' />
            <span className='min-w-0'>
              <span className='block truncate text-[17px] leading-5 font-bold'>
                Earn {Math.round(quote.blackPct / quote.pct)}x more with Black
              </span>
              <span className='mt-0.5 block truncate text-[12.5px] leading-4'>
                Get {formatPct(quote.blackPct)} Privé Credits instead of {formatPct(quote.pct)}
              </span>
              <span className='mt-1 block text-[10.5px] text-white/80'>
                1 <span className={`${SERIF} italic`}>Privé</span>Credit = MUR 1
              </span>
            </span>
            <span className='shrink-0 rounded-full bg-white px-3 py-1 text-[13px] font-bold text-[#A52E06]'>Claim now →</span>
          </button>
        )}
        <button
          type='button'
          onClick={() => setSheet(true)}
          className='relative aspect-1436/296 w-full shrink-0 snap-start overflow-hidden rounded-xl text-left @container'
        >
          {/* the artwork carries the card, its shines and the Know More CTA */}
          <Image src='/assets/merchant-detail/Merchant-Cap.webp' alt='' fill sizes='(min-width: 768px) 560px, 100vw' className='object-fill' />
          <span className='absolute inset-y-0 left-[6.1%] flex w-[58%] flex-col justify-center'>
            {/* sized to the card (app: figmaPx 14 / 12 on a 358pt-wide banner) so the headline fits on one line */}
            <span className='truncate text-[min(3.6cqw,15px)] leading-tight font-bold text-white'>{copy.headline}</span>
            <span className='mt-[1.6cqw] line-clamp-2 text-[min(3.1cqw,13px)] leading-snug font-medium text-[#FFF1CF]'>{copy.supporting}</span>
          </span>
        </button>
      </div>

      {count > 1 && (
        // app parity: BannerPagerIndicator — the active dot stretches, its neighbours taper
        <div className='mt-2.5 flex items-center justify-center gap-2'>
          {Array.from({ length: count }, (_, i) => {
            const d = Math.abs(i - page)
            return (
              <button
                key={i}
                type='button'
                aria-label={`Banner ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn('h-0.5 rounded-full transition-all', d === 0 ? 'w-6.5 bg-[#979393]' : d === 1 ? 'w-2.25 bg-[#ADADAD]/50' : 'w-0.5 bg-[#ADADAD]/50')}
              />
            )
          })}
        </div>
      )}

      <UpsellSheet open={sheet} onClose={() => setSheet(false)} plan={plan} caps={caps} />
    </div>
  )
}
