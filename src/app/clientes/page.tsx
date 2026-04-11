import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleFromEmail } from '@/lib/auth/roles'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { ClientesContent } from '@/components/team/ClientesContent'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const email = user.email ?? ''
  const role = getRoleFromEmail(email)
  if (!role) redirect('/login')

  const { data: clients } = await supabase
    .from('clients')
    .select('*, pieces(id, status)')
    .order('name')

  return (
    <TeamLayout role={role} email={email}>
      <ClientesContent clients={clients ?? []} role={role} />
    </TeamLayout>
  )
}
