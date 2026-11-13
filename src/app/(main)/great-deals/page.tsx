import type { Metadata } from 'next'
import { getUserCoords } from '@/lib/location'
import { getGreatDeals } from '@/lib/services/greatDeals'
import { GreatDeals } from '@/components/greatDeals/GreatDeals'

export const metadata: Metadata = {
  title: 'Great Deals',
  description: 'Offers, cashback, stamp rewards and exclusive deals near you.',
}

/** Great Deals — app parity: screens/DealsScreen.jsx, laid out to the website Figma. `?min=` pre-sets "All offers" to a minimum % off. */
export default async function GreatDealsPage({ searchParams }: { searchParams: Promise<{ min?: string }> }) {
  const { min } = await searchParams
  const minPct = [30, 40].includes(Number(min)) ? Number(min) : 0
  const data = await getGreatDeals(await getUserCoords())
  return (
    <main className='relative'>
      <GreatDeals data={data} initialMin={minPct} />
    </main>
  )
}
