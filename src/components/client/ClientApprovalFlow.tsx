'use client'

import { useState, useEffect, useRef } from 'react'
import { PieceViewer } from './PieceViewer'
import { ReprovacaoPanel } from './ReprovacaoPanel'
import type { Piece, Client } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  client: Pick<Client, 'id' | 'name'>
  pieces: Piece[]
  token: string
  singlePieceMode?: boolean
}

type FlowState = 'viewing' | 'reprovando' | 'sent'

export function ClientApprovalFlow({ client, pieces, token, singlePieceMode }: Props) {
  // Pre-populate decided set from pieces already decided in previous sessions
  const buildInitialDecided = () => {
    const s = new Set<string>()
    for (const p of pieces) {
      if (p.status !== 'pendente') s.add(p.id)
    }
    return s
  }

  const totalPieces = pieces.length

  // Start at first undecided piece
  const findFirstUndecided = () => {
    const idx = pieces.findIndex(p => p.status === 'pendente')
    return idx === -1 ? 0 : idx
  }

  const [decided, setDecided] = useState<Set<string>>(buildInitialDecided)
  const [currentIndex, setCurrentIndex] = useState(findFirstUndecided)
  const [flowState, setFlowState] = useState<FlowState>('viewing')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [undoTarget, setUndoTarget] = useState<string | null>(null)
  const [undoing, setUndoing] = useState(false)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentPiece = pieces[currentIndex]
  const allDone = decided.size === totalPieces

  // Clear undo timer on unmount
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current) }, [])

  function startUndoWindow(pieceId: string) {
    setUndoTarget(pieceId)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => {
      setUndoTarget(null)
      advanceOrFinish()
    }, 8000)
  }

  function advanceOrFinish() {
    // Find next undecided piece after current
    const nextIndex = pieces.findIndex((p, i) => i > currentIndex && !decided.has(p.id))
    if (nextIndex !== -1) {
      setCurrentIndex(nextIndex)
      setFlowState('viewing')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    // If no next, we stay — allDone will be true
  }

  async function handleApprove() {
    if (!currentPiece || submitting) return
    setSubmitting(true)

    const res = await fetch('/api/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, piece_id: currentPiece.id, status: 'aprovado' }),
    })

    if (res.ok) {
      setDecided(prev => new Set([...prev, currentPiece.id]))
      startUndoWindow(currentPiece.id)
    }
    setSubmitting(false)
  }

  function handleReprove() {
    setFlowState('reprovando')
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
    setSubmitError(null)

    try {
      const res = await fetch('/api/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, piece_id: currentPiece.id, status: 'reprovado', ...feedback }),
      })

      // 409 = piece was already saved on a previous attempt; treat as success
      if (res.ok || res.status === 409) {
        setDecided(prev => new Set([...prev, currentPiece.id]))
        // Show explicit confirmation screen before advancing
        setFlowState('sent')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        // Advance after 2.5 seconds
        setTimeout(() => {
          setFlowState('viewing')
          startUndoWindow(currentPiece.id)
        }, 2500)
      } else {
        const body = await res.json().catch(() => ({}))
        setSubmitError(`Erro ${res.status}${body.code ? ` (${body.code})` : ''}: ${body.detail ?? body.error ?? 'desconhecido'}`)
      }
    } catch (err) {
      setSubmitError(`Erro de conexão: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUndo() {
    if (!undoTarget || undoing) return
    setUndoing(true)

    // Clear the advance timer
    if (undoTimer.current) clearTimeout(undoTimer.current)

    const res = await fetch('/api/approval', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, piece_id: undoTarget }),
    })

    if (res.ok) {
      setDecided(prev => {
        const next = new Set(prev)
        next.delete(undoTarget)
        return next
      })
      setUndoTarget(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setUndoing(false)
  }

  function handleCancelReprova() {
    setFlowState('viewing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 'sent' must be checked BEFORE allDone — when reproval is the last piece,
  // both allDone and flowState='sent' become true in the same render batch.
  // Without this guard, the allDone early-return below would swallow the confirmation screen.
  if (flowState === 'sent') {
    return (
      <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-[#E8192C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <p className="text-[#F5F5F5] font-semibold text-xl mb-2">Feedback enviado!</p>
        <p className="text-[#888888] text-sm max-w-xs leading-relaxed">
          Sua mensagem foi registrada. O time vai analisar e refazer a peça.
        </p>
        <div className="mt-8">
          <span className="text-[#555555] text-xs">
            <span className="text-[#E8192C] font-medium">V4</span> Aprovações
          </span>
        </div>
      </div>
    )
  }

  if (totalPieces === 0 || allDone) {
    return <EmptyState clientName={client.name} singlePieceMode={singlePieceMode} />
  }

  if (!currentPiece) return null

  const isPieceDecided = decided.has(currentPiece.id)

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col">
      {/* Progress bar — top */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#2A2A2A]">
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

          {/* Action buttons */}
          {flowState === 'viewing' && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent pt-8 pb-6 px-6">

              {/* Undo bar — shows for 8 seconds after a decision */}
              {undoTarget && (
                <div className="flex items-center justify-between mb-3 px-4 py-2.5 bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl">
                  <span className="text-[#888888] text-xs">Decisão registrada</span>
                  <button
                    onClick={handleUndo}
                    disabled={undoing}
                    className="text-[#E8192C] hover:text-red-400 text-xs font-medium transition-colors disabled:opacity-40"
                  >
                    {undoing ? '...' : 'Desfazer'}
                  </button>
                </div>
              )}

              {!isPieceDecided && (
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
              )}
            </div>
          )}
        </div>

        {/* Reproval panel */}
        {flowState === 'reprovando' && (
          <div id="reproval-panel" className="border-t border-[#1E1E1E]">
            <ReprovacaoPanel
              piece={currentPiece}
              onComplete={handleReprovacaoComplete}
              onCancel={handleCancelReprova}
              submitting={submitting}
              submitError={submitError}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ clientName, singlePieceMode }: { clientName: string; singlePieceMode?: boolean }) {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-[#F5F5F5] font-medium text-lg">
        {singlePieceMode ? 'Respondido!' : 'Tudo em dia!'}
      </p>
      <p className="text-[#888888] text-sm mt-2 max-w-xs">
        {singlePieceMode
          ? 'Sua resposta foi registrada. Você pode fechar esta página.'
          : 'Não há peças aguardando sua aprovação no momento.'}
      </p>
      <div className="mt-8">
        <span className="text-[#555555] text-xs">
          <span className="text-[#E8192C] font-medium">V4</span> Aprovações
        </span>
      </div>
    </div>
  )
}
