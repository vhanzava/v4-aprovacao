import { NextResponse, type NextRequest } from 'next/server'
import { getRoleFromEmail } from '@/lib/auth/roles'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const publicRoutes = ['/login', '/auth/callback', '/cliente', '/api/auth']
  const isPublic = publicRoutes.some(r => pathname.startsWith(r))

  if (isPublic) return NextResponse.next()

  const email = request.cookies.get('v4_email')?.value
  const role = email ? getRoleFromEmail(email) : null

  if (!role) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
