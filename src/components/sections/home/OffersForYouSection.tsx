import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { HScroll } from './HScroll'
import type { OfferForYouCard } from '@/lib/types/offersForYou'

/** App parity: 'link' opens link_url; 'screen' navigates to an entity/route. */
function resolveHref(
  card: OfferForYouCard,
): { href: string; external: boolean } | null {
  if (card.type === 'link' && card.link_url) {
    return { href: card.link_url, external: /^https?:\/\//.test(card.link_url) }
  }
  if (card.type === 'screen') {
    if (card.target_kind === 'restaurant' && card.target_id)
      return { href: `/dining/${card.target_id}`, external: false }
    if (card.target_kind === 'store' && card.target_id)
      return { href: `/stores/${card.target_id}`, external: false }
    if (card.target_route) return { href: card.target_route, external: false }
  }
  // TODO(design): the app opens a detail bottom-sheet (hero_url / detail_title /
  // detail_body) for cards with no link/screen target — not ported yet.
  if (card.link_url)
    return { href: card.link_url, external: /^https?:\/\//.test(card.link_url) }
  return null
}

const IMG_CARD =
  'relative block aspect-256/196 w-64 shrink-0 overflow-hidden rounded-2xl bg-gray-100'

/** Placeholder cards shown until `offers_for_you_cards` has rows. */
const FALLBACK = [
  { id: 'f1', network: 'VISA' as const },
  { id: 'f2', network: 'Mastercard' as const },
  { id: 'f3', network: 'VISA' as const },
  { id: 'f4', network: 'Mastercard' as const },
]

function FallbackCard({ network }: { network: 'VISA' | 'Mastercard' }) {
  return (
    <div className="relative flex aspect-256/196 w-64 shrink-0 flex-col justify-end overflow-hidden rounded-2xl bg-linear-to-b from-[#E06A2B] to-[#C6551D] p-4 text-white">
      <div
        className={`absolute -right-4 -top-3 h-24 w-40 rotate-[8deg] rounded-xl ${
          network === 'VISA' ? 'bg-[#3B3AA6]' : 'bg-[#111]'
        }`}
      >
        <span className="absolute left-3 top-2 text-[11px] font-extrabold tracking-wider">
          {network === 'VISA' ? 'VISA' : '●●'}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 top-[46%] bg-[#C6551D] [clip-path:ellipse(120%_80%_at_50%_100%)]" />
      <div className="relative">
        <p className="text-[12px] leading-snug">
          Unlock exclusive offers with{' '}
          <span className="font-bold">{network} credit cards</span>
        </p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#C6551D]">
          Know More <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  )
}

export function OffersForYouSection({ cards }: { cards: OfferForYouCard[] }) {
  if (!cards.length) {
    return (
      <HScroll
        title="Offers for you"
        className="relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]"
      >
        {FALLBACK.map((c) => (
          <FallbackCard key={c.id} network={c.network} />
        ))}
      </HScroll>
    )
  }

  return (
    <HScroll
      title="Offers for you"
      className="relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]"
    >
      {cards.map((card) => {
        const link = resolveHref(card)
        const inner = (
          <Image
            src={card.image_url}
            alt={card.detail_title ?? 'Offer'}
            fill
            className="object-cover"
            sizes="256px"
          />
        )
        if (!link) {
          return (
            <div key={card.id} className={IMG_CARD}>
              {inner}
            </div>
          )
        }
        return link.external ? (
          <a
            key={card.id}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className={IMG_CARD}
          >
            {inner}
          </a>
        ) : (
          <Link key={card.id} href={link.href} className={IMG_CARD}>
            {inner}
          </Link>
        )
      })}
    </HScroll>
  )
}
