'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { cn, formatLabel, purposeLabel, formatDate } from '@/lib/utils'
import type { Client } from '@/lib/types'

interface Piece {
  id: string
  title: string
  format: string | null
  purpose: string | null
  status: string
  stage: number
  post_date: string | null
  order_index: number
  created_at: string
  created_by_email: string | null
}

interface Props {
  client: Client
  pendentes: Piece[]
  aprovadas: Piece[]
  reprovadas: Piece[]
  canceladas: Piece[]
}

function stageLabel(stage: number) {
  if (stage === 1) return 'Tema'
  if (stage === 2) return 'Copy'
  return 'Arte'
}

function stageBadge(stage: number) {
  if (stage === 1) return 'text-violet-400 bg-violet-400/10'
  if (stage === 2) return 'text-blue-400 bg-blue-400/10'
  return 'text-[#888888] bg-[#2A2A2A]'
}

export function ClientDetailContent({ client, pendentes, aprovadas, reprovadas, canceladas }: Props) {
  const [activePendentes, setActivePendentes] = useState(pendentes)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const total = pendentes.length + aprovadas.length + reprovadas.length + canceladas.length
  const approvalRate = (pendentes.length + aprovadas.length + reprovadas.length) > 0
    ? Math.round((aprovadas.length / (aprovadas.length + reprovadas.length)) * 100) || 0
    : 0

  const handleCancel = useCallback(async (pieceId: string) => {
    if (!confirm('Cancelar esta peça? Ela ficará no histórico como "Cancelada".')) return
    setCancelling(pieceId)
    try {
      const res = await fetch(`/api/pieces/${pieceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelada' }),
      })
      if (res.ok) {
        setActivePendentes(prev => prev.filter(p => p.id !== pieceId))
      }
    } finally {
      setCancelling(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/clientes" className="text-[#555555] hover:text-[#888888] text-xs transition-colors">
              ← Clientes
            </Link>
          </div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">{client.name}</h1>
          <p className="text-[#555555] text-sm mt-0.5">
            {client.status === 'ativo' ? (
              <span className="text-emerald-400">Ativo</span>
            ) : (
              <span className="text-red-400">Inativo</span>
            )}
            {' · '}Link:
            <a
              href={`/cliente/${client.magic_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888888] hover:text-[#F5F5F5] ml-1 underline underline-offset-2 transition-colors"
            >
              abrir link do cliente
            </a>
          </p>
        </div>

        <Link
          href="/pecas/nova"
          className="bg-[#E8192C] hover:bg-[#C41020] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nova peça
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pendentes" value={activePendentes.length} color="text-amber-400" />
        <StatCard label="Aprovadas" value={aprovadas.length} color="text-emerald-400" />
        <StatCard label="Reprovadas" value={reprovadas.length} color="text-red-400" />
        <StatCard label="Taxa aprovação" value={`${approvalRate}%`} color="text-[#F5F5F5]" />
      </div>

      {/* Pending pieces — backlog view */}
      <div>
        <h2 className="text-[#555555] text-xs font-medium uppercase tracking-wider mb-3">
          Tarefas em aberto ({activePendentes.length})
        </h2>

        {activePendentes.length === 0 ? (
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-6 text-center">
            <p className="text-[#555555] text-sm">Nenhuma peça pendente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activePendentes.map((piece, idx) => (
              <div
                key={piece.id}
                className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 flex items-center gap-3"
              >
                {/* Position */}
                <span className="text-[#555555] text-xs w-5 text-right flex-shrink-0">{idx + 1}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', stageBadge(piece.stage))}>
                      {stageLabel(piece.stage)}
                    </span>
                    {piece.format && (
                      <span className="text-[10px] text-[#555555]">{formatLabel(piece.format)}</span>
                    )}
                    {piece.purpose && (
                      <span className="text-[10px] text-[#555555]">{purposeLabel(piece.purpose)}</span>
                    )}
                  </div>
                  <p className="text-[#F5F5F5] text-sm font-medium truncate">{piece.title}</p>
                  {piece.post_date && (
                    <p className="text-[#555555] text-xs mt-0.5">Postagem: {formatDate(piece.post_date)}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/pecas/${piece.id}`}
                    className="text-[#555555] hover:text-[#F5F5F5] text-xs border border-[#2E2E2E] px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => handleCancel(piece.id)}
                    disabled={cancelling === piece.id}
                    className="text-[#555555] hover:text-red-400 text-xs border border-[#2E2E2E] hover:border-red-400/30 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {cancelling === piece.id ? '...' : 'Cancelar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent history */}
      {(aprovadas.length > 0 || reprovadas.length > 0) && (
        <div>
          <h2 className="text-[#555555] text-xs font-medium uppercase tracking-wider mb-3">
            Histórico recente
          </h2>
          <div className="space-y-2">
            {[...aprovadas, ...reprovadas]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10)
              .map(piece => (
                <div
                  key={piece.id}
                  className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        piece.status === 'aprovado'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : 'bg-red-400/10 text-red-400'
                      )}>
                        {piece.status === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                      </span>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', stageBadge(piece.stage))}>
                        {stageLabel(piece.stage)}
                      </span>
                    </div>
                    <p className="text-[#888888] text-sm truncate">{piece.title}</p>
                  </div>
                  <Link
                    href={`/pecas/${piece.id}`}
                    className="text-[#555555] hover:text-[#F5F5F5] text-xs border border-[#2E2E2E] px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  >
                    Ver
                  </Link>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4">
      <p className="text-[#555555] text-xs mb-1">{label}</p>
      <p className={cn('text-xl font-semibold', color)}>{value}</p>
    </div>
  )
}
