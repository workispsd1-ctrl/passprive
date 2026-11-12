import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Anon-key client with no cookies/session — for public catalog reads that are
 * the same for every visitor. Safe to call inside `unstable_cache` (the
 * cookie-based server client is not: request APIs are banned in cached scopes).
 */
export function createPublicClient(): SupabaseClient {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  )
  return client
}
