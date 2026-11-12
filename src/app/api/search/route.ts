import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';
import { cachedCatalog, unwrap } from '@/lib/catalogCache';

type StoreHit = { id: string; name: string; category: string | null; subcategory: string | null; location_name: string | null; city: string | null; logo_url: string | null; slug: string | null; store_type: string | null };
type RestaurantHit = { id: string; name: string; area: string | null; city: string | null; cover_image: string | null; slug: string | null; description: string | null };

/**
 * Both tables are a few hundred rows, so they're cached once for everyone and
 * matched in memory — a `%q%` ilike can't use an index and scanned every row
 * on each keystroke.
 */
const getSearchIndex = cachedCatalog('search-index', async () => {
  const supabase = createPublicClient();
  const [stores, restaurants] = await Promise.all([
    supabase
      .from('stores')
      .select('id, name, category, subcategory, location_name, city, logo_url, slug, store_type')
      .eq('is_active', true),
    supabase
      .from('restaurants')
      .select('id, name, area, city, cover_image, slug, description')
      .eq('is_active', true),
  ]);
  return {
    stores: (unwrap(stores) ?? []) as StoreHit[],
    restaurants: (unwrap(restaurants) ?? []) as RestaurantHit[],
  };
}, { stores: [] as StoreHit[], restaurants: [] as RestaurantHit[] });

/** Case-insensitive substring match on any field — what `ilike '%q%'` did. */
const matches = (needle: string, ...fields: (string | null)[]) =>
  fields.some((f) => f != null && f.toLowerCase().includes(needle));

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(40, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 6));
  if (q.length < 2) return NextResponse.json([]);

  const safe = q.replace(/[%,()]/g, '').slice(0, 100).toLowerCase();
  if (!safe) return NextResponse.json([]);

  const index = await getSearchIndex();

  const storesData = index.stores
    .filter((s) => matches(safe, s.name, s.category, s.subcategory, s.location_name, s.city))
    .slice(0, limit)
    .map(({ subcategory: _subcategory, ...rest }) => rest);

  const restaurantsData = index.restaurants
    .filter((r) => matches(safe, r.name, r.area, r.city, r.description))
    .slice(0, limit);

  // app parity: GlobalSearchScreen has no tourist results (Tourist is "coming soon")
  const combined = [
    ...storesData.map((item) => ({ ...item, type: 'store' })),
    ...restaurantsData.map(({ cover_image, area, description, ...rest }) => ({
      ...rest,
      logo_url: cover_image,
      location_name: area,
      category: description ?? null,
      type: 'restaurant',
    })),
  ];

  return NextResponse.json(combined, { headers: { 'Cache-Control': 'private, max-age=60' } });
}
