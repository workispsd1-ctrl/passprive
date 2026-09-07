import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

// The Collect Stamps art is 1290×450 (≈43/15); both cards use that ratio so the
// image fills its card with no crop and the two cards stay the same height.
const CARD =
  'relative block aspect-[43/15] overflow-hidden rounded-[20px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-95'

/**
 * "Collect Stamps" + "Gift Privé" promo row — two 768×312 banner cards.
 *
 * Collect Stamps uses the app's real banner art (`CollectStamp-Single.webp`,
 * from `components/Home/MoreWithPassPrive.jsx`). The app home has no Gift Privé
 * card, so that one is a styled placeholder until the artwork is supplied.
 */
export function StampsGiftPromo() {
  return (
    <section className="px-4 py-6 md:px-8">
      <div className="mx-auto grid max-w-394 grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-10">
        <Link href="/visit-rewards" aria-label="Collect Stamps" className={CARD}>
          <Image
            src="/CollectStamp-Single.webp"
            alt="Collect Stamps"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 768px"
          />
        </Link>

        {/* TODO(design): replace with the real Gift Privé banner art */}
        <Link
          href="/gifts"
          aria-label="Gift Privé"
          className={`${CARD} flex flex-col justify-center bg-linear-to-br from-[#0F4A3F] to-[#0A2C2A] px-8 text-white`}
        >
          <p className="text-[26px] font-semibold leading-tight md:text-[34px]">
            Gift
            <br />
            <span className="font-(family-name:--font-playfair) italic">
              Privé
            </span>
          </p>
          <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0F4A3F]">
            Learn more <ArrowRight className="h-4 w-4" />
          </span>
          <span
            aria-hidden="true"
            className="absolute -right-4 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#F3B93F]/25 blur-2xl"
          />
        </Link>
      </div>
    </section>
  )
}
