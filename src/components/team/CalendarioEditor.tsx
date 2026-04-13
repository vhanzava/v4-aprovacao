'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NationalDate } from '@/lib/national-dates'

interface Theme {
  id: string
  title: string
  theme_date: string | null
  theme_description: string | null
  theme_headline: string | null
  status: string
  created_by_email: string | null
}

interface Calendar {
  id: string
  client_id: string
  month: string // YYYY-MM-DD (first of month)
  status: string
  national_dates: NationalDate[]
  client?: { id: string; name: string }
}

interface Props {
  calendar: Calendar
  themes: Theme[]
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const grid: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)
  return grid
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

export function CalendarioEditor({ calendar, themes: initialThemes }: Props) {
  const router = useRouter()
  const [year, month] = calendar.month.split('-').map(Number)

  const [nationalDates, setNationalDates] = useState<NationalDate[]>(calendar.national_dates)
  const [themes, setThemes] = useState<Theme[]>(initialThemes)
  const [saving, setSaving] = useState(false)
  const [markingReady, setMarkingReady] = useState(false)

  // Selected date state for adding theme
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [addingTheme, setAddingTheme] = useState(false)
  const [themeForm, setThemeForm] = useState({ description: '', headline: '' })
  const [themeSubmitting, setThemeSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const grid = buildCalendarGrid(year, month)

  // Index national dates by date
  const ndByDate = new Map<string, NationalDate[]>()
  for (const nd of nationalDates) {
    if (!ndByDate.has(nd.date)) ndByDate.set(nd.date, [])
    ndByDate.get(nd.date)!.push(nd)
  }

  // Index themes by date
  const themesByDate = new Map<string, Theme[]>()
  for (const t of themes) {
    if (!t.theme_date) continue
    if (!themesByDate.has(t.theme_date)) themesByDate.set(t.theme_date, [])
    themesByDate.get(t.theme_date)!.push(t)
  }

  // All national dates reviewed?
  const allReviewed = nationalDates.every(nd => nd.reviewed)
  const reviewedCount = nationalDates.filter(nd => nd.reviewed).length
  const canMarkReady = allReviewed && calendar.status === 'rascunho'

  const toggleNationalDate = useCallback(async (date: string, label: string) => {
    if (saving) return
    setSaving(true)

    const updated = nationalDates.map(nd => {
      if (nd.date === date && nd.label === label) {
        return { ...nd, visible: !nd.visible, reviewed: true }
      }
      return nd
    })

    setNationalDates(updated)

    try {
      await fetch(`/api/calendars/${calendar.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ national_dates: updated }),
      })
    } finally {
      setSaving(false)
    }
  }, [calendar.id, nationalDates, saving])

  const handleAddTheme = useCallback(async () => {
    if (!selectedDate || !themeForm.description.trim()) return
    setThemeSubmitting(true)

    const title = `Tema ${selectedDate} — ${themeForm.description.slice(0, 40)}`
    const res = await fetch('/api/pieces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: calendar.client_id,
        title,
        stage: 1,
        calendar_id: calendar.id,
        theme_date: selectedDate,
        theme_description: themeForm.description.trim(),
        theme_headline: themeForm.headline.trim() || null,
        format: null,
        purpose: null,
      }),
    })

    if (res.ok) {
      const piece = await res.json()
      setThemes(prev => [...prev, piece])
      setThemeForm({ description: '', headline: '' })
      setAddingTheme(false)
    }
    setThemeSubmitting(false)
  }, [calendar.client_id, calendar.id, selectedDate, themeForm])

  const handleDeleteTheme = useCallback(async (themeId: string) => {
    if (!confirm('Remover este tema?')) return
    setDeletingId(themeId)

    await fetch(`/api/pieces/${themeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelada' }),
    })

    setThemes(prev => prev.filter(t => t.id !== themeId))
    setDeletingId(null)
  }, [])

  const handleMarkReady = useCallback(async () => {
    if (!canMarkReady) return
    setMarkingReady(true)

    await fetch(`/api/calendars/${calendar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'pronto' }),
    })

    router.refresh()
    setMarkingReady(false)
  }, [calendar.id, canMarkReady, router])

  const isReady = calendar.status === 'pronto'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-[#F5F5F5]">
              {MONTHS_PT[month - 1]} {year}
            </h1>
            <span className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider',
              isReady
                ? 'bg-emerald-400/10 text-emerald-400'
                : 'bg-amber-400/10 text-amber-400'
            )}>
              {isReady ? 'Pronto' : 'Rascunho'}
            </span>
          </div>
          <p className="text-[#888888] text-sm mt-0.5">
            {calendar.client?.name} — Etapa 1: Temas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-[#555555] text-xs">Salvando...</span>
          )}
          {!isReady && (
            <div className="text-right">
              <button
                onClick={handleMarkReady}
                disabled={!canMarkReady || markingReady}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  canMarkReady
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                    : 'bg-[#1E1E1E] text-[#555555] cursor-not-allowed'
                )}
                title={!canMarkReady ? `Revise todas as datas comemorativas antes (${reviewedCount}/${nationalDates.length})` : ''}
              >
                {markingReady ? 'Salvando...' : 'Marcar como Pronto'}
              </button>
              {!canMarkReady && nationalDates.length > 0 && (
                <p className="text-[#555555] text-xs mt-1">
                  {reviewedCount}/{nationalDates.length} datas revisadas
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-[#555555]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E8192C]" />
          Feriado nacional
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Data comercial
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
          Tema proposto
        </div>
        <span className="ml-auto">Clique em qualquer dia para adicionar tema</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[#2E2E2E]">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center py-2 text-[#555555] text-xs font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {grid.map((day, idx) => {
              if (day === null) {
                return <div key={idx} className="h-20 border-b border-r border-[#1E1E1E]" />
              }

              const dateStr = toDateStr(year, month, day)
              const nds = ndByDate.get(dateStr) ?? []
              const dayThemes = themesByDate.get(dateStr)?.filter(t => t.status !== 'cancelada') ?? []
              const isSelected = selectedDate === dateStr
              const today = new Date()
              const isToday = today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(dateStr)
                    setAddingTheme(true)
                    setThemeForm({ description: '', headline: '' })
                  }}
                  className={cn(
                    'h-20 border-b border-r border-[#1E1E1E] p-1.5 cursor-pointer transition-colors relative overflow-hidden',
                    isSelected ? 'bg-[#1E1E1E] ring-1 ring-inset ring-[#E8192C]/40' : 'hover:bg-[#1A1A1A]'
                  )}
                >
                  {/* Day number */}
                  <div className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 flex-shrink-0',
                    isToday ? 'bg-[#E8192C] text-white' : 'text-[#888888]'
                  )}>
                    {day}
                  </div>

                  {/* National date dots */}
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {nds.slice(0, 2).map(nd => (
                      <div
                        key={nd.label}
                        className={cn(
                          'text-[9px] leading-tight px-1 rounded truncate',
                          nd.type === 'feriado'
                            ? 'bg-[#E8192C]/15 text-[#E8192C]'
                            : 'bg-blue-400/10 text-blue-400',
                          !nd.visible && 'opacity-40'
                        )}
                        title={nd.label}
                      >
                        {nd.label}
                      </div>
                    ))}

                    {/* Theme indicator */}
                    {dayThemes.length > 0 && (
                      <div className="text-[9px] leading-tight px-1 rounded bg-violet-400/10 text-violet-400 truncate">
                        {dayThemes.length} tema{dayThemes.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar: selected date panel + national dates list */}
        <div className="space-y-4">
          {/* Selected date / add theme */}
          {selectedDate && addingTheme && (
            <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[#F5F5F5] text-sm font-medium">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </h3>
                <button
                  onClick={() => { setSelectedDate(null); setAddingTheme(false) }}
                  className="text-[#555555] hover:text-[#888888] text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Existing themes for this date */}
              {(themesByDate.get(selectedDate) ?? []).filter(t => t.status !== 'cancelada').map(t => (
                <div key={t.id} className="bg-[#1E1E1E] rounded-lg p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[#F5F5F5] text-xs font-medium">{t.theme_description}</p>
                    <button
                      onClick={() => handleDeleteTheme(t.id)}
                      disabled={deletingId === t.id}
                      className="text-[#555555] hover:text-red-400 text-[10px] flex-shrink-0 transition-colors"
                    >
                      {deletingId === t.id ? '...' : 'Remover'}
                    </button>
                  </div>
                  {t.theme_headline && (
                    <p className="text-[#555555] text-xs italic">"{t.theme_headline}"</p>
                  )}
                  <div className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full inline-block',
                    t.status === 'aprovado' ? 'bg-emerald-400/10 text-emerald-400' :
                    t.status === 'reprovado' ? 'bg-red-400/10 text-red-400' :
                    'bg-amber-400/10 text-amber-400'
                  )}>
                    {t.status === 'aprovado' ? 'Aprovado' : t.status === 'reprovado' ? 'Recusado' : 'Aguardando'}
                  </div>
                </div>
              ))}

              {/* Add theme form */}
              {!isReady && (
                <div className="space-y-2">
                  <h4 className="text-[#555555] text-xs">Adicionar tema</h4>
                  <input
                    type="text"
                    value={themeForm.description}
                    onChange={e => setThemeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tema / assunto..."
                    className="w-full bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors"
                  />
                  <input
                    type="text"
                    value={themeForm.headline}
                    onChange={e => setThemeForm(prev => ({ ...prev, headline: e.target.value }))}
                    placeholder="Headline de exemplo (opcional)"
                    className="w-full bg-[#0A0A0A] border border-[#2E2E2E] rounded-lg px-3 py-2 text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] transition-colors"
                  />
                  <button
                    onClick={handleAddTheme}
                    disabled={!themeForm.description.trim() || themeSubmitting}
                    className="w-full bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-30 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                  >
                    {themeSubmitting ? 'Salvando...' : '+ Adicionar tema'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* National dates review list */}
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2E2E2E] flex items-center justify-between">
              <h3 className="text-[#888888] text-xs font-medium">Datas comemorativas</h3>
              <span className="text-[#555555] text-xs">{reviewedCount}/{nationalDates.length} revisadas</span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[#1E1E1E]">
              {nationalDates.length === 0 ? (
                <p className="text-[#555555] text-xs px-4 py-3">Nenhuma data neste mês</p>
              ) : (
                nationalDates.map(nd => (
                  <div key={`${nd.date}|${nd.label}`} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs truncate',
                        nd.reviewed ? 'text-[#888888]' : 'text-[#F5F5F5]'
                      )}>
                        {nd.label}
                      </p>
                      <p className="text-[#555555] text-[10px]">
                        {new Date(nd.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        {' · '}
                        <span className={nd.type === 'feriado' ? 'text-[#E8192C]' : 'text-blue-400'}>
                          {nd.type === 'feriado' ? 'Feriado' : 'Comercial'}
                        </span>
                      </p>
                    </div>

                    {/* Toggle: mostrar ao cliente */}
                    <button
                      onClick={() => toggleNationalDate(nd.date, nd.label)}
                      disabled={isReady || saving}
                      className={cn(
                        'flex-shrink-0 relative w-8 h-4 rounded-full transition-colors',
                        nd.visible ? 'bg-emerald-500' : nd.reviewed ? 'bg-[#2E2E2E]' : 'bg-[#2E2E2E] ring-1 ring-amber-400/50',
                        (isReady || saving) && 'opacity-40 cursor-not-allowed'
                      )}
                      title={nd.visible ? 'Visível ao cliente (clique para ocultar)' : 'Oculto ao cliente (clique para mostrar)'}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform shadow-sm',
                        nd.visible ? 'translate-x-4' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
