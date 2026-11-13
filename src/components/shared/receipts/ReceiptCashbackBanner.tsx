'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Clock, X } from 'lucide-react'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { useAppPrompt } from '@/lib/context/AppPromptContext'
import { isCashbackEnabled, type MerchantCapabilityFields } from '@/lib/cashback'
import { earnOn } from '@/lib/platformFlags'
import {
  RECEIPT_STATUS,
  claimBannerCopy,
  formatPct,
  isPendingStatus,
  uploadHref,
  type ReceiptClaim,
} from '@/lib/receipts'
import type { ReceiptMerchantState } from '@/lib/services/receipts'
import { cn } from '@/lib/utils'
import { OfferCard, OfferHead, OfferText } from '@/components/sections/dining/OfferCard'
import { t } from '@/components/sections/dining/designUnit'
import { TodaysOfferDialog } from '@/components/shared/deals/RedeemFlowPopups'

const DAY_MS = 24 * 60 * 60 * 1000

const TONES = {
  pending: { bg: 'bg-[#FFF7E7]', dot: 'bg-[#FF8800]', Icon: Clock },
  approved: { bg: 'bg-[#EFF8F1]', dot: 'bg-[#3AA456]', Icon: Check },
  rejected: { bg: 'bg-[#FDECEC]', dot: 'bg-[#E5484D]', Icon: X },
}

/** A claim in flight for this merchant — app parity: components/ReceiptStatusBanner.jsx. */
export function ReceiptStatusBanner({ claim, className }: { claim: ReceiptClaim; className?: string }) {
  const copy = claimBannerCopy(claim)
  if (!copy) return null
  const tone = TONES[copy.tone]
  return (
    <Link
      href={`/receipts/${claim.id}`}
      className={cn('flex h-14 items-center gap-3 rounded-[14px] px-4 font-(family-name:--font-dm-sans)', tone.bg, className)}
    >
      <span className={cn('flex size-6.5 shrink-0 items-center justify-center rounded-full text-white', tone.dot)}>
        <tone.Icon className="size-3.5" strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] leading-4.5 font-bold text-[#2C2D32]">{copy.title}</span>
        <span className="block truncate text-[11px] leading-4 font-medium text-[#5B5A5A]">{copy.detail}</span>
      </span>
      <ChevronRight className="size-4.5 shrink-0 text-[#5B5A5A]" />
    </Link>
  )
}

/**
 * The purple receipt card — app parity: ReceiptCashbackBanner.jsx, laid out on
 * the web Figma's 372×104 frame (css.txt "Frame 2147225018"). Everything is
 * sized in container units (1cqw = 3.72 design px) so the card scales as one
 * piece: the receipt art is an opaque square painted to sit in its right 40%.
 */
function ReceiptArtCard({ children, className, fill = false }: { children: React.ReactNode; className?: string; /** fill the parent's height, the 372×104 artwork centred in it (a grid cell beside taller cards) */ fill?: boolean }) {
  // the container is the wrapper: cqw resolves against an ancestor, never the element itself
  const art = (
    <>
      <Image
        src="/assets/receipts/cashback-upload-receipt.jpeg"
        alt=""
        width={340}
        height={340}
        sizes="(min-width: 768px) 240px, 50vw"
        className="pointer-events-none absolute top-[-7.527cqw] left-[63.978cqw] size-[45.699cqw] max-w-none"
      />
      {children}
    </>
  )
  return (
    <span className={cn('block w-full @container', fill && 'h-full', className)}>
    <span className={cn('relative block w-full overflow-hidden rounded-[4.301cqw] bg-[linear-gradient(223.48deg,#2A0C63_18.2%,#38107C_46.93%,#2F0E6D_75.66%)] text-left text-white', fill ? 'h-full min-h-[27.957cqw]' : 'aspect-372/104')}>
      {/* "Ellipse 43908": #20094C, 160 at -17,-70, blur 29 */}
      <span className="pointer-events-none absolute top-[-18.817cqw] left-[-4.57cqw] size-[43.011cqw] rounded-full bg-[#20094C] blur-[7.796cqw]" />
      {/* "Ellipse 43907": #38117D, 40×104 at 177,0, blur 12.5 */}
      <span className="pointer-events-none absolute top-0 left-[47.581cqw] h-[27.957cqw] w-[10.753cqw] rounded-full bg-[#38117D] blur-[3.36cqw]" />
      {fill ? (
        <>
          {/* the art keeps its 104-tall frame's proportions (45.7 of 27.96 cqw) against the taller card, centred where the frame puts it, so its edges stay outside the card */}
          <Image
            src="/assets/receipts/cashback-upload-receipt.jpeg"
            alt=""
            width={340}
            height={340}
            sizes="(min-width: 768px) 280px, 60vw"
            className="pointer-events-none absolute top-1/2 left-[86.828cqw] aspect-square h-[163.4%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2"
          />
          <span className="absolute inset-x-0 top-1/2 block aspect-372/104 -translate-y-1/2">{children}</span>
        </>
      ) : art}
    </span>
    </span>
  )
}

