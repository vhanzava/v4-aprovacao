import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/components/team/DashboardContent'

export default async function DashboardPage() {
  const session = await getSession()
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

  return (
    <DashboardContent
      pieces={piecesRes.data ?? []}
      clients={clientsRes.data ?? []}
      role={session!.role}
      currentUserEmail={session!.email}
    />
  )
}
