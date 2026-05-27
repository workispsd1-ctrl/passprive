import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Star,
  Phone,
  Share2,
  Navigation,
  BadgeCheck,
  ThumbsUp,
  Info,
  CreditCard,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BookingWidget } from '@/components/sections/dining/BookingWidget'
import {
  PhotoGalleryProvider,
  PhotoGrid,
  PhotoStrip,
} from '@/components/sections/dining/PhotoGalleryClient'
import {
  MenuGalleryProvider,
  MenuImageCard,
} from '@/components/sections/dining/MenuGalleryClient'

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
  latitude: number | null
  longitude: number | null
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
  'id, name, slug, description, area, city, full_address, cover_image, cost_for_two, phone, is_pure_veg, booking_enabled, menu_json, latitude, longitude'

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

  const [offersRes, tagsRes, reviewsRes, storageRes, reviewPhotosRes, menuAssetsRes] =
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
      supabase
        .from('restaurant_media_assets')
        .select('file_url, sort_order')
        .eq('restaurant_id', restaurant.id)
        .eq('asset_type', 'menu')
        .eq('is_active', true)
        .order('sort_order'),
    ])

  const offers: Offer[] =
    offersRes.status === 'fulfilled' ? (offersRes.value.data ?? []) : []
  const tags: RestaurantTag[] =
    tagsRes.status === 'fulfilled' ? (tagsRes.value.data ?? []) : []
  const reviews: Review[] =
    reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data ?? []) : []
  const menuImages: string[] =
    menuAssetsRes.status === 'fulfilled'
      ? (menuAssetsRes.value.data ?? []).map(a => a.file_url).filter(Boolean)
      : []

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
    menuImages,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────


