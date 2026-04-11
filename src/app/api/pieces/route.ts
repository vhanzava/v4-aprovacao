import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getRoleFromEmail, canCreatePieces } from '@/lib/auth/roles'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSessionRole() {
  const cookieStore = await cookies()
  const email = cookieStore.get('v4_email')?.value
  if (!email) return null
  return getRoleFromEmail(email)
}

export async function POST(request: Request) {
  const role = await getSessionRole()
  if (!role || !canCreatePieces(role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { client_id, title, format, purpose, copy, drive_url, post_date, assets } = body

  if (!client_id || !title || !format || !purpose) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  const supabase = getServiceClient()

  const { data: piece, error } = await supabase
    .from('pieces')
    .insert({ client_id, title, format, purpose, copy: copy || null, drive_url: drive_url || null, post_date: post_date || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert assets if any
  if (assets && assets.length > 0) {
    await supabase.from('piece_assets').insert(
      assets.map((a: { url: string; storage_path: string }, i: number) => ({
        piece_id: piece.id,
        url: a.url,
        storage_path: a.storage_path,
        order_index: i,
      }))
    )
  }

  return NextResponse.json(piece)
}
