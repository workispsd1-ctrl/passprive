import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { CardBadge } from '@/lib/cashback'

/*
 * App parity: components/CashbackBadge.jsx + bookingBadgeArt.js + BookNowPill.jsx.
 * Every size below is the app's Figma number times a scale `k`, which the app
 * derives from `cardWidth`; here `100cqw` is the card image's width (the
 * overlay is a size container), so the art scales with the card the same way.
 */

// PAIR_NOTCH — the white notch an earn + "use cashback" pair sits on
const PAIR_NOTCH_PATHS = [
  {
    transform: 'translate(95 -13)',
    clip: true,
    d: 'M172.79 13C161.696 13 152.861 21.1817 152.861 30.8123C152.861 40.443 144.084 48 132.99 48H49.022C40.5129 48 33.9756 54.1132 33.9756 61.5V64C33.9756 70.2107 27.881 75 20.7266 75C13.5723 75 7.77249 69.9652 7.77249 63.7544L7.77249 51.6238C7.77249 49.7606 6.03256 48.2501 3.88624 48.2501C1.73993 48.2501 0 46.7397 0 44.8765L0 3.41687C0 1.6725 1.62895 0.258405 3.63835 0.258405L7.12787 0.258405C7.21006 0.258405 7.2767 0.200559 7.2767 0.129202C7.2767 0.0578459 7.34333 0 7.42553 0L191.297 0C195.551 0 199 2.994 199 6.68727C199 10.3805 195.489 13 191.234 13H172.79Z',
  },
  {
    transform: 'translate(-35 -13)',
    clip: false,
    d: 'M178 13C166.572 13 157.47 21.1817 157.47 30.8123C157.47 40.443 148.428 48 137 48H50.5C41.7344 48 35 54.1132 35 61.5V64C35 70.2107 28.7216 75 21.3516 75C13.9815 75 8.00683 69.9652 8.00683 63.7544L8.00684 51.6238C8.00684 49.7606 6.21444 48.2501 4.00342 48.2501C1.79239 48.2501 0 46.7397 0 44.8765L0 3.41687C0 1.6725 1.67806 0.258405 3.74805 0.258405L7.34278 0.258405C7.42745 0.258405 7.4961 0.200559 7.4961 0.129202C7.4961 0.0578459 7.56474 0 7.64942 0L197.064 0C201.447 0 205 2.994 205 6.68727C205 10.3805 201.383 13 197 13H178Z',
  },
]

// PROMOTED_TAB
const PROMOTED_TAB_PATH =
  'M130.5 72C122.138 72 115.222 64.582 115.222 53.0252C115.222 41.4684 115.222 32.4 99.0385 32.4H36.9512C30.5373 32.4 26 25.3641 26 16.5V13.5C26 6.0471 21.0158 0 15.6231 0C10.2303 0 5.85866 6.04176 5.85866 13.4947L5.85866 28.0514C5.85866 30.2873 4.54715 32.0998 2.92933 32.0998C1.31151 32.0998 0 33.9124 0 36.1482L0 85.8998C0 87.993 1.22785 89.6899 2.74248 89.6899L5.37276 89.6899C5.43472 89.6899 5.48495 89.7593 5.48495 89.845C5.48495 89.9306 5.53518 90 5.59713 90L144.193 90C147.4 90 150 86.4072 150 81.9753C150 77.5434 147.565 72 144.359 72H130.5Z'

// BOOKING_CUT (drawn rotated 180° so the notch opens into the bottom-right corner)
const BOOKING_CUT_PATH =
  'M157.161 13C147.071 13 139.034 21.1817 139.034 30.8123C139.034 40.443 131.051 48 120.961 48H44.5878C36.8484 48 30.9024 54.1132 30.9024 61.5V64C30.9024 70.2107 25.3591 75 18.8519 75C12.3446 75 7.06945 69.9652 7.06945 63.7544L7.06945 51.6238C7.06945 49.7606 5.4869 48.2501 3.53473 48.2501C1.58255 48.2501 0 46.7397 0 44.8765L0 3.41687C0 1.6725 1.4816 0.258405 3.30925 0.258405L6.48313 0.258405C6.5579 0.258405 6.6185 0.200559 6.6185 0.129202C6.6185 0.0578459 6.67911 0 6.75387 0L173.993 0C177.863 0 181 2.994 181 6.68727C181 10.3805 177.806 13 173.937 13H157.161Z'

/** `n` app units at scale `k` (a CSS length per Figma px). */
const u = (n: number, k: string) => `calc(${n} * ${k})`

// Pair: k = min(fixed scale, room left of the heart) — app: PAIR_REF_CARD_W·1.08/358 vs (W − 60)/300
const PAIR_K = 'min(0.953px, calc((100cqw - 60px) / 300))'
// Promoted tab: k = W / 358
const PROMO_K = 'calc(100cqw / 358)'
// Booking badge: k = W / 342 · 1.3
const BOOK_K = 'calc(100cqw * 1.3 / 342)'

