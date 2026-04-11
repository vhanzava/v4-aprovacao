import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { ClientesContent } from '@/components/team/ClientesContent'

export default async function ClientesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*, pieces(id, status)')
    .order('name')

  return (
    <TeamLayout role={session.role} email={session.email}>
      <ClientesContent clients={clients ?? []} role={session.role} />
    </TeamLayout>
  )
}
