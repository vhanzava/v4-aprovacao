'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { cn, formatLabel, purposeLabel, formatDate } from '@/lib/utils'

interface BacklogPiece {
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
  client: { id: string; name: string } | null
}

interface Client {
  id: string
  name: string
  status: string
}

interface Props {
  clients: Client[]
  pieces: BacklogPiece[]
}

function stageLabel(stage: number) {
  if (stage === 1) return 'Tema'
  if (stage === 2) return 'Copy'
  return 'Arte'
}

export function BacklogContent({ clients, pieces: initialPieces }: Props) {
  const [pieces, setPieces] = useState(initialPieces)
  const [selectedClient, setSelectedClient] = useState<string>('todos')
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [moving, setMoving] = useState<string | null>(null)

  // Group by client
  const clientsWithPieces = clients
    .map(c => ({
      client: c,
      pieces: pieces.filter(p => p.client?.id === c.id),
    }))
    .filter(g => selectedClient === 'todos' ? g.pieces.length > 0 : g.client.id === selectedClient)

  const handleCancel = useCallback(async (pieceId: string) => {
    if (!confirm('Cancelar esta peça? Ela ficará no histórico com status "Cancelada".')) return
    setCancelling(pieceId)
    try {
      const res = await fetch(`/api/pieces/${pieceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelada' }),
      })
      if (res.ok) {
        setPieces(prev => prev.filter(p => p.id !== pieceId))
      }
    } finally {
      setCancelling(null)
    }
  }, [])

  const handleMove = useCallback(async (
    clientId: string,
    pieceId: string,
    direction: 'up' | 'down'
  ) => {
    const clientPieces = pieces
      .filter(p => p.client?.id === clientId)
      .sort((a, b) => a.order_index - b.order_index || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const idx = clientPieces.findIndex(p => p.id === pieceId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= clientPieces.length) return

    const pieceA = clientPieces[idx]
    const pieceB = clientPieces[swapIdx]

    setMoving(pieceId)
    try {
      await Promise.all([
        fetch(`/api/pieces/${pieceA.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: pieceB.order_index }),
        }),
        fetch(`/api/pieces/${pieceB.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: pieceA.order_index }),
        }),
      ])

      setPieces(prev => prev.map(p => {
        if (p.id === pieceA.id) return { ...p, order_index: pieceB.order_index }
        if (p.id === pieceB.id) return { ...p, order_index: pieceA.order_index }
        return p
      }))
    } finally {
      setMoving(null)
    }
  }, [pieces])

  const totalPending = pieces.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#F5F5F5]">Backlog</h1>
            {totalPending > 0 && (
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full',
                totalPending > 5 ? 'bg-[#E8192C]/15 text-[#E8192C]' : 'bg-[#2A2A2A] text-[#888888]'
              )}>
                {totalPending}
              </span>
            )}
          </div>
          <p className="text-[#888888] text-sm mt-0.5">Peças pendentes por cliente — reordene ou cancele</p>
        </div>

        {/* Client filter */}
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-[#888888] focus:outline-none focus:border-[#E8192C] transition-colors"
        >
          <option value="todos">Todos os clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {clientsWithPieces.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-[#141414] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#F5F5F5] text-sm font-medium">Backlog limpo</p>
          <p className="text-[#555555] text-xs mt-1">Nenhuma peça pendente de aprovação</p>
        </div>
      ) : (
        <div className="space-y-6">
          {clientsWithPieces.map(({ client, pieces: clientPieces }) => {
            const sorted = [...clientPieces].sort(
              (a, b) => a.order_index - b.order_index || new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )

            return (
              <div key={client.id} className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden">
                {/* Client header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E2E2E]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5F5F5] text-sm font-medium">{client.name}</span>
                    <span className="text-[10px] text-[#555555] bg-[#2A2A2A] px-1.5 py-0.5 rounded">
                      {clientPieces.length} pendente{clientPieces.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Pieces list */}
                <div className="divide-y divide-[#2E2E2E]">
                  {sorted.map((piece, idx) => (
                    <div
                      key={piece.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#1E1E1E] transition-colors"
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleMove(client.id, piece.id, 'up')}
                          disabled={idx === 0 || moving === piece.id}
                          className="p-1 rounded text-[#555555] hover:text-[#F5F5F5] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Mover para cima"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMove(client.id, piece.id, 'down')}
                          disabled={idx === sorted.length - 1 || moving === piece.id}
                          className="p-1 rounded text-[#555555] hover:text-[#F5F5F5] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Mover para baixo"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Position */}
                      <span className="text-[#555555] text-xs w-4 text-center flex-shrink-0">{idx + 1}</span>

                      {/* Piece info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/pecas/${piece.id}`}
                            className="text-[#F5F5F5] text-sm hover:text-[#E8192C] transition-colors truncate"
                          >
                            {piece.title}
                          </Link>
                          <span className="text-[10px] text-[#555555] bg-[#2A2A2A] px-1.5 py-0.5 rounded flex-shrink-0">
                            Etapa {piece.stage} — {stageLabel(piece.stage)}
                          </span>
                          {piece.format && (
                            <span className="text-[10px] text-[#555555] bg-[#2A2A2A] px-1.5 py-0.5 rounded flex-shrink-0">
                              {formatLabel(piece.format)}
                            </span>
                          )}
                          {piece.purpose && (
                            <span className="text-[10px] text-[#555555] bg-[#2A2A2A] px-1.5 py-0.5 rounded flex-shrink-0">
                              {purposeLabel(piece.purpose as 'postagem' | 'anuncio')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {piece.post_date && (
                            <span className="text-[#555555] text-xs">
                              Publicar: {formatDate(piece.post_date)}
                            </span>
                          )}
                          <span className="text-[#555555] text-xs">
                            Criado: {formatDate(piece.created_at)}
                          </span>
                          {piece.created_by_email && (
                            <span className="text-[#555555] text-xs capitalize">
                              por {piece.created_by_email.split('@')[0].replace('.', ' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cancel button */}
                      <button
                        onClick={() => handleCancel(piece.id)}
                        disabled={cancelling === piece.id}
                        className="flex-shrink-0 text-xs text-[#555555] hover:text-red-400 disabled:opacity-40 transition-colors px-2 py-1 rounded border border-transparent hover:border-red-400/20"
                        title="Cancelar peça"
                      >
                        {cancelling === piece.id ? '...' : 'Cancelar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
