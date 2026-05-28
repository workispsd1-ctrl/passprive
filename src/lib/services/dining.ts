import { createClient } from '@/lib/supabase/server'
import type {
  Restaurant,
  DiningOffer,
  RestaurantTag,
  Review,
  ReviewSummary,
  RestaurantDetail,
} from '@/lib/types/dining'

const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SELECT_FIELDS =
  'id, name, slug, description, area, city, full_address, cover_image, cost_for_two, phone, is_pure_veg, booking_enabled, menu_json, latitude, longitude'

export async function getRestaurantBySlugOrId(slugOrId: string): Promise<RestaurantDetail> {
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
      offers: [],
      tags: [],
      reviews: [],
      reviewSummary: { avg: 0, count: 0 },
      galleryPhotos: [],
      menuImages: [],
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

  const offers: DiningOffer[] =
    offersRes.status === 'fulfilled' ? (offersRes.value.data ?? []) : []
  const tags: RestaurantTag[] =
    tagsRes.status === 'fulfilled' ? (tagsRes.value.data ?? []) : []
  const reviews: Review[] =
    reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data ?? []) : []
  const menuImages: string[] =
    menuAssetsRes.status === 'fulfilled'
      ? (menuAssetsRes.value.data ?? []).map((a: { file_url: string }) => a.file_url).filter(Boolean)
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
  const storagePhotos = (storageFiles as Array<{ name?: string }>)
    .filter(f => f.name && /\.(jpe?g|png|webp)$/i.test(f.name))
    .map(
      f =>
        `${STORAGE_URL}/storage/v1/object/public/restaurant/restaurant/food/${restaurant!.id}/${f.name}`,
    )

  const reviewPhotos =
    reviewPhotosRes.status === 'fulfilled'
      ? (reviewPhotosRes.value.data ?? [])
          .flatMap((r: { photo_urls?: string[] }) => r.photo_urls ?? [])
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
