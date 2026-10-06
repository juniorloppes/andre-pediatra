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

/** Item do Mapa do Passo: pergunta objetiva SIM/NÃO, agrupada por pilar. */
export interface MapItem {
  pillar: string
  question: string
}

/** Situação do texto do passo em relação ao documento "Meus Primeiros Passos". */
export type StepSource = 'documento' | 'pendente' | 'demonstrativo'

export interface ProgramStep {
  n: number
  startDay: number
  endDay: number
  /** Faixa como o documento escreve (ex.: "12 a 13,5 meses") */
  rangeLabel: string
  /** Tema central do passo */
  title: string
  challenges: string[]
  /** Encontro do passo: consulta com o médico ou triagem com a equipe */
  encounter: string
  map: MapItem[]
  goal: string
  parentChallenge: string
  celebration: string
  source: StepSource
}

/** Contrato vendável de um programa (ex.: Ano 1 e Ano 2 do Meus Primeiros Passos). */
export interface ProgramContract {
  id: string
  label: string
  fromStep: number
  toStep: number
  durationMonths: number
  price: number
}

/** Programa = produto que pode ser vendido para uma criança/família. */
export interface Program {
  id: string
  name: string
  ageLabel: string
  description: string
  startAgeDays: number
  endAgeDays: number
  /** Duração de cada passo (dias) */
  stepDays: number
  active: boolean
  benefits: string[]
  contracts: ProgramContract[]
  steps: ProgramStep[]
}

export type PaymentStatus = 'Pendente' | 'Pago' | 'Cancelado'
export type PaymentMethod = 'PIX' | 'Cartão de crédito' | 'Boleto' | 'Transferência' | 'Dinheiro' | 'A definir'

export interface Sale {
  id: string
  patientId: string
  programId: string
  contractId: string
  listPrice: number
  discount: number
  /** Forma de pagamento — dado demonstrativo (formas reais a definir com Dr. André) */
  payment: PaymentMethod
  installments: number
  saleDate: string
  /** Início e fim da vigência do programa */
  startDate: string
  endDate: string
  paymentStatus: PaymentStatus
  paidAt?: string
  createdBy: string
}

/** Situação do programa vendido, derivada da venda + datas. */
export type ProgramStatus = 'Pagamento pendente' | 'Programa ativo' | 'Aguardando início' | 'Programa encerrado' | 'Cancelado'

export interface Pendency {
  id: string
  text: string
  done: boolean
  familyVisible: boolean
}

export type EncounterKind = 'Consulta com o Dr. André' | 'Triagem com a equipe'

export interface FollowUp {
  id: string
  patientId: string
  programId: string
  step: number
  kind: EncounterKind
  date: string
  author: string
  /** Respostas do Mapa do Passo (índice do item → SIM/NÃO) */
  mapAnswers: Record<number, 'SIM' | 'NÃO'>
  evolution: string
  orientations: string
  pendencies: Pendency[]
  /** Sinalizado para avaliação do Dr. André (equipe não decide conduta) */
  flaggedForDoctor?: boolean
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
  /** Para respostas da equipe: "Dr. André", "Secretaria"… */
  authorRole?: string
  text: string
  at: string // ISO datetime
}

/** Caixa de mensagens Crescer: uma conversa por criança/família. */
export interface Conversation {
  id: string
  patientId: string
  messages: Message[]
  readByTeam: boolean
  readByFamily: boolean
  /** Sinalizada para o Dr. André (assunto clínico) */
  needsDoctor?: boolean
}

export interface StepProgress {
  /** chave `${patientId}:${programId}:${step}` → itens marcados pela família */
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
