'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Lock } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { dealWindowSentence, resetDateSentence, resetLabel, type DealQuota, type DealTerms } from '@/lib/deals'
import type { RevealPlan } from '@/lib/services/merchantDeals'

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

/** app parity: DealTermsSheet.jsx buildSections */
function termsSections(deal: DealTerms, quota: DealQuota | null) {
  const { starts_at: starts, ends_at: ends } = deal
  const validity = starts && ends
    ? `This deal is valid from ${dealWindowSentence(starts, ends)}.`
    : ends
      ? `This deal is valid until ${dealWindowSentence(null, ends)}.`
      : 'This deal is valid while it is shown as live on the merchant page.'
  const reset = resetDateSentence(quota?.period_end)
  const monthly = quota?.monthly_limit
  const perMerchant = quota?.per_restaurant_limit
  const merchantTerms = (deal.terms ?? []).filter(Boolean)
  return [
    {
      title: 'Eligibility',
      points: [
        'Deal Reveal is available to signed-in PassPrivé members. The deals you see depend on your membership plan.',
        'Deals are personal to your account and cannot be transferred or exchanged for cash.',
      ],
    },
    {
      title: 'Your Monthly Limit',
      points: [
        monthly == null
          ? 'Your plan has no monthly limit on redeemed deals.'
          : `Your plan includes ${plural(monthly, 'redeemed deal')} per month across all merchants.`,
        perMerchant == null ? null : `You can redeem up to ${plural(perMerchant, 'deal')} per merchant each month.`,
        reset ? `Your limit resets on ${reset} (Mauritius time).` : 'Your limit resets at the start of every month (Mauritius time).',
        String(quota?.tier ?? '').toLowerCase() === 'black'
          ? null
          : 'Want more deals? Upgrade your PassPrivé membership to unlock more deals each month and better offers at every merchant.',
      ].filter((p): p is string => !!p),
    },
    {
      title: 'How It Works',
      points: [
        'Tap to reveal the deal before you pay. A revealed deal hides again once you leave the merchant page.',
        'At the counter, tap Redeem Deal and hold your phone on the merchant’s PassPrivé NFC tag. If NFC is not available, ask the staff for the deal PIN and enter it.',
        'Show the confirmation screen and code to the staff so the deal is applied to your bill.',
        'Redeem only while you are at the merchant. A redeemed deal cannot be reversed or reused.',
      ],
    },
    { title: 'Validity', points: [validity] },
    {
      title: 'PIN Security',
      points: [
        'After 5 wrong PIN attempts, PIN entry is paused for 5 minutes.',
        'After 5 more wrong attempts, PIN entry is paused for 24 hours.',
      ],
    },
    ...(merchantTerms.length ? [{ title: 'Merchant Terms', points: merchantTerms }] : []),
  ]
}

