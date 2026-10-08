import type { Metadata } from 'next'
import { TrendingWellnessSection } from '@/components/sections/wellness/TrendingWellnessSection'
import { SpaNearYouSection } from '@/components/sections/wellness/SpaNearYouSection'
import { SalonVisitSection } from '@/components/sections/home/SalonVisitSection'
import { WellnessGlowUpSection } from '@/components/sections/wellness/WellnessGlowUpSection'
import { AllSalonsSection } from '@/components/sections/wellness/AllSalonsSection'
import { getWellnessStores, getWellnessPromotionalCollections } from '@/lib/services/stores'
import { getUserCoords } from '@/lib/location'
import { scopeStoresToRadius } from '@/lib/nearby'

export const metadata: Metadata = {
  title: 'Wellness & Spas',
  description:
    'Discover top-rated salons, spas, and wellness rituals near you. Unlock exclusive cashback and member discounts with PassPrivé.',
  openGraph: {
    title: 'Wellness & Spas | PassPrivé',
    description: 'Explore curated salons and spas with exclusive cashback near you.',
    url: '/wellness',
  },
  alternates: {
    canonical: '/wellness',
  },
}

export default async function Wellness() {
  const coords = await getUserCoords()
  const [stores, collections] = await Promise.all([
    // every wellness rail draws from this, so the 3–5 km radius applies to all of them
    getWellnessStores().then((all) => scopeStoresToRadius(all, coords)),
    getWellnessPromotionalCollections(),
  ])

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      <TrendingWellnessSection stores={stores} />
      <SpaNearYouSection stores={stores} />
      <SalonVisitSection stores={stores} radiusKm={50} plain />
      <WellnessGlowUpSection collections={collections} stores={stores} />
      <AllSalonsSection stores={stores} />
    </main>
  )
}
