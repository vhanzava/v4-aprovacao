import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { ClientesContent } from '@/components/team/ClientesContent'

export default async function ClientesPage() {
  const session = await getSession()
  const supabase = await createServiceClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*, pieces(id, status)')
    .order('name')

  return <ClientesContent clients={clients ?? []} role={session!.role} />
}
