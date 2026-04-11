'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDate, formatLabel, purposeLabel } from '@/lib/utils'
import type { Piece } from '@/lib/types'

interface Props {
  piece: Piece
}

export function PieceViewer({ piece }: Props) {
  const [copyExpanded, setCopyExpanded] = useState(false)

  return (
    <div className="flex flex-col flex-1 px-4 pt-6 pb-4 max-w-lg mx-auto w-full">
      {/* Tags */}
      <div className="flex items-center gap-2 mb-4">
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

      {/* Media */}
      <div className="flex-1">
        {/* Images */}
        {piece.assets && piece.assets.length > 0 && (
          <div className="space-y-2 mb-4">
            {piece.assets.map((asset, i) => (
              <div key={asset.id} className="relative rounded-xl overflow-hidden bg-[#141414]">
                {piece.format === 'carrossel' && (
                  <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full z-10">
                    {i + 1} / {piece.assets!.length}
                  </div>
                )}
                <Image
                  src={asset.url}
                  alt={`${piece.title}`}
                  width={800}
                  height={800}
                  className="w-full h-auto"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        )}

        {/* Drive link */}
        {piece.drive_url && (
          <a
            href={piece.drive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl px-4 py-4 text-[#888888] hover:text-[#F5F5F5] text-sm transition-colors mb-4"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {piece.format === 'video' ? 'Assistir vídeo no Drive' : 'Ver arquivo no Drive'}
            <svg className="w-4 h-4 opacity-50 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Copy */}
        {piece.copy && (
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden mb-4">
            <button
              onClick={() => setCopyExpanded(!copyExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">Texto da postagem</span>
              <svg
                className={`w-4 h-4 text-[#555555] transition-transform ${copyExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
