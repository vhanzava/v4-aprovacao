import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { TeamLayout } from '@/components/layout/TeamLayout'

export default async function TeamGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createServiceClient()
  const { count } = await supabase
    .from('pieces')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pendente')

  return (
    <TeamLayout role={session.role} email={session.email} pendingCount={count ?? 0}>
      {children}
    </TeamLayout>
  )
}
