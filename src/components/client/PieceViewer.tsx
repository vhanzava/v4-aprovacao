'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDate, formatLabel, purposeLabel } from '@/lib/utils'
import type { Piece } from '@/lib/types'

interface Props {
  piece: Piece
}

// Extrai o FILE_ID de qualquer formato de link do Google Drive
function getDriveEmbedUrl(url: string): string | null {
  try {
    // Formatos suportados:
    // https://drive.google.com/file/d/FILE_ID/view
    // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    // https://drive.google.com/open?id=FILE_ID
    // https://drive.google.com/file/d/FILE_ID/preview (já é embed)

    const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`

    const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (openMatch) return `https://drive.google.com/file/d/${openMatch[1]}/preview`

    return null
  } catch {
    return null
  }
}

export function PieceViewer({ piece }: Props) {
  const [copyExpanded, setCopyExpanded] = useState(false)

  const isStage2 = piece.stage === 2
  const embedUrl = piece.drive_url ? getDriveEmbedUrl(piece.drive_url) : null

  // Altura do iframe: vídeo é mais alto, imagem/carrossel mais compacto
  const iframeHeight = piece.format === 'video' ? 'aspect-video' : 'aspect-square'

  // ── Stage 2: copy + caption prominence ──────────────────────────────────
  if (isStage2) {
    return (
      <div className="flex flex-col flex-1 px-4 pt-6 pb-4 max-w-lg mx-auto w-full">
        {/* Stage badge */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-violet-400 bg-violet-400/10 px-2.5 py-1 rounded-full border border-violet-400/20">
            Etapa 2 — Copy
          </span>
          {piece.purpose && (
            <span className="text-xs text-[#555555] bg-[#141414] px-2.5 py-1 rounded-full border border-[#2E2E2E]">
              {purposeLabel(piece.purpose)}
            </span>
          )}
          {piece.post_date && (
            <span className="text-xs text-[#888888] bg-[#141414] px-2.5 py-1 rounded-full border border-[#2E2E2E]">
              Postagem: {formatDate(piece.post_date)}
            </span>
          )}
        </div>

        <h2 className="text-[#F5F5F5] font-semibold text-lg leading-snug mb-5">
          {piece.title}
        </h2>

        <div className="flex-1 space-y-4">
          {/* Copy text — always expanded and prominent */}
          {piece.copy && (
            <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2E2E2E]">
                <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
                  Texto da arte
                </span>
              </div>
              <div className="px-4 py-4 text-sm text-[#F5F5F5] whitespace-pre-wrap leading-relaxed">
                {piece.copy}
              </div>
            </div>
          )}

          {/* Post caption */}
          {piece.post_caption && (
            <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2E2E2E]">
                <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
                  Legenda da postagem
                </span>
              </div>
              <div className="px-4 py-4 text-sm text-[#F5F5F5] whitespace-pre-wrap leading-relaxed">
                {piece.post_caption}
              </div>
            </div>
          )}

          {/* Drive link if present */}
          {piece.drive_url && (
            <a
              href={piece.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl px-4 py-4 text-[#888888] hover:text-[#F5F5F5] text-sm transition-colors"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver referência no Drive
            </a>
          )}
        </div>
      </div>
    )
  }

  // ── Stage 3 (default): art approval ─────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-4 max-w-lg mx-auto w-full">
      {/* Tags */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-[#555555] bg-[#141414] px-2.5 py-1 rounded-full border border-[#2E2E2E]">
          {formatLabel(piece.format)}
        </span>
        <span className="text-xs text-[#555555] bg-[#141414] px-2.5 py-1 rounded-full border border-[#2E2E2E]">
          {purposeLabel(piece.purpose)}
        </span>
        {piece.post_date && (
          <span className="text-xs text-[#888888] bg-[#141414] px-2.5 py-1 rounded-full border border-[#2E2E2E]">
            Postagem: {formatDate(piece.post_date)}
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-[#F5F5F5] font-semibold text-lg leading-snug mb-4">
        {piece.title}
      </h2>

      <div className="flex-1 space-y-4">
        {/* Imagens uploadadas (imagem única) */}
        {piece.assets && piece.assets.length > 0 && (
          <div className="space-y-2">
            {piece.assets.map((asset, i) => (
              <div key={asset.id} className="relative rounded-xl overflow-hidden bg-[#141414]">
                {piece.format === 'carrossel' && (
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full z-10">
                    {i + 1} / {piece.assets!.length}
                  </div>
                )}
                <Image
                  src={asset.url}
                  alt={piece.title}
                  width={800}
                  height={800}
                  className="w-full h-auto"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        )}

        {/* Drive embed — vídeo, carrossel ou imagem via Drive */}
        {embedUrl && (
          <div className={`w-full rounded-xl overflow-hidden bg-[#141414] ${iframeHeight}`}>
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="autoplay"
              allowFullScreen
              loading="lazy"
              title={piece.title}
            />
          </div>
        )}

        {/* Fallback: link do Drive não reconhecido */}
        {piece.drive_url && !embedUrl && (
          <a
            href={piece.drive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl px-4 py-4 text-[#888888] hover:text-[#F5F5F5] text-sm transition-colors"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {piece.format === 'video' ? 'Assistir vídeo' : 'Ver arquivo'}
          </a>
        )}

        {/* Copy */}
        {piece.copy && (
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden">
            <button
              onClick={() => setCopyExpanded(!copyExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
                Texto da postagem
              </span>
              <svg
                className={`w-4 h-4 text-[#555555] transition-transform ${copyExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {copyExpanded && (
              <div className="px-4 pb-4 pt-0 text-sm text-[#F5F5F5] whitespace-pre-wrap leading-relaxed border-t border-[#2E2E2E]">
                {piece.copy}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
