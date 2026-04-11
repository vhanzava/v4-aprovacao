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

export function formatLabel(format: PieceFormat): string {
  const map: Record<PieceFormat, string> = {
    imagem_unica: 'Imagem única',
    carrossel: 'Carrossel',
    video: 'Vídeo',
  }
  return map[format]
}

export function purposeLabel(purpose: PiecePurpose): string {
  return purpose === 'postagem' ? 'Postagem' : 'Anúncio'
}

export function statusLabel(status: PieceStatus): string {
  const map: Record<PieceStatus, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    reprovado: 'Reprovado',
  }
  return map[status]
}

export function statusColor(status: PieceStatus): string {
  const map: Record<PieceStatus, string> = {
    pendente: 'text-amber-400 bg-amber-400/10',
    aprovado: 'text-emerald-400 bg-emerald-400/10',
    reprovado: 'text-red-400 bg-red-400/10',
  }
  return map[status]
}

export function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
