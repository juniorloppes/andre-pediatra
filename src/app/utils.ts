import type { AppState, Patient, Program, ProgramContract, ProgramStatus, Sale } from './types'

/** Data de referência da demonstração (mantém os dados de exemplo coerentes). */
export const TODAY = '2026-10-06'

export const uid = () => Math.random().toString(36).slice(2, 10)

const DAY = 86_400_000
const parse = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export const toISO = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const addDays = (iso: string, days: number) => toISO(parse(iso) + days * DAY)
export const diffDays = (a: string, b: string) => Math.round((parse(a) - parse(b)) / DAY)

export const addMonths = (iso: string, months: number) => {
  const d = new Date(parse(iso))
  const whole = Math.floor(months)
  d.setUTCMonth(d.getUTCMonth() + whole)
  return toISO(d.getTime() + Math.round((months - whole) * 30.4375) * DAY)
}

export const fmtDate = (iso?: string) => {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MONTHS_FULL = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const monthShort = (iso: string) => MONTHS[Number(iso.slice(5, 7)) - 1]
export const fmtLongDate = (iso: string) => {
  const d = new Date(parse(iso))
  return `${WEEKDAYS[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, '0')} de ${MONTHS_FULL[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}
export const fmtDayMonth = (iso: string) => `${iso.slice(8, 10)} ${monthShort(iso)}`

export const fmtTime = (isoDateTime: string) => isoDateTime.slice(11, 16)

export const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const ageDays = (birth: string, at = TODAY) => diffDays(at, birth)
export const ageMonthsExact = (birth: string, at = TODAY) => ageDays(birth, at) / 30.4375

/** "3 meses, 12 dias" / "1 ano e 2 meses" */
export const ageLabel = (birth: string, at = TODAY, short = false) => {
  const days = ageDays(birth, at)
  if (days < 0) return '—'
  if (days < 31) return `${days} ${days === 1 ? 'dia' : 'dias'}`
  const b = new Date(parse(birth))
  const t = new Date(parse(at))
  let months = (t.getUTCFullYear() - b.getUTCFullYear()) * 12 + t.getUTCMonth() - b.getUTCMonth()
  let rest = t.getUTCDate() - b.getUTCDate()
  if (rest < 0) {
    months -= 1
    const prevMonthDays = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0)).getUTCDate()
    rest += prevMonthDays
  }
  if (months < 12) {
    const m = `${months} ${months === 1 ? 'mês' : 'meses'}`
    return short || rest === 0 ? m : `${m}, ${rest} ${rest === 1 ? 'dia' : 'dias'}`
  }
  const y = Math.floor(months / 12)
  const m = months % 12
  const ys = `${y} ${y === 1 ? 'ano' : 'anos'}`
  return m ? `${ys} e ${m} ${m === 1 ? 'mês' : 'meses'}` : ys
}

export const initials = (name: string) =>
  name.replace(/^(Dr|Dra)\.\s*/, '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export const firstName = (name: string) => name.replace(/^(Dr|Dra)\.\s*/, '').split(' ')[0]

export const finalPrice = (s: Pick<Sale, 'listPrice' | 'discount'>) => Math.max(0, s.listPrice - s.discount)

/* ------------------------------------------------------------------ */
/* Produto → Venda → Pagamento → Programa ativo → Vigência             */
/* ------------------------------------------------------------------ */

export const contractOf = (program: Program | undefined, contractId: string): ProgramContract | undefined =>
  program?.contracts.find((c) => c.id === contractId)

/** Situação do programa vendido: deriva do pagamento e da vigência. */
export const programStatus = (sale: Sale, at = TODAY): ProgramStatus => {
  if (sale.paymentStatus === 'Cancelado') return 'Cancelado'
  if (sale.paymentStatus === 'Pendente') return 'Pagamento pendente'
  if (at < sale.startDate) return 'Aguardando início'
  if (at > sale.endDate) return 'Programa encerrado'
  return 'Programa ativo'
}

/** Dias até o fim da vigência (negativo = já encerrado). */
export const daysToEnd = (sale: Sale, at = TODAY) => diffDays(sale.endDate, at)

/**
 * Janela usada SOMENTE como exemplo visual de "próximo do vencimento".
 * A antecedência real dos alertas ainda será definida com o Dr. André.
 */
export const DEMO_EXPIRY_WINDOW_DAYS = 60

/** Venda mais recente (não cancelada) do paciente. */
export const currentSale = (state: AppState, patientId: string) =>
  state.sales
    .filter((s) => s.patientId === patientId && s.paymentStatus !== 'Cancelado')
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0]

export interface Enrollment { sale: Sale; program: Program; contract: ProgramContract }

/** Programa ativo = venda paga e dentro da vigência. */
export const activeEnrollment = (state: AppState, patientId: string): Enrollment | undefined => {
  const sale = state.sales
    .filter((s) => s.patientId === patientId && programStatus(s) === 'Programa ativo')
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  const program = sale && state.programs.find((p) => p.id === sale.programId)
  const contract = sale && contractOf(program, sale.contractId)
  return sale && program && contract ? { sale, program, contract } : undefined
}

export const hasActiveProgram = (state: AppState, patientId: string) => Boolean(activeEnrollment(state, patientId))

/** Etapa do programa pela idade da criança (em dias). */
export const currentStepOf = (program: Program, patient: Patient, at = TODAY) => {
  const days = ageDays(patient.birthDate, at)
  const steps = program.steps
  if (!steps.length) return undefined
  if (days < steps[0].startDay) return steps[0]
  return steps.find((s) => days >= s.startDay && days < s.endDay) ?? steps[steps.length - 1]
}

/**
 * Situação do acompanhamento — rótulos NEUTROS.
 * Se todo passo exige encontro e quando um encontro fica "atrasado" ainda não foi definido
 * pelo Dr. André; por isso o protótipo apenas informa passos sem registro, sem marcar atraso.
 */
export type FollowState = 'Encontro registrado' | 'Aguardando encontro' | 'Passos anteriores sem registro'

export const followUpSituation = (state: AppState, patient: Patient, enr: Enrollment) => {
  const { program, contract, sale } = enr
  const step = currentStepOf(program, patient)
  const records = state.followUps.filter((f) => f.patientId === patient.id && f.programId === program.id)
  const doneSteps = new Set(records.map((r) => r.step))
  const openPendencies = records.flatMap((r) => r.pendencies).filter((p) => !p.done).length
  const days = ageDays(patient.birthDate)
  const stepEnd = (n: number) => addDays(patient.birthDate, program.steps[n - 1]?.endDay ?? 0)
  // Passos do contrato vigente que terminaram depois do início da vigência e não têm encontro registrado.
  const missing = program.steps.filter((s) => s.n >= contract.fromStep && s.n <= contract.toStep && s.endDay <= days && stepEnd(s.n) > sale.startDate && !doneSteps.has(s.n))
  const currentDone = step ? doneSteps.has(step.n) : false
  const stepWindowEnd = step ? addDays(patient.birthDate, step.endDay) : undefined
  const status: FollowState = missing.length ? 'Passos anteriores sem registro' : currentDone ? 'Encontro registrado' : 'Aguardando encontro'
  const flagged = records.filter((r) => r.flaggedForDoctor).length
  return { step, records, doneSteps, openPendencies, missing, currentDone, stepWindowEnd, status, flagged }
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const bmi = (weight: number, heightCm: number) => (heightCm ? weight / (heightCm / 100) ** 2 : 0)

export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const youtubeEmbed = (url?: string) => {
  if (!url) return undefined
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : undefined
}
