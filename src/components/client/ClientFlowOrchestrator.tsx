'use client'

import { useState } from 'react'
import { CalendarioApproval } from './CalendarioApproval'
import { ClientApprovalFlow } from './ClientApprovalFlow'
import type { Piece, Client } from '@/lib/types'

interface NationalDate {
  date: string
  label: string
  type: 'feriado' | 'comercial'
  visible: boolean
}

interface CalendarData {
  id: string
  national_dates: NationalDate[]
}

interface Props {
  client: Pick<Client, 'id' | 'name'>
  token: string
  stage1Themes: Piece[]
  calendarNationalDates: NationalDate[]
  laterPieces: Piece[]
}

export function ClientFlowOrchestrator({
  client,
  token,
  stage1Themes,
  calendarNationalDates,
  laterPieces,
}: Props) {
  const [stage1Done, setStage1Done] = useState(stage1Themes.length === 0)

  const hasStage1 = stage1Themes.length > 0
  const hasLater = laterPieces.length > 0

  // Nothing at all
  if (!hasStage1 && !hasLater) {
    return <EmptyState clientName={client.name} />
  }

  // Show stage 1 calendar first
  if (hasStage1 && !stage1Done) {
    return (
      <CalendarioApproval
        clientName={client.name}
        token={token}
        themes={stage1Themes.map(p => ({
          id: p.id,
          title: p.title,
          theme_date: p.theme_date!,
          theme_description: p.theme_description ?? null,
          theme_headline: p.theme_headline ?? null,
          status: p.status,
        }))}
        nationalDates={calendarNationalDates}
        onAllDone={() => {
          if (hasLater) {
            setStage1Done(true)
          } else {
            setStage1Done(true)
          }
        }}
      />
    )
  }

  // After stage 1 is done (or skipped), show stage 2/3 pieces
  if (hasLater) {
    return (
      <ClientApprovalFlow
        client={client}
        pieces={laterPieces}
        token={token}
      />
    )
  }

  // Stage 1 done and no stage 2/3 pieces
  return <EmptyState clientName={client.name} />
}

function EmptyState({ clientName }: { clientName: string }) {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-[#F5F5F5] font-medium text-lg">Tudo em dia!</p>
      <p className="text-[#888888] text-sm mt-2 max-w-xs">
        Não há itens aguardando sua aprovação no momento.
      </p>
      <div className="mt-8">
        <span className="text-[#555555] text-xs">
          <span className="text-[#E8192C] font-medium">V4</span> Aprovações
        </span>
      </div>
    </div>
  )
}
