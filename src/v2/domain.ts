import type { AppState, Content, Conversation, Patient, Role, User, VaccineDose, VaccineRecord } from './types'
import { activeEnrollment, addMonths, ageMonthsExact, currentStepOf, diffDays, TODAY } from './utils'

export type VaccineStatus = 'Realizada' | 'Atrasada' | 'Pendente' | 'Próxima' | 'Futura'

export interface VaccineRow {
  dose: VaccineDose
  record?: VaccineRecord
  due: string
  status: VaccineStatus
}

/**
 * Situação de cada dose para a criança:
 * Realizada · Atrasada (vencida há +30 dias) · Pendente (vencida até 30 dias) · Próxima (nos próximos 30 dias) · Futura.
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

/** Paciente "ativo" na clínica: tem programa pago ou ainda não completou 2 anos. */
export const isPediatricAge = (p: Patient) => ageMonthsExact(p.birthDate) < 24.5

export const conversationsFor = (state: AppState, user: User, childId?: string): Conversation[] => {
  if (user.role === 'parent') return state.conversations.filter((c) => c.patientId === childId)
  // A equipe só conversa com famílias que têm programa ativo.
  return state.conversations.filter((c) => Boolean(activeEnrollment(state, c.patientId)))
}

export const unreadCount = (state: AppState, user: User, childId?: string) => {
  const list = conversationsFor(state, user, childId)
  if (user.role === 'parent') return activeEnrollment(state, childId ?? '') ? list.filter((c) => !c.readByFamily).length : 0
  return list.filter((c) => !c.readByTeam && (user.role !== 'secretary' || c.channel !== 'Dr. André')).length
}

/** Conteúdos visíveis para a criança: do programa ativo, até a etapa atual (inclui gerais). */
export const contentsForChild = (state: AppState, patient: Patient): Array<Content & { current: boolean }> => {
  const enr = activeEnrollment(state, patient.id)
  if (!enr) return state.contents.filter((c) => c.published && c.programId === 'all').map((c) => ({ ...c, current: false }))
  const step = currentStepOf(enr.program, patient)?.n ?? 1
  return state.contents
    .filter((c) => c.published && (c.programId === 'all' || (c.programId === enr.program.id && c.step <= step)))
    .map((c) => ({ ...c, current: c.programId === enr.program.id && c.step === step }))
    .sort((a, b) => Number(b.current) - Number(a.current) || b.step - a.step)
}

export const canSeeChannel = (role: Role, channel: Conversation['channel']) => role !== 'secretary' || channel !== 'Dr. André'
