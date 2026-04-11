import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { canCreatePieces } from '@/lib/auth/roles'
import { createServiceClient } from '@/lib/supabase/server'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { NovaPecaForm } from '@/components/team/NovaPecaForm'

export default async function NovaPecaPage() {
  const session = await getSession()
  if (!session || !canCreatePieces(session.role)) redirect('/dashboard')

  const supabase = await createServiceClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('status', 'ativo')
    .order('name')

  return (
    <TeamLayout role={session.role} email={session.email}>
      <NovaPecaForm clients={clients ?? []} />
    </TeamLayout>
  )
}
