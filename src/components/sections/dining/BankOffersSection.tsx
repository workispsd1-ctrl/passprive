'use client'

import { useState } from 'react'
import Image from 'next/image'
import { HScroll } from '@/components/sections/home/HScroll'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import type { OfferForYouCard } from '@/lib/types/offersForYou'

function toPoints(body: string | null): string[] {
  if (!body) return []
  return body
    .split(/\r?\n/)
    .map((s) => s.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean)
}

/**
 * `offers_for_you_cards` rail — app parity: components/Home/OffersForYou.jsx.
 * "Offers for you" on home, "Bank offers" on dining. Tap behaviour: link →
 * opens `link_url`, screen → navigates, otherwise a detail sheet with
 * `hero_url`/`detail_title`/`detail_body`.
 */
export function BankOffersSection({
  cards,
  title = 'Bank offers',
  className,
}: {
  cards: OfferForYouCard[]
  title?: string
  className?: string
}) {
  const router = useRouter()
  const [active, setActive] = useState<OfferForYouCard | null>(null)

  /** App parity: OffersForYou.jsx handlePress — link → URL, screen → route, else detail sheet. */
  function open(card: OfferForYouCard) {
    if (card.type === 'link' && card.link_url) {
      window.open(card.link_url, '_blank', 'noopener,noreferrer')
    } else if (card.type === 'screen') {
      if (card.target_kind === 'restaurant' && card.target_id) router.push(`/dining/${card.target_id}`)
      else if (card.target_kind === 'store' && card.target_id) router.push(`/stores/${card.target_id}`)
      else if (card.target_route) router.push(card.target_route)
    } else {
      setActive(card)
    }
  }

  if (!cards.length) return null

  return (
    <>
      <HScroll title={title} className={className}>
        {cards.map((card) => (
          <button
            key={String(card.id)}
            type="button"
            onClick={() => open(card)}
            className="relative aspect-256/196 w-64 shrink-0 overflow-hidden rounded-2xl bg-gray-100"
          >
            <Image
              src={card.image_url}
              alt={card.detail_title ?? title}
              fill
              className="object-cover"
              sizes="256px"
            />
          </button>
        ))}
      </HScroll>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-sm overflow-hidden p-0">
          {active?.hero_url && (
            <div className="relative aspect-video w-full bg-gray-100">
              <Image
                src={active.hero_url}
                alt={active.detail_title ?? 'Offer'}
                fill
                className="object-cover"
              />
            </div>
          )}
          <DialogHeader className="px-5 pt-4">
            <DialogTitle className="text-[15px] font-bold text-[#0D141C]">
              {active?.detail_title}
            </DialogTitle>
          </DialogHeader>
          <ul className="flex flex-col gap-2 px-5 pb-5 text-[13px] text-gray-600">
            {toPoints(active?.detail_body ?? null).map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-[#FF4800]">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}