function ratingAvg(reviews: Review[], key: 'food_rating' | 'service_rating' | 'ambience_rating'): number | null {
  const vals = reviews.map(r => r[key]).filter((v): v is number => v != null)
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
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
  const { restaurant, offers, tags, reviews, reviewSummary, galleryPhotos, menuImages } =
    await getData(id)

  if (!restaurant) notFound()

  const cuisineTags = tags.filter(t => t.tag_type === 'cuisine').map(t => t.tag_value)
  const facilityTags = tags.filter(t => t.tag_type === 'facility').map(t => t.tag_value)
  const cuisineLabel = cuisineTags.join(', ')
  const sections: MenuSection[] = restaurant.menu_json?.sections ?? []
  // Prefer media_assets menu images, fall back to menu_json urls
  const fullMenuImages: string[] = menuImages.length > 0
    ? menuImages
    : (restaurant.menu_json?.full_menu_image_urls ?? [])
  const breadcrumbCity = restaurant.city ?? restaurant.area ?? 'Dining'

  const foodAvg = ratingAvg(reviews, 'food_rating')
  const serviceAvg = ratingAvg(reviews, 'service_rating')
  const ambienceAvg = ratingAvg(reviews, 'ambience_rating')

  const mainOffers = offers.filter(o => o.offer_type !== 'bank_card' && o.offer_type !== 'credit_card')
  const bankOffers = offers.filter(o => o.offer_type === 'bank_card' || o.offer_type === 'credit_card')

  return (
    <PhotoGalleryProvider photos={galleryPhotos}>
      <main className='min-h-screen bg-white pb-24 md:pb-0'>
        {/* ── Gallery ── */}
        <PhotoGrid
          photos={galleryPhotos}
          restaurantName={restaurant.name}
        />

        {/* ── Content ── */}
        <div className='max-w-7xl mx-auto px-4 md:px-6'>
          {/* Breadcrumb */}
          <nav className='pt-3 pb-2 text-[12px] text-gray-400 hidden md:flex items-center gap-1.5'>
            <Link
              href='/'
              className='hover:text-gray-600 transition-colors'
            >
              Home page
            </Link>
            <span>/</span>
            <Link
              href='/dining'
              className='hover:text-gray-600 transition-colors'
            >
              {breadcrumbCity}
            </Link>
            <span>/</span>
            <span className='text-gray-600'>{restaurant.name}</span>
          </nav>

          <div className='md:grid md:grid-cols-[1fr_340px] md:gap-10 md:items-start md:pt-2'>
            {/* ── Left Column ── */}
            <div className='min-w-0'>
              {/* Restaurant name + meta */}
              <div className='mt-4 md:mt-0'>
                <div className='flex items-start gap-2 flex-wrap'>
                  <h1 className='text-[28px] md:text-[36px] font-bold text-gray-900 leading-tight'>
                    {restaurant.name}
                  </h1>
                  {restaurant.is_pure_veg && (
                    <span className='shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700 mt-1.5'>
                      <BadgeCheck className='w-3 h-3' /> Pure Veg
                    </span>
                  )}
                </div>

                {/* Rating + cost + status line */}
                <div className='flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[14px]'>
                  {reviewSummary.avg > 0 && (
                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-700 text-white text-[13px] font-bold'>
                      {reviewSummary.avg}
                      <Star className='w-3 h-3 fill-white' />
                    </span>
                  )}
                  {restaurant.cost_for_two != null && (
                    <>
                      <span className='text-gray-300 font-light'>|</span>
                      <span className='text-gray-800 font-medium'>
                        ₹{restaurant.cost_for_two.toLocaleString()} for two
                      </span>
                    </>
                  )}
                  <span className='text-gray-300 font-light'>|</span>
                  <span className='text-orange-500 font-semibold'>Closed</span>
                  <span className='text-gray-400'>•</span>
                  <span className='text-gray-500'>Opens in 13 min</span>
                </div>

                {/* Address */}
                {(restaurant.full_address ?? restaurant.area) && (
                  <div className='flex items-start gap-1.5 mt-3'>
                    <MapPin className='w-4 h-4 text-gray-400 mt-0.5 shrink-0' />
                    <span className='text-[13px] text-gray-500 leading-snug'>
                      {restaurant.full_address ??
                        `${restaurant.area}, ${restaurant.city}`}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className='flex flex-wrap gap-3 mt-5'>
                  <button
                    type='button'
                    className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors'
                  >
                    <Navigation className='w-4 h-4' /> Direction
                  </button>
                  <button
                    type='button'
                    className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors'
                  >
                    <Share2 className='w-4 h-4' /> Share
                  </button>
                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors'
                    >
                      <Phone className='w-4 h-4' /> Call
                    </a>
                  )}
                </div>
              </div>

              {/* ── Info highlight cards ── */}
              {(restaurant.description ||
                cuisineLabel ||
                facilityTags.length > 0) && (
                <div className='flex gap-4 mt-7 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
                  {restaurant.description && (
                    <div className='shrink-0 w-72 border border-gray-200 rounded-2xl p-5 bg-white'>
                      <div className='flex items-center gap-2.5 mb-3'>
                        <span className='text-[22px]'>💎</span>
                        <span className='text-[14px] font-bold text-gray-900'>
                          About the place
                        </span>
                      </div>
                      <p className='text-[13px] text-gray-500 leading-relaxed line-clamp-3'>
                        {restaurant.description}
                      </p>
                      <button
                        type='button'
                        className='text-[13px] text-gray-500 mt-2 hover:text-gray-700'
                      >
                        view more
                      </button>
                    </div>
                  )}
                  {cuisineLabel && (
                    <div className='shrink-0 w-72 border border-gray-200 rounded-2xl p-5 bg-white'>
                      <div className='flex items-center gap-2.5 mb-3'>
                        <span className='text-[22px]'>🍲</span>
                        <span className='text-[14px] font-bold text-gray-900'>
                          Must tries dishes and cuisines
                        </span>
                      </div>
                      <p className='text-[13px] text-gray-500 leading-relaxed line-clamp-3'>
                        {cuisineLabel}
                      </p>
                      <button
                        type='button'
                        className='text-[13px] text-gray-500 mt-2 hover:text-gray-700'
                      >
                        view more
                      </button>
                    </div>
                  )}
                  {facilityTags.length > 0 && (
                    <div className='shrink-0 w-72 border border-gray-200 rounded-2xl p-5 bg-white'>
                      <div className='flex items-center gap-2.5 mb-3'>
                        <span className='text-[22px]'>✨</span>
                        <span className='text-[14px] font-bold text-gray-900'>
                          Must try experiences
                        </span>
                      </div>
                      <p className='text-[13px] text-gray-500 leading-relaxed line-clamp-3'>
                        {facilityTags.slice(0, 4).join(', ')}
                      </p>
                      <button
                        type='button'
                        className='text-[13px] text-gray-500 mt-2 hover:text-gray-700'
                      >
                        view more
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Offers ── */}
              {offers.length > 0 && (
                <section className='mt-8 border-t border-gray-100 pt-6'>
                  <h2 className='text-[22px] font-bold text-gray-900 mb-4'>
                    Offers
                  </h2>

                  {/* Ticket-style offer cards */}
                  <div className='flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
                    {mainOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className='shrink-0 w-80 relative'
                      >
                        {/* Card body */}
                        <div className='flex h-[100px] rounded-2xl overflow-hidden'>
                          {/* Left: dark purple gradient */}
                          <div className='w-[140px] shrink-0 bg-gradient-to-br from-violet-600 via-purple-500 to-purple-400 flex flex-col justify-center px-4 py-3'>
                            <p className='text-white font-black text-[18px] leading-tight'>
                              {offer.title}
                            </p>
                            {offer.badge_text && (
                              <span className='mt-1.5 text-[10px] font-semibold text-white/80 bg-white/20 rounded px-1.5 py-0.5 inline-block w-fit'>
                                {offer.badge_text}
                              </span>
                            )}
                          </div>
                          {/* Right: light section */}
                          <div className='flex-1 bg-violet-50 flex flex-col justify-center px-4 py-3'>
                            {offer.description && (
                              <p className='text-[13px] font-semibold text-gray-900 leading-snug'>
                                {offer.description}
                              </p>
                            )}
                            {offer.min_spend != null && (
                              <p className='text-[12px] text-gray-500 mt-0.5'>
                                Min spend ₹{offer.min_spend.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Notch circles at divider top/bottom */}
                        <div className='absolute top-0 left-[140px] -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-gray-200 z-10' />
                        <div className='absolute bottom-0 left-[140px] -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-white border border-gray-200 z-10' />
                      </div>
                    ))}
                  </div>

                  {/* Additional offers (bank card) */}
                  {bankOffers.length > 0 && (
                    <div className='mt-5'>
                      <p className='flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 mb-3'>
                        <span className='w-1.5 h-1.5 rounded-full bg-gray-400 inline-block' />
                        Additional offers
                      </p>
                      <div className='flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
                        {bankOffers.map((offer) => (
                          <div
                            key={offer.id}
                            className='shrink-0 w-52 border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-start gap-2.5'
                          >
                            <div className='w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0'>
                              <CreditCard className='w-4 h-4 text-gray-400' />
                            </div>
                            <p className='text-[12px] text-gray-700 leading-snug font-medium line-clamp-3'>
                              {offer.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ── Menu ── */}
              <section className='mt-8 border-t border-gray-100 pt-6'>
                <h2 className='text-[22px] font-bold text-gray-900 mb-1'>
                  Menu
                </h2>

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
                              label='Menu'
                              sublabel={`${i + 1} of ${fullMenuImages.length}`}
                            />
                          ))
                        : ['Food', 'Beverages', 'Bar'].map((label) => (
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

              {/* ── Photos strip ── */}
              <PhotoStrip photos={galleryPhotos} />

              {/* ── Ratings & reviews ── */}
              {reviews.length > 0 && (
                <section className='mt-8 border-t border-gray-100 pt-6'>
                  <h2 className='text-[22px] font-bold text-gray-900 mb-5'>
                    Ratings &amp; reviews
                  </h2>

                  {/* Outer card */}
                  <div className='rounded-3xl bg-gray-50 border border-gray-200 p-6 md:p-8'>
                    {/* Large rating number */}
                    <div className='text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <span className='text-[52px] font-bold text-green-700 leading-none'>
                          {reviewSummary.avg}
                        </span>
                        <Star className='w-9 h-9 fill-green-700 text-green-700' />
                      </div>
                      <p className='text-[16px] font-bold text-gray-900 mt-3'>
                        Based on {reviewSummary.count.toLocaleString()} ratings
                      </p>
                      <div className='flex items-center justify-center gap-1 mt-1'>
                        <span className='text-[13px] text-gray-400'>
                          how are ratings calculated?
                        </span>
                        <Info className='w-4 h-4 text-gray-400' />
                      </div>
                    </div>

                    {/* Sub-ratings pill */}
                    {(foodAvg != null ||
                      serviceAvg != null ||
                      ambienceAvg != null) && (
                      <div className='flex justify-center mt-6'>
                        <div className='inline-flex rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden divide-x divide-gray-200'>
                          {foodAvg != null && (
                            <div className='flex flex-col items-center px-8 py-3.5'>
                              <span className='text-[17px] font-bold text-gray-900'>
                                {foodAvg}
                              </span>
                              <span className='text-[13px] text-gray-500 mt-0.5'>
                                Food
                              </span>
                            </div>
                          )}
                          {serviceAvg != null && (
                            <div className='flex flex-col items-center px-8 py-3.5'>
                              <span className='text-[17px] font-bold text-gray-900'>
                                {serviceAvg}
                              </span>
                              <span className='text-[13px] text-gray-500 mt-0.5'>
                                Service
                              </span>
                            </div>
                          )}
                          {ambienceAvg != null && (
                            <div className='flex flex-col items-center px-8 py-3.5'>
                              <span className='text-[17px] font-bold text-gray-900'>
                                {ambienceAvg}
                              </span>
                              <span className='text-[13px] text-gray-500 mt-0.5'>
                                Ambience
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reviews count */}
                    <p className='text-center text-[22px] font-bold text-gray-900 mt-7 mb-5'>
                      {reviewSummary.count.toLocaleString()} reviews
                    </p>

                    {/* Review cards — horizontal scroll */}
                    <div className='flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1'>
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className='shrink-0 w-72 bg-white border border-gray-100 rounded-2xl p-4'
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <div className='flex items-center gap-2.5'>
                              <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0'>
                                <span className='text-[14px] font-bold text-gray-600'>
                                  {(review.username_snapshot ??
                                    'A')[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className='text-[14px] font-bold text-gray-900 leading-tight'>
                                  {review.username_snapshot ?? 'Anonymous'}
                                </p>
                                <p className='text-[12px] text-gray-400'>
                                  {timeAgo(review.created_at)}
                                </p>
                              </div>
                            </div>
                            <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-700 text-white text-[13px] font-bold shrink-0'>
                              {review.rating}
                              <Star className='w-3 h-3 fill-white' />
                            </span>
                          </div>

                          {review.review_text && (
                            <p className='mt-3 text-[13px] text-gray-600 leading-relaxed line-clamp-3'>
                              {review.review_text}
                            </p>
                          )}
                          {review.review_text &&
                            review.review_text.length > 120 && (
                              <button
                                type='button'
                                className='text-[13px] font-bold text-gray-800 mt-1'
                              >
                                Read more
                              </button>
                            )}

                          {(review.liked_tags ?? []).length > 0 && (
                            <div className='flex flex-wrap gap-1.5 mt-2.5'>
                              <ThumbsUp className='w-3 h-3 text-green-500 shrink-0 mt-0.5' />
                              {review.liked_tags!.map((tag) => (
                                <span
                                  key={tag}
                                  className='px-1.5 py-0.5 rounded-full bg-green-50 border border-green-100 text-[10px] font-medium text-green-700'
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── About the restaurant ── */}
              <section className='mt-8 border-t border-gray-100 pt-6'>
                <h2 className='text-[18px] font-bold text-gray-900 mb-5'>
                  About the restaurant
                </h2>

                <div className='space-y-4'>
                  {restaurant.cost_for_two != null && (
                    <div>
                      <p className=' font-semibold text-gray-900 mb-0.5'>
                        Cost
                      </p>
                      <p className='text-sm font-semibold text-gray-500'>
                        ₹{restaurant.cost_for_two.toLocaleString()} for two
                      </p>
                    </div>
                  )}
                  {cuisineLabel && (
                    <div>
                      <p className=' font-semibold text-gray-900 mb-0.5'>
                        Cuisines
                      </p>
                      <p className='text-sm font-semibold text-gray-500'>
                        {cuisineLabel}
                      </p>
                    </div>
                  )}
                  {facilityTags.length > 0 && (
                    <div>
                      <p className=' font-semibold text-gray-900 mb-2.5'>
                        Available facilities
                      </p>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4'>
                        {facilityTags.map((f) => (
                          <div
                            key={f}
                            className='flex items-center gap-1.5'
                          >
                            <span className='w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0' />
                            <span className='text-sm text-gray-500 font-semibold'>
                              {f}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* ── Location ── */}
              {(restaurant.full_address ?? restaurant.area) && (
                <section className='mt-8 border-t border-gray-200 pt-6 pb-8'>
                  <h2 className='text-[18px] font-bold text-gray-900 mb-4'>
                    Location
                  </h2>

                  <div className='border rounded-2xl'>
                    {/* Map */}
                    <div className='w-full h-52 rounded-t-2xl overflow-hidden mb-4 bg-gray-100'>
                      {restaurant.latitude && restaurant.longitude ? (
                        <iframe
                          title='Restaurant location'
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${restaurant.longitude - 0.006},${restaurant.latitude - 0.004},${restaurant.longitude + 0.006},${restaurant.latitude + 0.004}&layer=mapnik&marker=${restaurant.latitude},${restaurant.longitude}`}
                          className='w-full h-full border-0'
                        />
                      ) : (
                        <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                          <p className='text-[13px] text-gray-400'>
                            Map not available
                          </p>
                        </div>
                      )}
                    </div>

                    <div className='px-4 pb-4'>
                      <p className=' font-bold text-gray-900'>
                        {restaurant.name}
                      </p>
                      <p className='text-sm text-gray-500 mt-0.5 leading-relaxed'>
                        {restaurant.full_address ??
                          `${restaurant.area}, ${restaurant.city}`}
                      </p>
                      <a
                        href={
                          restaurant.latitude && restaurant.longitude
                            ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
                            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.full_address ?? `${restaurant.area}, ${restaurant.city}`)}`
                        }
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 mt-2.5 text-[12px] font-semibold text-brand hover:underline'
                      >
                        <Navigation className='w-3.5 h-3.5' /> Get Directions
                      </a>
                      {restaurant.phone && (
                        <p className='text-[12px] text-gray-600 mt-2'>
                          ☎ {restaurant.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* ── Right sticky sidebar ── */}
            <div className='hidden md:block sticky top-20 pt-4'>
              <BookingWidget restaurantName={restaurant.name} />
            </div>
          </div>
        </div>

        {/* ── Mobile CTA ── */}
        {restaurant.booking_enabled && (
          <div className='md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 z-20 shadow-lg'>
            <button
              type='button'
              className='w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold text-[15px] hover:bg-black transition-colors'
            >
              Book a table
            </button>
          </div>
        )}
      </main>
    </PhotoGalleryProvider>
  );
}
