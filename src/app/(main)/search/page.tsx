import type { Metadata } from 'next'
import { SearchClient } from './SearchClient'

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false },
}

/** Global search — app parity: screens/GlobalSearchScreen (restaurants, stores and tourist places, with tabs). */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  return <SearchClient initialQuery={q ?? ''} />
}
