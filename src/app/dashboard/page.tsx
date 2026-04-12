import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { DashboardContent } from '@/components/team/DashboardContent'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const [piecesRes, clientsRes] = await Promise.all([
    supabase
      .from('pieces')
      .select('*, client:clients(id, name, status), approval:approvals(*)')
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name, status')
      .order('name'),
  ])

  const pendingCount = (piecesRes.data ?? []).filter(p => p.status === 'pendente').length

  return (
    <TeamLayout role={session.role} email={session.email} pendingCount={pendingCount}>
      <DashboardContent
        pieces={piecesRes.data ?? []}
        clients={clientsRes.data ?? []}
        role={session.role}
        currentUserEmail={session.email}
      />
    </TeamLayout>
  )
}
