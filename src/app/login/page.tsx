'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRoleFromEmail } from '@/lib/auth/roles'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const role = getRoleFromEmail(email.trim().toLowerCase())
    if (!role) {
      setError('Acesso restrito a e-mails @v4company.com.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (authError) {
      setError('Erro ao enviar o link. Tente novamente.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[#0A0A0A]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-[#E8192C] font-bold text-2xl tracking-tight">V4</span>
            <span className="text-[#F5F5F5] font-light text-2xl tracking-tight">Aprovações</span>
          </div>
          <p className="text-[#888888] text-sm">Sistema de aprovação de peças criativas</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#1E1E1E] flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-[#E8192C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[#F5F5F5] font-medium">Link enviado!</p>
              <p className="text-[#888888] text-sm mt-1">
                Verifique sua caixa de entrada em <span className="text-[#F5F5F5]">{email}</span>
              </p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-[#888888] text-sm underline underline-offset-2 hover:text-[#F5F5F5] transition-colors"
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
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
                className="w-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-lg px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors text-sm"
              />
            </div>

            {error && (
              <p className="text-[#E8192C] text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg py-3 transition-colors text-sm"
            >
              {loading ? 'Enviando...' : 'Receber link de acesso'}
            </button>

            <p className="text-center text-[#555555] text-xs">
              Um link de acesso será enviado para seu e-mail
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
