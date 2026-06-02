import Link from 'next/link'
import Image from 'next/image'
import { Bookmark } from 'lucide-react'
import type { StoreRow } from '@/lib/types/stores'

export function StoresNearYouSection({ stores }: { stores: StoreRow[] }) {
  if (!stores.length) return null
  const items = stores.slice(0, 8)

  return (
    <section className="bg-white py-5 md:py-8">
      <h2 className="text-[17px] md:text-[19px] font-bold text-gray-900 px-4 md:px-6 mb-4">
        Stores near you
      </h2>
      <div className="mt-5 flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
        {items.map(store => {
          const offer = store.store_offers?.[0]
          return (
            <Link
              key={store.id}
              href={`/stores/${store.slug}`}
              className="relative shrink-0 w-[85vw] max-w-96 md:w-auto aspect-4/3 rounded-2xl overflow-hidden block bg-gray-900"
            >
              {store.cover_image ? (
                <Image
                  src={store.cover_image}
                  alt={store.name}
                  fill
                  className="object-cover opacity-80"
                  sizes="(max-width: 768px) 85vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 bg-linear-to-br from-purple-900 to-gray-900" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />

              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                <span className="bg-brand/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  For you
                </span>
                {offer?.badge_text && (
                  <span className="bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    {offer.badge_text}
                  </span>
                )}
              </div>

              <button
                type="button"
                aria-label="Save"
                className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-black/30 text-white/80 hover:text-white"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end gap-2">
                <div className="relative w-8 h-8 rounded-lg bg-white shrink-0 overflow-hidden shadow">
                  {store.logo_url ? (
                    <Image src={store.logo_url} alt="" fill className="object-contain p-0.5" sizes="32px" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-gray-500">{store.name[0]}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[11px] font-bold leading-tight truncate">{store.name}</p>
                  <p className="text-white/55 text-[10px] truncate mt-0.5">
                    {store.location_name ?? store.city ?? ''}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
