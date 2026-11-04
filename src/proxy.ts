import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.getUser()

  // The browser holds a session whose refresh token no longer exists server-side
  // (revoked, signed out elsewhere, or expired). Drop the stale auth cookies from
  // both the forwarded request and the response so downstream server components
  // don't retry the refresh and the browser stops sending them.
  if (error?.code === 'refresh_token_not_found' || error?.code === 'refresh_token_already_used') {
    const stale = request.cookies.getAll().filter(({ name }) => name.startsWith('sb-'))
    stale.forEach(({ name }) => request.cookies.delete(name))
    supabaseResponse = NextResponse.next({ request })
    stale.forEach(({ name }) => supabaseResponse.cookies.delete(name))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
