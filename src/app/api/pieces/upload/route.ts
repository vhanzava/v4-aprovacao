import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getRoleFromEmail, canCreatePieces } from '@/lib/auth/roles'
import { randomUUID } from 'crypto'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const email = cookieStore.get('v4_email')?.value
  const role = email ? getRoleFromEmail(email) : null

  if (!role || !canCreatePieces(role)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) {
    return NextResponse.json({ assets: [] })
  }

  const supabase = getServiceClient()
  const assets: { url: string; storage_path: string }[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage
      .from('pieces')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('pieces')
        .getPublicUrl(path)

      assets.push({ url: publicUrl, storage_path: path })
    }
  }

  return NextResponse.json({ assets })
}
