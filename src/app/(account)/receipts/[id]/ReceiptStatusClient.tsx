'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Clock, Pencil, X } from 'lucide-react'
import {
  RECEIPT_STATUS,
  formatClaimStamp,
  formatMoney,
  isPendingStatus,
  uploadHref,
  type ReceiptClaim,
  type ReceiptMerchant,
} from '@/lib/receipts'
import { ReceiptTip } from '../upload/UploadReceiptClient'

type Result = { claim: ReceiptClaim; merchant: ReceiptMerchant | null }

const STATE_COPY = {
  pending: {
    title: 'Under review',
    body: 'We’re checking your receipt. We’ll update you very soon.',
    palette: ['bg-[#FFF7E7]', 'bg-[#FFE5C2]', 'bg-[#FF8800]'],
    Icon: Clock,
  },
  approved: { title: 'Receipt approved.', body: '', palette: ['bg-[#CEE8D5]', 'bg-[#9DD1AB]', 'bg-[#3AA456]'], Icon: Check },
  rejected: {
    title: 'Receipt couldn’t be verified.',
    body: 'The receipt is unclear. Please upload a clear image, showing the merchant name, date and total amount.',
    palette: ['bg-[#FDECEC]', 'bg-[#F8D3D3]', 'bg-[#E5484D]'],
    Icon: X,
  },
}

function StatusHero({ palette, Icon }: { palette: string[]; Icon: typeof Check }) {
  return (
    <span className={`flex size-31 items-center justify-center rounded-full ${palette[0]}`}>
      <span className={`flex size-25 items-center justify-center rounded-full ${palette[1]}`}>
        <span className={`flex size-19 items-center justify-center rounded-full ${palette[2]}`}>
          <Icon className="size-13 text-white" strokeWidth={2} />
        </span>
      </span>
    </span>
  )
}

