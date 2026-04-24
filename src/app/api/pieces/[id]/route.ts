import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getRoleFromEmail, canCreatePieces, isAdmin } from '@/lib/auth/roles'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSession() {
  const cookieStore = await cookies()
  const email = cookieStore.get('v4_email')?.value
  if (!email) return null
  const role = getRoleFromEmail(email)
  if (!role) return null
  return { email, role }
}

/** PATCH /api/pieces/[id]
 *  Supported operations:
 *  - { status: 'cancelada' }       → cancel a piece
 *  - { order_index: number }        → reorder
 *  - { ...any piece fields }        → generic update (team only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (!session || !canCreatePieces(session.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = getServiceClient()

  const allowed = ['status', 'order_index', 'title', 'format', 'purpose',
    'copy', 'drive_url', 'post_date', 'theme_date', 'theme_description',
    'theme_headline', 'post_caption']

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('pieces')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

/** DELETE /api/pieces/[id]
 *  Admin only. Permanently removes the piece, its approval, and all assets.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: 'Apenas admins podem apagar peças' }, { status: 403 })
  }

  const supabase = getServiceClient()

  // 1. Remove storage files (best-effort — don't block on failure)
  try {
    const { data: assets } = await supabase
      .from('piece_assets')
      .select('storage_path')
      .eq('piece_id', id)
      .not('storage_path', 'is', null)

    const paths = (assets ?? [])
      .map((a: { storage_path: string }) => a.storage_path)
      .filter(Boolean)

    if (paths.length > 0) {
      await supabase.storage.from('pieces').remove(paths)
    }
  } catch {
    // Storage cleanup failure is non-fatal
  }

  // 2. Delete approval (if exists)
  await supabase.from('approvals').delete().eq('piece_id', id)

  // 3. Delete piece assets records
  await supabase.from('piece_assets').delete().eq('piece_id', id)

  // 4. Delete the piece itself
  const { error } = await supabase.from('pieces').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
