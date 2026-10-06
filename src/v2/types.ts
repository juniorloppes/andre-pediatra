export type Role = 'doctor' | 'secretary' | 'admin' | 'parent'
export type Sex = 'F' | 'M'

export type Page =
  | 'home' | 'patients' | 'patient' | 'agenda' | 'programs' | 'program' | 'followup'
  | 'contents' | 'growth' | 'vaccines' | 'messages' | 'sales' | 'new-sale' | 'reports' | 'users'
  | 'child' | 'my-program' | 'materials'

export interface Route {
  page: Page
  id?: string
  tab?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  title: string
  active: boolean
  /** Para responsáveis: crianças vinculadas */
  patientIds?: string[]
}

export interface Patient {
  id: string
  name: string
  sex: Sex
  birthDate: string // ISO yyyy-mm-dd
  guardian: string
  guardianRelation: string
  phone: string
  email: string
  createdAt: string
  notes?: string
}

export interface ProgramStep {
  n: number
  startDay: number
  endDay: number
  title: string
  subtitle: string
  goal: string
  themes: string[]
  orientations: string[]
  checklist: string[]
  challenge: string
  celebration: string
}

export interface Program {
  id: string
  name: string
  ageLabel: string
  /** Idade (dias) em que o programa começa e termina */
  startAgeDays: number
  endAgeDays: number
  /** Intervalo entre encontros de acompanhamento (dias) */
  cadenceDays: number
  price: number
  description: string
  active: boolean
  steps: ProgramStep[]
}

export type SaleStatus = 'Pago' | 'Pendente' | 'Cancelado'
export type PaymentMethod = 'PIX' | 'Cartão de crédito' | 'Boleto' | 'Dinheiro' | 'Transferência'

export interface Sale {
  id: string
  patientId: string
  programId: string
  listPrice: number
  discount: number
  payment: PaymentMethod
  installments: number
  saleDate: string
  startDate: string
  status: SaleStatus
  createdBy: string
}

export interface Pendency {
  id: string
  text: string
  done: boolean
  familyVisible: boolean
}

export interface FollowUp {
  id: string
  patientId: string
  programId: string
  step: number
  date: string
  author: string
  evolution: string
  orientations: string
  pendencies: Pendency[]
}

export type ContentType = 'texto' | 'imagem' | 'video'

export interface Content {
  id: string
  type: ContentType
  title: string
  summary: string
  body: string
  url?: string
  programId: string | 'all'
  step: number | 0 // 0 = todas as etapas
  createdAt: string
  author: string
  published: boolean
}

export interface VaccineDose {
  id: string
  vaccine: string
  dose: string
  ageMonths: number
  network: 'SUS + particular' | 'Particular'
  notes?: string
}

export interface VaccineRecord {
  id: string
  patientId: string
  doseId: string
  date: string
  lot?: string
  place?: string
}

export interface GrowthRecord {
  id: string
  patientId: string
  date: string
  weight: number // kg
  height: number // cm
  head: number // cm
}

export interface Appointment {
  id: string
  patientId: string
  date: string
  time: string
  kind: string
  professional: string
  status: 'Agendado' | 'Realizado' | 'Cancelado'
}

export interface Message {
  id: string
  from: 'family' | 'team'
  author: string
  text: string
  at: string // ISO datetime
}

export interface Conversation {
  id: string
  patientId: string
  channel: 'Equipe Crescer' | 'Dr. André' | 'Nutrição'
  messages: Message[]
  readByTeam: boolean
  readByFamily: boolean
}

export interface StepProgress {
  /** chave `${patientId}:${programId}:${step}` → itens de checklist marcados */
  [key: string]: number[]
}

export interface AppState {
  version: number
  users: User[]
  patients: Patient[]
  programs: Program[]
  sales: Sale[]
  followUps: FollowUp[]
  contents: Content[]
  vaccineCatalog: VaccineDose[]
  vaccineRecords: VaccineRecord[]
  growth: GrowthRecord[]
  appointments: Appointment[]
  conversations: Conversation[]
  stepProgress: StepProgress
}
