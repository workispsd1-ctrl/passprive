import { MenuGalleryProvider, MenuImageCard } from './MenuGalleryClient'
import type { MenuSection } from '@/lib/types/dining'

interface Props {
  sections: MenuSection[]
  fullMenuImages: string[]
}

export function RestaurantMenuSection({ sections, fullMenuImages }: Props) {
  return (
    <section className='mt-8 border-t border-gray-100 pt-6'>
      <h2 className='text-[22px] font-bold text-gray-900 mb-1'>Menu</h2>
      <MenuGalleryProvider images={fullMenuImages}>
        <div className='flex gap-4 mt-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
          {sections.length > 0
            ? sections.map((section, i) => (
                <MenuImageCard
                  key={section.id}
                  src={fullMenuImages[i] ?? null}
                  alt={section.name}
                  index={i}
                  label={section.name}
                  sublabel={`${section.items.length} pages`}
                />
              ))
            : fullMenuImages.length > 0
              ? fullMenuImages.map((url, i) => (
                  <MenuImageCard
                    key={url}
                    src={url}
                    alt={`Menu ${i + 1}`}
                    index={i}
                    label=''
                    sublabel=''
                  />
                ))
              : ['Food', 'Beverages', 'Bar'].map(label => (
                  <MenuImageCard
                    key={label}
                    src={null}
                    alt={label}
                    index={0}
                    label={label}
                    sublabel='—'
                  />
                ))}
        </div>
      </MenuGalleryProvider>
    </section>
  )
}
