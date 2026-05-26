import Link from 'next/link'
import Image from 'next/image'
import { Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type SectionStore = {
  section_id: string
  store_id: string
  sort_order: number
  stores: {
    name: string
    slug: string
    logo_url: string | null
    location_name: string | null
    city: string | null
  }
}

type HomeSection = {
  id: string
  title: string
  subtitle: string | null
  items: SectionStore[]
}

async function getHomeSections(): Promise<HomeSection[]> {
  const supabase = await createClient()

  const { data: sections } = await supabase
    .from('stores_home_sections')
    .select('id, title, subtitle')
    .eq('is_active', true)
    .order('created_at')

  if (!sections?.length) return []

  const { data: items } = await supabase
    .from('stores_home_section_items')
    .select('section_id, store_id, sort_order, stores(name, slug, logo_url, location_name, city)')
    .in('section_id', sections.map(s => s.id))
    .eq('is_active', true)
    .order('sort_order')

  return sections.map(section => ({
    ...section,
    items: ((items ?? []) as unknown as SectionStore[]).filter(
      i => i.section_id === section.id,
    ),
  }))
}

export async function DistrictSection() {
  const sections = await getHomeSections()

  if (!sections.length) return null

  return (
    <section className="px-4 py-5 md:px-6">
      {sections.map(section => (
        <div key={section.id} className="mb-8 last:mb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">{section.title}</h2>
              {section.subtitle && (
                <p className="text-[12px] text-gray-400 mt-0.5">{section.subtitle}</p>
              )}
            </div>
            <button type="button" className="text-[12px] font-semibold text-brand shrink-0">
              See All
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0">
            {section.items.map(item => (
              <Link
                key={item.store_id}
                href={`/stores/${item.stores.slug}`}
                className="shrink-0 w-72 md:w-auto flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="relative w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-gray-100 border border-gray-100">
                  {item.stores.logo_url ? (
                    <Image
                      src={item.stores.logo_url}
                      alt={item.stores.name}
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-xl" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-gray-900 truncate">{item.stores.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {item.stores.location_name ?? item.stores.city ?? ''}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-semibold text-emerald-600">Exclusive offer</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
