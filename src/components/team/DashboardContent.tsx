'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatDate, formatLabel, purposeLabel, statusLabel, statusColor } from '@/lib/utils'
import type { Piece, Client, Role } from '@/lib/types'

interface Props {
  pieces: Piece[]
  clients: Pick<Client, 'id' | 'name' | 'status'>[]
  role: Role
}

type FilterStatus = 'todos' | 'pendente' | 'aprovado' | 'reprovado'

export function DashboardContent({ pieces, clients, role }: Props) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('todos')
  const [clientFilter, setClientFilter] = useState<string>('todos')

  const filtered = pieces.filter(p => {
    if (statusFilter !== 'todos' && p.status !== statusFilter) return false
    if (clientFilter !== 'todos' && p.client_id !== clientFilter) return false
    return true
  })

  const counts = {
    todos: pieces.length,
    pendente: pieces.filter(p => p.status === 'pendente').length,
    aprovado: pieces.filter(p => p.status === 'aprovado').length,
    reprovado: pieces.filter(p => p.status === 'reprovado').length,
  }

  const approvalRate = pieces.length > 0
    ? Math.round((counts.aprovado / (counts.aprovado + counts.reprovado || 1)) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Dashboard</h1>
          <p className="text-[#888888] text-sm mt-0.5">Acompanhe o status das aprovações</p>
        </div>
        <Link
          href="/pecas/nova"
          className="flex items-center gap-2 bg-[#E8192C] hover:bg-[#C41020] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova peça
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.todos, color: 'text-[#F5F5F5]' },
          { label: 'Pendentes', value: counts.pendente, color: 'text-amber-400' },
          { label: 'Aprovados', value: counts.aprovado, color: 'text-emerald-400' },
          { label: 'Reprovados', value: counts.reprovado, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4">
            <p className="text-[#888888] text-xs mb-1">{stat.label}</p>
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Approval rate */}
      {(counts.aprovado + counts.reprovado) > 0 && (
        <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#888888] text-sm">Taxa de aprovação</span>
            <span className="text-[#F5F5F5] font-semibold">{approvalRate}%</span>
          </div>
          <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(['todos', 'pendente', 'aprovado', 'reprovado'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                statusFilter === s
                  ? 'bg-[#E8192C] text-white'
                  : 'bg-[#1E1E1E] text-[#888888] hover:text-[#F5F5F5]'
              )}
            >
              {s === 'todos' ? 'Todos' : statusLabel(s)}
              <span className="ml-1.5 opacity-60">
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        {/* Client filter */}
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="bg-[#1E1E1E] border border-[#2E2E2E] text-[#888888] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#E8192C] sm:ml-auto"
        >
          <option value="todos">Todos os clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Pieces list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#555555]">
          <p className="text-sm">Nenhuma peça encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(piece => (
            <PieceRow key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </div>
  )
}

function PieceRow({ piece }: { piece: Piece }) {
  return (
    <Link
      href={`/pecas/${piece.id}`}
      className="flex items-center gap-4 bg-[#141414] hover:bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl p-4 transition-colors group"
    >
      {/* Status dot */}
      <div className={cn(
        'w-2 h-2 rounded-full flex-shrink-0',
        piece.status === 'pendente' && 'bg-amber-400',
        piece.status === 'aprovado' && 'bg-emerald-400',
        piece.status === 'reprovado' && 'bg-red-400',
      )} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="text-[#F5F5F5] text-sm font-medium truncate">{piece.title}</p>
          <div className="flex gap-1.5">
            <span className="text-[10px] text-[#888888] bg-[#2A2A2A] px-1.5 py-0.5 rounded">
              {formatLabel(piece.format)}
            </span>
            <span className="text-[10px] text-[#888888] bg-[#2A2A2A] px-1.5 py-0.5 rounded">
              {purposeLabel(piece.purpose)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-[#555555] text-xs">{piece.client?.name ?? '—'}</p>
          {piece.post_date && (
            <p className="text-[#555555] text-xs">Postagem: {formatDate(piece.post_date)}</p>
          )}
          <p className="text-[#555555] text-xs">{formatDate(piece.created_at)}</p>
        </div>
        {piece.status === 'reprovado' && piece.approval?.step3_text && (
          <p className="text-[#888888] text-xs mt-1.5 truncate italic">
            "{piece.approval.step3_text}"
          </p>
        )}
      </div>

      <span className={cn(
        'text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0',
        statusColor(piece.status)
      )}>
        {statusLabel(piece.status)}
      </span>
    </Link>
  )
}