function UseCashbackPair({ arts, radius }: { arts: string[]; radius: number }) {
  const k = PAIR_K
  return (
    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: u(300, k), height: u(62, k), borderTopLeftRadius: radius }}>
      <svg viewBox="0 0 300 62" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <clipPath id="cb-pair-second">
            <rect x="0" y="0" width="205" height="48" />
          </clipPath>
        </defs>
        {PAIR_NOTCH_PATHS.map((p) => (
          <path
            key={p.transform}
            transform={p.transform}
            clipPath={p.clip ? 'url(#cb-pair-second)' : undefined}
            d={p.d}
            fill="white"
          />
        ))}
      </svg>
      {arts.slice(0, 2).map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={src.includes('Use-Cashback') ? 'Use cashback on payment' : 'Cashback'}
          width={492}
          height={172}
          className="absolute object-contain object-left"
          style={{ left: u(i === 0 ? 4 : 123, k), top: u(2, k), width: u(115, k), height: u(41, k) }}
        />
      ))}
    </div>
  )
}

function PromotedTag({ inset }: { inset: string }) {
  const k = PROMO_K
  const text: CSSProperties = { position: 'absolute', whiteSpace: 'nowrap' }
  return (
    <div className="absolute" style={{ left: u(-26, k), bottom: `calc(${inset} - 18 * ${k})`, width: u(150, k), height: u(90, k) }}>
      <svg viewBox="0 0 150 90" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d={PROMOTED_TAB_PATH} fill="white" />
      </svg>
      <span
        className="font-(family-name:--font-libre-baskerville) font-bold italic text-[#FF4800]"
        style={{ ...text, left: u(40.89, k), top: u(38.85, k), fontSize: u(15.01, k), lineHeight: u(16.35, k), letterSpacing: u(-0.76, k) }}
      >
        PassPrivé
      </span>
      <span
        className="font-(family-name:--font-dm-sans) font-normal text-[#2247FF]"
        style={{ ...text, left: u(39, k), top: u(51.93, k), fontSize: u(16.17, k), lineHeight: u(15.28, k), letterSpacing: u(-0.83, k) }}
      >
        Promoted
      </span>
    </div>
  )
}

function BookingBadge({ inset }: { inset: string }) {
  const k = BOOK_K
  return (
    <div className="absolute" style={{ right: u(-31, k), bottom: `calc(${inset} - 14 * ${k})`, width: u(181, k), height: u(75, k) }}>
      <svg viewBox="0 0 181 75" className="absolute inset-0 h-full w-full rotate-180" aria-hidden="true">
        <path d={BOOKING_CUT_PATH} fill="white" />
      </svg>
      {/* BookNowPill — #1D68FF → #3100B7 gradient, DM Sans SemiBold 11 */}
      <span
        className="absolute flex items-center justify-center rounded-full bg-[linear-gradient(99deg,#1D68FF_0%,#3100B7_85.9%)] font-(family-name:--font-dm-sans) font-semibold whitespace-nowrap text-white"
        style={{ left: u(48, k), top: u(33, k), width: u(96, k), height: u(23, k), fontSize: u(11, k), lineHeight: u(15.943, k) }}
      >
        Book Now
      </span>
    </div>
  )
}

/**
 * Card badges for a merchant card's image — app parity: CashbackBadge.jsx.
 * Top-left: one cashback art on the curved backdrop, or the earn + "use
 * cashback on payment" pair on the white notch. Bottom-left: the "PassPrivé
 * Promoted" tab. Bottom-right: the "Book Now" cut-out for bookable merchants.
 * Render it inside the (relative, overflow-hidden) image box.
 */
export function CardBadgeArt({
  badge,
  radius = 15,
  bottomInset = '0px',
}: {
  badge: CardBadge | null | undefined
  /** top-left corner radius of the image box (px) */
  radius?: number
  /** app parity: `promotedBottom` — lifts the bottom badges above a strip / pill */
  bottomInset?: string
}) {
  if (!badge) return null
  const { arts, promoted, bookable } = badge

  return (
    <div className="pointer-events-none absolute inset-0 z-5 @container">
      {arts.length > 1 ? (
        <UseCashbackPair arts={arts} radius={radius} />
      ) : arts.length === 1 ? (
        <>
          {/* App parity: CashbackBadgeTop — CardBg.webp (736×224) stretched to
              190/299 × 177.34/299·224/736 of the card width, the art (120/299
              wide, 41:115) centred in its left 72%, 2px from the top. */}
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: 'calc(100cqw * 190 / 299)', height: 'calc(100cqw * 177.34 / 299 * 224 / 736)', borderTopLeftRadius: radius }}
          >
            <Image src="/assets/cashback/cashback-badge-backdrop.webp" alt="" fill className="object-fill" sizes="240px" />
          </div>
          <Image
            src={arts[0]}
            alt={arts[0].includes('Use-Cashback') ? 'Use cashback on payment' : 'Cashback'}
            width={492}
            height={172}
            className="absolute object-contain"
            style={{ top: 2, left: 'calc(100cqw * (190 * 0.72 - 120) / 2 / 299)', width: 'calc(100cqw * 120 / 299)', height: 'calc(100cqw * 120 / 299 * 41 / 115)' }}
          />
        </>
      ) : null}

      {promoted && <PromotedTag inset={bottomInset} />}
      {bookable && <BookingBadge inset={bottomInset} />}
    </div>
  )
}
