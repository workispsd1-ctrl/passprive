import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { AppUser } from '@/lib/types/user'

/**
 * The signed-in user from the session's verified JWT claims. `getClaims`
 * checks the token locally against the project's public key, so (unlike
 * `getUser`) it costs no Auth round trip; `cache` shares one result between
 * the layout, header and page of a request.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null
  return {
    id: claims.sub,
    email: claims.email as string | undefined,
    name: (claims.user_metadata?.full_name as string | undefined) ?? null,
    phone: (claims.phone as string | undefined) ?? null,
  }
})
