import type { User } from '@supabase/supabase-js'
import type { createClient } from '@/lib/supabase/client'

/**
 * The public `users` row every account needs — app parity: Login.jsx /
 * Signup.jsx syncUserProfile. Existing rows get their login stamps refreshed;
 * new accounts (Google, email) are inserted with their name and email.
 */
export async function ensureUserRow(supabase: ReturnType<typeof createClient>, user: User) {
  const now = new Date().toISOString()
  const { data: row } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
  if (row) {
    await supabase.from('users').update({ last_login: now, last_opened: now, updated_at: now }).eq('id', user.id)
    return
  }
  await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    created_at: now,
    last_login: now,
    last_opened: now,
  })
}
