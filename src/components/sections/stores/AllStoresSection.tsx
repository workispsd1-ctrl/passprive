'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { StoreRow } from '@/app/stores/page'

interface Props {
  stores: StoreRow[]
}

export function AllStoresSection({ stores }: Props) {
  if (stores.length === 0) {
    return (
      <section className="px-4 py-5 md:px-6">
        <h2 className="text-[15px] font-bold text-gray-900 mb-3">All Stores</h2>
        <p className="text-[13px] text-gray-400">No stores found in this category.</p>
      </section>
    )
  }

  return (
    <section className="px-4 py-5 md:px-6">
      <h2 className="text-[15px] font-bold text-gray-900 mb-4">
        All Stores{' '}
        <span className="text-gray-400 font-normal">({stores.length})</span>
      </h2>

      <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stores.map(store => (
          <Link
            key={store.id}
            href={`/stores/${store.slug}`}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            {/* Cover image */}
            <div className="relative w-full aspect-4/3 bg-gray-100">
              {store.cover_image ? (
                <Image
                  src={store.cover_image}
                  alt={store.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-brand/20 to-purple-100" />
              )}
            </div>

            {/* Info row */}
            <div className="flex items-center gap-2 p-2.5">
              {/* Logo */}
              <div className="relative w-9 h-9 rounded-full bg-white border border-gray-100 shrink-0 overflow-hidden shadow-sm">
                {store.logo_url ? (
                  <Image
                    src={store.logo_url}
                    alt=""
                    fill
                    className="object-contain p-0.5"
                    sizes="36px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-full" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[12px] font-bold text-gray-900 truncate">{store.name}</p>
                <p className="text-[10px] text-gray-400 truncate">
                  {store.location_name ?? store.city ?? ''}
                </p>
                {store.subcategory && (
                  <p className="text-[10px] text-gray-400 truncate">{store.subcategory}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
