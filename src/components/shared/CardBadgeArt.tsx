import Image from 'next/image'
import { PROMOTED_CHIP, type CardBadge } from '@/lib/cashback'

/**
 * Card-corner badge for a merchant card's image — app parity:
 * components/CashbackBadge.jsx. One cashback badge sits on the curved white
 * backdrop; an earn + "use cashback on payment" pair sits on a wider white
 * notch; a promoted merchant gets the "PassPrivé Promoted" tab bottom-left
 * (or the promoted chip on its own when it has no cashback art).
 */
export function CardBadgeArt({ badge }: { badge: CardBadge | null | undefined }) {
  if (!badge) return null
  const { arts, promoted } = badge

  if (!arts.length) {
    return promoted ? (
      <Image
        src={PROMOTED_CHIP}
        alt="PassPrivé Promoted"
        width={736}
        height={260}
        className="pointer-events-none absolute top-0 left-0 w-40 rounded-tl-[15px] 2xl:w-48"
        style={{ height: 'auto' }}
      />
    ) : null
  }

  return (
    <>
      {arts.length > 1 ? (
        <div className="pointer-events-none absolute top-0 left-0 flex items-center gap-1.5 rounded-tl-[15px] rounded-br-[18px] bg-white py-1 pr-2 pl-1">
          {arts.map(src => (
            <Image
              key={src}
              src={src}
              alt={src.includes('Use-Cashback') ? 'Use cashback on payment' : 'Cashback'}
              width={492}
              height={172}
              className="w-24 2xl:w-28"
              style={{ height: 'auto' }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* White curved backdrop the badge sits on — app parity: CardBg.webp
              (736×224), rounded to match the card's own top-left corner. */}
          <div className="pointer-events-none absolute top-0 left-0 aspect-736/224 w-60 overflow-hidden rounded-tl-[15px] 2xl:w-73">
            <Image
              src="/assets/cashback/cashback-badge-backdrop.webp"
              alt=""
              fill
              className="object-cover object-top-left"
              sizes="240px"
            />
          </div>
          <Image
            src={arts[0]}
            alt="Cashback"
            width={492}
            height={172}
            className="pointer-events-none absolute left-1.5 top-1.5 w-30 2xl:w-36.25"
            style={{ height: 'auto' }}
          />
        </>
      )}

      {promoted && (
        <span className="pointer-events-none absolute bottom-0 left-0 z-5 flex flex-col rounded-tr-[18px] bg-white px-3 pt-1.5 pb-1 leading-none">
          <span className="font-(family-name:--font-libre-baskerville) text-[13px] font-bold italic tracking-[-0.6px] text-brand">PassPrivé</span>
          <span className="text-[13px] tracking-[-0.6px] text-[#2247FF]">Promoted</span>
        </span>
      )}
    </>
  )
}
