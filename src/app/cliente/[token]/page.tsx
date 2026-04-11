import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ClientApprovalFlow } from '@/components/client/ClientApprovalFlow'

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

  // Get pending pieces for this client
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, assets:piece_assets(*), approval:approvals(*)')
    .eq('client_id', client.id)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  if (pieces) {
    pieces.forEach((p: { assets?: { order_index: number }[] }) => {
      if (p.assets) p.assets.sort((a, b) => a.order_index - b.order_index)
    })
  }

  const pendingPieces = pieces ?? []

  return (
    <ClientApprovalFlow
      client={client}
      pieces={pendingPieces}
      token={token}
    />
  )
}
