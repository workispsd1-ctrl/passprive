import type { Metadata } from 'next'
import { SearchClient } from './SearchClient'

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false },
}

/** Global search — app parity: screens/GlobalSearchScreen (restaurants and stores, with tabs; Tourists is disabled). */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  return <SearchClient initialQuery={q ?? ''} />
}
