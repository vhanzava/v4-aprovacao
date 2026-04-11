'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import type { Role } from '@/lib/types'

interface ClientWithPieces {
  id: string
  name: string
  status: 'ativo' | 'inativo'
  magic_token: string
  created_at: string
  pieces?: { id: string; status: string }[]
}

interface Props {
  clients: ClientWithPieces[]
  role: Role
}

export function ClientesContent({ clients, role }: Props) {
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, startTransition] = useTransition()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const router = useRouter()

  const canEdit = role === 'admin' || role === 'team'

  const visible = clients.filter(c => showInactive ? true : c.status === 'ativo')

  function getClientUrl(token: string) {
    return `${window.location.origin}/cliente/${token}`
  }

  async function handleCopyLink(token: string, id: string) {
    await navigator.clipboard.writeText(getClientUrl(token))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    startTransition(async () => {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      setNewName('')
      setShowNew(false)
      router.refresh()
    })
  }

  async function handleToggleStatus(client: ClientWithPieces) {
    await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: client.status === 'ativo' ? 'inativo' : 'ativo' }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#F5F5F5]">Clientes</h1>
          <p className="text-[#888888] text-sm mt-0.5">
            {clients.filter(c => c.status === 'ativo').length} ativos
            {clients.filter(c => c.status === 'inativo').length > 0 && (
              <> · {clients.filter(c => c.status === 'inativo').length} inativos</>
            )}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-2 bg-[#E8192C] hover:bg-[#C41020] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo cliente
          </button>
        )}
      </div>

      {/* New client form */}
      {showNew && (
        <form
          onSubmit={handleCreate}
          className="bg-[#141414] border border-[#E8192C]/30 rounded-xl p-4 flex gap-3"
        >
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nome do cliente"
            className="flex-1 bg-[#1E1E1E] border border-[#2E2E2E] rounded-lg px-3 py-2 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C]"
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className="bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Criar
          </button>
          <button
            type="button"
            onClick={() => { setShowNew(false); setNewName('') }}
            className="text-[#555555] hover:text-[#F5F5F5] text-sm px-3 py-2 rounded-lg hover:bg-[#1E1E1E] transition-colors"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Inactive toggle */}
      {clients.some(c => c.status === 'inativo') && (
        <button
          onClick={() => setShowInactive(!showInactive)}
          className="text-[#555555] hover:text-[#888888] text-xs flex items-center gap-1.5 transition-colors"
        >
          <svg className={cn('w-3 h-3 transition-transform', showInactive && 'rotate-90')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showInactive ? 'Ocultar' : 'Mostrar'} inativos
        </button>
      )}

      {/* Clients list */}
      <div className="space-y-2">
        {visible.map(client => {
          const pending = client.pieces?.filter(p => p.status === 'pendente').length ?? 0
          const approved = client.pieces?.filter(p => p.status === 'aprovado').length ?? 0
          const reproved = client.pieces?.filter(p => p.status === 'reprovado').length ?? 0

          return (
            <div
              key={client.id}
              className={cn(
                'bg-[#141414] border border-[#2E2E2E] rounded-xl p-4',
                client.status === 'inativo' && 'opacity-50'
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[#F5F5F5] text-sm font-medium">{client.name}</p>
                    {client.status === 'inativo' && (
                      <span className="text-[10px] text-[#555555] bg-[#2A2A2A] px-1.5 py-0.5 rounded uppercase">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {pending > 0 && <span className="text-xs text-amber-400">{pending} pendente{pending > 1 ? 's' : ''}</span>}
                    {approved > 0 && <span className="text-xs text-emerald-400">{approved} aprovado{approved > 1 ? 's' : ''}</span>}
                    {reproved > 0 && <span className="text-xs text-red-400">{reproved} reprovado{reproved > 1 ? 's' : ''}</span>}
                    {(pending + approved + reproved) === 0 && (
                      <span className="text-xs text-[#555555]">Sem peças</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {client.status === 'ativo' && (
                    <>
                      {/* Abrir link */}
                      <a
                        href={getClientUrl(client.magic_token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg border border-[#2E2E2E] text-[#888888] hover:text-[#F5F5F5] hover:border-[#555555] transition-colors flex items-center gap-1.5"
                        title="Visualizar como cliente"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Abrir
                      </a>

                      {/* Copiar link */}
                      <button
                        onClick={() => handleCopyLink(client.magic_token, client.id)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5',
                          copiedId === client.id
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-400/5'
                            : 'border-[#2E2E2E] text-[#888888] hover:text-[#F5F5F5] hover:border-[#555555]'
                        )}
                        title="Copiar link de aprovação"
                      >
                      {copiedId === client.id ? (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copiado
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copiar link
                        </>
                      )}
                      </button>
                    </>
                  )}

                  {canEdit && (
                    <button
                      onClick={() => handleToggleStatus(client)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#2E2E2E] text-[#555555] hover:text-[#F5F5F5] hover:border-[#555555] transition-colors"
                    >
                      {client.status === 'ativo' ? 'Desativar' : 'Reativar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-[#555555] text-sm">
          Nenhum cliente cadastrado
        </div>
      )}
    </div>
  )
}
