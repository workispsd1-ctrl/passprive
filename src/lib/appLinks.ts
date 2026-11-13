/** Play Store listing for the PassPrivé app (Android applicationId `com.passprive`); env can swap in a testing link. */
export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.passprive'

/** App Store listing — set NEXT_PUBLIC_APP_STORE_URL once the iOS app id is known. */
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || ''

/** What the download QR encodes: /get-app redirects to the scanning phone's store. */
export function appDownloadUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.passprive.com'
  return `${site.replace(/\/$/, '')}/get-app`
}
