/** Store listings for the PassPrivé mobile app (Android applicationId `com.passprive`). */
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.passprive'

/** App Store listing — set NEXT_PUBLIC_APP_STORE_URL once the iOS app id is known. */
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL ?? ''

/** What the download QR encodes: /get-app redirects to the scanning phone's store. */
export function appDownloadUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.passprive.com'
  return `${site.replace(/\/$/, '')}/get-app`
}
