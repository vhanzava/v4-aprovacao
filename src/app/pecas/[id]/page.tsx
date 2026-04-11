import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { PecaDetail } from '@/components/team/PecaDetail'

export default async function PecaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')

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

  return (
    <TeamLayout role={session.role} email={session.email}>
      <PecaDetail piece={piece} role={session.role} />
    </TeamLayout>
  )
}
