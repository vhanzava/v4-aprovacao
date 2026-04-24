'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn, formatDateTime, formatLabel } from '@/lib/utils'
import type { Role } from '@/lib/types'

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
  client_id: string
  client_name: string
  approval?: Approval
}

type DateFilter = 'hoje' | '7d' | '30d' | 'todos'

function buildEvents(pieces: PieceActivity[]): ActivityEvent[] {
  const events: ActivityEvent[] = []

  for (const p of pieces) {
    events.push({
      id: `upload-${p.id}`,
      type: 'upload',
      timestamp: p.created_at,
      actor: p.created_by_email
        ? p.created_by_email.split('@')[0].replace('.', ' ')
        : 'Time',
      piece_id: p.id,
      piece_title: p.title,
      piece_format: p.format,
      piece_purpose: p.purpose,
      client_id: p.client?.id ?? '',
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
        client_id: p.client?.id ?? '',
        client_name: p.client?.name ?? '—',
        approval: p.approval,
      })
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function filterByDate(events: ActivityEvent[], filter: DateFilter): ActivityEvent[] {
  if (filter === 'todos') return events
  const now = new Date()
  const cutoff = new Date()
  if (filter === 'hoje') {
    cutoff.setHours(0, 0, 0, 0)
  } else {
    const days = filter === '7d' ? 7 : 30
    cutoff.setDate(now.getDate() - days)
  }
  return events.filter(e => new Date(e.timestamp) >= cutoff)
}

export function AtividadesContent({
  pieces: initialPieces,
  role,
}: {
  pieces: PieceActivity[]
  role: Role | null
}) {
  const [pieces, setPieces] = useState(initialPieces)
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('todos')
  const [dateFilter, setDateFilter] = useState<DateFilter>('todos')
  // confirmingDelete: piece_id being confirmed
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const isAdmin = role === 'admin'

  // Unique clients from pieces
  const clients = useMemo(() => {
    const seen = new Map<string, string>()
    pieces.forEach(p => {
      if (p.client?.id) seen.set(p.client.id, p.client.name)
    })
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [pieces])

  const allEvents = useMemo(() => buildEvents(pieces), [pieces])

  const events = useMemo(() => {
    let result = filterByDate(allEvents, dateFilter)

    if (clientFilter !== 'todos') {
      result = result.filter(e => e.client_id === clientFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.piece_title.toLowerCase().includes(q) ||
        e.client_name.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q)
      )
    }

    return result
  }, [allEvents, dateFilter, clientFilter, search])

  const dateOptions: { value: DateFilter; label: string }[] = [
    { value: 'hoje', label: 'Hoje' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: 'todos', label: 'Tudo' },
  ]

  async function handleDelete(pieceId: string) {
    if (deleting) return
    setDeleting(pieceId)
    setConfirmingDelete(null)

    const res = await fetch(`/api/pieces/${pieceId}`, { method: 'DELETE' })

    if (res.ok) {
      setPieces(prev => prev.filter(p => p.id !== pieceId))
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Atividades</h1>
          <p className="text-[#888888] text-sm mt-0.5">Histórico completo de uploads e aprovações</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar criativo, cliente..."
          className="bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors w-52"
        />

        {/* Client filter */}
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-[#888888] focus:outline-none focus:border-[#E8192C] transition-colors"
        >
          <option value="todos">Todos os clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Date filter */}
        <div className="flex items-center gap-1">
          {dateOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setDateFilter(o.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                dateFilter === o.value
                  ? 'bg-[#E8192C] text-white'
                  : 'bg-[#1E1E1E] text-[#888888] hover:text-[#F5F5F5]'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <span className="text-[#555555] text-xs ml-auto">
          {events.length} evento{events.length !== 1 ? 's' : ''}
        </span>
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
                {isAdmin && <th className="w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {events.map(event => {
                const isUpload = event.type === 'upload'
                const isBeingDeleted = deleting === event.piece_id
                const isConfirming = confirmingDelete === event.piece_id

                return (
                  <tr
                    key={event.id}
                    className={cn(
                      'transition-colors',
                      isBeingDeleted ? 'opacity-40' : 'hover:bg-[#1E1E1E]'
                    )}
                  >
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
                        {event.piece_format && (
                          <span className="text-[10px] text-[#555555] bg-[#2A2A2A] px-1.5 py-0.5 rounded flex-shrink-0">
                            {formatLabel(event.piece_format)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3 text-[#888888] text-xs">{event.client_name}</td>

                    {/* Detalhes reprovação */}
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

                    {/* Delete — admin only, only on upload rows (one button per piece) */}
                    {isAdmin && (
                      <td className="px-2 py-3">
                        {isUpload && (
                          isConfirming ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(event.piece_id)}
                                disabled={!!deleting}
                                className="text-[10px] font-medium text-red-400 hover:text-red-300 bg-red-400/10 border border-red-400/20 px-2 py-1 rounded transition-colors whitespace-nowrap disabled:opacity-40"
                              >
                                {isBeingDeleted ? '...' : 'Confirmar'}
                              </button>
                              <button
                                onClick={() => setConfirmingDelete(null)}
                                className="text-[#555555] hover:text-[#888888] text-[10px] transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmingDelete(event.piece_id)}
                              disabled={!!deleting}
                              title="Apagar peça"
                              className="text-[#2E2E2E] hover:text-red-400 transition-colors disabled:opacity-40"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
