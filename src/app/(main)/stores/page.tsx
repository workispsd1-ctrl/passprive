import { StoresPageClient } from '@/components/sections/stores/StoresPageClient'
import { DistrictSection } from '@/components/sections/stores/DistrictSection'
import { getActiveStores, getStoreMoodCategories } from '@/lib/services/stores'

export const metadata = {
  title: 'Stores | PassPrivé',
  description: 'Browse exclusive stores and boutiques across Mauritius.',
}

export default async function Stores() {
  const [stores, moodCategories] = await Promise.all([
    getActiveStores(),
    getStoreMoodCategories(),
  ])

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      <StoresPageClient moodCategories={moodCategories} stores={stores} districtSection={<DistrictSection />} />
    </main>
  )
}
