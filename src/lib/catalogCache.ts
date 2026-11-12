import { unstable_cache } from 'next/cache'

/** Tag on every cached catalog read — `revalidateTag(CATALOG_TAG, 'max')` refreshes them all. */
export const CATALOG_TAG = 'catalog'

/** Seconds a catalog read is shared across visitors before it's refetched. */
export const CATALOG_TTL = 300

/**
 * Shares the result of a public, visitor-independent read (stores, malls,
 * collections…) across all requests for CATALOG_TTL seconds, so traffic stops
 * scaling database load. Arguments are part of the cache key.
 *
 * `fn` must throw on a failed query: a throw is never cached, and the caller
 * gets `fallback` for that one request instead of an empty list being pinned
 * for every visitor until the TTL runs out.
 */
export function cachedCatalog<A extends unknown[], R>(
  key: string,
  fn: (...args: A) => Promise<R>,
  fallback: R,
): (...args: A) => Promise<R> {
  const cached = unstable_cache(fn, ['catalog', key], { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] })
  return async (...args: A) => {
    try {
      return await cached(...args)
    } catch (err) {
      console.error(`[catalog:${key}]`, err)
      return fallback
    }
  }
}

/** Unwraps a Supabase result, throwing on error so a failed read isn't cached. */
export function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}
