/**
 * Mobile-number login — app parity: screens/Login.jsx + OtpVerification.jsx +
 * utils/otpApi.js. Numbers are Mauritian (+230); the backend texts a 6-digit
 * code and, on success, returns a Supabase session.
 */
export const COUNTRY_CODE = '+230'
export const CODE_LENGTH = 6
export const RESEND_SECONDS = 60

/** Local part of the number (digits only). Mauritian numbers are 7–8 digits. */
export function normalizeLocalPhone(raw: string): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '').replace(/^230/, '')
  return /^\d{7,8}$/.test(digits) ? digits : null
}

export const fullPhone = (local: string) => `${COUNTRY_CODE}${local}`

type OtpErrorKind =
  | 'cooldown' | 'incorrect' | 'locked' | 'blocked' | 'phone' | 'send'
  | 'network' | 'taken' | 'auth' | 'session' | 'unknown'

/**
 * Backend wording → what the login screen shows — app parity: otpApi.js
 * describeOtpError. `locked` / `session` mean the current code can't be
 * retried; `cooldown` carries the seconds left before a resend.
 */
export function describeOtpError(raw: string): { kind: OtpErrorKind; message: string; seconds?: number } {
  const text = String(raw ?? '')
  const wait = text.match(/wait (\d+) seconds/i)
  if (wait) {
    const seconds = Number(wait[1])
    return { kind: 'cooldown', seconds, message: `Please wait ${seconds}s before requesting a new code.` }
  }
  const left = text.match(/(\d+) attempts? remaining/i)
  if (left) {
    const n = Number(left[1])
    return { kind: 'incorrect', message: `Incorrect code. ${n} ${n === 1 ? 'attempt' : 'attempts'} left.` }
  }
  if (/limit exceeded|too many failed/i.test(text) && !/hourly/i.test(text)) {
    return { kind: 'locked', message: 'Too many incorrect attempts. Request a new code.' }
  }
  if (/expired|no active otp/i.test(text)) return { kind: 'locked', message: 'This code has expired. Request a new one.' }
  if (/hourly/i.test(text)) return { kind: 'blocked', message: 'Too many codes requested. Please try again in an hour.' }
  if (/invalid phone/i.test(text)) return { kind: 'phone', message: 'Please enter a valid mobile number.' }
  if (/deliver|sms provider/i.test(text)) return { kind: 'send', message: "We couldn't send the SMS. Please try again." }
  if (/timeout/i.test(text)) return { kind: 'network', message: 'This is taking too long. Check your connection and try again.' }
  if (/network|no connection/i.test(text)) return { kind: 'network', message: 'No internet connection. Please try again.' }
  if (/already linked|already has an account/i.test(text)) return { kind: 'taken', message: text }
  if (/session has expired/i.test(text)) return { kind: 'auth', message: 'Your session has expired. Please log in again.' }
  if (/sign you in/i.test(text)) return { kind: 'session', message: "Code verified, but we couldn't sign you in. Please try again." }
  return { kind: 'unknown', message: 'Something went wrong. Please try again.' }
}
