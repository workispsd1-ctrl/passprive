/**
 * A store belongs to exactly one section — app parity: utils/wellnessStore.js
 * `isWellnessStore` + utils/storeDetailsRouting.js. `store_type = 'SERVICE'`
 * is a wellness store (spa, salon, …) and opens the wellness detail screen;
 * everything else is a shopping store and opens the store detail screen.
 */
export function isWellnessStore(store: { store_type?: string | null } | null | undefined): boolean {
  return String(store?.store_type ?? '').trim().toUpperCase() === 'SERVICE'
}

/** The one detail URL for a store, whichever list it's shown in. */
export function storeHref(store: { id: string; slug?: string | null; store_type?: string | null }): string {
  return `/${isWellnessStore(store) ? 'wellness' : 'stores'}/${store.slug ?? store.id}`
}
