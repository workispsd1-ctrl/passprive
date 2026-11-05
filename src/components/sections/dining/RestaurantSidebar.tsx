'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Roboto_Mono } from 'next/font/google'
import { Check, ChevronRight } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import { applyOffers, fmtMur, primaryOffer, shareOffer, type BillOffer } from '@/lib/payBill'
import type { DiscountCaps } from '@/lib/services/membershipCaps'
import { stampColor } from '@/lib/stamps'
import { t, tMin } from './designUnit'

const CARD = 'relative bg-white drop-shadow-[0_8px_23.8px_rgba(0,0,0,0.1)]'
const receiptFont = Roboto_Mono({ subsets: ['latin'], display: 'swap' })
const DASHED = 'border-t border-dashed border-[#C9D6FF]'

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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className='flex justify-between' style={{ gap: tMin(14, 10) }}>
      <span className='min-w-0'>{label}</span>
      <span className={strong ? 'shrink-0 text-right font-bold text-[#1A1A1A]' : 'shrink-0 text-right'}>{value}</span>
    </div>
  )
}

/**
 * "This is how much you could save" — an estimate for this restaurant's cost
 * for two, with the member's share of its offer and their cashback rate, worked
 * out the way the bill summary does. Hidden when there's nothing to show.
 */
export function SavingsReceipt({
  costForTwo,
  offers,
  caps,
  merchant,
  printedAt,
  calculateHref,
}: {
  costForTwo: number | null
  offers: BillOffer[]
  caps: DiscountCaps
  merchant: MerchantCapabilityFields
  printedAt: string
  calculateHref: string | null
}) {
  const plan = useUserPlan()
  if (!costForTwo || costForTwo <= 0 || !calculateHref) return null
  const offer = primaryOffer(offers.filter(o => o.source === 'MERCHANT'))
  const shared = offer ? shareOffer(offer, caps[plan]) : null
  const discount = shared ? applyOffers(costForTwo, [shared]).discount : 0
  const toPay = Math.max(0, costForTwo - discount)
  const pct = getCashbackPct(merchant, plan)
  const cashback = Math.round(toPay * pct) / 100
  if (discount <= 0 && cashback <= 0) return null
  const total = [discount > 0 ? `MUR ${fmtMur(discount)}` : null, cashback > 0 ? `${fmtMur(cashback)} Privé credits` : null].filter(Boolean).join(' + ')

  return (
    <section className='flex flex-col items-center'>
      <h2 className='text-center text-[#5b5a5a]' style={{ fontSize: tMin(15, 13) }}>This is how much you could save</h2>
      {/* the blank paper artwork, stretched through its middle so the scalloped edge keeps its shape;
          its shadow falls to the left, so the box is pulled over to centre the paper itself */}
      <div
        className={`${receiptFont.className} flex w-full flex-col text-[#4B5A8C]`}
        style={{
          boxSizing: 'content-box',
          width: `calc(100% - ${t(34)})`,
          marginTop: tMin(10, 6),
          marginLeft: t(-35),
          marginBottom: t(-30),
          borderStyle: 'solid',
          borderWidth: `${t(20)} ${t(17)} ${t(66)} ${t(52)}`,
          borderImage: "url('/assets/merchant-detail/receipt-paper.webp') 40 34 132 104 fill / 1 / 0 stretch",
          borderImageWidth: `${t(20)} ${t(17)} ${t(66)} ${t(52)}`,
          fontSize: tMin(13, 11),
          lineHeight: 1.45,
        }}
      >
        <div className='flex flex-col' style={{ padding: `${tMin(14, 10)} ${tMin(14, 8)} 0` }}>
          <p className='text-center'>{printedAt}</p>
          <div style={{ marginTop: tMin(20, 12) }}><Row label='Estimated amount (2 guests)' value={`MUR ${fmtMur(costForTwo)}`} /></div>
          {discount > 0 && shared && (
            <div className={DASHED} style={{ marginTop: tMin(12, 8), paddingTop: tMin(12, 8) }}>
              <Row label={shared.benefitType === 'percent' ? `${Number(shared.value.toFixed(1))}% off, your share` : 'Restaurant offer'} value={`-${fmtMur(discount)}`} />
            </div>
          )}
          <div className={DASHED} style={{ marginTop: tMin(12, 8), paddingTop: tMin(12, 8) }}><Row label='Amount to pay' value={`MUR ${fmtMur(toPay)}`} /></div>
          {cashback > 0 && (
            <div className={DASHED} style={{ marginTop: tMin(12, 8), paddingTop: tMin(12, 8) }}><Row label={`Cashback* received (${pct}%)`} value={`MUR ${fmtMur(cashback)}`} /></div>
          )}
          <div className={DASHED} style={{ marginTop: tMin(12, 8), paddingTop: tMin(12, 8) }}><Row label='Total savings' value={total} strong /></div>
          {cashback > 0 && <p style={{ marginTop: tMin(20, 12) }}>*Cashback will be added as Privé credits. 1 credit = MUR 1</p>}
        </div>
      </div>
      <Link href={calculateHref} className='flex w-full items-center justify-between border border-[#d5d5d5] bg-white font-medium text-[#252427] hover:bg-gray-50' style={{ marginTop: tMin(18, 10), minHeight: tMin(44, 36), borderRadius: t(24), padding: `0 ${tMin(18, 12)}`, gap: 8, fontSize: tMin(14, 12) }}>
        Calculate savings on any amount
        <ChevronRight className='shrink-0 text-[#666]' style={{ width: tMin(18, 14), height: tMin(18, 14) }} />
      </Link>
    </section>
  )
}

/** "Have queries or need help?" */
export function HelpSideCard() {
  return (
    <Link href='/help' className='block bg-[#FFF3D6] hover:bg-[#FFEDC2]' style={{ padding: tMin(18, 12), borderRadius: t(16) }}>
      <span className='block font-medium text-[#252427]' style={{ fontSize: tMin(14, 13) }}>Have queries or need help?</span>
      <span className='block font-medium text-[#ff4800]' style={{ marginTop: t(2), fontSize: tMin(13, 12) }}>Contact help &amp; support</span>
    </Link>
  )
}
