import type { Metadata } from 'next'
import { TrendingWellnessSection } from '@/components/sections/wellness/TrendingWellnessSection'
import { SpaNearYouSection } from '@/components/sections/wellness/SpaNearYouSection'
import { SalonVisitSection } from '@/components/sections/home/SalonVisitSection'
import { WellnessGlowUpSection } from '@/components/sections/wellness/WellnessGlowUpSection'
import { AllSalonsSection } from '@/components/sections/wellness/AllSalonsSection'
import { getWellnessStores, getWellnessPromotionalCollections } from '@/lib/services/stores'

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
  const [stores, collections] = await Promise.all([
    getWellnessStores(),
    getWellnessPromotionalCollections(),
  ])

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      <TrendingWellnessSection stores={stores} />
      <SpaNearYouSection stores={stores} />
      <SalonVisitSection stores={stores} radiusKm={50} />
      <WellnessGlowUpSection collections={collections} stores={stores} />
      <AllSalonsSection stores={stores} />
    </main>
  )
}
