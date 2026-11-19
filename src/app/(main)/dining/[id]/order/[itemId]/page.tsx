import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getOrderCollect, getRestaurantBySlugOrId } from '@/lib/services/dining'
import { getRestaurantStampCard } from '@/lib/services/visitRewards'
import { getDiscountCaps } from '@/lib/services/membershipCaps'
import { isCashbackEnabled } from '@/lib/cashback'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'
import { splitDiningOffers } from '@/lib/diningOffers'
import { PhotoGalleryProvider } from '@/components/sections/dining/PhotoGalleryClient'
import { OffersRow, PhotosGrid, ReviewsSection, Section } from '@/components/sections/dining/RestaurantDesktopSections'
import { StampSideCard } from '@/components/sections/dining/RestaurantSidebar'
import { LeaveReviewDialog } from '@/components/shared/LeaveReviewDialog'
import { OrderProductClient } from '@/components/sections/dining/order/OrderProductClient'
import type { DiningOffer } from '@/lib/types/dining'

const fetchRestaurant = cache((id: string) => getRestaurantBySlugOrId(id))
const fetchMenu = cache((restaurantId: string) => getOrderCollect(restaurantId))

export async function generateMetadata({ params }: { params: Promise<{ id: string; itemId: string }> }): Promise<Metadata> {
  const { id, itemId } = await params
  const { restaurant } = await fetchRestaurant(id)
  if (!restaurant) return {}
  const item = (await fetchMenu(restaurant.id)).items.find(i => i.id === decodeURIComponent(itemId))
  return item ? { title: `${item.name} · ${restaurant.name} | PassPrivé`, description: item.description || undefined } : {}
}

/**
 * One menu item — app parity: OrderProductDetailScreen.jsx (photo, name,
 * price, add to cart, more from the menu). Laid out as the Figma "Product
 * information" frame, with the restaurant's real offers, stamp card, photos
 * and reviews in its sections; the Figma's perfume attributes, sold counts
 * and per-product ratings have no data and are left out.
 */
export default async function OrderProductPage({ params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { id, itemId } = await params
  const { restaurant, offers, reviews, reviewSummary, galleryPhotos } = await fetchRestaurant(id)
  if (!restaurant) notFound()
  const [{ enabled, items }, stampCard, caps] = await Promise.all([fetchMenu(restaurant.id), getRestaurantStampCard(restaurant.id), getDiscountCaps()])
  const item = items.find(i => i.id === decodeURIComponent(itemId))
  if (!item) notFound()

  // app parity: OrderProductDetail "similar" — the rest of its category first, then the menu
  const others = items.filter(i => i.id !== item.id)
  const similar = [...others.filter(i => i.category === item.category), ...others.filter(i => i.category !== item.category)].slice(0, 3)

  const slug = restaurant.slug ?? restaurant.id
  const { exclusive, bank } = splitDiningOffers(offers as DiningOffer[])
  // app parity: upsellOfferPct — the first percentage offer is what the tiers share
  const offerPct = Number(offers.find(o => String(o.offer_type ?? '').toLowerCase().startsWith('percent') && Number(o.discount_value) > 0)?.discount_value) || 0
  const offersRow = <OffersRow restaurantOffers={exclusive} bankOffers={bank} merchant={restaurant} />

  return (
    <PhotoGalleryProvider photos={galleryPhotos}>
      <OrderProductClient
        restaurant={restaurant}
        slug={slug}
        item={item}
        items={items}
        similar={similar}
        browseOnly={!enabled}
        cashback={
          // the site's "Earn 6x more cashback" banner (store / salon pages) — Figma "Earn 6x cashback"
          <UpsellBannerPager
            eligible={isCashbackEnabled(restaurant)}
            merchantType={restaurant.merchant_type}
            merchantId={restaurant.id}
            kind='restaurant'
            offerPct={offerPct}
            caps={caps}
            variant='figma'
          />
        }
        stamps={
          stampCard ? (
            <StampSideCard
              href={`/visit-rewards/restaurant/${restaurant.id}`}
              image={restaurant.cover_image ?? galleryPhotos[0] ?? null}
              visits={stampCard.visits}
              total={stampCard.total}
            />
          ) : null
        }
        offers={offersRow}
        photos={
          galleryPhotos.length > 0 ? (
            <Section id='gallery' title='Photos' top={0} gap={24}>
              <PhotosGrid photos={galleryPhotos} />
              <div className='mt-24 flex justify-center max-lg:mt-12'>
                <LeaveReviewDialog kind='restaurant' entityId={restaurant.id} entityName={restaurant.name} variant='add-image' />
              </div>
            </Section>
          ) : null
        }
        reviews={
          <ReviewsSection
            kind='restaurant'
            entityId={restaurant.id}
            name={restaurant.name}
            reviews={reviews}
            summary={reviewSummary}
            allHref={`/dining/${slug}/reviews`}
            top={0}
          />
        }
      />
    </PhotoGalleryProvider>
  )
}
