import { createPublicClient } from '@/lib/supabase/public'
import { cachedCatalog, unwrap } from '@/lib/catalogCache'

export type HomeSectionRow = { section_key: string | null; title: string | null; template: string | null }

/**
 * app parity: components/Home/HomeContent.jsx DEFAULT_ORDER — used when the
 * CMS order can't be read or is empty.
 */
const DEFAULT_ORDER = [
  'foodie-frontrow', 'fresh-spots', 'more-with-passprive', 'offers-for-you', 'foodie-frontrow-classic',
  'promotional-cards', 'new-kick-in-stores', 'family-feast', 'plan-your-salon-visit',
  'whats-hot',
]

/**
 * The home page's sections, in order — app parity: useSectionOrder("Home Screen"):
 * enabled `session_sorting_titles` rows of the "Home Screen" screen by sort_order.
 */
const getRows = cachedCatalog('home-section-order', async (): Promise<HomeSectionRow[] | null> => {
  const supabase = createPublicClient()
  const screen = unwrap(await supabase.from('session_sorting').select('id').eq('name', 'Home Screen').maybeSingle())
  if (!screen) return null
  return (unwrap(await supabase
    .from('session_sorting_titles')
    .select('section_key, title, template')
    .eq('screen_id', screen.id)
    .eq('enabled', true)
    .order('sort_order', { ascending: true })) ?? []) as HomeSectionRow[]
}, null)

export async function getHomeSectionOrder(): Promise<HomeSectionRow[]> {
  const rows = await getRows()
  return rows?.length ? rows : DEFAULT_ORDER.map((section_key) => ({ section_key, title: null, template: null }))
}
