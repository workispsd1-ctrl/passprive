'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Loader2, Lock, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import {
  dealWindowShort,
  isQuotaExhausted,
  isUnlimitedQuota,
  planTierSlug,
  quotaFraction,
  quotaText,
  resetLabel,
  revealDisplay,
  sentence,
  unlocksLeftLabel,
  type DealQuota,
  type DealTerms,
  type RedeemResult,
  type RevealItem,
} from '@/lib/deals'
import type { MerchantDealsState } from '@/lib/services/merchantDeals'
import { DealRevealCard } from './DealRevealCard'
import { DealTicket } from './DealTicket'
import { SnapPager } from '@/components/shared/detail/SnapPager'
import { DealQuotaDialog, DealTermsDialog } from './DealSheets'
import { DealRedeemDialog } from './DealRedeemDialog'
import { DownloadAppDialog } from './RedeemFlowPopups'
import { OfferAction, OfferCard, OfferHead, OfferText } from '@/components/sections/dining/OfferCard'
import { t } from '@/components/sections/dining/designUnit'

const PLAN_BADGES: Record<string, string> = {
  free: '/assets/membership/FreeBadge.webp',
  plus: '/assets/membership/PlusBadge.webp',
  premiere: '/assets/membership/PlusBadge.webp',
  black: '/assets/membership/BlackBadge.webp',
}

/** Monthly unlocks left — app parity: components/DealRevealsCard.jsx. */
function DealRevealsCard({ quota, onLocked, className }: { quota: DealQuota; onLocked: () => void; className?: string }) {
  const badge = PLAN_BADGES[String(quota.tier ?? '').trim().toLowerCase()]
  const reset = resetLabel(quota.period_end)
  const locked = isQuotaExhausted(quota)
  const Wrapper = locked ? 'button' : 'div'

  return (
    <Wrapper
      {...(locked ? { type: 'button' as const, onClick: onLocked } : {})}
      className={cn(
        'flex w-full flex-col justify-center rounded-[18px] border border-[#F2F2F2] px-4 pt-3 pb-4.5 text-left shadow-[-1px_0_11.5px_rgba(0,0,0,0.09)]',
        locked ? 'bg-[#F6F6F6]' : 'bg-white',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn('flex min-w-0 items-center gap-1.5 truncate text-[15px] font-bold', locked ? 'text-[#8E8E93]' : 'text-[#0F172A]')}>
          {locked && <Lock className="size-4 shrink-0" strokeWidth={2.4} />}
          {unlocksLeftLabel(quota)}
        </p>
        {reset && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
            <CalendarDays className="size-3.5" /> {reset}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {badge && <Image src={badge} alt="" width={91} height={39} className={cn('h-auto w-20', locked && 'opacity-50')} />}
          <span className="truncate text-[14px] font-medium text-[#666666]">your monthly unlocks</span>
        </div>
        <span className={cn('shrink-0 font-bold', isUnlimitedQuota(quota) ? 'text-[18px]' : 'text-[24px]', locked ? 'text-[#8E8E93]' : 'text-[#666666]')}>
          {quotaText(quota)}
        </span>
      </div>
      {!isUnlimitedQuota(quota) && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E1E1E1]">
          <div className={cn('h-full rounded-full', locked ? 'bg-[#B8B8B8]' : 'bg-[#FF6A30]')} style={{ width: `${quotaFraction(quota) * 100}%` }} />
        </div>
      )}
      {locked && <p className="mt-2 text-[12px] font-medium text-[#8E8E93]">Tap to see your plan’s deal reveals</p>}
    </Wrapper>
  )
}

/**
 * Horizontal ticket rail — app parity: the snapping reveal carousel. On wider
 * screens arrows page through it and the edges fade where more tickets hide.
 */
