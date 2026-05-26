import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Star, Phone, Share2, Navigation, Tag, Store, BadgeCheck, ThumbsUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookingWidget } from '@/components/sections/dining/BookingWidget'
import {
  PhotoGalleryProvider,
  PhotoGrid,
  PhotoStrip,
} from '@/components/sections/dining/PhotoGalleryClient'

// ── Types ─────────────────────────────────────────────────────────────────────

type Restaurant = {
  id: string
  name: string
  slug: string | null
  description: string | null
  area: string | null
  city: string | null
  full_address: string | null
  cover_image: string | null
  cost_for_two: number | null
  phone: string | null
  is_pure_veg: boolean
  booking_enabled: boolean
  menu_json: MenuJson | null
}

type MenuJson = {
  sections: MenuSection[]
  full_menu_image_url?: string
  full_menu_image_urls?: string[]
}

type MenuSection = {
  id: string
  name: string
  description: string | null
  items: MenuItemJson[]
}

type MenuItemJson = {
  id: string
  name: string
  price: number | null
  is_veg: boolean
  image_urls: string[]
  description: string | null
  is_available: boolean
  is_bestseller: boolean
}

type Offer = {
  id: string
  title: string
  description: string | null
  badge_text: string | null
  offer_type: string | null
  discount_value: number | null
  min_spend: number | null
}

type RestaurantTag = {
  id: string
  tag_type: string
  tag_value: string
}

type Review = {
  id: string
  rating: number
  review_text: string | null
  username_snapshot: string | null
  liked_tags: string[] | null
  photo_urls: string[] | null
  food_rating: number | null
  service_rating: number | null
  ambience_rating: number | null
  created_at: string
}

type ReviewSummary = { avg: number; count: number }

// ── Data fetching ─────────────────────────────────────────────────────────────

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SELECT_FIELDS =
  'id, name, slug, description, area, city, full_address, cover_image, cost_for_two, phone, is_pure_veg, booking_enabled, menu_json'

