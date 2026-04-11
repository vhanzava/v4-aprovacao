'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { PieceFormat, PiecePurpose } from '@/lib/types'

interface Props {
  clients: { id: string; name: string }[]
}

export function NovaPecaForm({ clients }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [form, setForm] = useState({
    client_id: '',
    title: '',
    format: '' as PieceFormat | '',
    purpose: '' as PiecePurpose | '',
    copy: '',
    drive_url: '',
    post_date: '',
  })

  const [images, setImages] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.client_id || !form.title || !form.format || !form.purpose) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()

      // Insert piece
      const { data: piece, error: pieceError } = await supabase
        .from('pieces')
        .insert({
          client_id: form.client_id,
          title: form.title,
          format: form.format,
          purpose: form.purpose,
          copy: form.copy || null,
          drive_url: form.drive_url || null,
          post_date: form.post_date || null,
        })
        .select()
        .single()

      if (pieceError || !piece) {
        setError('Erro ao criar peça. Tente novamente.')
        return
      }

      // Upload images to Supabase Storage
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const ext = file.name.split('.').pop()
          const path = `${piece.id}/${i}.${ext}`

          const { data: upload } = await supabase.storage
            .from('pieces')
            .upload(path, file, { upsert: true })

          if (upload) {
            const { data: { publicUrl } } = supabase.storage
              .from('pieces')
              .getPublicUrl(path)

            await supabase.from('piece_assets').insert({
              piece_id: piece.id,
              url: publicUrl,
              storage_path: path,
              order_index: i,
            })
          }
        }
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

  const formats: { value: PieceFormat; label: string; desc: string }[] = [
    { value: 'imagem_unica', label: 'Imagem única', desc: 'Post, banner ou anúncio estático' },
    { value: 'carrossel', label: 'Carrossel', desc: 'Sequência de imagens' },
    { value: 'video', label: 'Vídeo', desc: 'Reels, stories ou anúncio em vídeo' },
  ]

  const purposes: { value: PiecePurpose; label: string }[] = [
    { value: 'postagem', label: 'Postagem orgânica' },
    { value: 'anuncio', label: 'Anúncio pago' },
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#F5F5F5]">Nova peça</h1>
        <p className="text-[#888888] text-sm mt-0.5">Preencha os dados para enviar ao cliente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client */}
        <Field label="Cliente" required>
          <select
            value={form.client_id}
            onChange={e => set('client_id', e.target.value)}
            required
            className={selectClass}
          >
            <option value="">Selecione o cliente</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        {/* Title */}
        <Field label="Título da peça" required>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Ex: Post de lançamento — Produto X"
            required
            className={inputClass}
          />
        </Field>

        {/* Format */}
        <Field label="Formato" required>
          <div className="grid grid-cols-3 gap-2">
            {formats.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => set('format', f.value)}
                className={cn(
                  'flex flex-col items-start p-3 rounded-lg border text-left transition-colors',
                  form.format === f.value
                    ? 'border-[#E8192C] bg-[#E8192C]/5 text-[#F5F5F5]'
                    : 'border-[#2E2E2E] bg-[#141414] text-[#888888] hover:border-[#555555]'
                )}
              >
                <span className="text-sm font-medium">{f.label}</span>
                <span className="text-[11px] mt-0.5 leading-tight opacity-70">{f.desc}</span>
              </button>
            ))}
          </div>
        </Field>

        {/* Purpose */}
        <Field label="Tipo" required>
          <div className="flex gap-2">
            {purposes.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => set('purpose', p.value)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg border text-sm transition-colors',
                  form.purpose === p.value
                    ? 'border-[#E8192C] bg-[#E8192C]/5 text-[#F5F5F5]'
                    : 'border-[#2E2E2E] bg-[#141414] text-[#888888] hover:border-[#555555]'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Post date */}
        <Field label="Data de postagem" hint="Opcional">
          <input
            type="date"
            value={form.post_date}
            onChange={e => set('post_date', e.target.value)}
            className={inputClass}
          />
        </Field>

        {/* Drive URL */}
        <Field label="Link do Drive" hint="Para vídeos ou carrosseis via link">
          <input
            type="url"
            value={form.drive_url}
            onChange={e => set('drive_url', e.target.value)}
            placeholder="https://drive.google.com/..."
            className={inputClass}
          />
        </Field>

        {/* Images */}
        <Field label="Imagens" hint="Para imagem única ou carrossel">
          <label className={cn(
            'flex flex-col items-center justify-center border border-dashed border-[#2E2E2E] rounded-lg p-6 cursor-pointer transition-colors hover:border-[#555555] gap-2',
            images.length > 0 && 'border-[#E8192C]/30'
          )}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => setImages(Array.from(e.target.files ?? []))}
              className="hidden"
            />
            {images.length === 0 ? (
              <>
                <svg className="w-6 h-6 text-[#555555]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[#555555] text-sm">Clique para selecionar imagens</span>
                <span className="text-[#555555] text-xs">A ordem de seleção define a ordem do carrossel</span>
              </>
            ) : (
              <>
                <span className="text-[#E8192C] text-sm font-medium">{images.length} imagem{images.length > 1 ? 's' : ''} selecionada{images.length > 1 ? 's' : ''}</span>
                <span className="text-[#555555] text-xs">{images.map(f => f.name).join(', ')}</span>
              </>
            )}
          </label>
        </Field>

        {/* Copy */}
        <Field label="Copy" hint="Texto que acompanha a peça — opcional">
          <textarea
            value={form.copy}
            onChange={e => set('copy', e.target.value)}
            placeholder="Cole ou escreva aqui o texto da postagem, incluindo emojis, hashtags e quebras de linha..."
            rows={6}
            className={cn(inputClass, 'resize-none leading-relaxed')}
          />
        </Field>

        {error && (
          <p className="text-[#E8192C] text-sm">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-40 text-white font-medium py-3 rounded-lg transition-colors text-sm"
          >
            {pending ? 'Criando...' : 'Criar peça'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg border border-[#2E2E2E] text-[#888888] hover:text-[#F5F5F5] hover:border-[#555555] transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
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
