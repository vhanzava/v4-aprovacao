import { notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { PecaDetail } from '@/components/team/PecaDetail'

export default async function PecaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const supabase = await createServiceClient()

  const { data: piece } = await supabase
    .from('pieces')
    .select('*, client:clients(*), assets:piece_assets(*), approval:approvals(*)')
    .eq('id', id)
    .single()

  if (!piece) notFound()

  if (piece.assets) {
    piece.assets.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
  }

  return <PecaDetail piece={piece} role={session!.role} />
}
