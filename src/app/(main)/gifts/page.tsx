import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getGiftEvents } from '@/lib/services/gifts'
import { GiftsClient } from '@/components/sections/gifts/GiftsClient'
import type { GiftBrand, GiftDiscount, GiftSummary } from '@/lib/types/gifts'

export const metadata: Metadata = {
  title: 'Gift Cards | PassPrivé',
  description: 'Buy, send and redeem gift cards at top restaurants and stores. Earn and spend PassPrivé coins.',
  openGraph: {
    title: 'Gift Cards | PassPrivé',
    description: 'Buy and send gift cards at your favourite PassPrivé partners.',
    url: '/gifts',
  },
  alternates: { canonical: '/gifts' },
}

const GIFTS_API = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

async function fetchFromLambda<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${GIFTS_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export default async function GiftsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const [events, brandsData, discountsData, summaryData] = await Promise.all([
    getGiftEvents(),
    session ? fetchFromLambda<{ brands: GiftBrand[] }>('/api/gifts/brands', session.access_token) : null,
    session ? fetchFromLambda<{ discounts: GiftDiscount[] }>('/api/gifts/discounts', session.access_token) : null,
    session ? fetchFromLambda<GiftSummary>('/api/gifts/summary', session.access_token) : null,
  ])

  const brands = brandsData?.brands ?? []
  const discounts = discountsData?.discounts ?? []
  const summary = summaryData ?? null

  return (
    <main className='min-h-screen bg-gray-50'>
      <GiftsClient
        events={events}
        brands={brands}
        discounts={discounts}
        summary={summary}
      />
    </main>
  )
}
