import { NextResponse, type NextRequest } from 'next/server'
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/appLinks'

/**
 * Target of the "Download the PassPrivé App" QR code: sends the phone that
 * scanned it to its own store (App Store on iOS, Play Store otherwise).
 */
export function GET(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? ''
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))
  return NextResponse.redirect(ios && APP_STORE_URL ? APP_STORE_URL : PLAY_STORE_URL, 307)
}
