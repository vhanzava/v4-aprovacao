import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getRoleFromEmail, canManageClients } from '@/lib/auth/roles'

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = await getSessionRole()
  if (!role || !canManageClients(role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('clients')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
