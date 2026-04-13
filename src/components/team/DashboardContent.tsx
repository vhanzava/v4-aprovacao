'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { cn, formatDate, formatLabel, purposeLabel, statusLabel, statusColor, formatDuration } from '@/lib/utils'
import type { Piece, Client, Role } from '@/lib/types'

interface Props {
  pieces: Piece[]
  clients: Pick<Client, 'id' | 'name' | 'status'>[]
  role: Role
  currentUserEmail: string
}

type FilterStatus = 'todos' | 'pendente' | 'aprovado' | 'reprovado'
type FilterPeriod = '7d' | '30d' | '90d' | 'todos'

function filterByPeriod(pieces: Piece[], period: FilterPeriod): Piece[] {
  if (period === 'todos') return pieces
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return pieces.filter(p => new Date(p.created_at) >= cutoff)
}

function avgResponseMinutes(pieces: Piece[]): number | null {
  const decided = pieces.filter(p => p.approval && (p.approval as { decided_at?: string }).decided_at)
  if (!decided.length) return null
  const total = decided.reduce((sum, p) => {
    const created = new Date(p.created_at).getTime()
    const decided_at = new Date((p.approval as { decided_at: string }).decided_at).getTime()
    return sum + (decided_at - created) / (1000 * 60)
  }, 0)
  return Math.round(total / decided.length)
}

