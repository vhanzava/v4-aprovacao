import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ClientFlowOrchestrator } from '@/components/client/ClientFlowOrchestrator'
import { ClientApprovalFlow } from '@/components/client/ClientApprovalFlow'

export default async function ClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ piece?: string }>
}) {
  const { token } = await params
  const { piece: pieceIdParam } = await searchParams
  const supabase = await createServiceClient()

  // Validate token and get client
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, status')
    .eq('magic_token', token)
    .single()

  if (!client || client.status === 'inativo') notFound()

  // ── Direct piece link mode (?piece=ID) ─────────────────────────────────
  // Shows only that single piece, no queue interference
  if (pieceIdParam) {
    const { data: singlePiece } = await supabase
      .from('pieces')
      .select('*, assets:piece_assets(*), approval:approvals(*)')
      .eq('id', pieceIdParam)
      .eq('client_id', client.id)
      .eq('status', 'pendente')
      .single()

    if (!singlePiece) notFound()

    if (singlePiece.assets) {
      singlePiece.assets.sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
      )
    }

    return (
      <ClientApprovalFlow
        client={client}
        pieces={[singlePiece]}
        token={token}
        singlePieceMode
      />
    )
  }

  // ── Full queue mode ─────────────────────────────────────────────────────
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, assets:piece_assets(*), approval:approvals(*)')
    .eq('client_id', client.id)
    .neq('status', 'cancelada')
    .order('stage', { ascending: true })
    .order('created_at', { ascending: true })

  if (pieces) {
    pieces.forEach((p: { assets?: { order_index: number }[] }) => {
      if (p.assets) p.assets.sort((a, b) => a.order_index - b.order_index)
    })
  }

  const allPieces = pieces ?? []

  // Stage 1: ALL non-cancelled (so pre-decided ones show with undo option)
  const stage1Pieces = allPieces.filter((p: { stage?: number }) => p.stage === 1)
  // Stage 2/3: only pending
  const laterPieces = allPieces.filter(
    (p: { stage?: number; status: string }) => (!p.stage || p.stage > 1) && p.status === 'pendente'
  )

  // Fetch national dates from the calendar linked to stage 1 pieces
  let calendarNationalDates: {
    date: string
    label: string
    type: 'feriado' | 'comercial'
    visible: boolean
  }[] = []

  if (stage1Pieces.length > 0) {
    const calendarId = stage1Pieces.find((p: { calendar_id?: string }) => p.calendar_id)?.calendar_id

    if (calendarId) {
      const { data: cal } = await supabase
        .from('calendars')
        .select('national_dates')
        .eq('id', calendarId)
        .single()

      if (cal?.national_dates) {
        const raw = cal.national_dates as {
          date: string
          label: string
          type: 'feriado' | 'comercial'
          visible: boolean
        }[]
        calendarNationalDates = raw.filter(nd => nd.visible)
      }
    }
  }

  return (
    <ClientFlowOrchestrator
      client={client}
      token={token}
      stage1Themes={stage1Pieces}
      calendarNationalDates={calendarNationalDates}
      laterPieces={laterPieces}
    />
  )
}
