import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { TeamLayout } from '@/components/layout/TeamLayout'
import { PendentesContent } from '@/components/team/PendentesContent'

export default async function PendentesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()

  const { data: pieces } = await supabase
    .from('pieces')
    .select('id, title, format, purpose, post_date, created_at, created_by_email, client:clients(id, name)')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  return (
    <TeamLayout role={session.role} email={session.email} pendingCount={pieces?.length ?? 0}>
      <PendentesContent pieces={pieces ?? []} />
    </TeamLayout>
  )
}
