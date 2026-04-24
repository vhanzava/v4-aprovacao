'use client'

import { useState } from 'react'
import { getReprovacaoFlow } from '@/lib/reproval-flows'
import { cn } from '@/lib/utils'
import type { Piece } from '@/lib/types'

interface Props {
  piece: Piece
  onComplete: (feedback: {
    step1_answers: string[]
    step2_answers: string[]
    step2_open: string
    step3_text: string
  }) => void
  onCancel: () => void
  submitting: boolean
}

type Step = 1 | 2 | 3

export function ReprovacaoPanel({ piece, onComplete, onCancel, submitting }: Props) {
  const isStage2 = piece.stage === 2
  const flow = getReprovacaoFlow(piece.format, piece.purpose)

  const [step, setStep] = useState<Step>(1)
  const [step1Answers, setStep1Answers] = useState<string[]>([])
  const [step1Open, setStep1Open] = useState('')
  const [step2Answers, setStep2Answers] = useState<string[]>([])
  const [step2Open, setStep2Open] = useState('')
  const [step3Text, setStep3Text] = useState('')
  // Local guard to prevent double-tap on mobile
  const [localSending, setLocalSending] = useState(false)
  const isSending = submitting || localSending

  // Which step1 answers have step2 defined
  const step1AnswersWithStep2 = step1Answers.filter(a => a !== 'outro' && !!flow.step2Map[a])

  function toggleStep1(value: string) {
    setStep1Answers(prev => {
      if (value === 'outro') {
        return prev.includes('outro') ? prev.filter(v => v !== 'outro') : [...prev.filter(v => v !== 'outro'), 'outro']
      }
      return prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    })
  }

  function toggleStep2(value: string) {
    setStep2Answers(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  function handleNextFromStep1() {
    if (step1AnswersWithStep2.length > 0) {
      setStep(2)
    } else {
      setStep(3)
    }
    setTimeout(() => {
      document.getElementById('reproval-step-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function handleNextFromStep2() {
    setStep(3)
    setTimeout(() => {
      document.getElementById('reproval-step-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function handleSubmit() {
    if (!step3Text.trim() || isSending) return
    setLocalSending(true)

    const allStep1: string[] = [
      ...step1Answers.filter(a => a !== 'outro'),
      ...(step1Open.trim() ? [`Outro: ${step1Open.trim()}`] : []),
    ]
    const allStep2: string[] = [
      ...step2Answers.filter(a => a !== 'outro'),
    ]

    onComplete({
      step1_answers: allStep1,
      step2_answers: allStep2,
      step2_open: step2Open.trim(),
      step3_text: step3Text.trim(),
    })
  }

  const totalSteps = step1AnswersWithStep2.length > 0 ? 3 : 2
  const currentStepNum = step === 1 ? 1 : step === 2 ? 2 : totalSteps

  // ── Stage 2: simple open-text reproval ──────────────────────────────────
  if (isStage2) {
    return (
      <div className="bg-[#0A0A0A] min-h-[40dvh]">
        <div className="px-4 pt-6 pb-8 max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[#F5F5F5] font-medium">O que precisa mudar?</p>
            <button
              onClick={onCancel}
              className="text-[#555555] hover:text-[#888888] text-xs flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Cancelar
            </button>
          </div>
          <textarea
            autoFocus
            value={step3Text}
            onChange={e => setStep3Text(e.target.value)}
            placeholder="Descreve o que não agradou no copy ou na legenda..."
            rows={4}
            className="w-full bg-[#141414] border border-[#2E2E2E] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] resize-none leading-relaxed transition-colors"
          />
          <button
            onClick={() => {
              if (!step3Text.trim() || isSending) return
              setLocalSending(true)
              onComplete({ step1_answers: [], step2_answers: [], step2_open: '', step3_text: step3Text.trim() })
            }}
            disabled={!step3Text.trim() || isSending}
            className="w-full bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-30 text-white font-medium py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : 'Enviar feedback'}
          </button>
        </div>
      </div>
    )
  }

  // ── Stage 3 (default): structured reproval flow ──────────────────────────
  return (
    <div className="bg-[#0A0A0A] min-h-[60dvh]">
      {/* Panel header */}
      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[#555555] text-xs">
            Passo {currentStepNum} de {totalSteps}
          </p>
          <button
            onClick={onCancel}
            className="text-[#555555] hover:text-[#888888] text-xs flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Cancelar
          </button>
        </div>
        {/* Step progress dots */}
        <div className="flex gap-1.5 mt-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-0.5 flex-1 rounded-full transition-all',
                i + 1 <= currentStepNum ? 'bg-[#E8192C]' : 'bg-[#2E2E2E]'
              )}
            />
          ))}
        </div>
      </div>

      <div id="reproval-step-content" className="px-4 pb-10 max-w-lg mx-auto space-y-6">
        {/* Step 1 */}
        {step === 1 && (
          <StepContainer
            question={flow.step1.question}
            hint="Pode selecionar mais de uma opção"
          >
            <div className="space-y-2">
              {flow.step1.options.map(opt => (
                <div key={opt.value}>
                  <OptionButton
                    label={opt.label}
                    selected={step1Answers.includes(opt.value)}
                    onClick={() => toggleStep1(opt.value)}
                  />
                  {opt.opens_field && step1Answers.includes(opt.value) && (
                    <textarea
                      autoFocus
                      value={step1Open}
                      onChange={e => setStep1Open(e.target.value)}
                      placeholder="Descreve o que não agradou..."
                      rows={3}
                      className="mt-2 w-full bg-[#141414] border border-[#E8192C]/30 rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] resize-none leading-relaxed"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleNextFromStep1}
              disabled={step1Answers.length === 0 && !step1Open.trim()}
              className="w-full bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-30 text-white font-medium py-4 rounded-2xl transition-colors text-sm mt-2"
            >
              Continuar
            </button>
          </StepContainer>
        )}

        {/* Step 2 */}
        {step === 2 && step1AnswersWithStep2.length > 0 && (
          <div className="space-y-6">
            {step1AnswersWithStep2.map(trigger => {
              const step2Config = flow.step2Map[trigger]
              if (!step2Config) return null

              if (step2Config.type === 'date_picker') {
                return (
                  <StepContainer key={trigger} question={step2Config.question}>
                    <input
                      type="date"
                      onChange={e => setStep2Open(e.target.value)}
                      className="w-full bg-[#141414] border border-[#2E2E2E] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#E8192C] transition-colors"
                    />
                  </StepContainer>
                )
              }

              return (
                <StepContainer
                  key={trigger}
                  question={step2Config.question}
                  hint="Pode selecionar mais de uma opção"
                >
                  <div className="space-y-2">
                    {step2Config.options?.map(opt => (
                      <div key={opt.value}>
                        <OptionButton
                          label={opt.label}
                          selected={step2Answers.includes(opt.value)}
                          onClick={() => toggleStep2(opt.value)}
                        />
                        {opt.opens_field && step2Answers.includes(opt.value) && (
                          <textarea
                            value={step2Open}
                            onChange={e => setStep2Open(e.target.value)}
                            placeholder="Detalha aqui..."
                            rows={2}
                            className="mt-2 w-full bg-[#141414] border border-[#E8192C]/30 rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] resize-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </StepContainer>
              )
            })}

            <button
              onClick={handleNextFromStep2}
              disabled={step2Answers.length === 0 && !step2Open.trim()}
              className="w-full bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-30 text-white font-medium py-4 rounded-2xl transition-colors text-sm"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 3 — open field, always shown */}
        {step === 3 && (
          <StepContainer question={flow.step3.question}>
            <textarea
              autoFocus
              value={step3Text}
              onChange={e => setStep3Text(e.target.value)}
              placeholder={flow.step3.placeholder}
              rows={5}
              className="w-full bg-[#141414] border border-[#2E2E2E] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#E8192C] resize-none leading-relaxed transition-colors"
            />
            <p className="text-[#555555] text-xs mt-2 text-right">
              {step3Text.length} caracteres
            </p>

            <button
              onClick={handleSubmit}
              disabled={!step3Text.trim() || isSending}
              className="w-full bg-[#E8192C] hover:bg-[#C41020] disabled:opacity-30 text-white font-medium py-4 rounded-2xl transition-colors text-sm mt-2 flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar feedback'
              )}
            </button>
          </StepContainer>
        )}
      </div>
    </div>
  )
}

function StepContainer({
  question,
  hint,
  children,
}: {
  question: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[#F5F5F5] text-xl font-semibold leading-snug">{question}</h3>
        {hint && <p className="text-[#555555] text-sm mt-1">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-5 py-4 rounded-2xl border text-sm transition-all',
        selected
          ? 'border-[#E8192C] bg-[#E8192C]/8 text-[#F5F5F5]'
          : 'border-[#2E2E2E] bg-[#141414] text-[#888888] hover:border-[#555555] hover:text-[#F5F5F5]'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
          selected ? 'border-[#E8192C] bg-[#E8192C]' : 'border-[#2E2E2E]'
        )}>
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        {label}
      </div>
    </button>
  )
}
