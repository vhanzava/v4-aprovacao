import { NextResponse } from 'next/server'
import { getRoleFromEmail } from '@/lib/auth/roles'

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()
  const role = getRoleFromEmail(normalized)

  if (!role) {
    return NextResponse.json({ error: 'Acesso restrito a e-mails @v4company.com.' }, { status: 403 })
  }

  const response = NextResponse.json({ ok: true, role })
  response.cookies.set('v4_email', normalized, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  })

  return response
}
