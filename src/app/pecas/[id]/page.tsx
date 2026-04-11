import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleFromEmail } from '@/lib/auth/roles'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { PecaDetail } from '@/components/team/PecaDetail'

export default async function PecaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const email = user.email ?? ''
  const role = getRoleFromEmail(email)
  if (!role) redirect('/login')

  const { data: piece } = await supabase
    .from('pieces')
    .select('*, client:clients(*), assets:piece_assets(*), approval:approvals(*)')
    .eq('id', id)
    .single()

  if (!piece) notFound()

  // Sort assets by order_index
  if (piece.assets) {
    piece.assets.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
  }

  return (
    <TeamLayout role={role} email={email}>
      <PecaDetail piece={piece} role={role} />
    </TeamLayout>
  )
}