export function DealTermsDialog({
  deal,
  quota,
  onClose,
}: {
  deal: DealTerms | null
  quota: DealQuota | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!deal} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[80dvh] gap-0 overflow-hidden rounded-3xl bg-white p-0 font-(family-name:--font-dm-sans) sm:max-w-lg">
        <div className="border-b border-gray-100 px-6 pt-6 pb-4">
          <DialogTitle className="text-[18px] font-bold text-[#2C2D32]">Deal Reveal Terms &amp; Conditions</DialogTitle>
          <DialogDescription className="mt-1 text-[13px] text-[#666666]">
            Unlock your exclusive cashback deal—fair, simple, and transparent.
          </DialogDescription>
        </div>
        <div className="overflow-y-auto px-6 py-4">
          {deal && termsSections(deal, quota).map(section => (
            <section key={section.title} className="mb-4 last:mb-0">
              <h3 className="text-[14px] font-bold text-[#2C2D32]">{section.title}</h3>
              <ul className="mt-1.5 space-y-1">
                {section.points.map(point => (
                  <li key={point} className="flex gap-2 text-[13px] leading-5 text-[#5B5A5A]">
                    <span aria-hidden="true">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

let plansCache: RevealPlan[] | null = null

function limitText(value: number | null | undefined) {
  return value == null ? 'Unlimited' : String(value)
}

/**
 * "You've used all your deal reveals" — app parity: DealQuotaSheet.jsx. A
 * per-merchant limit (the RPC reason mentions the merchant) gets its own copy.
 */
export function DealQuotaDialog({
  open,
  reason,
  quota,
  onClose,
}: {
  open: boolean
  reason: string
  quota: DealQuota | null
  onClose: () => void
}) {
  const [plans, setPlans] = useState<RevealPlan[]>(plansCache ?? [])

  useEffect(() => {
    if (!open || plansCache) return
    fetch('/api/deals/plans')
      .then(res => (res.ok ? res.json() : null))
      .then((data: { plans?: RevealPlan[] } | null) => {
        if (!data?.plans) return
        plansCache = data.plans
        setPlans(data.plans)
      })
      .catch(() => {})
  }, [open])

  const tier = String(quota?.tier ?? '').toLowerCase()
  const current = plans.find(p => p.tier === tier)
  const planName = current?.plan_name?.trim() || 'plan'
  const limit = quota?.monthly_limit
  const used = Number(quota?.monthly_used) || 0
  const merchantLimited = /merchant|restaurant/i.test(reason)
  const reset = resetLabel(quota?.period_end)

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="gap-0 rounded-3xl bg-white p-6 text-center font-(family-name:--font-dm-sans) sm:max-w-md">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand">
          <Lock className="size-6.5 text-white" strokeWidth={2.4} />
        </span>
        <DialogTitle className="mt-4 text-[20px] font-bold text-[#2C2D32]">
          {merchantLimited ? 'Limit reached for this merchant' : 'You’ve used all your deal reveals'}
        </DialogTitle>
        <DialogDescription className="mt-2 text-[14px] leading-5 text-[#666666]">
          {!quota
            ? 'You’ve used your deal reveals for this month. Upgrade to unlock more deals.'
            : merchantLimited
              ? `Your ${planName} allows ${limitText(current?.deals_per_restaurant_per_month)} reveals per merchant each month.`
              : `Your ${planName} includes ${limitText(limit)} deal reveals a month. You’ve used ${used}${limit == null ? '' : ` of ${limit}`}.`}
        </DialogDescription>
        {reset && (
          <span className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full border border-[#FFAC8B] bg-brand-tint px-3 py-1 text-[12px] font-semibold text-brand-dark">
            <CalendarDays className="size-3.5" /> {reset}
          </span>
        )}

        {plans.length > 0 && (
          <table className="mt-5 w-full overflow-hidden rounded-xl text-left text-[13px]">
            <thead className="bg-[#F6F6F6] text-[#666666]">
              <tr>
                <th className="px-3 py-2 font-semibold">Plan</th>
                <th className="px-3 py-2 font-semibold">Per month</th>
                <th className="px-3 py-2 font-semibold">Per merchant</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => {
                const mine = plan.tier === tier
                return (
                  <tr key={plan.tier} className={mine ? 'bg-brand-tint font-bold text-brand-dark' : 'border-t border-gray-100 text-[#2C2D32]'}>
                    <td className="px-3 py-2">{plan.plan_name?.trim()}{mine ? ' (you)' : ''}</td>
                    <td className="px-3 py-2">{limitText(plan.deals_per_month)}</td>
                    <td className="px-3 py-2">{limitText(plan.deals_per_restaurant_per_month)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {tier !== 'black' && (
          <Link
            href="/membership"
            onClick={onClose}
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark"
          >
            Upgrade plan
          </Link>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 flex h-12 items-center justify-center rounded-full border border-brand text-[16px] font-semibold text-brand hover:bg-brand-tint"
        >
          Got it
        </button>
      </DialogContent>
    </Dialog>
  )
}
