export interface NationalDate {
  date: string // YYYY-MM-DD
  label: string
  type: 'feriado' | 'comercial'
  visible: boolean   // team approved for client
  reviewed: boolean  // team has explicitly toggled it
}

// Gauss algorithm for Easter (Gregorian)
function getEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function getNthWeekday(year: number, month: number, weekday: number, nth: number): Date {
  const d = new Date(year, month - 1, 1)
  let count = 0
  while (d.getMonth() === month - 1) {
    if (d.getDay() === weekday && ++count === nth) return new Date(d)
    d.setDate(d.getDate() + 1)
  }
  throw new Error('weekday not found')
}

function getLastWeekday(year: number, month: number, weekday: number): Date {
  const d = new Date(year, month, 0)
  while (d.getDay() !== weekday) d.setDate(d.getDate() - 1)
  return d
}

/** Returns all national + commercial dates for a given year/month, ready for DB storage */
export function buildNationalDatesForMonth(year: number, month: number): NationalDate[] {
  const result: { date: string; label: string; type: 'feriado' | 'comercial' }[] = []
  const seen = new Set<string>()

  function push(date: string, label: string, type: 'feriado' | 'comercial') {
    const key = `${date}|${label}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ date, label, type })
    }
  }

  function fixed(m: number, d: number, label: string, type: 'feriado' | 'comercial') {
    if (m === month) {
      push(`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, label, type)
    }
  }

  function variable(dt: Date, label: string, type: 'feriado' | 'comercial') {
    if (dt.getFullYear() === year && dt.getMonth() + 1 === month) {
      push(toISO(dt), label, type)
    }
  }

  // ── Feriados fixos ──────────────────────────────────────────────────────────
  fixed(1,  1,  'Ano Novo', 'feriado')
  fixed(4,  21, 'Tiradentes', 'feriado')
  fixed(5,  1,  'Dia do Trabalho', 'feriado')
  fixed(9,  7,  'Independência do Brasil', 'feriado')
  fixed(10, 12, 'Nossa Senhora Aparecida', 'feriado')
  fixed(11, 2,  'Finados', 'feriado')
  fixed(11, 15, 'Proclamação da República', 'feriado')
  fixed(12, 25, 'Natal', 'feriado')

  // ── Feriados variáveis ──────────────────────────────────────────────────────
  try {
    const easter = getEaster(year)
    variable(addDays(easter, -48), 'Carnaval (Segunda)', 'feriado')
    variable(addDays(easter, -47), 'Carnaval (Terça)', 'feriado')
    variable(addDays(easter, -2),  'Sexta-feira Santa', 'feriado')
    variable(easter,               'Páscoa', 'feriado')
    variable(addDays(easter, 60),  'Corpus Christi', 'feriado')
  } catch { /* ignore */ }

  // ── Datas comerciais fixas ──────────────────────────────────────────────────
  fixed(1,  28, 'Dia da Proteção de Dados', 'comercial')
  fixed(2,  14, 'Dia dos Namorados (Internacional)', 'comercial')
  fixed(3,  8,  'Dia Internacional da Mulher', 'comercial')
  fixed(3,  15, 'Dia do Consumidor', 'comercial')
  fixed(4,  1,  'Dia da Mentira', 'comercial')
  fixed(6,  12, 'Dia dos Namorados', 'comercial')
  fixed(10, 12, 'Dia das Crianças', 'comercial')
  fixed(10, 15, 'Dia dos Professores', 'comercial')
  fixed(10, 31, 'Halloween', 'comercial')
  fixed(12, 24, 'Véspera de Natal', 'comercial')
  fixed(12, 31, 'Réveillon', 'comercial')

  // ── Datas comerciais variáveis ──────────────────────────────────────────────
  try {
    if (month === 5)  variable(getNthWeekday(year, 5, 0, 2), 'Dia das Mães', 'comercial')
    if (month === 8)  variable(getNthWeekday(year, 8, 0, 2), 'Dia dos Pais', 'comercial')
  } catch { /* ignore */ }

  try {
    const bf = getLastWeekday(year, 11, 5) // última sexta de novembro = Black Friday
    const semBF = addDays(bf, -4)          // segunda anterior
    const cm = addDays(bf, 3)              // Cyber Monday

    variable(semBF, 'Início Semana Black Friday', 'comercial')
    variable(bf,    'Black Friday', 'comercial')
    variable(cm,    'Cyber Monday', 'comercial')
  } catch { /* ignore */ }

  return result
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({ ...d, visible: false, reviewed: false }))
}

/** Merge saved DB national_dates with freshly generated ones (adds new dates, keeps reviewed state) */
export function mergeNationalDates(
  saved: NationalDate[],
  generated: NationalDate[]
): NationalDate[] {
  const savedMap = new Map(saved.map(d => [`${d.date}|${d.label}`, d]))
  return generated.map(g => savedMap.get(`${g.date}|${g.label}`) ?? g)
}