async function getData(slugOrId: string) {
  const supabase = await createClient()

  let { data: restaurant } = await supabase
    .from('restaurants')
    .select(SELECT_FIELDS)
    .eq('slug', slugOrId)
    .eq('is_active', true)
    .maybeSingle()

  if (!restaurant) {
    const res = await supabase
      .from('restaurants')
      .select(SELECT_FIELDS)
      .eq('id', slugOrId)
      .eq('is_active', true)
      .maybeSingle()
    restaurant = res.data
  }

  if (!restaurant) {
    return {
      restaurant: null,
      offers: [] as Offer[],
      tags: [] as RestaurantTag[],
      reviews: [] as Review[],
      reviewSummary: { avg: 0, count: 0 } as ReviewSummary,
      galleryPhotos: [] as string[],
    }
  }

  const [offersRes, tagsRes, reviewsRes, storageRes, reviewPhotosRes] =
    await Promise.allSettled([
      supabase
        .from('restaurant_offers')
        .select('id, title, description, badge_text, offer_type, discount_value, min_spend')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .order('created_at'),
      supabase
        .from('restaurant_tags')
        .select('id, tag_type, tag_value')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order'),
      supabase
        .from('restaurant_reviews')
        .select(
          'id, rating, review_text, username_snapshot, liked_tags, photo_urls, food_rating, service_rating, ambience_rating, created_at',
        )
        .eq('restaurant_id', restaurant.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.storage
        .from('restaurant')
        .list(`restaurant/food/${restaurant.id}`, { limit: 20 }),
      supabase
        .from('restaurant_reviews')
        .select('photo_urls')
        .eq('restaurant_id', restaurant.id)
        .eq('is_approved', true)
        .not('photo_urls', 'eq', '{}'),
    ])

  const offers: Offer[] =
    offersRes.status === 'fulfilled' ? (offersRes.value.data ?? []) : []
  const tags: RestaurantTag[] =
    tagsRes.status === 'fulfilled' ? (tagsRes.value.data ?? []) : []
  const reviews: Review[] =
    reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data ?? []) : []

  const reviewSummary: ReviewSummary =
    reviews.length > 0
      ? {
          avg:
            Math.round(
              (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length) * 10,
            ) / 10,
          count: reviews.length,
        }
      : { avg: 0, count: 0 }

  // Build gallery from storage + review photos
  const storageFiles =
    storageRes.status === 'fulfilled' ? (storageRes.value.data ?? []) : []
  const storagePhotos = storageFiles
    .filter(f => f.name && /\.(jpe?g|png|webp)$/i.test(f.name))
    .map(
      f =>
        `${STORAGE_URL}/storage/v1/object/public/restaurant/restaurant/food/${restaurant!.id}/${f.name}`,
    )

  const reviewPhotos =
    reviewPhotosRes.status === 'fulfilled'
      ? (reviewPhotosRes.value.data ?? [])
          .flatMap(r => r.photo_urls ?? [])
          .filter(Boolean)
      : []

  const seen = new Set<string>()
  const galleryPhotos: string[] = []
  for (const url of [restaurant.cover_image, ...storagePhotos, ...reviewPhotos]) {
    if (url && !seen.has(url)) {
      seen.add(url)
      galleryPhotos.push(url)
    }
  }

  return {
    restaurant: restaurant as Restaurant,
    offers,
    tags,
    reviews,
    reviewSummary,
    galleryPhotos,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatOffer(offer: Offer): string {
  const parts: string[] = []
  if (offer.discount_value != null) {
    parts.push(
      offer.offer_type === 'percentage'
        ? `${offer.discount_value}% off`
        : `₹${offer.discount_value} off`,
    )
  }
  if (offer.min_spend != null)
    parts.push(`Min spend ₹${offer.min_spend.toLocaleString()}`)
  return parts.join(' · ') || offer.description || ''
}

function StarRow({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { restaurant, offers, tags, reviews, reviewSummary, galleryPhotos } =
    await getData(id)

  if (!restaurant) notFound()

  const cuisineTags = tags.filter(t => t.tag_type === 'cuisine').map(t => t.tag_value)
  const facilityTags = tags.filter(t => t.tag_type === 'facility').map(t => t.tag_value)
  const cuisineLabel = cuisineTags.join(', ')
  const sections: MenuSection[] = restaurant.menu_json?.sections ?? []
  const breadcrumbCity = restaurant.city ?? restaurant.area ?? 'Dining'

  return (
    <PhotoGalleryProvider photos={galleryPhotos}>
      <main className="min-h-screen bg-white pb-24 md:pb-0">

        {/* ── Gallery ── */}
        <PhotoGrid photos={galleryPhotos} restaurantName={restaurant.name} />

        {/* ── Content ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">

          {/* Breadcrumb */}
          <nav className="pt-4 pb-2 text-[13px] text-gray-400 hidden md:flex items-center gap-1.5">
            <Link href="/dining" className="hover:text-gray-600 transition-colors">
              {breadcrumbCity}
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{restaurant.name}</span>
          </nav>

          <div className="md:grid md:grid-cols-[1fr_340px] md:gap-10 md:items-start md:pt-2">


            <div className="min-w-0">

              <div className="flex items-start gap-2 mt-4 md:mt-0 flex-wrap">
                <h1 className="text-3xl md:text-[40px] font-bold text-gray-900 leading-tight">
                  {restaurant.name}
                </h1>
                {restaurant.is_pure_veg && (
                  <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700 mt-1">
                    <BadgeCheck className="w-3 h-3" /> Pure Veg
                  </span>
                )}
              </div>


              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3">
                {reviewSummary.avg > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-600 text-white text-[13px] font-bold">
                    {reviewSummary.avg}
                    <Star className="w-3 h-3 fill-white" />
                  </span>
                )}
                {reviewSummary.count > 0 && (
                  <span className="text-[13px] text-gray-500">
                    {reviewSummary.count.toLocaleString()}{' '}
                    {reviewSummary.count === 1 ? 'review' : 'reviews'}
                  </span>
                )}
                {restaurant.cost_for_two != null && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="text-[13px] text-gray-600">
                      ₹{restaurant.cost_for_two.toLocaleString()} for two
                    </span>
                  </>
                )}
              </div>

              {cuisineLabel && (
                <p className="text-[13px] text-gray-500 mt-1.5">{cuisineLabel}</p>
              )}

              {(restaurant.full_address ?? restaurant.area) && (
                <div className="flex items-start gap-1.5 mt-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-[13px] text-gray-600">
                    {restaurant.full_address ?? `${restaurant.area}, ${restaurant.city}`}
                  </span>
                </div>
              )}

              {facilityTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {facilityTags.map(f => (
                    <span
                      key={f}
                      className="px-2.5 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button type="button" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </button>
                <button type="button" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                {restaurant.phone && (
                  <a
                    href={`tel:${restaurant.phone}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
                <button type="button" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <Store className="w-3.5 h-3.5" /> All outlets
                </button>
              </div>

              {restaurant.description && (
                <p className="mt-5 text-[14px] text-gray-600 leading-relaxed">
                  {restaurant.description}
                </p>
              )}

              {/* ── Offers ── */}
              {offers.length > 0 && (
                <section className="mt-8 border-t border-gray-100 pt-6">
                  <h2 className="text-[20px] font-bold text-gray-900 mb-4">Offers</h2>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                    {offers.map(offer => (
                      <div
                        key={offer.id}
                        className="shrink-0 w-64 flex items-start gap-3 p-3.5 rounded-2xl border border-gray-200"
                      >
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                          <Tag className="w-5 h-5 text-brand" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 leading-tight">
                            {offer.title}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                            {formatOffer(offer)}
                          </p>
                          {offer.badge_text && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-brand/10 text-[10px] font-bold text-brand tracking-wide">
                              {offer.badge_text}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Menu ── */}
              {sections.length > 0 && (
                <section className="mt-8 border-t border-gray-100 pt-6">
                  <h2 className="text-[20px] font-bold text-gray-900 mb-1">Menu</h2>
                  {sections.map(section => (
                    <div key={section.id} className="mt-6">
                      <h3 className="text-[16px] font-bold text-gray-800 mb-3">
                        {section.name}
                      </h3>
                      {section.description && (
                        <p className="text-[12px] text-gray-400 -mt-2 mb-3">
                          {section.description}
                        </p>
                      )}
                      <div className="flex flex-col divide-y divide-gray-50">
                        {section.items
                          .filter(item => item.is_available)
                          .map(item => (
                            <div key={item.id} className="flex items-start gap-4 py-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                  <span
                                    className={`w-3.5 h-3.5 rounded-sm border-2 inline-flex items-center justify-center shrink-0 ${
                                      item.is_veg ? 'border-green-600' : 'border-red-500'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        item.is_veg ? 'bg-green-600' : 'bg-red-500'
                                      }`}
                                    />
                                  </span>
                                  <p className="text-[14px] font-semibold text-gray-900">
                                    {item.name}
                                  </p>
                                  {item.is_bestseller && (
                                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                      Bestseller
                                    </span>
                                  )}
                                </div>
                                {item.price != null && (
                                  <p className="text-[13px] font-bold text-gray-800 mt-0.5">
                                    ₹{item.price.toLocaleString()}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="text-[12px] text-gray-400 mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              {item.image_urls?.[0] && (
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                                  <Image
                                    src={item.image_urls[0]}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {/* ── Photos strip (opens dialog) ── */}
              <PhotoStrip photos={galleryPhotos} />

              {/* ── Reviews ── */}
              {reviews.length > 0 && (
                <section className="mt-8 border-t border-gray-100 pt-6 pb-6">
                  <div className="flex items-baseline gap-3 mb-5">
                    <h2 className="text-[20px] font-bold text-gray-900">Reviews</h2>
                    {reviewSummary.avg > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-600 text-white text-[13px] font-bold">
                        {reviewSummary.avg}
                        <Star className="w-3 h-3 fill-white" />
                      </span>
                    )}
                    <span className="text-[13px] text-gray-400">
                      {reviewSummary.count} {reviewSummary.count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-5">
                    {reviews.map(review => (
                      <div
                        key={review.id}
                        className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                              <span className="text-[13px] font-bold text-brand">
                                {(review.username_snapshot ?? 'A')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-gray-900">
                                {review.username_snapshot ?? 'Anonymous'}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {timeAgo(review.created_at)}
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-600 text-white text-[12px] font-bold shrink-0">
                            {review.rating}
                            <Star className="w-3 h-3 fill-white" />
                          </span>
                        </div>

                        {/* Review text */}
                        {review.review_text && (
                          <p className="mt-3 text-[13px] text-gray-700 leading-relaxed">
                            {review.review_text}
                          </p>
                        )}

                        {/* Sub-ratings */}
                        {(review.food_rating != null ||
                          review.service_rating != null ||
                          review.ambience_rating != null) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                            {review.food_rating != null && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-gray-400">Food</span>
                                <StarRow value={review.food_rating} />
                                <span className="text-[11px] font-semibold text-gray-600">
                                  {review.food_rating}
                                </span>
                              </div>
                            )}
                            {review.service_rating != null && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-gray-400">Service</span>
                                <StarRow value={review.service_rating} />
                                <span className="text-[11px] font-semibold text-gray-600">
                                  {review.service_rating}
                                </span>
                              </div>
                            )}
                            {review.ambience_rating != null && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-gray-400">Ambience</span>
                                <StarRow value={review.ambience_rating} />
                                <span className="text-[11px] font-semibold text-gray-600">
                                  {review.ambience_rating}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Liked tags */}
                        {(review.liked_tags ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            <ThumbsUp className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                            {review.liked_tags!.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full bg-green-50 border border-green-100 text-[11px] font-medium text-green-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Review photos */}
                        {(review.photo_urls ?? []).length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                            {review.photo_urls!.map((url, i) => (
                              <div
                                key={i}
                                className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-200"
                              >
                                <Image
                                  src={url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── Right sticky sidebar ── */}
            <div className="hidden md:block sticky top-20 pt-4">
              <BookingWidget restaurantName={restaurant.name} />
            </div>

          </div>
        </div>

        {/* ── Mobile CTA ── */}
        {restaurant.booking_enabled && (
          <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 z-20 shadow-lg">
            <button
              type="button"
              className="w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold text-[15px] hover:bg-black transition-colors"
            >
              Book a table
            </button>
          </div>
        )}

      </main>
    </PhotoGalleryProvider>
  )
}
