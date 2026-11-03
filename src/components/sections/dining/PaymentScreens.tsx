'use client'

import Image from 'next/image'
import { t } from '@/components/sections/dining/designUnit'
import { fmtMur } from '@/lib/payBill'

const P = '/assets/pay-bill'

/** The frames' peach wash across the top of a full-screen state. */
function PeachTop() {
  return <div aria-hidden='true' className='pointer-events-none absolute inset-x-0 top-0 h-[30vh] bg-linear-to-b from-[#ffbfa3] to-white' />
}

/** Figma "Processing…" — four bouncing orange dots. */
export function ProcessingScreen({ title = 'Processing...', sub = 'Please do not close this window', children }: { title?: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div role='status' aria-live='polite' className='fixed inset-0 z-50 flex flex-col items-center bg-white font-(family-name:--font-dm-sans)'>
      <PeachTop />
      <div className='relative mt-[38vh] flex flex-col items-center text-center' style={{ gap: t(20) }}>
        <span className='flex items-end' style={{ gap: t(14), height: t(40) }}>
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              className='animate-bounce rounded-full bg-[#ff7d45]'
              style={{ width: t(22), height: t(22), animationDelay: `${i * 140}ms`, animationDuration: '900ms' }}
            />
          ))}
        </span>
        <p className='font-bold text-[#2c2d32]' style={{ fontSize: t(40) }}>{title}</p>
        <p className='max-w-[90vw] text-[#5b5a5a]' style={{ fontSize: t(28) }}>{sub}</p>
        {children}
      </div>
    </div>
  )
}

/** The green check in two soft rings — Figma 110 / 94 / 77. */
export function CheckRings({ size = 110 }: { size?: number }) {
  const k = size / 110
  return (
    <span className='relative flex items-center justify-center rounded-full bg-[#cee8d5]' style={{ width: t(110 * k), height: t(110 * k) }}>
      <span className='flex items-center justify-center rounded-full bg-[#9dd1ab]' style={{ width: t(94 * k), height: t(94 * k) }}>
        <Image src={`${P}/check.svg`} alt='' width={77} height={77} style={{ width: t(76.7 * k), height: t(76.7 * k) }} />
      </span>
    </span>
  )
}

/** Figma "Payment successful!" — shown a moment before the receipt. */
export function PaymentSuccessful() {
  return (
    <div role='status' className='fixed inset-0 z-50 flex flex-col items-center bg-white font-(family-name:--font-dm-sans)'>
      <PeachTop />
      <div className='relative mt-[27vh] flex flex-col items-center' style={{ gap: t(40) }}>
        <span className='animate-in zoom-in-50 fade-in duration-500'>
          <CheckRings size={250} />
        </span>
        <p className='font-bold text-[#2c2d32]' style={{ fontSize: t(40) }}>Payment successful!</p>
      </div>
    </div>
  )
}

/** Saved / Earned glass tile — Figma 238×123, inset green glow. */
function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className='flex flex-col items-center justify-center border-white bg-white/75 text-center text-[#2e8247] shadow-[inset_0_6px_31.2px_rgba(47,131,72,0.5)]'
      style={{ width: t(238.5), height: t(123), borderRadius: t(23.6), borderWidth: t(1.24), gap: t(4) }}
    >
      <span className='font-(family-name:--font-libre-baskerville) font-bold italic' style={{ fontSize: t(30), letterSpacing: t(-1.65) }}>{label}</span>
      <span className='flex items-center font-black' style={{ fontSize: t(30), letterSpacing: t(-0.6), gap: t(6) }}>{children}</span>
    </div>
  )
}

/**
 * Figma "Bill cleared" — app parity: BillPaymentSuccessScreen. The bill, what
 * the member paid, and what they saved / earned, over a soft green glow.
 */
export function BillCleared({
  name,
  location,
  originalAmount,
  paidAmount,
  saved,
  earned,
  onShare,
  onDone,
}: {
  name: string
  location: string
  originalAmount: number
  paidAmount: number
  saved: number
  earned: number
  onShare: () => void
  onDone: () => void
}) {
  return (
    <div className='relative mx-auto flex w-full flex-col items-center overflow-hidden px-4 text-center font-(family-name:--font-dm-sans)' style={{ maxWidth: t(1576), paddingTop: t(97), paddingBottom: t(120) }}>
      <button
        type='button'
        onClick={onShare}
        aria-label='Share'
        className='absolute flex items-center justify-center rounded-full bg-[rgba(217,217,217,0.1)] transition-colors hover:bg-black/5'
        style={{ right: t(0), top: t(12), width: t(60), height: t(60) }}
      >
        <Image src={`${P}/share.svg`} alt='' width={23} height={23} style={{ width: t(23), height: t(23) }} />
      </button>

      <Image src={`${P}/green-glow.svg`} alt='' width={824} height={828} aria-hidden='true' className='pointer-events-none absolute left-1/2 max-w-none -translate-x-1/2' style={{ top: t(97), width: t(824), height: t(828) }} />

      <p className='relative font-bold text-[#2c2d32]' style={{ fontSize: t(44), letterSpacing: t(-2), lineHeight: t(48) }}>{name}</p>
      {location && <p className='relative font-medium text-[#666]' style={{ fontSize: t(28), lineHeight: t(40) }}>{location}</p>}

      <span className='relative' style={{ marginTop: t(58) }}>
        <CheckRings />
      </span>
      <p className='relative font-(family-name:--font-libre-baskerville) font-bold text-[#3aa456] italic' style={{ marginTop: t(52), fontSize: t(54), letterSpacing: t(-2.78), lineHeight: t(60) }}>
        Bill cleared
      </p>
      <p className='relative font-black text-[#2c7b44]' style={{ marginTop: t(18), fontSize: t(80), lineHeight: t(92) }}>MUR {fmtMur(originalAmount)}</p>
      <span aria-hidden='true' className='relative max-w-full rounded-full bg-linear-to-r from-[#999fcc00] via-[#bfc7ff] to-[#999fcc00] opacity-50' style={{ marginTop: t(15), width: t(638), height: t(2.5) }} />
      <p className='relative font-bold text-[#2c7b44]' style={{ marginTop: t(22), fontSize: t(40), letterSpacing: t(-0.8) }}>MUR {fmtMur(paidAmount)} paid by you</p>

      <div className='relative flex flex-wrap justify-center' style={{ marginTop: t(40), gap: t(32) }}>
        <StatTile label='Saved'>MUR {fmtMur(saved)}</StatTile>
        {earned > 0 && (
          <StatTile label='Earned'>
            {fmtMur(earned)}
            <Image src='/assets/merchant-detail/earn-coin.png' alt='Privé Credits' width={47} height={47} style={{ width: t(47), height: t(47) }} />
          </StatTile>
        )}
      </div>

      <button
        type='button'
        onClick={onDone}
        className='relative flex items-center justify-center rounded-full bg-[#ff4800] font-semibold text-white transition-colors hover:bg-brand-dark'
        style={{ marginTop: t(55), width: t(328), height: t(81), fontSize: t(24), letterSpacing: t(-0.48) }}
      >
        Done
      </button>
    </div>
  )
}
