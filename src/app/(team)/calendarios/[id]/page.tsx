import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { CalendarioEditor } from '@/components/team/CalendarioEditor'
import { buildNationalDatesForMonth, mergeNationalDates } from '@/lib/national-dates'

export default async function CalendarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServiceClient()

  const [calRes, themesRes] = await Promise.all([
    supabase
      .from('calendars')
      .select('*, client:clients(id, name)')
      .eq('id', id)
      .single(),
    supabase
      .from('pieces')
      .select('id, title, theme_date, theme_description, theme_headline, status, created_by_email')
      .eq('calendar_id', id)
      .eq('stage', 1)
      .order('theme_date', { ascending: true }),
  ])

  if (!calRes.data) notFound()

  const calendar = calRes.data
  const [year, month] = (calendar.month as string).split('-').map(Number)

  // Auto-initialize national_dates if empty (first time opening this calendar)
  let nationalDates = calendar.national_dates as ReturnType<typeof buildNationalDatesForMonth>
  if (!nationalDates || nationalDates.length === 0) {
    const generated = buildNationalDatesForMonth(year, month)
    nationalDates = generated
    // Save to DB
    await supabase
      .from('calendars')
      .update({ national_dates: nationalDates })
      .eq('id', id)
  } else {
    // Merge: add any new dates from library, keep reviewed state for existing ones
    const generated = buildNationalDatesForMonth(year, month)
    nationalDates = mergeNationalDates(nationalDates, generated)
  }

  return (
    <CalendarioEditor
      calendar={{ ...calendar, national_dates: nationalDates }}
      themes={themesRes.data ?? []}
    />
  )
}
