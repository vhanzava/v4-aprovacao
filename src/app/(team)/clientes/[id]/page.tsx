import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { ClientDetailContent } from '@/components/team/ClientDetailContent'

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // All pieces for this client (pending + approved + reproved), ordered by stage + created_at
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, approval:approvals(*)')
    .eq('client_id', id)
    .order('stage', { ascending: true })
    .order('created_at', { ascending: true })

  // Stats
  const allPieces = pieces ?? []
  const pendentes = allPieces.filter(p => p.status === 'pendente')
  const aprovadas = allPieces.filter(p => p.status === 'aprovado')
  const reprovadas = allPieces.filter(p => p.status === 'reprovado')
  const canceladas = allPieces.filter(p => p.status === 'cancelada')

  return (
    <ClientDetailContent
      client={client}
      pendentes={pendentes}
      aprovadas={aprovadas}
      reprovadas={reprovadas}
      canceladas={canceladas}
    />
  )
}
