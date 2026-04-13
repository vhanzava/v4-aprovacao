'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NationalDate {
  date: string
  label: string
  type: 'feriado' | 'comercial'
  visible: boolean
}

interface Theme {
  id: string
  title: string
  theme_date: string
  theme_description: string | null
  theme_headline: string | null
  status: string
}

interface Props {
  clientName: string
  token: string
  themes: Theme[]
  nationalDates: NationalDate[]
  onAllDone: () => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function buildGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const grid: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

export function CalendarioApproval({ clientName, token, themes: initialThemes, nationalDates, onAllDone }: Props) {
  const pendingThemes = initialThemes.filter(t => t.status === 'pendente')

  // Derive year/month from the first theme
  const firstDate = pendingThemes[0]?.theme_date ?? initialThemes[0]?.theme_date ?? ''
  const [year, month] = firstDate.split('-').map(Number)

  const [decided, setDecided] = useState<Map<string, 'aprovado' | 'reprovado'>>(new Map())
  const [selected, setSelected] = useState<string | null>(null)  // theme id
  const [reprovando, setReprovando] = useState<string | null>(null)
  const [reprovText, setReprovText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const grid = buildGrid(year, month)

  // Index themes by date
  const themesByDate = new Map<string, Theme[]>()
  for (const t of pendingThemes) {
    const d = t.theme_date
    if (!themesByDate.has(d)) themesByDate.set(d, [])
    themesByDate.get(d)!.push(t)
  }

  // Index national dates by date
  const ndByDate = new Map<string, NationalDate[]>()
  for (const nd of nationalDates.filter(nd => nd.visible)) {
    if (!ndByDate.has(nd.date)) ndByDate.set(nd.date, [])
    ndByDate.get(nd.date)!.push(nd)
  }

  const total = pendingThemes.length
  const doneCount = decided.size
  const allDone = doneCount === total

  const selectedTheme = pendingThemes.find(t => t.id === selected)

  async function handleApprove(themeId: string) {
    if (submitting) return
    setSubmitting(true)

    await fetch('/api/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, piece_id: themeId, status: 'aprovado' }),
    })

    setDecided(prev => new Map(prev).set(themeId, 'aprovado'))
    setSelected(null)
    setSubmitting(false)

    if (doneCount + 1 === total) {
      setTimeout(onAllDone, 600)
    }
  }

  async function handleReprove(themeId: string) {
    if (submitting || !reprovText.trim()) return
    setSubmitting(true)

    await fetch('/api/approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        piece_id: themeId,
        status: 'reprovado',
        step3_text: reprovText.trim(),
        step1_answers: [],
        step2_answers: [],
        step2_open: '',
      }),
    })

    setDecided(prev => new Map(prev).set(themeId, 'reprovado'))
    setReprovando(null)
    setReprovText('')
    setSelected(null)
    setSubmitting(false)

    if (doneCount + 1 === total) {
      setTimeout(onAllDone, 600)
    }
  }

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#2A2A2A]">
        <div
          className="h-full bg-[#E8192C] transition-all duration-500"
          style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
        />
      </div>

      <div className="flex-1 pt-8 px-4 pb-10 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[#555555] text-xs mb-1">Etapa 1 de 3 — Temas</p>
          <h1 className="text-[#F5F5F5] text-2xl font-semibold leading-snug">
            Aprove os temas de {MONTHS_PT[month - 1]}
          </h1>
          <p className="text-[#888888] text-sm mt-2">
            Toque em um tema no calendário para aprovar ou recusar.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1 bg-[#2A2A2A] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E8192C] rounded-full transition-all"
                style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[#555555] text-xs flex-shrink-0">{doneCount}/{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 flex-wrap text-xs text-[#555555]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E8192C]" />Feriado
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />Data comemorativa
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400" />Tema para aprovar
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-7 border-b border-[#2E2E2E]">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center py-2 text-[#555555] text-[10px] font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((day, idx) => {
              if (day === null) return <div key={idx} className="h-16 border-b border-r border-[#1E1E1E]" />

              const dateStr = toDateStr(year, month, day)
              const dayThemes = themesByDate.get(dateStr) ?? []
              const nds = ndByDate.get(dateStr) ?? []
              const allDecidedOnDay = dayThemes.every(t => decided.has(t.id))
              const hasUndecided = dayThemes.some(t => !decided.has(t.id))

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (dayThemes.length > 0) setSelected(dayThemes[0].id)
                  }}
                  className={cn(
                    'h-16 border-b border-r border-[#1E1E1E] p-1 overflow-hidden',
                    dayThemes.length > 0 ? 'cursor-pointer hover:bg-[#1A1A1A] transition-colors' : ''
                  )}
                >
                  <div className="text-[10px] text-[#555555] mb-0.5">{day}</div>
                  <div className="flex flex-col gap-0.5">
                    {nds.slice(0, 1).map(nd => (
                      <div
                        key={nd.label}
                        className={cn(
                          'text-[8px] px-0.5 rounded truncate leading-tight',
                          nd.type === 'feriado' ? 'text-[#E8192C] bg-[#E8192C]/10' : 'text-blue-400 bg-blue-400/10'
                        )}
                      >{nd.label}</div>
                    ))}
                    {dayThemes.length > 0 && (
                      <div className={cn(
                        'text-[8px] px-0.5 rounded truncate leading-tight',
                        allDecidedOnDay
                          ? decided.get(dayThemes[0].id) === 'aprovado'
                            ? 'text-emerald-400 bg-emerald-400/10'
                            : 'text-red-400 bg-red-400/10'
                          : 'text-violet-400 bg-violet-400/10',
                        hasUndecided && 'font-medium'
                      )}>
                        {dayThemes.length > 1 ? `${dayThemes.length} temas` : 'Tema'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Theme list below calendar */}
        <div className="space-y-2">
          <h2 className="text-[#555555] text-xs font-medium uppercase tracking-wider">Temas do mês</h2>
          {pendingThemes.map(t => {
            const decision = decided.get(t.id)
            const isSelected = selected === t.id

            return (
              <div key={t.id}>
                <button
                  onClick={() => setSelected(isSelected ? null : t.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border transition-all',
                    decision === 'aprovado'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : decision === 'reprovado'
                      ? 'border-red-500/30 bg-red-500/5'
                      : isSelected
                      ? 'border-[#E8192C]/50 bg-[#E8192C]/5'
                      : 'border-[#2E2E2E] bg-[#141414] hover:border-[#555555]'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[#888888] text-xs mb-1">
                        {new Date(t.theme_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'short', day: 'numeric', month: 'short'
                        })}
                      </p>
                      <p className="text-[#F5F5F5] text-sm font-medium">{t.theme_description}</p>
                      {t.theme_headline && (
                        <p className="text-[#555555] text-xs mt-1 italic">"{t.theme_headline}"</p>
                      )}
                    </div>
                    {decision && (
                      <span className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0',
                        decision === 'aprovado' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                      )}>
                        {decision === 'aprovado' ? 'Aprovado' : 'Recusado'}
                      </span>
                    )}
                  </div>
                </button>

                {/* Action panel for selected theme */}
                {isSelected && !decided.has(t.id) && (
                  <div className="mt-2 px-2 space-y-3">
                    {reprovando !== t.id ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setReprovando(t.id)}
                          className="flex-1 border border-[#2E2E2E] bg-[#141414] hover:bg-[#1E1E1E] text-[#888888] hover:text-[#F5F5F5] font-medium py-3.5 rounded-2xl transition-all text-sm"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => handleApprove(t.id)}
                          disabled={submitting}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-medium py-3.5 rounded-2xl transition-all text-sm"
                        >
                          {submitting ? '...' : 'Aprovar'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-[#141414] border border-[#2E2E2E] rounded-2xl p-4">
                        <p className="text-[#F5F5F5] text-sm font-medium">O que precisa mudar?</p>
                        <textarea
                          autoFocus
                          value={reprovText}
                          onChange={e => setReprovText(e.target.value)}
                          placeholder="Descreve o que não agradou ou o que deveria ser diferente..."
                          rows={3}
                          className="w-full bg-[#0A0A0A] border border-[#2E2E2E] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] resize-none leading-relaxed transition-colors"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setReprovando(null); setReprovText('') }}
                            className="flex-1 border border-[#2E2E2E] text-[#888888] py-3 rounded-xl text-sm transition-colors hover:text-[#F5F5F5]"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleReprove(t.id)}
                            disabled={!reprovText.trim() || submitting}
                            className="flex-1 bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-30 text-white font-medium py-3 rounded-xl text-sm transition-colors"
                          >
                            {submitting ? 'Enviando...' : 'Enviar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {allDone && (
          <div className="text-center py-8">
            <p className="text-emerald-400 text-sm font-medium">Todos os temas revisados! ✓</p>
          </div>
        )}
      </div>
    </div>
  )
}
