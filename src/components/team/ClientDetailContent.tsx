'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { cn, formatLabel, purposeLabel, formatDate } from '@/lib/utils'
import type { Client, PieceFormat, PiecePurpose } from '@/lib/types'

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
  copy: string | null
  post_caption: string | null
  drive_url: string | null
}

interface Props {
  client: Client
  pendentes: Piece[]
  aprovadas: Piece[]
  reprovadas: Piece[]
  canceladas: Piece[]
}

interface EditForm {
  title: string
  format: PieceFormat | ''
  purpose: PiecePurpose | ''
  drive_url: string
  copy: string
  post_caption: string
  post_date: string
}

const FORMATS: { value: PieceFormat; label: string }[] = [
  { value: 'imagem_unica', label: 'Imagem única' },
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'video', label: 'Vídeo' },
  { value: 'banner', label: 'Banner' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'blog', label: 'Blog' },
]

const PURPOSES: { value: PiecePurpose; label: string }[] = [
  { value: 'postagem', label: 'Postagem' },
  { value: 'anuncio', label: 'Anúncio' },
]

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleCopyLink(pieceId: string) {
    const url = `${window.location.origin}/cliente/${client.magic_token}?piece=${pieceId}`
    await navigator.clipboard.writeText(url)
    setCopiedId(pieceId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const total = pendentes.length + aprovadas.length + reprovadas.length + canceladas.length
  const approvalRate = (pendentes.length + aprovadas.length + reprovadas.length) > 0
    ? Math.round((aprovadas.length / (aprovadas.length + reprovadas.length)) * 100) || 0
    : 0
  void total

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

  function startEdit(piece: Piece) {
    setEditingId(piece.id)
    setEditForm({
      title: piece.title,
      format: (piece.format as PieceFormat) ?? '',
      purpose: (piece.purpose as PiecePurpose) ?? '',
      drive_url: piece.drive_url ?? '',
      copy: piece.copy ?? '',
      post_caption: piece.post_caption ?? '',
      post_date: piece.post_date ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  async function handleSave(pieceId: string) {
    if (!editForm || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/pieces/${pieceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          format: editForm.format || null,
          purpose: editForm.purpose || null,
          drive_url: editForm.drive_url || null,
          copy: editForm.copy || null,
          post_caption: editForm.post_caption || null,
          post_date: editForm.post_date || null,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setActivePendentes(prev =>
          prev.map(p => p.id === pieceId ? { ...p, ...updated } : p)
        )
        cancelEdit()
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors'

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

      {/* Pending pieces */}
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
            {activePendentes.map((piece, idx) => {
              const isEditing = editingId === piece.id

              return (
                <div
                  key={piece.id}
                  className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden"
                >
                  {/* Row header — always visible */}
                  <div className="p-4 flex items-center gap-3">
                    <span className="text-[#555555] text-xs w-5 text-right flex-shrink-0">{idx + 1}</span>

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

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopyLink(piece.id)}
                        title="Copiar link direto para o cliente"
                        className={cn(
                          'text-xs border px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5',
                          copiedId === piece.id
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-400/5'
                            : 'border-[#2E2E2E] text-[#555555] hover:text-[#F5F5F5]'
                        )}
                      >
                        {copiedId === piece.id ? (
                          <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copiado
                          </>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        )}
                      </button>
                      <Link
                        href={`/pecas/${piece.id}`}
                        className="text-[#555555] hover:text-[#F5F5F5] text-xs border border-[#2E2E2E] px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Ver
                      </Link>
                      <button
                        onClick={() => isEditing ? cancelEdit() : startEdit(piece)}
                        className={cn(
                          'text-xs border px-2.5 py-1.5 rounded-lg transition-colors',
                          isEditing
                            ? 'border-[#E8192C]/40 text-[#E8192C] hover:bg-[#E8192C]/5'
                            : 'border-[#2E2E2E] text-[#555555] hover:text-[#F5F5F5]'
                        )}
                      >
                        {isEditing ? 'Fechar' : 'Editar'}
                      </button>
                      <button
                        onClick={() => handleCancel(piece.id)}
                        disabled={cancelling === piece.id}
                        className="text-[#555555] hover:text-red-400 text-xs border border-[#2E2E2E] hover:border-red-400/30 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {cancelling === piece.id ? '...' : 'Cancelar'}
                      </button>
                    </div>
                  </div>

                  {/* Inline edit form */}
                  {isEditing && editForm && (
                    <div className="border-t border-[#2E2E2E] bg-[#0F0F0F] p-4 space-y-4">
                      {/* Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-[#555555]">Título</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={e => setEditForm(f => f && ({ ...f, title: e.target.value }))}
                          className={inputCls}
                        />
                      </div>

                      {/* Format + Purpose side by side */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-[#555555]">Formato</label>
                          <select
                            value={editForm.format}
                            onChange={e => setEditForm(f => f && ({ ...f, format: e.target.value as PieceFormat }))}
                            className={inputCls}
                          >
                            <option value="">—</option>
                            {FORMATS.map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-[#555555]">Tipo</label>
                          <select
                            value={editForm.purpose}
                            onChange={e => setEditForm(f => f && ({ ...f, purpose: e.target.value as PiecePurpose }))}
                            className={inputCls}
                          >
                            <option value="">—</option>
                            {PURPOSES.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Drive URL */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-[#555555]">Link do Drive <span className="text-[#444]">— opcional</span></label>
                        <input
                          type="url"
                          value={editForm.drive_url}
                          onChange={e => setEditForm(f => f && ({ ...f, drive_url: e.target.value }))}
                          placeholder="https://drive.google.com/file/d/..."
                          className={inputCls}
                        />
                      </div>

                      {/* Copy */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-[#555555]">Texto da arte <span className="text-[#444]">— opcional</span></label>
                        <textarea
                          value={editForm.copy}
                          onChange={e => setEditForm(f => f && ({ ...f, copy: e.target.value }))}
                          placeholder="Texto que aparece dentro do criativo..."
                          rows={3}
                          className={cn(inputCls, 'resize-none leading-relaxed')}
                        />
                      </div>

                      {/* Post caption — stage 2 only */}
                      {piece.stage === 2 && (
                        <div className="space-y-1.5">
                          <label className="text-xs text-[#555555]">Legenda da postagem <span className="text-[#444]">— opcional</span></label>
                          <textarea
                            value={editForm.post_caption}
                            onChange={e => setEditForm(f => f && ({ ...f, post_caption: e.target.value }))}
                            placeholder="Texto do post (caption), emojis, hashtags..."
                            rows={3}
                            className={cn(inputCls, 'resize-none leading-relaxed')}
                          />
                        </div>
                      )}

                      {/* Post date */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-[#555555]">Data de postagem <span className="text-[#444]">— opcional</span></label>
                        <input
                          type="date"
                          value={editForm.post_date}
                          onChange={e => setEditForm(f => f && ({ ...f, post_date: e.target.value }))}
                          className={inputCls}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleSave(piece.id)}
                          disabled={saving || !editForm.title.trim()}
                          className="bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-40 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          {saving ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-[#555555] hover:text-[#F5F5F5] text-xs border border-[#2E2E2E] px-4 py-2 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
