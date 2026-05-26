import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([]);


  const safe = q.replace(/[%,()]/g, '').slice(0, 100);
  if (!safe) return NextResponse.json([]);

  const supabase = await createClient();

  const { data: storesData } = await supabase
    .from('stores')
    .select('id, name, category, location_name, city, logo_url, slug')
    .or(
      `name.ilike.%${safe}%,category.ilike.%${safe}%,subcategory.ilike.%${safe}%,location_name.ilike.%${safe}%,city.ilike.%${safe}%`,
    )
    .eq('is_active', true)
    .limit(6);

  const { data: restaurantsData } = await supabase
    .from('restaurants')
    .select('id, name, area, city, cover_image, slug, description')
    .or(
      `name.ilike.%${safe}%,area.ilike.%${safe}%,city.ilike.%${safe}%,description.ilike.%${safe}%`,
    )
    .eq('is_active', true)
    .limit(6);


  const combined = [
    ...(storesData ?? []).map((item) => ({ ...item, type: 'store' })),
    ...(restaurantsData ?? []).map(({ cover_image, area, description, ...rest }) => ({
      ...rest,
      logo_url: cover_image,
      location_name: area,
      category: description ?? null,
      type: 'restaurant',
    })),
  ];

  return NextResponse.json(combined);
}
