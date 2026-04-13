'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { PieceFormat, PiecePurpose } from '@/lib/types'

interface Props {
  clients: { id: string; name: string }[]
}

type Stage = 1 | 2 | 3

export function NovaPecaForm({ clients }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [stage, setStage] = useState<Stage>(3)

  // Stage 3 form
  const [form, setForm] = useState({
    client_id: '',
    title: '',
    format: '' as PieceFormat | '',
    purpose: '' as PiecePurpose | '',
    copy: '',
    drive_url: '',
    post_date: '',
  })

  // Stage 1 form (calendar)
  const [calForm, setCalForm] = useState({ client_id: '', month: '' })
  const [calLoading, setCalLoading] = useState(false)

  // Stage 2 form (copy)
  const [copyForm, setCopyForm] = useState({
    client_id: '',
    title: '',
    format: '' as PieceFormat | '',
    purpose: 'postagem' as PiecePurpose,
    copy: '',
    post_caption: '',
    post_date: '',
  })

  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  // ── Stage 1: open/create calendar ─────────────────────────────────────────
  async function handleOpenCalendar() {
    if (!calForm.client_id || !calForm.month) {
      setError('Selecione o cliente e o mês.')
      return
    }
    setError(null)
    setCalLoading(true)

    // month input returns YYYY-MM; we need YYYY-MM-01 for DB
    const monthDate = `${calForm.month}-01`

    const res = await fetch('/api/calendars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: calForm.client_id, month: monthDate }),
    })

    if (!res.ok) {
      setError('Erro ao criar calendário. Tente novamente.')
      setCalLoading(false)
      return
    }

    const calendar = await res.json()
    router.push(`/calendarios/${calendar.id}`)
  }

  // ── Stage 2: create copy piece ──────────────────────────────────────────
  async function handleSubmitCopy(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!copyForm.client_id || !copyForm.title || !copyForm.format || !copyForm.purpose) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/pieces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: copyForm.client_id,
          title: copyForm.title,
          stage: 2,
          format: copyForm.format,
          purpose: copyForm.purpose,
          copy: copyForm.copy || null,
          post_caption: copyForm.post_caption || null,
          post_date: copyForm.post_date || null,
          assets: [],
        }),
      })

      if (!res.ok) { setError('Erro ao criar peça. Tente novamente.'); return }
      router.push('/dashboard')
      router.refresh()
    })
  }

  // ── Stage 3: create art piece ───────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.client_id || !form.title || !form.format || !form.purpose) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/pieces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: form.client_id,
          title: form.title,
          stage: 3,
          format: form.format,
          purpose: form.purpose,
          copy: form.copy || null,
          drive_url: form.drive_url || null,
          post_date: form.post_date || null,
          assets: [],
        }),
      })

      if (!res.ok) { setError('Erro ao criar peça. Tente novamente.'); return }
      router.push('/dashboard')
      router.refresh()
    })
  }

  const formats: { value: PieceFormat; label: string; desc: string }[] = [
    { value: 'imagem_unica', label: 'Imagem única', desc: 'Post ou anúncio estático' },
    { value: 'carrossel', label: 'Carrossel', desc: 'Sequência de imagens' },
    { value: 'video', label: 'Vídeo', desc: 'Reels, stories ou anúncio' },
    { value: 'banner', label: 'Banner', desc: 'Display, e-mail ou impresso' },
    { value: 'artigo', label: 'Artigo', desc: 'LinkedIn, Medium ou blog' },
    { value: 'blog', label: 'Blog', desc: 'Post de blog no site' },
  ]

  const purposes: { value: PiecePurpose; label: string }[] = [
    { value: 'postagem', label: 'Postagem orgânica' },
    { value: 'anuncio', label: 'Anúncio pago' },
  ]

  const stages: { value: Stage; label: string; desc: string }[] = [
    { value: 1, label: 'Etapa 1', desc: 'Temas / Calendário' },
    { value: 2, label: 'Etapa 2', desc: 'Copy / Texto' },
    { value: 3, label: 'Etapa 3', desc: 'Arte / Criativo' },
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#F5F5F5]">Nova peça</h1>
        <p className="text-[#888888] text-sm mt-0.5">Selecione a etapa e preencha os dados</p>
      </div>

      {/* Stage selector */}
      <div className="mb-8">
        <label className="text-sm text-[#888888] mb-2 block">Etapa</label>
        <div className="grid grid-cols-3 gap-2">
          {stages.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => { setStage(s.value); setError(null) }}
              className={cn(
                'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                stage === s.value
                  ? 'border-[#E8192C] bg-[#E8192C]/5 text-[#F5F5F5]'
                  : 'border-[#2E2E2E] bg-[#141414] text-[#888888] hover:border-[#555555]'
              )}
            >
              <span className="text-sm font-medium">{s.label}</span>
              <span className="text-[11px] mt-0.5 leading-tight opacity-70">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Etapa 1: Calendar ───────────────────────────────────────────────── */}
      {stage === 1 && (
        <div className="space-y-6">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 text-sm text-[#888888] leading-relaxed">
            A etapa 1 cria um <strong className="text-[#F5F5F5]">calendário de temas</strong> para o mês. Você poderá adicionar temas por data, revisar datas comemorativas e marcar o calendário como pronto para o cliente aprovar.
          </div>

          <Field label="Cliente" required>
            <select
              value={calForm.client_id}
              onChange={e => setCalForm(p => ({ ...p, client_id: e.target.value }))}
              className={selectClass}
            >
              <option value="">Selecione o cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Mês" required>
            <input
              type="month"
              value={calForm.month}
              onChange={e => setCalForm(p => ({ ...p, month: e.target.value }))}
              className={inputClass}
            />
          </Field>

          {error && <p className="text-[#E8192C] text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenCalendar}
              disabled={calLoading}
              className="flex-1 bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-40 text-white font-medium py-3 rounded-lg transition-colors text-sm"
            >
              {calLoading ? 'Abrindo...' : 'Criar / Abrir Calendário'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg border border-[#2E2E2E] text-[#888888] hover:text-[#F5F5F5] hover:border-[#555555] transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Etapa 2: Copy ───────────────────────────────────────────────────── */}
      {stage === 2 && (
        <form onSubmit={handleSubmitCopy} className="space-y-6">
          <Field label="Cliente" required>
            <select
              value={copyForm.client_id}
              onChange={e => setCopyForm(p => ({ ...p, client_id: e.target.value }))}
              required className={selectClass}
            >
              <option value="">Selecione o cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Título" required>
            <input
              type="text"
              value={copyForm.title}
              onChange={e => setCopyForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Copy — Lançamento Produto X"
              required className={inputClass}
            />
          </Field>

          <Field label="Formato" required>
            <div className="grid grid-cols-3 gap-2">
              {formats.map(f => (
                <button key={f.value} type="button"
                  onClick={() => setCopyForm(p => ({ ...p, format: f.value }))}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                    copyForm.format === f.value
                      ? 'border-[#E8192C] bg-[#E8192C]/5 text-[#F5F5F5]'
                      : 'border-[#2E2E2E] bg-[#141414] text-[#888888] hover:border-[#555555]'
                  )}>
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-[11px] mt-0.5 leading-tight opacity-70">{f.desc}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tipo" required>
            <div className="flex gap-2">
              {purposes.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setCopyForm(prev => ({ ...prev, purpose: p.value }))}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg border text-sm transition-colors',
                    copyForm.purpose === p.value
                      ? 'border-[#E8192C] bg-[#E8192C]/5 text-[#F5F5F5]'
                      : 'border-[#2E2E2E] bg-[#141414] text-[#888888] hover:border-[#555555]'
                  )}>
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Texto dentro da arte" hint="Opcional">
            <textarea
              value={copyForm.copy}
              onChange={e => setCopyForm(p => ({ ...p, copy: e.target.value }))}
              placeholder="Todo o texto que aparece dentro do criativo..."
              rows={4}
              className={cn(inputClass, 'resize-none leading-relaxed')}
            />
          </Field>

          <Field label="Legenda da postagem" hint="Opcional">
            <textarea
              value={copyForm.post_caption}
              onChange={e => setCopyForm(p => ({ ...p, post_caption: e.target.value }))}
              placeholder="Texto do post (caption), incluindo emojis e hashtags..."
              rows={4}
              className={cn(inputClass, 'resize-none leading-relaxed')}
            />
          </Field>

          <Field label="Data de postagem" hint="Opcional">
            <input
              type="date"
              value={copyForm.post_date}
              onChange={e => setCopyForm(p => ({ ...p, post_date: e.target.value }))}
              className={inputClass}
            />
          </Field>

          {error && <p className="text-[#E8192C] text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={pending}
              className="flex-1 bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-40 text-white font-medium py-3 rounded-lg transition-colors text-sm"
            >
              {pending ? 'Criando...' : 'Criar copy'}
            </button>
            <button
              type="button" onClick={() => router.back()}
              className="px-6 py-3 rounded-lg border border-[#2E2E2E] text-[#888888] hover:text-[#F5F5F5] hover:border-[#555555] transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ── Etapa 3: Arte (current form) ────────────────────────────────────── */}
      {stage === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Cliente" required>
            <select
              value={form.client_id}
              onChange={e => set('client_id', e.target.value)}
              required className={selectClass}
            >
              <option value="">Selecione o cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Título da peça" required>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ex: Post de lançamento — Produto X"
              required className={inputClass}
            />
          </Field>

          <Field label="Formato" required>
            <div className="grid grid-cols-3 gap-2">
              {formats.map(f => (
                <button key={f.value} type="button"
                  onClick={() => set('format', f.value)}
                  className={cn(
                    'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                    form.format === f.value
                      ? 'border-[#E8192C] bg-[#E8192C]/5 text-[#F5F5F5]'
                      : 'border-[#2E2E2E] bg-[#141414] text-[#888888] hover:border-[#555555]'
                  )}>
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-[11px] mt-0.5 leading-tight opacity-70">{f.desc}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Tipo" required>
            <div className="flex gap-2">
              {purposes.map(p => (
                <button key={p.value} type="button"
                  onClick={() => set('purpose', p.value)}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg border text-sm transition-colors',
                    form.purpose === p.value
                      ? 'border-[#E8192C] bg-[#E8192C]/5 text-[#F5F5F5]'
                      : 'border-[#2E2E2E] bg-[#141414] text-[#888888] hover:border-[#555555]'
                  )}>
                  {p.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Data de postagem" hint="Opcional">
            <input
              type="date"
              value={form.post_date}
              onChange={e => set('post_date', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Link do Drive" hint="Obrigatório — cole o link de compartilhamento">
            <input
              type="url"
              value={form.drive_url}
              onChange={e => set('drive_url', e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className={inputClass}
            />
            <p className="text-[#555555] text-xs mt-1.5">
              O arquivo precisa estar com acesso "Qualquer pessoa com o link"
            </p>
          </Field>

          <Field label="Copy" hint="Texto da postagem — opcional">
            <textarea
              value={form.copy}
              onChange={e => set('copy', e.target.value)}
              placeholder="Cole ou escreva aqui o texto da postagem..."
              rows={6}
              className={cn(inputClass, 'resize-none leading-relaxed')}
            />
          </Field>

          {error && <p className="text-[#E8192C] text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={pending}
              className="flex-1 bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-40 text-white font-medium py-3 rounded-lg transition-colors text-sm"
            >
              {pending ? 'Criando...' : 'Criar peça'}
            </button>
            <button
              type="button" onClick={() => router.back()}
              className="px-6 py-3 rounded-lg border border-[#2E2E2E] text-[#888888] hover:text-[#F5F5F5] hover:border-[#555555] transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm text-[#888888]">
        {label}
        {required && <span className="text-[#E8192C]">*</span>}
        {hint && <span className="text-[#555555] text-xs">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'w-full bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors'
const selectClass = 'w-full bg-[#141414] border border-[#2E2E2E] rounded-lg px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#E8192C] transition-colors'
