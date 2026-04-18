import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que solo se muestran a usuarios NO autenticados (login, registro)
const GUEST_ONLY_PATHS = ['/login', '/register']

// Rutas accesibles siempre (con o sin sesión)
const ALWAYS_PUBLIC_PATHS = [
  '/auth/callback',
  '/callback',
  '/forgot-password',
  '/set-password',
]

export async function middleware(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isGuestOnly    = GUEST_ONLY_PATHS.some(p => pathname.startsWith(p))
  const isAlwaysPublic = ALWAYS_PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const isPublicStorefront = pathname.startsWith('/menu/') || pathname === '/'

  // Sin sesión → solo puede ver rutas públicas
  if (!user && !isGuestOnly && !isAlwaysPublic && !isPublicStorefront) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión → no puede ver login/registro, pero SÍ puede ver set-password y forgot-password
  if (user && isGuestOnly) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
