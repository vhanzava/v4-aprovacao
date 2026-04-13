import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ClientFlowOrchestrator } from '@/components/client/ClientFlowOrchestrator'

export default async function ClientePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServiceClient()

  // Validate token and get client
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, status')
    .eq('magic_token', token)
    .single()

  if (!client || client.status === 'inativo') notFound()

  // Get all pending pieces ordered by stage ASC, then created_at ASC
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, assets:piece_assets(*), approval:approvals(*)')
    .eq('client_id', client.id)
    .eq('status', 'pendente')
    .order('stage', { ascending: true })
    .order('created_at', { ascending: true })

  if (pieces) {
    pieces.forEach((p: { assets?: { order_index: number }[] }) => {
      if (p.assets) p.assets.sort((a, b) => a.order_index - b.order_index)
    })
  }

  const allPieces = pieces ?? []

  // Split stage 1 from the rest
  const stage1Pieces = allPieces.filter((p: { stage?: number }) => p.stage === 1)
  const laterPieces = allPieces.filter((p: { stage?: number }) => !p.stage || p.stage > 1)

  // Fetch national dates from the calendar linked to stage 1 pieces
  let calendarNationalDates: {
    date: string
    label: string
    type: 'feriado' | 'comercial'
    visible: boolean
  }[] = []

  if (stage1Pieces.length > 0) {
    // Find first calendar_id from stage 1 pieces
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
        // Only pass dates that are visible to the client
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
