import Link from 'next/link'
import Image from 'next/image'
import type { StoreRow } from '@/lib/types/stores'

export function PopularChainsSection({ stores }: { stores: StoreRow[] }) {
  const chains = stores.filter(s => s.logo_url).slice(0, 12)
  if (!chains.length) return null

  return (
    <section className="bg-white py-5 md:py-8">
      <h2 className="text-[17px] md:text-[19px] font-bold text-gray-900 px-4 md:px-6 mb-4">
        Popular chains
      </h2>
      <div className="flex gap-5 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-2">
        {chains.map(store => {
          const offer = store.store_offers?.[0]
          return (
            <Link
              key={store.id}
              href={`/stores/${store.slug ?? store.id}`}
              className="shrink-0 flex flex-col items-center gap-1.5 w-[72px]"
            >
              <div className="relative w-[60px] h-[60px] rounded-full bg-white border border-gray-100 shadow-sm overflow-hidden">
                <Image
                  src={store.logo_url!}
                  alt={store.name}
                  fill
                  className="object-contain p-2"
                  sizes="60px"
                />
              </div>
              <p className="text-[11px] font-semibold text-gray-800 text-center leading-tight line-clamp-2 w-full">
                {store.name}
              </p>
              {offer?.badge_text && (
                <p className="text-[9px] font-bold text-brand text-center leading-tight line-clamp-1">
                  {offer.badge_text}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