function DealRail({ children, count }: { children: React.ReactNode; count: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, count])

  const page = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  const arrow = 'absolute top-[136px] z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#2C2D32] shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition-opacity hover:bg-gray-50 md:flex'

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={measure}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-3 scrollbar-hide md:mx-0 md:scroll-px-0 md:px-0"
      >
        {children}
      </div>
      {!edges.start && (
        <>
          <span className="pointer-events-none absolute inset-y-0 left-0 hidden w-12 bg-linear-to-r from-white to-transparent md:block" />
          <button type="button" onClick={() => page(-1)} aria-label="Previous deals" className={cn(arrow, '-left-3')}>
            <ChevronLeft className="size-5" />
          </button>
        </>
      )}
      {!edges.end && (
        <>
          <span className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-linear-to-l from-white to-transparent md:block" />
          <button type="button" onClick={() => page(1)} aria-label="More deals" className={cn(arrow, '-right-3')}>
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Deal Reveal on a merchant page — app parity: components/DealRevealSection.jsx.
 * The monthly-unlocks card, then a rail of locked deal tickets; revealing one
 * (and redeeming it) is cleared by `redeem_precheck` first, which enforces the
 * plan's monthly and per-merchant limits. Revealed deals hide again when the
 * visitor leaves the page.
 */
export function DealRevealSection({
  restaurantId,
  storeId,
  merchantName,
  onHasItems,
  className,
  variant = 'default',
  previewTier = null,
}: {
  restaurantId?: string
  storeId?: string
  merchantName: string
  onHasItems?: (has: boolean) => void
  /** TierPills preview — another plan's deals, locked (app parity: DealRevealSection previewTier) */
  previewTier?: 'free' | 'plus' | 'black' | null
  className?: string
  /** 'figma' — desktop restaurant page: each piece is an "Offers for today" card, placed by the parent rail */
  /** 'ticket' — the app's current ticket rail (restaurant page sidebar and phones) */
  variant?: 'default' | 'figma' | 'ticket'
}) {
  const { promptLogin } = useAuthPrompt()
  const [state, setState] = useState<MerchantDealsState | null>(null)
  // key → the percent `reveal_deal_percent` returned (null for a non-percentage deal)
  const [revealed, setRevealed] = useState<Map<string, number | null>>(() => new Map())
  const [checking, setChecking] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [terms, setTerms] = useState<DealTerms | null>(null)
  const [quotaSheet, setQuotaSheet] = useState<{ open: boolean; reason: string }>({ open: false, reason: '' })
  const [redeemItem, setRedeemItem] = useState<RevealItem | null>(null)
  const [appPrompt, setAppPrompt] = useState(false)
  const checkingRef = useRef(false)

  const load = useCallback(() => {
    const query = restaurantId ? `restaurantId=${restaurantId}` : `storeId=${storeId}`
    fetch(`/api/deals/merchant?${query}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: MerchantDealsState | null) => { if (data) setState(data) })
      .catch(() => {})
  }, [restaurantId, storeId])

  useEffect(() => {
    load()
    window.addEventListener('pp:auth', load)
    return () => window.removeEventListener('pp:auth', load)
  }, [load])

  const router = useRouter()
  const userTier = planTierSlug(state?.quota?.tier) ?? 'free'
  const previewing = !!previewTier && previewTier !== userTier
  const items = (previewing ? state?.previews?.[previewTier!] : state?.items) ?? []
  const quota = state?.quota ?? null
  // app parity: DealRevealSection viewTier — whose caps the tickets show
  const viewTier = previewing ? previewTier : userTier
  /** The ticket as shown: the revealed percent, else the viewed plan's cap (app: DealRevealCard benefit / upTo). */
  const shown = (item: RevealItem): RevealItem => ({
    ...item,
    ...revealDisplay(item, viewTier, previewing ? null : revealed.get(item.key)),
  })

  useEffect(() => { onHasItems?.(items.length > 0) }, [items.length, onHasItems])

  /** app parity: applyRevealResult — keep the unlocks card in step with the RPC. */
  const applyUsed = useCallback((result: RedeemResult | null) => {
    if (result?.monthly_used == null) return
    // the title card's unlocks gauge follows along
    window.dispatchEvent(new CustomEvent('pp:deal-quota', { detail: result.monthly_used }))
    setState(prev => (prev?.quota ? { ...prev, quota: { ...prev.quota, monthly_used: result.monthly_used ?? null } } : prev))
  }, [])

  const openQuota = useCallback((reason = '') => setQuotaSheet({ open: true, reason }), [])

  const precheck = useCallback(async (item: RevealItem, phase: 'reveal' | 'redeem', onPass: () => void) => {
    if (checkingRef.current) return
    if (!state?.loggedIn) { promptLogin(); return }
    if (isQuotaExhausted(quota)) { openQuota(); return }
    checkingRef.current = true
    setChecking(`${phase}:${item.key}`)
    setMessage('')
    const res = await fetch('/api/deals/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'precheck', kind: item.kind, id: item.id }),
    }).catch(() => null)
    const result = (await res?.json().catch(() => null)) as (RedeemResult & { signedOut?: boolean }) | null
    checkingRef.current = false
    setChecking(null)
    if (result?.signedOut) { promptLogin(); return }
    // No verdict (RPC unavailable) → let it through; redeeming checks again.
    if (!result || result.allowed || result.locked_until) {
      if (result?.allowed) applyUsed(result)
      onPass()
      return
    }
    const reason = String(result.reason ?? '')
    if (/limit reached/i.test(reason)) {
      applyUsed(result)
      openQuota(reason)
      return
    }
    setMessage(`Can’t redeem this deal. ${sentence(reason) || 'Please try again later.'}`)
  }, [state?.loggedIn, quota, promptLogin, openQuota, applyUsed])

  /**
   * app parity: DealRevealSection onReveal — once cleared, a percentage deal
   * asks `reveal_deal_percent` for its percent; no percent means try again.
   */
  const reveal = useCallback((item: RevealItem) => {
    precheck(item, 'reveal', async () => {
      if (!item.percent) {
        setRevealed(prev => new Map(prev).set(item.key, null))
        return
      }
      checkingRef.current = true
      setChecking(`reveal:${item.key}`)
      const res = await fetch('/api/deals/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reveal', kind: item.kind, id: item.id }),
      }).catch(() => null)
      const data = (await res?.json().catch(() => null)) as { percent?: number | null } | null
      checkingRef.current = false
      setChecking(null)
      const percent = Number(data?.percent)
      if (!(percent > 0)) {
        setMessage('Can’t reveal this deal. Please try again in a moment.')
        return
      }
      setRevealed(prev => new Map(prev).set(item.key, percent))
    })
  }, [precheck])

  const onRedeemed = useCallback((item: RevealItem, result: RedeemResult) => {
    applyUsed(result)
    setRedeemItem(null)
    setRevealed(prev => {
      const next = new Map(prev)
      next.delete(item.key)
      return next
    })
  }, [applyUsed])

  const closeRedeem = useCallback(() => setRedeemItem(null), [])
  // Redeeming happens in the app (NFC / PIN at the counter) — every device gets the download pop-up.
  // The web redeem flow (setRedeemItem → DealRedeemDialog) is kept for when it's switched back on.
  const startRedeem: (item: RevealItem) => void = useCallback(() => {
    setAppPrompt(true)
  }, [])
  const onLimit = useCallback((reason: string) => { openQuota(reason); load() }, [openQuota, load])

  if (!items.length) return null

  const dialogs = (
    <>
      <DealTermsDialog deal={terms} quota={quota} onClose={() => setTerms(null)} />
      <DealQuotaDialog
        open={quotaSheet.open}
        reason={quotaSheet.reason}
        quota={quota}
        onClose={() => setQuotaSheet({ open: false, reason: '' })}
      />
      <DealRedeemDialog
        key={redeemItem?.key ?? 'closed'}
        item={redeemItem}
        merchantName={merchantName}
        merchantKind={storeId ? 'store' : 'restaurant'}
        onClose={closeRedeem}
        onRedeemed={onRedeemed}
        onLimit={onLimit}
      />
      <DownloadAppDialog open={appPrompt} reason='deal' onClose={() => setAppPrompt(false)} />
    </>
  )

  if (variant === 'ticket') {
    const locked = previewing || isQuotaExhausted(quota)
    return (
      <div className={cn('font-(family-name:--font-dm-sans)', className)}>
        <SnapPager label='Deal'>
          {items.map(item => {
            // app parity: a previewed plan's tickets stay locked, even ones you revealed
            const open = !previewing && revealed.has(item.key)
            return (
              <div key={item.key} className='flex flex-col'>
                <DealTicket
                  item={shown(item)}
                  revealed={open}
                  locked={locked && !open}
                  busy={checking === `reveal:${item.key}`}
                  onReveal={() => (previewing ? router.push('/membership') : locked ? openQuota() : reveal(item))}
                  onTerms={() => setTerms(item.terms)}
                />
                {open && (
                  <button
                    type='button'
                    onClick={() => precheck(item, 'redeem', () => startRedeem(item))}
                    disabled={!!checking}
                    className={cn(
                      'mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(109.78deg,#FF4800,#001FE7)] text-[15px] font-semibold text-white transition-opacity',
                      checking === `redeem:${item.key}` && 'opacity-70',
                    )}
                  >
                    {checking === `redeem:${item.key}` ? <Loader2 className='size-5 animate-spin' /> : <Ticket className='size-5' />} Redeem Deal <ArrowRight className='size-5' />
                  </button>
                )}
              </div>
            )
          })}
        </SnapPager>
        {!state?.loggedIn && (
          <p className='mt-2 text-center text-[12px] text-[#767677]'>
            <button type='button' onClick={promptLogin} className='font-semibold text-brand hover:underline'>Sign in</button> to reveal {items.length === 1 ? 'this deal' : `${items.length} deals`}
          </p>
        )}
        {message && <p role='alert' className='mt-1 text-[13px] font-semibold text-[#E5484D]'>{message}</p>}
        {dialogs}
      </div>
    )
  }

  if (variant === 'figma') {
    const coin = <Image src="/assets/deals/deal-coin.png" alt="" width={36} height={36} style={{ width: t(36), height: t(36) }} />
    const badge = PLAN_BADGES[String(quota?.tier ?? '').trim().toLowerCase()]
    const locked = isQuotaExhausted(quota)
    return (
      <>
        {quota ? (
          <OfferCard as="button" onClick={locked ? () => openQuota() : undefined} className={cn(!locked && 'cursor-default')}>
            <div className="flex items-center justify-between" style={{ gap: t(16) }}>
              {badge && <Image src={badge} alt="" width={133} height={57} className={cn('w-auto', locked && 'opacity-50')} style={{ height: t(57) }} />}
              {resetLabel(quota.period_end) && (
                <span className="flex items-center rounded-full bg-[#fff1eb] font-semibold text-[#d93d00]" style={{ height: t(40), padding: `0 ${t(16)}`, gap: t(8), fontSize: t(18) }}>
                  <CalendarDays style={{ width: t(20), height: t(20) }} /> {resetLabel(quota.period_end)}
                </span>
              )}
            </div>
            <OfferText
              main={<span className={cn(locked && 'text-[#8e8e93]')}>{unlocksLeftLabel(quota)}</span>}
              sub={locked ? 'Tap to see your plan’s deal reveals' : `${quotaText(quota)} deal reveals used`}
            />
          </OfferCard>
        ) : (
          !state?.loggedIn && (
            <OfferCard>
              <OfferHead icon={coin} label="Member deals" color="#ff4800" aside={<OfferAction onClick={promptLogin}>Sign in</OfferAction>} />
              <OfferText main={`${items.length} ${items.length === 1 ? 'deal' : 'deals'} to reveal`} sub="Sign in to see your monthly unlocks" />
            </OfferCard>
          )
        )}

        {items.map(item => {
          const open = !previewing && revealed.has(item.key)
          const view = shown(item)
          const windowLine = dealWindowShort(item.terms)
          return (
            <OfferCard key={item.key}>
              <OfferHead
                icon={coin}
                label="Deal reveal"
                color="#ff4800"
                aside={
                  open ? (
                    <OfferAction gradient disabled={!!checking} onClick={() => precheck(item, 'redeem', () => startRedeem(item))}>
                      {checking === `redeem:${item.key}` ? <Loader2 className="animate-spin" style={{ width: t(20), height: t(20) }} /> : <Ticket style={{ width: t(20), height: t(20) }} />}
                      Redeem
                    </OfferAction>
                  ) : previewing ? (
                    // app parity: a previewed plan's deal is locked behind an upgrade
                    <OfferAction onClick={() => router.push('/membership')}>
                      <Lock style={{ width: t(18), height: t(18) }} strokeWidth={2.4} />
                      Upgrade
                    </OfferAction>
                  ) : (
                    <OfferAction disabled={!!checking} onClick={() => reveal(item)}>
                      {checking === `reveal:${item.key}` ? <Loader2 className="animate-spin" style={{ width: t(20), height: t(20) }} /> : <Lock style={{ width: t(18), height: t(18) }} strokeWidth={2.4} />}
                      Reveal
                    </OfferAction>
                  )
                }
              />
              {open ? (
                <OfferText
                  main={view.benefit}
                  sub={
                    <>
                      {windowLine && `${windowLine} · `}
                      <button type="button" onClick={() => setTerms(item.terms)} className="underline hover:text-[#2c2d32]">Terms</button>
                    </>
                  }
                />
              ) : (
                <OfferText
                  main={
                    // the benefit itself, unreadable until revealed
                    <span aria-hidden="true" className="inline-block blur-[7px] select-none">{view.benefit}</span>
                  }
                  sub={previewing ? `Up to ${view.upTo || view.benefit} on this plan` : 'Reveal to see this deal'}
                />
              )}
            </OfferCard>
          )
        })}
        {message && <p role="alert" className="max-w-80 shrink-0 self-center font-semibold text-[#E5484D]" style={{ fontSize: t(18) }}>{message}</p>}
        {dialogs}
      </>
    )
  }

  return (
    // `contents`: the unlocks card and the rail are placed by the parent grid
    // (side by side with the receipt card on desktop, stacked on phones)
    <div className={cn('contents font-(family-name:--font-dm-sans)', className)}>
      {quota ? (
        <DealRevealsCard quota={quota} onLocked={() => openQuota()} className="md:order-1" />
      ) : (
        !state?.loggedIn && (
          // signed out there's no quota yet — one quiet line, not a card competing with the deals
          <div className='flex items-center gap-3 rounded-2xl bg-[#FFF6F1] px-4 py-3 md:order-0 md:col-span-2'>
            <Lock className='size-4 shrink-0 text-brand' strokeWidth={2.4} />
            <p className='min-w-0 flex-1 text-[13px] leading-5 text-[#7A2E0E]'>
              <span className='font-bold'>Sign in to reveal {items.length === 1 ? 'this deal' : `${items.length} deals`}</span>
              <span className='hidden sm:inline'> and see your monthly unlocks</span>
            </p>
            <button
              type='button'
              onClick={promptLogin}
              className='shrink-0 rounded-full bg-brand px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark'
            >
              Sign in
            </button>
          </div>
        )
      )}

      <section aria-label="Deal Reveal" className="min-w-0 md:order-3 md:col-span-2">
       <DealRail count={items.length}>
        {items.map(item => {
          const open = !previewing && revealed.has(item.key)
          return (
            <div key={item.key} className="flex w-79 shrink-0 snap-start flex-col items-center">
              <DealRevealCard
                item={shown(item)}
                quota={quota}
                revealed={open}
                busy={checking === `reveal:${item.key}`}
                locked={previewing}
                onReveal={() => (previewing ? router.push('/membership') : reveal(item))}
                onTerms={() => setTerms(item.terms)}
              />
              {open && (
                <button
                  type="button"
                  onClick={() => precheck(item, 'redeem', () => startRedeem(item))}
                  disabled={!!checking}
                  className={cn(
                    'mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(109.78deg,#FF4800,#001FE7)] text-[16px] font-semibold text-white transition-opacity',
                    checking === `redeem:${item.key}` && 'opacity-70',
                  )}
                >
                  <Ticket className="size-5" /> Redeem Deal <ArrowRight className="size-5" />
                </button>
              )}
            </div>
          )
        })}
       </DealRail>
       {message && <p role="alert" className="mt-1 text-[13px] font-semibold text-[#E5484D]">{message}</p>}
      </section>

      {dialogs}
    </div>
  )
}
