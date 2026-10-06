import type { AppState, Content, Conversation, Patient, User, VaccineDose, VaccineRecord } from './types'
import { activeEnrollment, addMonths, currentStepOf, diffDays, TODAY } from './utils'

export type VaccineStatus = 'Realizada' | 'Atrasada' | 'Pendente' | 'Próxima' | 'Futura'

export interface VaccineRow {
  dose: VaccineDose
  record?: VaccineRecord
  due: string
  status: VaccineStatus
}

/**
 * Situação de cada dose para a criança, a partir da idade recomendada no calendário SBP:
 * Realizada · Atrasada (idade recomendada passou há +30 dias) · Pendente (passou até 30 dias)
 * · Próxima (nos próximos 30 dias) · Futura.
 * A janela de 30 dias é um critério de VISUALIZAÇÃO do protótipo, não regra clínica.
 */
export const vaccineRows = (state: AppState, patient: Patient): VaccineRow[] =>
  state.vaccineCatalog
    .map((dose) => {
      const record = state.vaccineRecords.find((r) => r.patientId === patient.id && r.doseId === dose.id)
      const due = addMonths(patient.birthDate, dose.ageMonths)
      const late = diffDays(TODAY, due)
      const status: VaccineStatus = record ? 'Realizada' : late > 30 ? 'Atrasada' : late >= 0 ? 'Pendente' : late >= -30 ? 'Próxima' : 'Futura'
      return { dose, record, due, status }
    })
    .sort((a, b) => a.dose.ageMonths - b.dose.ageMonths || a.dose.vaccine.localeCompare(b.dose.vaccine))

export const pendingVaccines = (state: AppState, patient: Patient) =>
  vaccineRows(state, patient).filter((r) => r.status === 'Atrasada' || r.status === 'Pendente' || r.status === 'Próxima')

/* ------------------------------------------------------------------ */
/* Mensagens                                                           */
/* ------------------------------------------------------------------ */

/** REGRA CONFIRMADA: somente família com programa PAGO e ATIVO pode ENVIAR mensagens. */
export const familyCanSend = (state: AppState, patientId: string) => Boolean(activeEnrollment(state, patientId))

/** Caixa de mensagens Crescer: a equipe (Dr. André e secretaria) vê todas as conversas. */
export const conversationsFor = (state: AppState, user: User, childId?: string): Conversation[] =>
  user.role === 'parent' ? state.conversations.filter((c) => c.patientId === childId) : state.conversations

export const unreadCount = (state: AppState, user: User, childId?: string) => {
  const list = conversationsFor(state, user, childId)
  return user.role === 'parent' ? list.filter((c) => !c.readByFamily).length : list.filter((c) => !c.readByTeam).length
}

/* ------------------------------------------------------------------ */
/* Conteúdos                                                           */
/* ------------------------------------------------------------------ */

/**
 * Conteúdos visíveis para a criança: do programa ativo até a etapa atual, mais os gerais.
 * Sem programa ativo: somente conteúdos gerais (o escopo do acesso gratuito ainda será
 * validado com o Dr. André).
 */
export const contentsForChild = (state: AppState, patient: Patient): Array<Content & { current: boolean }> => {
  const enr = activeEnrollment(state, patient.id)
  if (!enr) return state.contents.filter((c) => c.published && c.programId === 'all').map((c) => ({ ...c, current: false }))
  const step = currentStepOf(enr.program, patient)?.n ?? 1
  return state.contents
    .filter((c) => c.published && (c.programId === 'all' || (c.programId === enr.program.id && c.step <= step)))
    .map((c) => ({ ...c, current: c.programId === enr.program.id && c.step === step }))
    .sort((a, b) => Number(b.current) - Number(a.current) || b.step - a.step)
}
