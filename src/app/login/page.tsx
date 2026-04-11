'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Acesso negado.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[#0A0A0A]">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-[#E8192C] font-bold text-2xl tracking-tight">V4</span>
            <span className="text-[#F5F5F5] font-light text-2xl tracking-tight">Aprovações</span>
          </div>
          <p className="text-[#888888] text-sm">Sistema de aprovação de peças criativas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-[#888888] mb-2">
              E-mail corporativo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@v4company.com"
              required
              autoFocus
              className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-lg px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors text-sm"
            />
          </div>

          {error && <p className="text-[#E8192C] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 transition-colors text-sm"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
