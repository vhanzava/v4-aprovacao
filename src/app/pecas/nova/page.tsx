import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleFromEmail, canCreatePieces } from '@/lib/auth/roles'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { NovaPecaForm } from '@/components/team/NovaPecaForm'

export default async function NovaPecaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const email = user.email ?? ''
  const role = getRoleFromEmail(email)
  if (!role || !canCreatePieces(role)) redirect('/dashboard')

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('status', 'ativo')
    .order('name')

  return (
    <TeamLayout role={role} email={email}>
      <NovaPecaForm clients={clients ?? []} />
    </TeamLayout>
  )
}
