'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Clock, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { hasBillCashback, isCashbackEnabled, type MerchantCapabilityFields } from '@/lib/cashback'
import { earnOn } from '@/lib/platformFlags'
import {
  RECEIPT_STATUS,
  claimBannerCopy,
  formatPct,
  isPendingStatus,
  uploadHref,
  type BlackPlan,
  type ReceiptClaim,
} from '@/lib/receipts'
import type { ReceiptMerchantState } from '@/lib/services/receipts'
import { cn } from '@/lib/utils'
import { OfferCard, OfferHead, OfferText } from '@/components/sections/dining/OfferCard'
import { t } from '@/components/sections/dining/designUnit'

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

function formatMur(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('en-US') : null
}

function periodLabel(type: string | null | undefined) {
  const m = String(type ?? '').match(/(\d+)\s*(year|month)/i)
  if (!m) return null
  const count = Number(m[1])
  const unit = m[2].toLowerCase()
  return count === 1 ? `For 1 ${unit}` : `For next ${count} ${unit}s`
}

/** "Get 4% instead of 1%" — app parity: components/BlackUpgradeSheet.jsx. */
function BlackUpgradeDialog({
  open,
  currentPct,
  blackPct,
  plan,
  onClose,
  onContinue,
}: {
  open: boolean
  currentPct: number
  blackPct: number
  plan: BlackPlan | null
  onClose: () => void
  onContinue: () => void
}) {
  const price = formatMur(plan?.amount)
  const struck = formatMur(plan?.original_amount)
  const period = periodLabel(plan?.type)
  const planName = String(plan?.plan_name ?? '').trim() || 'Privé Black'
  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="gap-0 rounded-3xl bg-white p-6 text-center font-(family-name:--font-dm-sans) sm:max-w-sm">
        <p className="text-[11px] font-bold tracking-[2px] text-[#8E8E93]">TODAY’S OFFER</p>
        <DialogTitle className="mt-2 bg-linear-to-r from-[#FF4800] to-[#7B2CF5] bg-clip-text text-[40px] leading-tight font-black text-transparent">
          Get {formatPct(blackPct)}
        </DialogTitle>
        <p className="text-[16px] font-semibold text-[#5B5A5A]">instead of {formatPct(currentPct)}</p>
        <DialogDescription className="mt-3 text-[14px] text-[#2C2D32]">
          If you upgrade to <span className="font-bold">{planName}</span>
          {price ? ' at a special rate of' : ''}
        </DialogDescription>
        {price && (
          <div className="mt-3 flex flex-col items-center gap-1">
            {struck && struck !== price && <span className="text-[13px] text-[#8E8E93] line-through">{struck} MUR</span>}
            <span className="rounded-xl bg-[#F6F6F6] px-5 py-2 text-[28px] font-black text-[#2C2D32]">
              {price}<span className="text-[16px] font-bold"> MUR</span>
            </span>
            <Image src="/assets/membership/BlackBadge.webp" alt="Privé Black" width={91} height={39} className="mt-1 h-auto w-22" />
            {period && <span className="text-[12px] font-medium text-[#666666]">{period}</span>}
          </div>
        )}
        <Link
          href="/membership"
          onClick={onClose}
          className="mt-5 flex h-12 items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark"
        >
          Upgrade Now
        </Link>
        <button type="button" onClick={onContinue} className="mt-3 text-[14px] font-semibold text-brand underline">
          Upload receipt at {formatPct(currentPct)}
        </button>
      </DialogContent>
    </Dialog>
  )
}

/**
 * The purple receipt card — app parity: ReceiptCashbackBanner.jsx, laid out on
 * its 342×104 design frame. Everything is sized in container units (1cqw =
 * 3.42 design px) so the card scales as one piece: the receipt art is an
 * opaque square painted to sit in the right 40% of exactly this shape.
 */
function ReceiptArtCard({ children, className }: { children: React.ReactNode; className?: string }) {
  // the container is the wrapper: cqw resolves against an ancestor, never the element itself
  return (
    <span className={cn('block w-full @container', className)}>
    <span className="relative block aspect-342/104 w-full overflow-hidden rounded-[4.68cqw] bg-[linear-gradient(196deg,#2A0C63_18%,#38107C_47%,#2F0E6D_76%)] text-left text-white">
      <span className="pointer-events-none absolute top-[-37.4cqw] left-[-21.9cqw] size-[80.7cqw] rounded-full bg-[radial-gradient(closest-side,#20094C,rgba(32,9,76,0.75)_55%,transparent)]" />
      <span className="pointer-events-none absolute top-[-7.3cqw] left-[44.4cqw] h-[45cqw] w-[26.3cqw] rounded-full bg-[radial-gradient(closest-side,#38117D,rgba(56,17,125,0.75)_55%,transparent)]" />
      <Image
        src="/assets/receipts/cashback-upload-receipt.jpeg"
        alt=""
        width={340}
        height={340}
        sizes="(min-width: 768px) 240px, 50vw"
        className="pointer-events-none absolute top-[-8.19cqw] left-[59.06cqw] size-[49.7cqw] max-w-none"
      />
      {children}
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
}: {
  merchant: MerchantCapabilityFields & { id: string }
  kind: 'restaurant' | 'store'
  className?: string
  /** 'figma' — desktop restaurant page: an "Offers for today" card */
  variant?: 'default' | 'figma'
}) {
  const router = useRouter()
  const { promptLogin } = useAuthPrompt()
  const eligible = earnOn() && !hasBillCashback(merchant)
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
  const pct = quote?.pct ?? 0
  const cashbackOff = !isCashbackEnabled(merchant) || (!!quote && quote.pct === 0 && quote.blackPct === 0)
  // Signed out there's no quote yet — still invite them, the rate shows after login.
  if (loggedIn && !cashbackOff && !(pct > 0)) return null

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
  if (latestClaim && (isPendingStatus(claimStatus) || recentlyRejected)) {
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
    if (!loggedIn) return promptLogin()
    if (upsell) setSheetOpen(true)
    else openUpload()
  }
  const upgrade = upsell && (
    <BlackUpgradeDialog
      open={sheetOpen}
      currentPct={pct}
      blackPct={quote.blackPct}
      plan={blackPlan}
      onClose={() => setSheetOpen(false)}
      onContinue={openUpload}
    />
  )

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
        className="block w-full rounded-2xl transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(42,12,99,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <ReceiptArtCard>
          <span className="absolute top-[3.51cqw] left-[5.26cqw] flex items-end">
            {pct > 0 && (
              <span className="text-[11.7cqw] leading-none font-bold tracking-[-1.05cqw] italic">{formatPct(pct)}</span>
            )}
            <span className={cn('leading-none font-medium italic', pct > 0 ? 'mb-[1.75cqw] ml-[2.92cqw] text-[5.85cqw]' : 'mt-[2.5cqw] text-[8.2cqw] font-bold')}>
              Cashback
            </span>
          </span>
          <span className="absolute top-[17.84cqw] left-[5.26cqw] w-[53.8cqw] text-[4.09cqw] leading-[4.68cqw] text-[#DFBEFF]">
            When you upload the receipt today.
          </span>
        </ReceiptArtCard>
      </button>

      {upgrade}
    </div>
  )
}
