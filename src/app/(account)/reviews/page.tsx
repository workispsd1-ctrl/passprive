import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { REVIEW_CONFIG, type ReviewKind } from '@/lib/reviews'
import { YourReviewsClient, type UserReview } from './YourReviewsClient'

export const metadata: Metadata = {
  title: 'Your Reviews | PassPrivé',
}

type ReviewRow = Record<string, unknown> & { id: string; created_at: string }
type Place = NonNullable<UserReview['place']>

/**
 * app parity: screens/YourReviewsScreen.jsx — the user's own reviews. The app
 * lists restaurants only; here stores and tourist places are included too.
 */
export default async function YourReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const kinds = Object.keys(REVIEW_CONFIG) as ReviewKind[]
  const rowsByKind = await Promise.all(
    kinds.map(async kind => {
      const { data } = await supabase
        .from(REVIEW_CONFIG[kind].table)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as ReviewRow[]
    }),
  )
  const [restaurantRows, storeRows, touristRows] = rowsByKind

  const ids = (rows: ReviewRow[], column: string) => [...new Set(rows.map(r => r[column] as string).filter(Boolean))]
  const restaurantIds = ids(restaurantRows, 'restaurant_id')
  const storeIds = ids(storeRows, 'store_id')
  const placeIds = ids(touristRows, 'tourist_place_id')

  const [restaurants, stores, places] = await Promise.all([
    restaurantIds.length
      ? supabase.from('restaurants').select('id, name, slug, area, city, cover_image').in('id', restaurantIds)
      : null,
    storeIds.length
      ? supabase.from('stores').select('id, name, slug, location_name, city, cover_image, logo_url').in('id', storeIds)
      : null,
    placeIds.length
      ? supabase.from('tourist_places').select('id, place_name, slug, area, city, cover_image').in('id', placeIds)
      : null,
  ])

  const placeById = new Map<string, Place>()
  for (const r of restaurants?.data ?? []) {
    placeById.set(r.id, {
      name: r.name,
      href: `/dining/${r.slug ?? r.id}`,
      area: [r.area, r.city].filter(Boolean).join(', '),
      image: r.cover_image,
    })
  }
  for (const s of stores?.data ?? []) {
    placeById.set(s.id, {
      name: s.name,
      // /stores/[id] serves every store, wellness ones included
      href: `/stores/${s.slug ?? s.id}`,
      area: [s.location_name, s.city].filter(Boolean).join(', '),
      image: s.cover_image ?? s.logo_url,
    })
  }
  for (const p of places?.data ?? []) {
    placeById.set(p.id, {
      name: p.place_name,
      href: `/tourist/${p.slug ?? p.id}`,
      area: [p.area, p.city].filter(Boolean).join(', '),
      image: p.cover_image,
    })
  }

  const reviews: UserReview[] = kinds
    .flatMap((kind, i) => {
      const config = REVIEW_CONFIG[kind]
      return rowsByKind[i].map(row => ({
        id: row.id,
        kind,
        rating: Number(row.rating ?? 0),
        text: (row.review_text as string | null) ?? '',
        subRatings: config.steps
          .filter(step => step.column && row[step.column] != null)
          .map(step => ({ label: step.label, value: Number(row[step.column as string]) })),
        approved: row.is_approved === true,
        createdAt: row.created_at,
        place: placeById.get(row[config.entityColumn] as string) ?? null,
      }))
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <main className="min-h-screen">
      <SetPageTitle title="Your reviews" />
      <YourReviewsClient reviews={reviews} />
    </main>
  )
}