function DetailRow({ label, value, editHref }: { label: string; value: string; editHref?: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-[#F0F0F0] py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[#8E8E93]">{label}</p>
        <p className="truncate text-[15px] font-semibold text-[#2C2D32]">{value}</p>
      </div>
      {editHref && (
        <Link href={editHref} aria-label={`Edit ${label.toLowerCase()}`} className="rounded-full p-1.5 hover:bg-gray-100">
          <Pencil className="size-5 text-[#5B5A5A]" strokeWidth={1.6} />
        </Link>
      )}
    </div>
  )
}

/**
 * Where a claim stands. Polls every 10s while under review — app parity:
 * ReceiptStatusScreen's interval. `celebrate` shows the green tick first, the
 * way the app's ReceiptSubmittedScreen does after a submit or an edit.
 */
export function ReceiptStatusClient({ initial, celebrate }: { initial: Result; celebrate: string | null }) {
  const router = useRouter()
  const [{ claim, merchant }, setResult] = useState(initial)
  const [splash, setSplash] = useState(celebrate)
  const status = String(claim.status)
  const pending = isPendingStatus(status)

  useEffect(() => {
    if (!splash) return
    const timer = setTimeout(() => {
      setSplash(null)
      router.replace(`/receipts/${claim.id}`, { scroll: false })
    }, 2200)
    return () => clearTimeout(timer)
  }, [splash, claim.id, router])

  useEffect(() => {
    if (!pending) return
    const timer = setInterval(() => {
      fetch(`/api/receipts/${claim.id}`)
        .then(res => (res.ok ? res.json() : null))
        .then((data: Result | null) => { if (data?.claim) setResult(data) })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(timer)
  }, [pending, claim.id])

  if (splash) {
    return (
      <button
        type="button"
        onClick={() => setSplash(null)}
        className="flex min-h-[70dvh] w-full flex-col items-center justify-center gap-10 font-(family-name:--font-dm-sans)"
      >
        <span className="flex size-62 animate-in zoom-in-75 items-center justify-center rounded-full bg-[#CEE8D5] duration-500">
          <span className="flex size-53 items-center justify-center rounded-full bg-[#9DD1AB]">
            <span className="flex size-36 items-center justify-center rounded-full bg-[#3AA456]">
              <Check className="size-20 text-white" strokeWidth={3} />
            </span>
          </span>
        </span>
        <span className="max-w-69 text-center text-[20px] leading-6.5 font-bold text-[#2C2D32]">{splash}</span>
      </button>
    )
  }

  const rejected = status === RECEIPT_STATUS.REJECTED
  const approved = status === RECEIPT_STATUS.APPROVED
  const copy = approved ? STATE_COPY.approved : rejected ? STATE_COPY.rejected : STATE_COPY.pending
  const rewardLine = claim.reward_amount != null
    ? `${claim.reward_amount} Privé Credits${claim.reward_percent != null ? ` (${claim.reward_percent}%)` : ''}`
    : 'Calculated after approval'
  const merchantId = merchant?.id ?? claim.restaurant_id ?? claim.store_id
  const kind = merchant?.kind ?? (claim.store_id ? 'store' : 'restaurant')
  const editHref = `/receipts/${claim.id}/edit`

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-8 pb-12 font-(family-name:--font-dm-sans)">
      <StatusHero palette={copy.palette} Icon={copy.Icon} />
      <h1 className="mt-7 text-center text-[24px] font-bold text-[#2C2D32]">{copy.title}</h1>
      {approved && Number(claim.reward_amount) > 0 && (
        <p className="mt-2 text-center text-[18px] leading-6 font-bold text-[#3AA456]">
          {claim.reward_amount} Privé Credits added to your wallet.
        </p>
      )}
      {(copy.body || claim.rejection_reason) && (
        <p className="mt-2 max-w-68 text-center text-[14px] leading-5 text-[#6B7280]">
          {rejected && claim.rejection_reason ? claim.rejection_reason : copy.body}
        </p>
      )}

      {!rejected && (
        <div className="mt-7 w-full rounded-[18px] bg-white px-5 pt-5 pb-2 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <div className="mb-3 flex items-center gap-4.5">
            <span className="relative size-15 shrink-0 overflow-hidden rounded-full bg-[#D3D3D3]">
              {merchant?.cover_image && <Image src={merchant.cover_image} alt="" fill className="object-cover" sizes="60px" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[18px] font-bold text-[#2C2D32]">{merchant?.name ?? 'Your receipt'}</span>
              <span className="block truncate text-[13px] text-[#6B7280]">{(merchant?.cuisines ?? []).slice(0, 2).join(', ')}</span>
            </span>
          </div>
          {approved ? (
            <>
              <DetailRow label="Eligible bill" value={formatMoney(claim.bill_amount) || 'Pending'} />
              <DetailRow label="Reward amount" value={rewardLine} />
              <DetailRow label="Approved on" value={formatClaimStamp(claim.reviewed_at)} />
            </>
          ) : (
            <>
              <DetailRow label="Submitted on" value={formatClaimStamp(claim.submitted_at)} />
              <DetailRow label="Eligible bill" value={formatMoney(claim.bill_amount) || 'Not added yet'} editHref={editHref} />
              <DetailRow label="Estimated reward" value={rewardLine} />
            </>
          )}
        </div>
      )}

      {pending && (
        <>
          <div className="mt-6 w-full">
            <ReceiptTip>You can edit the amount, date or receipt photo if something looks incorrect.</ReceiptTip>
          </div>
          <Link href={editHref} className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark">
            Edit Claim
          </Link>
          <Link href="/receipts" className="mt-5 text-[14px] font-semibold text-[#6B7280] underline">Done</Link>
        </>
      )}

      {rejected && merchantId && (
        <>
          <Link href={uploadHref(merchantId, kind)} className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark">
            Upload again
          </Link>
          <Link href={uploadHref(merchantId, kind)} className="mt-5 text-[14px] font-semibold text-[#6B7280] underline">
            View guidelines
          </Link>
        </>
      )}

      {approved && (
        <>
          <Link href="/great-deals" className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark">
            My Deals &amp; Offers
          </Link>
          <Link href="/" className="mt-5 text-[14px] font-semibold text-[#6B7280] underline">Go Home</Link>
        </>
      )}
    </div>
  )
}
