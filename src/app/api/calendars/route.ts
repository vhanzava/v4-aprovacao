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

async function getSession() {
  const cookieStore = await cookies()
  const email = cookieStore.get('v4_email')?.value
  if (!email) return null
  const role = getRoleFromEmail(email)
  if (!role) return null
  return { email, role }
}

/** POST /api/calendars — create or get-or-create calendar for client+month */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || !canCreatePieces(session.role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { client_id, month } = await request.json()
  if (!client_id || !month) {
    return NextResponse.json({ error: 'client_id e month obrigatórios' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Upsert: get existing or create new
  const { data: existing } = await supabase
    .from('calendars')
    .select('*')
    .eq('client_id', client_id)
    .eq('month', month)
    .single()

  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase
    .from('calendars')
    .insert({
      client_id,
      month,
      status: 'rascunho',
      national_dates: [],
      created_by_email: session.email,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
