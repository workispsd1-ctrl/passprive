import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Serves a promotional_collections banner. Rows hold the image as an inline
 * `data:` URI (multi-MB) — decoding it here keeps it out of the page HTML and
 * lets the browser cache it.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('promotional_collections')
    .select('banner_image_url')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  const url = data?.banner_image_url as string | null | undefined
  if (!url) return new NextResponse(null, { status: 404 })

  const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(url)
  if (!m) return NextResponse.redirect(url)

  return new NextResponse(Buffer.from(m[2], 'base64'), {
    headers: {
      'Content-Type': m[1],
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
