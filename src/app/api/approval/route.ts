import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { formatLabel, purposeLabel } from '@/lib/utils'

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()
    const { token, piece_id, status, step1_answers, step2_answers, step2_open, step3_text } = body

    if (!token || !piece_id || !status) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Validate token
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, status')
      .eq('magic_token', token)
      .single()

    if (!client || client.status === 'inativo') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
    }

    // Validate piece belongs to client
    const { data: piece } = await supabase
      .from('pieces')
      .select('id, title, format, purpose, client_id')
      .eq('id', piece_id)
      .eq('client_id', client.id)
      .single()

    if (!piece) {
      return NextResponse.json({ error: 'Peça não encontrada' }, { status: 404 })
    }

    // Upsert approval — handles retries gracefully (e.g. previous attempt
    // saved to DB but response never reached the client)
    const { error: approvalError } = await supabase.from('approvals').upsert(
      {
        piece_id,
        status,
        step1_answers: step1_answers ?? null,
        step2_answers: step2_answers ?? null,
        step2_open: step2_open ?? null,
        step3_text: step3_text ?? null,
        decided_at: new Date().toISOString(),
      },
      { onConflict: 'piece_id' }
    )

    if (approvalError) {
      console.error('[approval] upsert error:', approvalError)
      return NextResponse.json(
        { error: 'Erro ao salvar', detail: approvalError.message, code: approvalError.code },
        { status: 500 }
      )
    }

    // Update piece status
    await supabase
      .from('pieces')
      .update({ status })
      .eq('id', piece_id)

    // Delete raw files from Storage — keeps DB history, frees storage
    await cleanupAssets(supabase, piece_id)

    // Notify Google Chat
    await notifyGoogleChat({
      clientName: client.name,
      pieceTitle: piece.title,
      pieceFormat: piece.format,
      piecePurpose: piece.purpose,
      status,
      step1_answers,
      step2_answers,
      step2_open,
      step3_text,
      pieceUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/pecas/${piece_id}`,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const body = await request.json()
    const { token, piece_id } = body

    if (!token || !piece_id) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Validate token
    const { data: client } = await supabase
      .from('clients')
      .select('id, status')
      .eq('magic_token', token)
      .single()

    if (!client || client.status === 'inativo') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
    }

    // Validate piece belongs to client
    const { data: piece } = await supabase
      .from('pieces')
      .select('id, client_id')
      .eq('id', piece_id)
      .eq('client_id', client.id)
      .single()

    if (!piece) {
      return NextResponse.json({ error: 'Peça não encontrada' }, { status: 404 })
    }

    // Delete approval record(s)
    await supabase.from('approvals').delete().eq('piece_id', piece_id)

    // Reset piece status to pendente
    await supabase.from('pieces').update({ status: 'pendente' }).eq('id', piece_id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cleanupAssets(supabase: any, piece_id: string) {
  try {
    // Fetch storage paths for this piece
    const { data: assets } = await supabase
      .from('piece_assets')
      .select('storage_path')
      .eq('piece_id', piece_id)
      .not('storage_path', 'is', null)

    if (assets && assets.length > 0) {
      const paths = assets.map((a: { storage_path: string }) => a.storage_path).filter(Boolean)
      if (paths.length > 0) {
        await supabase.storage.from('pieces').remove(paths)
      }
    }
  } catch {
    // Cleanup failure shouldn't break the approval flow
  }
}

async function notifyGoogleChat(data: {
  clientName: string
  pieceTitle: string
  pieceFormat: string
  piecePurpose: string
  status: string
  step1_answers?: string[]
  step2_answers?: string[]
  step2_open?: string
  step3_text?: string
  pieceUrl: string
}) {
  const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL
  if (!webhookUrl) return

  const emoji = data.status === 'aprovado' ? '✅' : '❌'
  const statusText = data.status === 'aprovado' ? 'APROVADO' : 'REPROVADO'

  let text = `${emoji} *${statusText}* — ${data.clientName}\n`
  text += `📄 *${data.pieceTitle}* (${formatLabel(data.pieceFormat as 'imagem_unica' | 'carrossel' | 'video')} · ${purposeLabel(data.piecePurpose as 'postagem' | 'anuncio')})\n`

  if (data.status === 'reprovado') {
    if (data.step1_answers?.length) {
      text += `\n🔍 *O que não agradou:* ${data.step1_answers.join(', ')}`
    }
    if (data.step2_answers?.length) {
      text += `\n🔎 *Detalhes:* ${data.step2_answers.join(', ')}`
    }
    if (data.step2_open) {
      text += `\n📝 ${data.step2_open}`
    }
    if (data.step3_text) {
      text += `\n\n💬 "${data.step3_text}"`
    }
  }

  text += `\n\n🔗 ${data.pieceUrl}`

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    // Notification failure shouldn't break the approval
  }
}
