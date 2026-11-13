import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SetPageTitle } from '@/components/layout/MinimalHeader/SetPageTitle'
import { REVIEW_CONFIG, reviewSteps, type ReviewKind } from '@/lib/reviews'
import { YourReviewsClient, type UserReview } from './YourReviewsClient'

export const metadata: Metadata = {
  title: 'Your Reviews | PassPrivé',
}

type ReviewRow = Record<string, unknown> & { id: string; created_at: string }
type Place = NonNullable<UserReview['place']>

/**
 * app parity: screens/YourReviewsScreen.jsx — the user's own reviews. The app
 * lists restaurants only; here stores are included too. Tourist places are
 * left out while Tourist is "coming soon" in the app.
 */
export default async function YourReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const kinds = (Object.keys(REVIEW_CONFIG) as ReviewKind[]).filter(kind => kind !== 'tourist')
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
  const [restaurantRows, storeRows] = rowsByKind

  const ids = (rows: ReviewRow[], column: string) => [...new Set(rows.map(r => r[column] as string).filter(Boolean))]
  const restaurantIds = ids(restaurantRows, 'restaurant_id')
  const storeIds = ids(storeRows, 'store_id')

  const [restaurants, stores] = await Promise.all([
    restaurantIds.length
      ? supabase.from('restaurants').select('id, name, slug, area, city, cover_image').in('id', restaurantIds)
      : null,
    storeIds.length
      ? supabase.from('stores').select('id, name, slug, location_name, city, cover_image, logo_url, store_type').in('id', storeIds)
      : null,
  ])

  const placeById = new Map<string, Place>()
  // wellness (SERVICE) stores name their ratings Treatment / Staff / Ambience
  const wellnessStores = new Set((stores?.data ?? []).filter(s => String(s.store_type ?? '').toUpperCase() === 'SERVICE').map(s => s.id))
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

  const reviews: UserReview[] = kinds
    .flatMap((kind, i) => {
      const config = REVIEW_CONFIG[kind]
      return rowsByKind[i].map(row => ({
        id: row.id,
        kind,
        rating: Number(row.rating ?? 0),
        text: (row.review_text as string | null) ?? '',
        subRatings: reviewSteps(kind, kind === 'store' && wellnessStores.has(row[config.entityColumn] as string) ? 'wellness' : undefined)
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