export function DashboardContent({ pieces, clients, role, currentUserEmail }: Props) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('todos')
  const [clientFilter, setClientFilter] = useState<string>('todos')
  const [periodFilter, setPeriodFilter] = useState<FilterPeriod>('30d')

  const periodPieces = useMemo(() => filterByPeriod(pieces, periodFilter), [pieces, periodFilter])

  const filtered = useMemo(() => periodPieces.filter(p => {
    if (statusFilter !== 'todos' && p.status !== statusFilter) return false
    if (clientFilter !== 'todos' && p.client_id !== clientFilter) return false
    return true
  }), [periodPieces, statusFilter, clientFilter])

  // Stats over period
  const total = periodPieces.length
  const pendentes = periodPieces.filter(p => p.status === 'pendente').length
  const aprovados = periodPieces.filter(p => p.status === 'aprovado').length
  const reprovados = periodPieces.filter(p => p.status === 'reprovado').length
  const decided = aprovados + reprovados
  const approvalRate = decided > 0 ? Math.round((aprovados / decided) * 100) : null
  const avgMinutes = avgResponseMinutes(periodPieces)

  // Per-client stats
  const clientStats = useMemo(() => {
    return clients
      .filter(c => c.status === 'ativo')
      .map(c => {
        const cp = periodPieces.filter(p => p.client_id === c.id)
        const cp_pending = cp.filter(p => p.status === 'pendente').length
        const cp_approved = cp.filter(p => p.status === 'aprovado').length
        const cp_reproved = cp.filter(p => p.status === 'reprovado').length
        const cp_decided = cp_approved + cp_reproved
        const rate = cp_decided > 0 ? Math.round((cp_approved / cp_decided) * 100) : null
        return { client: c, total: cp.length, pending: cp_pending, approved: cp_approved, reproved: cp_reproved, rate }
      })
      .filter(s => s.total > 0)
      .sort((a, b) => b.pending - a.pending || b.total - a.total)
  }, [clients, periodPieces])

  // Most common reproval reasons
  const reprovacaoReasons = useMemo(() => {
    const counts: Record<string, number> = {}
    periodPieces
      .filter(p => p.status === 'reprovado' && p.approval)
      .forEach(p => {
        const a = p.approval as { step1_answers?: string[] }
        a.step1_answers?.forEach(r => { counts[r] = (counts[r] ?? 0) + 1 })
      })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [periodPieces])

  const periodOptions: { value: FilterPeriod; label: string }[] = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: 'todos', label: 'Tudo' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Dashboard</h1>
          <p className="text-[#888888] text-sm mt-0.5">Visão geral das aprovações</p>
        </div>
        <div className="flex items-center gap-2">
          {periodOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setPeriodFilter(o.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                periodFilter === o.value
                  ? 'bg-[#E8192C] text-white'
                  : 'bg-[#1E1E1E] text-[#888888] hover:text-[#F5F5F5]'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total de peças" value={total} />
        <KpiCard label="Pendentes" value={pendentes} color="text-amber-400" alert={pendentes > 5} />
        <KpiCard
          label="Taxa de aprovação"
          value={approvalRate !== null ? `${approvalRate}%` : '—'}
          color={approvalRate !== null ? (approvalRate >= 70 ? 'text-emerald-400' : approvalRate >= 40 ? 'text-amber-400' : 'text-red-400') : undefined}
          sub={decided > 0 ? `${aprovados} de ${decided} decididas` : 'Sem decisões ainda'}
        />
        <KpiCard
          label="Tempo médio de resposta"
          value={avgMinutes !== null ? formatDuration(avgMinutes) : '—'}
          color={avgMinutes !== null ? (avgMinutes <= 1440 ? 'text-emerald-400' : avgMinutes <= 2880 ? 'text-amber-400' : 'text-red-400') : undefined}
          sub="do envio à decisão"
        />
      </div>

      {/* Approval rate bar */}
      {approvalRate !== null && (
        <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#888888] text-sm">Aprovados × Reprovados</span>
            <span className="text-[#F5F5F5] text-sm font-medium">{aprovados} × {reprovados}</span>
          </div>
          <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${approvalRate}%` }} />
            <div className="h-full bg-red-500/60 transition-all" style={{ width: `${100 - approvalRate}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-emerald-400 text-xs">{approvalRate}% aprovação</span>
            <span className="text-red-400 text-xs">{100 - approvalRate}% reprovação</span>
          </div>
        </div>
      )}

      {/* Per-client stats */}
      {clientStats.length > 0 && (
        <section>
          <h2 className="text-[#888888] text-xs font-medium uppercase tracking-wider mb-3">Por cliente</h2>
          <div className="space-y-2">
            {clientStats.map(s => (
              <div key={s.client.id} className="bg-[#141414] border border-[#2E2E2E] rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[#F5F5F5] text-sm font-medium truncate">{s.client.name}</p>
                    {s.pending > 0 && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {s.pending} pendente{s.pending > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[#555555] text-xs">{s.total} peça{s.total > 1 ? 's' : ''}</span>
                    {s.approved > 0 && <span className="text-emerald-400 text-xs">{s.approved} aprovada{s.approved > 1 ? 's' : ''}</span>}
                    {s.reproved > 0 && <span className="text-red-400 text-xs">{s.reproved} reprovada{s.reproved > 1 ? 's' : ''}</span>}
                  </div>
                </div>
                {s.rate !== null && (
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'text-sm font-semibold',
                      s.rate >= 70 ? 'text-emerald-400' : s.rate >= 40 ? 'text-amber-400' : 'text-red-400'
                    )}>
                      {s.rate}%
                    </p>
                    <p className="text-[#555555] text-xs">aprovação</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top reproval reasons */}
      {reprovacaoReasons.length > 0 && (
        <section>
          <h2 className="text-[#888888] text-xs font-medium uppercase tracking-wider mb-3">Motivos de reprovação mais frequentes</h2>
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl divide-y divide-[#2E2E2E]">
            {reprovacaoReasons.map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between px-4 py-3">
                <span className="text-[#888888] text-sm">{reason}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E8192C] rounded-full"
                      style={{ width: `${(count / reprovacaoReasons[0][1]) * 100}%` }}
                    />
                  </div>
                  <span className="text-[#F5F5F5] text-sm font-medium w-4 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pieces list with filters */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-[#888888] text-xs font-medium uppercase tracking-wider">Peças</h2>
          <div className="flex gap-2 flex-wrap items-center">
            {(['todos', 'pendente', 'aprovado', 'reprovado'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s ? 'bg-[#E8192C] text-white' : 'bg-[#1E1E1E] text-[#888888] hover:text-[#F5F5F5]'
                )}
              >
                {s === 'todos' ? 'Todos' : statusLabel(s)}
                <span className="ml-1 opacity-60">
                  {s === 'todos' ? periodPieces.length
                    : s === 'pendente' ? pendentes
                    : s === 'aprovado' ? aprovados
                    : reprovados}
                </span>
              </button>
            ))}
            <select
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="bg-[#1E1E1E] border border-[#2E2E2E] text-[#888888] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#E8192C]"
            >
              <option value="todos">Todos os clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#555555] text-sm">Nenhuma peça encontrada</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(piece => <PieceRow key={piece.id} piece={piece} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function KpiCard({ label, value, color, sub, alert }: {
  label: string
  value: string | number
  color?: string
  sub?: string
  alert?: boolean
}) {
  return (
    <div className={cn(
      'bg-[#141414] border rounded-xl p-4',
      alert ? 'border-amber-400/30' : 'border-[#2E2E2E]'
    )}>
      <p className="text-[#888888] text-xs mb-1 leading-snug">{label}</p>
      <p className={cn('text-2xl font-bold', color ?? 'text-[#F5F5F5]')}>{value}</p>
      {sub && <p className="text-[#555555] text-xs mt-1">{sub}</p>}
    </div>
  )
}

function PieceRow({ piece }: { piece: Piece }) {
  return (
    <Link
      href={`/pecas/${piece.id}`}
      className="flex items-center gap-4 bg-[#141414] hover:bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl p-4 transition-colors"
    >
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
            <span className="text-[10px] text-[#888888] bg-[#2A2A2A] px-1.5 py-0.5 rounded">{formatLabel(piece.format)}</span>
            <span className="text-[10px] text-[#888888] bg-[#2A2A2A] px-1.5 py-0.5 rounded">{purposeLabel(piece.purpose)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <p className="text-[#555555] text-xs">{piece.client?.name ?? '—'}</p>
          {piece.post_date && <p className="text-[#555555] text-xs">Postagem: {formatDate(piece.post_date)}</p>}
          <p className="text-[#555555] text-xs">{formatDate(piece.created_at)}</p>
        </div>
        {piece.status === 'reprovado' && (piece.approval as { step3_text?: string })?.step3_text && (
          <p className="text-[#888888] text-xs mt-1.5 truncate italic">
            "{(piece.approval as { step3_text: string }).step3_text}"
          </p>
        )}
      </div>
      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0', statusColor(piece.status))}>
        {statusLabel(piece.status)}
      </span>
    </Link>
  )
}
