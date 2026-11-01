import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Receipt } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { RECEIPT_STATUS, formatClaimStamp, formatMoney } from '@/lib/receipts'
import { getMyReceiptClaims } from '@/lib/services/receipts'

export const metadata: Metadata = {
  title: 'Your Receipts | PassPrivé',
}

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  [RECEIPT_STATUS.SUBMITTED]: { label: 'Under review', className: 'bg-[#FFF7E7] text-[#FF8800]' },
  [RECEIPT_STATUS.UNDER_REVIEW]: { label: 'Under review', className: 'bg-[#FFF7E7] text-[#FF8800]' },
  [RECEIPT_STATUS.APPROVED]: { label: 'Approved', className: 'bg-[#EFF8F1] text-[#3AA456]' },
}

/** app parity: screens/MyReceiptsScreen.jsx — receipt claims under review or approved. */
export default async function MyReceiptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const claims = await getMyReceiptClaims(user.id)

  return (
    <main className="min-h-screen font-(family-name:--font-dm-sans)">
      <SetPageTitle title="Your receipts" />
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-16">
        {claims.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-20 text-center">
            <Receipt className="size-10 text-[#C4C4C8]" strokeWidth={1.6} />
            <p className="mt-4 text-[18px] font-bold text-[#2C2D32]">No receipts yet</p>
            <p className="mt-1 max-w-xs text-[14px] text-[#6B7280]">
              Upload a bill from a restaurant or store page to earn cashback.
            </p>
            <Link
              href="/dining"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-[15px] font-semibold text-white hover:bg-brand-dark"
            >
              Explore restaurants
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {claims.map(claim => {
              const merchant = claim.restaurant ?? claim.store
              const cover = merchant?.cover_image ?? claim.store?.logo_url ?? null
              const chip = STATUS_CHIP[claim.status] ?? STATUS_CHIP[RECEIPT_STATUS.SUBMITTED]
              const detail = claim.status === RECEIPT_STATUS.APPROVED && claim.reward_amount != null
                ? `${claim.reward_amount} Privé Credits added`
                : formatMoney(claim.bill_amount) || 'Waiting for review'
              return (
                <li key={claim.id}>
                  <Link href={`/receipts/${claim.id}`} className="flex items-center gap-4 py-4 transition-colors hover:bg-gray-50">
                    <span className="relative flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F2F2F5]">
                      {cover ? (
                        <Image src={cover} alt="" fill className="object-cover" sizes="52px" />
                      ) : (
                        <Receipt className="size-5 text-[#8A8A8E]" strokeWidth={1.8} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-bold text-[#2C2D32]">{merchant?.name ?? 'Your receipt'}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${chip.className}`}>{chip.label}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] font-medium text-[#5B5A5A]">{detail}</span>
                      <span className="mt-0.5 block text-[12px] text-[#8E8E93]">{formatClaimStamp(claim.submitted_at)}</span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-[#8E8E93]" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
