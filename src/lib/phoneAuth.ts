/**
 * Mobile-number login — app parity: screens/Login.jsx + OtpVerification.jsx +
 * utils/otpApi.js. Numbers are Mauritian (+230); the backend texts a 6-digit
 * code and, on success, returns a Supabase session.
 */
export const COUNTRY_CODE = '+230'
export const CODE_LENGTH = 6
export const RESEND_SECONDS = 30

/** Local part of the number (digits only). Mauritian numbers are 7–8 digits. */
export function normalizeLocalPhone(raw: string): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '').replace(/^230/, '')
  return /^\d{7,8}$/.test(digits) ? digits : null
}

export const fullPhone = (local: string) => `${COUNTRY_CODE}${local}`

/** app parity: OtpVerification.jsx friendlyOtpError */
export function friendlyOtpError(message: string, fallback = 'Something went wrong. Please try again.') {
  if (/invalid|incorrect|expired|match|no active otp/i.test(message)) return 'That code is incorrect or has expired. Please try again.'
  if (/network|fetch|timeout/i.test(message)) return 'No connection. Check your internet and try again.'
  return fallback
}
