import { MenuGalleryProvider, MenuImageCard } from './MenuGalleryClient'
import { DetailSection } from '@/components/shared/detail/DetailSection'
import type { MenuSection } from '@/lib/types/dining'

interface Props {
  sections: MenuSection[]
  fullMenuImages: string[]
}

/** Menu pages — tap one to page through the full menu. Hidden when there's no menu. */
export function RestaurantMenuSection({ sections, fullMenuImages }: Props) {
  if (!sections.length && !fullMenuImages.length) return null
  return (
    <DetailSection id='menu' title='Menu' subtitle='Tap a page to view the full menu'>
      <MenuGalleryProvider images={fullMenuImages}>
        <div className='scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0'>
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
            : fullMenuImages.map((url, i) => (
                <MenuImageCard key={url} src={url} alt={`Menu page ${i + 1}`} index={i} label={`Page ${i + 1}`} sublabel='' />
              ))}
        </div>
      </MenuGalleryProvider>
    </DetailSection>
  )
}
