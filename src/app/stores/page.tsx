import { createClient } from '@/lib/supabase/server'
import { StoresPageClient } from '@/components/sections/stores/StoresPageClient'
import { DistrictSection } from '@/components/sections/stores/DistrictSection'

export type StoreRow = {
  id: string
  name: string
  slug: string
  category: string | null
  subcategory: string | null
  location_name: string | null
  city: string | null
  logo_url: string | null
  cover_image: string | null
}

export default async function Stores() {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from('stores')
    .select('id, name, slug, category, subcategory, location_name, city, logo_url, cover_image')
    .eq('is_active', true)
    .order('sort_order')
    .order('name')

  const stores: StoreRow[] = rows ?? []


  const categories = [
    ...new Set(
      stores
        .flatMap(s => (s.category ?? '').split(',').map(c => c.trim()))
        .filter(c => c && c !== 'All Stores'),
    ),
  ].sort()

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      <StoresPageClient categories={categories} stores={stores} districtSection={<DistrictSection />} />
    </main>
  )
}
