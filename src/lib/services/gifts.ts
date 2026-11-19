import { createPublicClient } from '@/lib/supabase/public'
import { cachedCatalog, unwrap } from '@/lib/catalogCache'
import type { GiftEvent } from '@/lib/types/gifts'

/** Active gifting occasions — the same for every visitor, so shared for CATALOG_TTL. */
export const getGiftEvents = cachedCatalog('gift-events', async (): Promise<GiftEvent[]> => {
  return (unwrap(
    await createPublicClient()
      .from('gift_events')
      .select('id, title, image_url, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
  ) ?? []) as GiftEvent[]
}, [])
