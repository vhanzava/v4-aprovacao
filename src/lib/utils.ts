import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PieceFormat, PiecePurpose, PieceStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatLabel(format: PieceFormat | string | null | undefined): string {
  if (!format) return '—'
  const map: Record<string, string> = {
    imagem_unica: 'Imagem única',
    carrossel: 'Carrossel',
    video: 'Vídeo',
    banner: 'Banner',
    artigo: 'Artigo',
    blog: 'Blog',
  }
  return map[format] ?? format
}

export function purposeLabel(purpose: PiecePurpose | string | null | undefined): string {
  if (!purpose) return '—'
  return purpose === 'postagem' ? 'Postagem' : 'Anúncio'
}

export function statusLabel(status: PieceStatus | string): string {
  const map: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
    cancelada: 'Cancelada',
  }
  return map[status] ?? status
}

export function statusColor(status: PieceStatus | string): string {
  const map: Record<string, string> = {
    pendente: 'text-amber-400 bg-amber-400/10',
    aprovado: 'text-emerald-400 bg-emerald-400/10',
    reprovado: 'text-red-400 bg-red-400/10',
    cancelada: 'text-[#555555] bg-[#2A2A2A]',
  }
  return map[status] ?? 'text-[#888888] bg-[#1E1E1E]'
}

/** Format a duration given in minutes to human-readable string */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h < 24) return m > 0 ? `${h}h ${m}min` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h % 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

export function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
