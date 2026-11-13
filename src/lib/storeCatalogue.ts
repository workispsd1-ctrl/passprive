/**
 * Store catalogue — app parity: StoresDetail/StoreCatalogueSection.jsx
 * `buildCatalogueCategoriesFromTables`. Items are grouped under the store's
 * enabled `store_catalogue_categories` (the query only fetches enabled ones),
 * items without a photo are dropped, categories and items go by sort_order then
 * title. When that leaves nothing, every available item with a photo is shown,
 * as the app's fallback does. The app then shows the groups as one photo grid,
 * so this returns the items flattened in that order.
 */

export type CatalogueCategoryRow = { id: string; title?: string | null; sort_order?: number | null }
export type CatalogueItemRow = {
  id: string
  category_id?: string | null
  title?: string | null
  image_url?: string | null
  sort_order?: number | null
}

const bySortThenTitle = (a: { sort_order?: number | null; title?: string | null }, b: typeof a) =>
  (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || String(a.title ?? '').localeCompare(String(b.title ?? ''))

/** One catalogue category with its items — the store page's collection tiles. */
export type CatalogueCollection<T> = { id: string; title: string; items: T[] }

/**
 * The catalogue grouped by category, in the order above. When no item sits in
 * an enabled category, every available item with a photo forms one collection
 * (the app's fallback).
 */
export function buildCatalogueCollections<T extends CatalogueItemRow>(categories: CatalogueCategoryRow[], items: T[]): CatalogueCollection<T>[] {
  const withPhoto = items
    .map((item) => ({ ...item, image_url: item.image_url?.trim() || null }))
    .filter((item) => !!item.image_url)

  const byCategory = new Map<string, T[]>()
  for (const item of withPhoto) {
    if (!item.category_id) continue
    const list = byCategory.get(item.category_id) ?? []
    list.push(item)
    byCategory.set(item.category_id, list)
  }

  const grouped = [...categories]
    .filter((c) => (byCategory.get(c.id)?.length ?? 0) > 0)
    .sort(bySortThenTitle)
    .map((c) => ({ id: c.id, title: c.title?.trim() || 'Collection', items: byCategory.get(c.id)!.sort(bySortThenTitle) }))

  if (grouped.length > 0) return grouped
  return withPhoto.length > 0 ? [{ id: 'all', title: 'All products', items: withPhoto }] : []
}

export function buildStoreCatalogue<T extends CatalogueItemRow>(categories: CatalogueCategoryRow[], items: T[]): T[] {
  return buildCatalogueCollections(categories, items).flatMap((c) => c.items)
}
