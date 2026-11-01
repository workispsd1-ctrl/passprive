import { createClient } from '@/lib/supabase/server'

export const AUTH_API_BASE = (process.env.PAYMENTS_API_URL ?? 'https://nxxacdlmcc.execute-api.ap-south-1.amazonaws.com').replace(/\/+$/, '')

export type OtpSessionResult = {
  session?: { access_token?: string; refresh_token?: string }
  session_token?: string
}

/**
 * app parity: otpApi.establishSessionFromOtp — the backend's session is stored
 * as the site's normal Supabase auth cookies (setSession), with the app's
 * fallback of redeeming a single-use `session_token` hash.
 */
export async function establishOtpSession(result: OtpSessionResult): Promise<boolean> {
  const supabase = await createClient()
  if (result.session?.access_token && result.session.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    })
    if (!error && data.session) return true
  }
  if (result.session_token) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: result.session_token, type: 'magiclink' })
    if (!error && data.session) return true
  }
  return false
}
