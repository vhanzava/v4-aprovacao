'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatLabel, purposeLabel } from '@/lib/utils'

interface PendingPiece {
  id: string
  title: string
  format: string
  purpose: string
  post_date?: string | null
  created_at: string
  created_by_email?: string | null
  client?: { id: string; name: string } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function daysWaiting(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Hoje'
  if (d === 1) return '1 dia'
  return `${d} dias`
}

export function PendentesContent({ pieces }: { pieces: PendingPiece[] }) {
  const [search, setSearch] = useState('')

  const filtered = pieces.filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      (p.client?.name ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#F5F5F5]">Pendentes</h1>
            {pieces.length > 0 && (
              <span className={cn(
                'text-xs font-bold px-2 py-0.5 rounded-full',
                pieces.length > 5
                  ? 'bg-[#E8192C]/15 text-[#E8192C]'
                  : 'bg-[#2A2A2A] text-[#888888]'
              )}>
                {pieces.length}
              </span>
            )}
          </div>
          <p className="text-[#888888] text-sm mt-0.5">Peças aguardando aprovação do cliente</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar criativo, cliente..."
          className="bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors w-56"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          {pieces.length === 0 ? (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#141414] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[#F5F5F5] text-sm font-medium">Nenhuma peça pendente</p>
              <p className="text-[#555555] text-xs">Todos os criativos foram revisados</p>
            </div>
          ) : (
            <p className="text-[#555555] text-sm">Nenhuma peça encontrada para "{search}"</p>
          )}
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2E2E2E]">
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium">Criativo</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium w-28">Cliente</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium w-24">Formato</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium w-24">Publicar em</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium w-24">Aguardando</th>
                <th className="text-left px-4 py-3 text-[#555555] text-xs font-medium w-32">Enviado por</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E]">
              {filtered.map(piece => {
                const waiting = Math.floor((Date.now() - new Date(piece.created_at).getTime()) / 86400000)
                const urgent = waiting >= 2

                return (
                  <tr key={piece.id} className="hover:bg-[#1E1E1E] transition-colors">
                    {/* Criativo */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/pecas/${piece.id}`}
                        className="text-[#F5F5F5] hover:text-[#E8192C] transition-colors font-medium truncate max-w-[240px] block"
                        title={piece.title}
                      >
                        {piece.title}
                      </Link>
                      <span className="text-[#555555] text-xs">{purposeLabel(piece.purpose as 'postagem' | 'anuncio')}</span>
                    </td>

                    {/* Cliente */}
                    <td className="px-4 py-3 text-[#888888] text-xs">
                      {piece.client?.name ?? '—'}
                    </td>

                    {/* Formato */}
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-[#555555] bg-[#2A2A2A] px-1.5 py-0.5 rounded">
                        {formatLabel(piece.format as 'imagem_unica' | 'carrossel' | 'video')}
                      </span>
                    </td>

                    {/* Publicar em */}
                    <td className="px-4 py-3 text-[#888888] text-xs whitespace-nowrap">
                      {piece.post_date ? formatDate(piece.post_date) : '—'}
                    </td>

                    {/* Aguardando */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs font-medium',
                        urgent ? 'text-[#E8192C]' : 'text-[#555555]'
                      )}>
                        {daysWaiting(piece.created_at)}
                      </span>
                    </td>

                    {/* Enviado por */}
                    <td className="px-4 py-3 text-[#555555] text-xs">
                      {piece.created_by_email
                        ? piece.created_by_email.split('@')[0].replace('.', ' ')
                        : '—'}
                    </td>

                    {/* Link */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/pecas/${piece.id}`}
                        className="text-[#555555] hover:text-[#F5F5F5] transition-colors"
                        title="Ver peça"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
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
