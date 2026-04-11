import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleFromEmail } from '@/lib/auth/roles'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { DashboardContent } from '@/components/team/DashboardContent'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const email = user.email ?? ''
  const role = getRoleFromEmail(email)
  if (!role) redirect('/login')

  // Fetch pieces with client and approval data
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, client:clients(id, name, status), approval:approvals(*)')
    .order('created_at', { ascending: false })

  // Fetch clients for filter
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, status')
    .order('name')

  return (
    <TeamLayout role={role} email={email}>
      <DashboardContent
        pieces={pieces ?? []}
        clients={clients ?? []}
        role={role}
      />
    </TeamLayout>
  )
}
