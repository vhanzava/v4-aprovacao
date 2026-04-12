import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { AtividadesContent } from '@/components/team/AtividadesContent'

export default async function AtividadesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const [piecesRes, pendingRes] = await Promise.all([
    supabase
      .from('pieces')
      .select('id, title, format, purpose, status, created_at, created_by_email, client:clients(id, name), approval:approvals(*)')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('pieces').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
  ])

  return (
    <TeamLayout role={session.role} email={session.email} pendingCount={pendingRes.count ?? 0}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AtividadesContent pieces={(piecesRes.data ?? []) as any} />
    </TeamLayout>
  )
}
