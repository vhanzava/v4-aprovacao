import { createServiceClient } from '@/lib/supabase/server'
import { PendentesContent } from '@/components/team/PendentesContent'

export default async function PendentesPage() {
  const supabase = await createServiceClient()

  const { data: pieces } = await supabase
    .from('pieces')
    .select('id, title, format, purpose, post_date, created_at, created_by_email, client:clients(id, name)')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PendentesContent pieces={(pieces ?? []) as any} />
}
