import { createServiceClient } from '@/lib/supabase/server'
import { BacklogContent } from '@/components/team/BacklogContent'

export default async function BacklogPage() {
  const supabase = await createServiceClient()

  const [clientsRes, piecesRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, status')
      .eq('status', 'ativo')
      .order('name'),
    supabase
      .from('pieces')
      .select('id, title, format, purpose, status, stage, post_date, order_index, created_at, created_by_email, client:clients(id, name)')
      .in('status', ['pendente'])
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <BacklogContent clients={clientsRes.data ?? []} pieces={(piecesRes.data ?? []) as any} />
}
