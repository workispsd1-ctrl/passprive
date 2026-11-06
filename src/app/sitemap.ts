import type { MetadataRoute } from 'next'
import { getActiveStores } from '@/lib/services/stores'
import { storeHref } from '@/lib/storeType'
import { getActiveRestaurants } from '@/lib/services/dining'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.passprive.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stores, restaurants] = await Promise.all([
    getActiveStores(),
    getActiveRestaurants(200),
  ])

  const storeUrls: MetadataRoute.Sitemap = stores.map(store => ({
    url: `${SITE_URL}${storeHref(store)}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const restaurantUrls: MetadataRoute.Sitemap = restaurants.map(r => ({
    url: `${SITE_URL}/dining/${r.slug ?? r.id}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/dining`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/stores`, changeFrequency: 'daily', priority: 0.9 },
    ...storeUrls,
    ...restaurantUrls,
  ]
}
