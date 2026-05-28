import { createClient } from '@/lib/supabase/server'
import type { AppUser } from '@/lib/types/user'

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null
  return {
    email: authUser.email,
    name: (authUser.user_metadata?.full_name as string | undefined) ?? null,
    phone: authUser.phone ?? null,
  }
}
