import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default async function CalendariosPage() {
  const supabase = await createServiceClient()

  const { data: calendars } = await supabase
    .from('calendars')
    .select('*, client:clients(id, name)')
    .order('month', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Calendários</h1>
          <p className="text-[#888888] text-sm mt-0.5">Etapa 1 — temas mensais por cliente</p>
        </div>
        <Link
          href="/pecas/nova"
          className="bg-[#E8192C] hover:bg-[#C41020] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo calendário
        </Link>
      </div>

      {!calendars || calendars.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#F5F5F5] text-sm font-medium">Nenhum calendário ainda</p>
          <p className="text-[#555555] text-xs mt-1">Crie uma peça Etapa 1 para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {calendars.map(cal => {
            const [year, month] = (cal.month as string).split('-').map(Number)
            const nationalDates = (cal.national_dates as { reviewed: boolean; visible: boolean }[]) ?? []
            const reviewed = nationalDates.filter(nd => nd.reviewed).length
            const total = nationalDates.length
            const isReady = cal.status === 'pronto'

            return (
              <Link
                key={cal.id}
                href={`/calendarios/${cal.id}`}
                className="bg-[#141414] border border-[#2E2E2E] hover:border-[#555555] rounded-xl p-4 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[#F5F5F5] text-sm font-medium group-hover:text-white transition-colors">
                      {MONTHS_PT[month - 1]} {year}
                    </p>
                    <p className="text-[#555555] text-xs mt-0.5">{(cal.client as { name: string })?.name ?? '—'}</p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full',
                    isReady
                      ? 'bg-emerald-400/10 text-emerald-400'
                      : 'bg-amber-400/10 text-amber-400'
                  )}>
                    {isReady ? 'Pronto' : 'Rascunho'}
                  </span>
                </div>

                {total > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#555555] text-xs">Datas revisadas</span>
                      <span className="text-[#888888] text-xs">{reviewed}/{total}</span>
                    </div>
                    <div className="h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', isReady ? 'bg-emerald-500' : 'bg-[#E8192C]')}
                        style={{ width: total > 0 ? `${(reviewed / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