/**
 * Receipt-upload cashback on a merchant page — app parity:
 * components/ReceiptCashbackBanner.jsx. Only for merchants that don't take
 * in-app bill payments (those earn on the bill itself). A claim still under
 * review (or rejected in the last day) replaces the banner with its status;
 * a member below Black is offered the upgrade before uploading.
 */
export function ReceiptCashbackBanner({
  merchant,
  kind,
  className,
  variant = 'default',
  previewTier = null,
}: {
  merchant: MerchantCapabilityFields & { id: string }
  kind: 'restaurant' | 'store'
  className?: string
  /** TierPills preview — that plan's rate, greyed (app parity: ReceiptCashbackBanner previewTier) */
  previewTier?: 'free' | 'plus' | 'black' | null
  /** 'figma' — desktop restaurant page: an "Offers for today" card */
  /** 'art' — the app's purple receipt artwork as an "Offers for today" grid card (store page) */
  variant?: 'default' | 'figma' | 'art'
}) {
  const router = useRouter()
  const { promptLogin } = useAuthPrompt()
  const openAppPrompt = useAppPrompt()
  // app parity: ReceiptCashbackBanner.jsx `eligible = earn && !!restaurant?.id` — pay-bill merchants too
  const eligible = earnOn()
  // fetchedAt: "rejected in the last day" is judged against when the claim was loaded
  const [state, setState] = useState<(ReceiptMerchantState & { fetchedAt: number }) | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(() => {
    fetch(`/api/receipts/merchant?${kind === 'store' ? 'storeId' : 'restaurantId'}=${merchant.id}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: ReceiptMerchantState | null) => { if (data) setState({ ...data, fetchedAt: Date.now() }) })
      .catch(() => {})
  }, [kind, merchant.id])

  useEffect(() => {
    if (!eligible) return
    load()
    window.addEventListener('pp:auth', load)
    return () => window.removeEventListener('pp:auth', load)
  }, [eligible, load])

  if (!eligible || !state) return null

  const { quote, latestClaim, blackPlan, loggedIn } = state
  const cashbackOff = !isCashbackEnabled(merchant) || (!!quote && quote.pct === 0 && quote.blackPct === 0)
  // Signed out there's no quote yet — still invite them, the rate shows after login.
  const userPct = quote?.pct ?? 0
  if (loggedIn && !cashbackOff && !(userPct > 0)) return null
  const previewing = !!previewTier && !cashbackOff
  const pct = !previewing
    ? userPct
    : previewTier === 'black'
      ? quote?.blackPct || 3
      : previewTier === 'plus' ? 1.5 : 0.5

  const merchantWord = kind === 'store' ? 'store' : 'restaurant'
  const figma = variant === 'figma'
  const receiptHead = (
    <OfferHead
      icon={<Image src="/assets/receipts/cashback-upload-receipt.jpeg" alt="" width={40} height={40} style={{ width: t(40), height: t(40) }} />}
      label="Receipt cashback"
      color="#38107c"
    />
  )
  if (cashbackOff && figma) {
    return (
      <OfferCard>
        {receiptHead}
        <OfferText main="No cashback here yet" sub={`Ask the ${merchantWord} to enable it`} />
      </OfferCard>
    )
  }
  if (cashbackOff) {
    return (
      <div className={cn('font-(family-name:--font-dm-sans)', className)}>
        <ReceiptArtCard>
          <span className="absolute top-[5.26cqw] left-[5.26cqw] w-[67.25cqw] text-[5.26cqw] leading-[6.73cqw] font-bold tracking-[-0.09cqw]">
            No cashback here yet
          </span>
          <span className="absolute top-[13.74cqw] left-[5.26cqw] w-[58.5cqw] text-[3.8cqw] leading-[4.97cqw] font-medium text-[#DFBEFF]">
            Ask the {merchantWord} to contact PassPrivé to enable it.
          </span>
        </ReceiptArtCard>
      </div>
    )
  }

  const claimStatus = latestClaim?.status
  const recentlyRejected = claimStatus === RECEIPT_STATUS.REJECTED
    && state.fetchedAt - Date.parse(latestClaim?.submitted_at ?? '') < DAY_MS
  if (!previewing && latestClaim && (isPendingStatus(claimStatus) || recentlyRejected)) {
    const copy = figma ? claimBannerCopy(latestClaim) : null
    if (copy) {
      return (
        <OfferCard as="button" onClick={() => router.push(`/receipts/${latestClaim.id}`)}>
          {receiptHead}
          <OfferText main={copy.title} sub={copy.detail} />
        </OfferCard>
      )
    }
    return <ReceiptStatusBanner claim={latestClaim} className={className} />
  }

  const upsell = !!quote && quote.tier !== 'black' && quote.blackPct > quote.pct
  const openUpload = () => {
    setSheetOpen(false)
    router.push(uploadHref(merchant.id, kind))
  }

  const onTap = () => {
    if (previewing) return router.push('/membership')
    // cashback is earned in the app — send the visitor there (the web upload flow below stays for when it's switched back on)
    if (openAppPrompt) return openAppPrompt('cashback')
    if (!loggedIn) return promptLogin()
    if (upsell) setSheetOpen(true)
    else openUpload()
  }
  const upgrade = upsell && (
    <TodaysOfferDialog
      open={sheetOpen}
      currentPct={userPct}
      blackPct={quote.blackPct}
      plan={blackPlan}
      onClose={() => setSheetOpen(false)}
      onContinue={openUpload}
      continueLabel={`Upload receipt at ${formatPct(userPct)}`}
    />
  )

  const artText = (
    <>
          {/* "0.5%" 40/52 Black Italic, -3.6 tracking at 18,12; "Cashback" 20/26 Medium Italic at 112,32 */}
          <span className="absolute top-[3.226cqw] left-[4.839cqw] flex items-baseline">
            {pct > 0 && (
              <span className="text-[10.753cqw] leading-[13.978cqw] font-black tracking-[-0.968cqw] italic">{formatPct(pct)}</span>
            )}
            <span className={cn('font-medium italic', pct > 0 ? 'ml-[0.806cqw] text-[5.376cqw] leading-[6.989cqw]' : 'text-[8.2cqw] leading-[13.978cqw] font-bold')}>
              Cashback
            </span>
          </span>
          {/* 14/16 #DFBEFF at 18,61, 184 wide */}
          <span className="absolute top-[16.398cqw] left-[4.839cqw] w-[49.462cqw] text-[3.763cqw] leading-[4.301cqw] text-[#DFBEFF]">
            When you upload the receipt today.
          </span>
    </>
  )

  if (variant === 'art') {
    return (
      <>
        <button
          type="button"
          data-offer-card
          onClick={onTap}
          aria-label={pct > 0 ? `${formatPct(pct)} cashback when you upload the receipt today` : 'Cashback when you upload the receipt'}
          className={cn('block h-full min-w-0 rounded-[calc(18.88*var(--t))] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand', previewing && 'grayscale', className)}
          style={{ minHeight: 'max(112px, calc(170 * var(--t)))' }}
        >
          <ReceiptArtCard fill className="[&>span]:rounded-[calc(18.88*var(--t))]">{artText}</ReceiptArtCard>
        </button>
        {upgrade}
      </>
    )
  }

  if (figma) {
    return (
      <>
        <OfferCard as="button" onClick={onTap} className="transition-transform hover:-translate-y-0.5">
          {receiptHead}
          <OfferText main={pct > 0 ? `Get ${formatPct(pct)} cash back` : 'Get cash back'} sub="when you upload the receipt today" />
        </OfferCard>
        {upgrade}
      </>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3 font-(family-name:--font-dm-sans)', className)}>
      <button
        type="button"
        onClick={onTap}
        aria-label={pct > 0 ? `${formatPct(pct)} cashback when you upload the receipt today` : 'Cashback when you upload the receipt'}
        className={cn(
          'block w-full rounded-2xl transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(42,12,99,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          previewing && 'grayscale',
        )}
      >
        <ReceiptArtCard>
          {artText}
        </ReceiptArtCard>
      </button>

      {upgrade}
    </div>
  )
}
