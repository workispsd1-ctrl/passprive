import { StoresPageClient } from '@/components/sections/stores/StoresPageClient'
import { BannerCarousel } from '@/components/shared/BannerCarousel'
import {
  getActiveStores,
  getStoreMoodCategories,
  getTopBrandStores,
  getShoppingPromotionalCollections,
} from '@/lib/services/stores'
import { getWebsiteBanners } from '@/lib/services/websiteBanners'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stores & Boutiques',
  description:
    'Browse exclusive stores, boutiques, and lifestyle brands near you. Unlock member discounts and special offers with PassPrivé.',
  openGraph: {
    title: 'Stores & Boutiques | PassPrivé',
    description: 'Explore top stores with exclusive member discounts and offers near you.',
    url: '/stores',
  },
  alternates: {
    canonical: '/stores',
  },
}

export default async function Stores() {
  const [stores, moodCategories, banners, topBrands, promoCollections] = await Promise.all([
    getActiveStores(),
    getStoreMoodCategories(),
    getWebsiteBanners('store'),
    getTopBrandStores(),
    getShoppingPromotionalCollections(),
  ])

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      {banners.length > 0 && (
        <div className="mx-auto mb-8 max-w-350 px-4 pt-4 md:px-12">
          <BannerCarousel banners={banners} className="aspect-1606/606" fit="contain" />
        </div>
      )}
      <StoresPageClient
        moodCategories={moodCategories}
        stores={stores}
        topBrands={topBrands}
        promoCollections={promoCollections}
      />
    </main>
  )
}
