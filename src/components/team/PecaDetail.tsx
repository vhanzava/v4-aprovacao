'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn, formatDate, formatLabel, purposeLabel, statusLabel, statusColor } from '@/lib/utils'
import type { Piece, Role } from '@/lib/types'

interface Props {
  piece: Piece
  role: Role
}

export function PecaDetail({ piece, role }: Props) {
  const approval = piece.approval as typeof piece.approval & { status?: string }
  const [copied, setCopied] = useState(false)

  const clientToken = (piece.client as { magic_token?: string } | undefined)?.magic_token

  async function handleCopyLink() {
    if (!clientToken) return
    const url = `${window.location.origin}/cliente/${clientToken}?piece=${piece.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[#555555] hover:text-[#888888] text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">{piece.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[#888888] text-sm">{piece.client?.name}</span>
            <span className="text-[#2E2E2E]">·</span>
            <span className="text-xs text-[#888888] bg-[#1E1E1E] px-2 py-0.5 rounded">{formatLabel(piece.format)}</span>
            <span className="text-xs text-[#888888] bg-[#1E1E1E] px-2 py-0.5 rounded">{purposeLabel(piece.purpose)}</span>
            {piece.post_date && (
              <span className="text-xs text-[#888888] bg-[#1E1E1E] px-2 py-0.5 rounded">
                Postagem: {formatDate(piece.post_date)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {clientToken && piece.status === 'pendente' && (
            <button
              onClick={handleCopyLink}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                copied
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-400/5'
                  : 'border-[#2E2E2E] text-[#888888] hover:text-[#F5F5F5] hover:border-[#555555]'
              )}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Copiar link direto
                </>
              )}
            </button>
          )}
          <span className={cn('text-xs font-medium px-3 py-1.5 rounded-lg', statusColor(piece.status))}>
            {statusLabel(piece.status)}
          </span>
        </div>
      </div>

      {/* Drive link */}
      {piece.drive_url && (
        <a
          href={piece.drive_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[#888888] hover:text-[#F5F5F5] bg-[#141414] border border-[#2E2E2E] rounded-lg px-4 py-3 transition-colors"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Abrir no Google Drive
        </a>
      )}

      {/* Images */}
      {piece.assets && piece.assets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[#555555] uppercase tracking-wider">
            {piece.format === 'carrossel' ? `Carrossel — ${piece.assets.length} imagens` : 'Imagem'}
          </p>
          <div className="space-y-2">
            {piece.assets.map((asset, i) => (
              <div key={asset.id} className="relative rounded-lg overflow-hidden bg-[#141414]">
                {piece.format === 'carrossel' && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded z-10">
                    {i + 1}
                  </div>
                )}
                <Image
                  src={asset.url}
                  alt={`${piece.title} — imagem ${i + 1}`}
                  width={800}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy */}
      {piece.copy && (
        <div className="space-y-2">
          <p className="text-xs text-[#555555] uppercase tracking-wider">Copy</p>
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-lg p-4 text-sm text-[#F5F5F5] whitespace-pre-wrap leading-relaxed">
            {piece.copy}
          </div>
        </div>
      )}

      {/* Approval/Reproval feedback */}
      {approval && (
        <div className={cn(
          'rounded-xl border p-5 space-y-4',
          approval.status === 'aprovado'
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-red-500/20 bg-red-500/5'
        )}>
          <div className="flex items-center gap-2">
            {approval.status === 'aprovado' ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400 text-sm font-medium">Aprovado em {formatDate(approval.decided_at!)}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-red-400 text-sm font-medium">Reprovado em {formatDate(approval.decided_at!)}</span>
              </>
            )}
          </div>

          {approval.status === 'reprovado' && (
            <div className="space-y-3 text-sm">
              {approval.step1_answers && approval.step1_answers.length > 0 && (
                <div>
                  <p className="text-[#888888] text-xs mb-1">O que não agradou</p>
                  <div className="flex flex-wrap gap-1.5">
                    {approval.step1_answers.map((a: string) => (
                      <span key={a} className="text-[#F5F5F5] bg-[#2A2A2A] px-2.5 py-1 rounded-md text-xs">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {approval.step2_answers && approval.step2_answers.length > 0 && (
                <div>
                  <p className="text-[#888888] text-xs mb-1">Detalhes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {approval.step2_answers.map((a: string) => (
                      <span key={a} className="text-[#F5F5F5] bg-[#2A2A2A] px-2.5 py-1 rounded-md text-xs">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {approval.step2_open && (
                <div>
                  <p className="text-[#888888] text-xs mb-1">Detalhe adicional</p>
                  <p className="text-[#F5F5F5] italic">"{approval.step2_open}"</p>
                </div>
              )}
              {approval.step3_text && (
                <div>
                  <p className="text-[#888888] text-xs mb-1">Descrição do cliente</p>
                  <p className="text-[#F5F5F5] leading-relaxed">"{approval.step3_text}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-[#555555] text-xs">Criado em {formatDate(piece.created_at)}</p>
    </div>
  )
}
