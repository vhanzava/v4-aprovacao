import { createServiceClient } from '@/lib/supabase/server'
import { AtividadesContent } from '@/components/team/AtividadesContent'

export default async function AtividadesPage() {
  const supabase = await createServiceClient()

  const { data: pieces } = await supabase
    .from('pieces')
    .select('id, title, format, purpose, status, created_at, created_by_email, client:clients(id, name), approval:approvals(*)')
    .order('created_at', { ascending: false })
    .limit(200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AtividadesContent pieces={(pieces ?? []) as any} />
}
