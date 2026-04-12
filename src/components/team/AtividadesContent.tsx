'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn, formatDateTime, formatLabel, purposeLabel } from '@/lib/utils'

interface Approval {
  status: string
  step1_answers?: string[]
  step2_answers?: string[]
  step2_open?: string
  step3_text?: string
  decided_at?: string
}

interface PieceActivity {
  id: string
  title: string
  format: string
  purpose: string
  status: string
  created_at: string
  created_by_email?: string
  client?: { id: string; name: string }
  approval?: Approval
}

interface ActivityEvent {
  id: string
  type: 'upload' | 'aprovado' | 'reprovado'
  timestamp: string
  actor: string
  piece_id: string
  piece_title: string
  piece_format: string
  piece_purpose: string
  client_name: string
  approval?: Approval
}

function buildEvents(pieces: PieceActivity[]): ActivityEvent[] {
  const events: ActivityEvent[] = []

  for (const p of pieces) {
    events.push({
      id: `upload-${p.id}`,
      type: 'upload',
      timestamp: p.created_at,
      actor: p.created_by_email ? p.created_by_email.split('@')[0].replace('.', ' ') : 'Time',
      piece_id: p.id,
      piece_title: p.title,
      piece_format: p.format,
      piece_purpose: p.purpose,
      client_name: p.client?.name ?? '—',
    })

    if (p.approval && p.approval.decided_at) {
      events.push({
        id: `decision-${p.id}`,
        type: p.approval.status === 'aprovado' ? 'aprovado' : 'reprovado',
        timestamp: p.approval.decided_at,
        actor: p.client?.name ?? 'Cliente',
        piece_id: p.id,
        piece_title: p.title,
        piece_format: p.format,
        piece_purpose: p.purpose,
        client_name: p.client?.name ?? '—',
        approval: p.approval,
      })
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function AtividadesContent({ pieces }: { pieces: PieceActivity[] }) {
  const [search, setSearch] = useState('')

  const events = useMemo(() => {
    const all = buildEvents(pieces)
    if (!search.trim()) return all
    const q = search.toLowerCase()
    return all.filter(e =>
      e.piece_title.toLowerCase().includes(q) ||
      e.client_name.toLowerCase().includes(q) ||
      e.actor.toLowerCase().includes(q)
    )
  }, [pieces, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Atividades</h1>
          <p className="text-[#888888] text-sm mt-0.5">Histórico completo de uploads e aprovações</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar criativo, cliente..."
          className="bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors w-56"
        />
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-[#555555] text-sm">Nenhuma atividade encontrada</div>
      ) : (
        <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2E2E2E]">
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium w-36">Data e hora</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium w-32">Quem</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium">Ação</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium w-28">Cliente</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-[#1E1E1E] transition-colors">
                  {/* Data */}
                  <td className="px-4 py-3 text-[#555555] text-xs whitespace-nowrap">
                    {formatDateTime(event.timestamp)}
                  </td>

                  {/* Quem */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs font-medium capitalize',
                      event.type === 'upload' ? 'text-[#888888]' : 'text-[#F5F5F5]'
                    )}>
                      {event.actor}
                    </span>
                  </td>

                  {/* Ação */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {event.type === 'upload' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#555555] flex-shrink-0" />
                      )}
                      {event.type === 'aprovado' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      )}
                      {event.type === 'reprovado' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      )}
                      <span className="text-[#888888] text-xs">
                        {event.type === 'upload' && 'subiu'}
                        {event.type === 'aprovado' && 'aprovou'}
                        {event.type === 'reprovado' && 'recusou'}
                      </span>
                      <Link
                        href={`/pecas/${event.piece_id}`}
                        className="text-[#F5F5F5] hover:text-[#E8192C] transition-colors truncate max-w-[200px]"
                        title={event.piece_title}
                      >
                        {event.piece_title}
                      </Link>
                      <span className="text-[10px] text-[#555555] bg-[#2A2A2A] px-1.5 py-0.5 rounded flex-shrink-0">
                        {formatLabel(event.piece_format as 'imagem_unica' | 'carrossel' | 'video')}
                      </span>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="px-4 py-3 text-[#888888] text-xs">{event.client_name}</td>

                  {/* Detalhes reprovação — inline, à direita */}
                  <td className="px-4 py-3">
                    {event.type === 'reprovado' && event.approval && (
                      <div className="flex items-start gap-3 flex-wrap text-xs">
                        {event.approval.step1_answers && event.approval.step1_answers.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#555555]">O que:</span>
                            <span className="text-[#888888]">{event.approval.step1_answers.join(', ')}</span>
                          </div>
                        )}
                        {event.approval.step2_answers && event.approval.step2_answers.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#555555]">Detalhe:</span>
                            <span className="text-[#888888]">{event.approval.step2_answers.join(', ')}</span>
                          </div>
                        )}
                        {event.approval.step3_text && (
                          <div className="flex items-center gap-1.5 max-w-xs">
                            <span className="text-[#555555] flex-shrink-0">"</span>
                            <span className="text-[#888888] italic truncate">{event.approval.step3_text}</span>
                            <span className="text-[#555555] flex-shrink-0">"</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
