'use client'

import { useState } from 'react'
import { PieceViewer } from './PieceViewer'
import { ReprovacaoPanel } from './ReprovacaoPanel'
import type { Piece, Client } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  client: Pick<Client, 'id' | 'name'>
  pieces: Piece[]
  token: string
}

type FlowState = 'viewing' | 'reprovando' | 'done'

export function ClientApprovalFlow({ client, pieces, token }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [decided, setDecided] = useState<Set<string>>(new Set())
  const [flowState, setFlowState] = useState<FlowState>('viewing')
  const [submitting, setSubmitting] = useState(false)

  const totalPieces = pieces.length
  const currentPiece = pieces[currentIndex]
  const allDone = decided.size === totalPieces

  async function handleApprove() {
    if (!currentPiece || submitting) return
    setSubmitting(true)

    await fetch('/api/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        piece_id: currentPiece.id,
        status: 'aprovado',
      }),
    })

    setDecided(prev => new Set([...prev, currentPiece.id]))
    setSubmitting(false)
    advanceOrFinish()
  }

  function handleReprove() {
    setFlowState('reprovando')
    // Smooth scroll to reproval panel
    setTimeout(() => {
      document.getElementById('reproval-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  async function handleReprovacaoComplete(feedback: {
    step1_answers: string[]
    step2_answers: string[]
    step2_open: string
    step3_text: string
  }) {
    if (!currentPiece || submitting) return
    setSubmitting(true)

    await fetch('/api/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        piece_id: currentPiece.id,
        status: 'reprovado',
        ...feedback,
      }),
    })

    setDecided(prev => new Set([...prev, currentPiece.id]))
    setSubmitting(false)
    setFlowState('viewing')
    advanceOrFinish()
  }

  function handleCancelReprova() {
    setFlowState('viewing')
    // Scroll back up to piece
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function advanceOrFinish() {
    const nextIndex = currentIndex + 1
    if (nextIndex < totalPieces) {
      setCurrentIndex(nextIndex)
      setFlowState('viewing')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (totalPieces === 0 || allDone) {
    return <EmptyState clientName={client.name} />
  }

  if (!currentPiece) return null

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col">
      {/* Progress bar — top, subtle */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-[#1E1E1E]">
        <div
          className="h-full bg-[#E8192C] transition-all duration-500 ease-out"
          style={{ width: `${(decided.size / totalPieces) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 pt-4">
        {/* Piece viewer section */}
        <div id="piece-top" className="min-h-[85dvh] flex flex-col">
          <PieceViewer piece={currentPiece} />

          {/* Action buttons — fixed at bottom when viewing */}
          {flowState === 'viewing' && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent pt-8 pb-6 px-6">
              <div className="flex gap-3 max-w-sm mx-auto">
                <button
                  onClick={handleReprove}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 border border-[#2E2E2E] bg-[#141414] hover:bg-[#1E1E1E] text-[#888888] hover:text-[#F5F5F5] font-medium py-4 rounded-2xl transition-all text-sm disabled:opacity-40"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Não aprovar
                </button>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium py-4 rounded-2xl transition-all text-sm disabled:opacity-40"
                >
                  {submitting ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Aprovar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reproval panel — expands below the piece */}
        {flowState === 'reprovando' && (
          <div id="reproval-panel" className="border-t border-[#1E1E1E]">
            <ReprovacaoPanel
              piece={currentPiece}
              onComplete={handleReprovacaoComplete}
              onCancel={handleCancelReprova}
              submitting={submitting}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ clientName }: { clientName: string }) {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-[#F5F5F5] font-medium text-lg">Tudo em dia!</p>
      <p className="text-[#888888] text-sm mt-2 max-w-xs">
        Não há peças aguardando sua aprovação no momento.
      </p>
      <div className="mt-8">
        <span className="text-[#555555] text-xs">
          <span className="text-[#E8192C] font-medium">V4</span> Aprovações
        </span>
      </div>
    </div>
  )
}
