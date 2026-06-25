import { createClient } from '@/lib/supabase/server'
import type { GiftEvent } from '@/lib/types/gifts'

export async function getGiftEvents(): Promise<GiftEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('gift_events')
    .select('id, title, image_url, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  return (data ?? []) as GiftEvent[]
}
