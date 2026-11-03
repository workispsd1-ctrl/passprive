import Link from 'next/link'
import Image from 'next/image'

/**
 * "Collect Stamps" promo banner — app parity: `CollectStamp-Single.webp`
 * from `components/Home/MoreWithPassPrive.jsx`. Used to sit alongside a
 * hardcoded "Gift Privé" placeholder card (no real art/link data existed
 * for it); removed rather than kept as a stub.
 */
export function StampsGiftPromo() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <div>
        <Link
          href="/visit-rewards"
          aria-label="Collect Stamps"
          className="relative block aspect-43/15 max-w-2xl overflow-hidden rounded-[20px] min-[120rem]:max-w-3xl shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-95"
        >
          <Image
            src="/assets/home/CollectStamp-Single.webp"
            alt="Collect Stamps"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 768px"
          />
        </Link>
      </div>
    </section>
  )
}
