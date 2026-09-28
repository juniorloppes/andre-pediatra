export type Role = 'doctor' | 'team' | 'parent-active' | 'parent-basic'
export type PatientStatus = 'Em acompanhamento' | 'Atrasado' | 'Pendência'
export type ItemStatus = 'Planejada' | 'Em andamento' | 'Concluída' | 'Atenção' | 'Pendente'
export type Visibility = 'Interno' | 'Compartilhado'
export type ThemeName = 'mint' | 'lavender' | 'peach'
export type Page = 'dashboard' | 'patients' | 'agenda' | 'follow' | 'pending' | 'messages' | 'documents' | 'reports' | 'team' | 'settings' | 'library' | 'mural' | 'home' | 'child' | 'journey' | 'goals' | 'guidance' | 'profile' | 'notifications'

export interface TimelineStage {
  id: string
  label: string
  date: string
  state: 'done' | 'current' | 'pending' | 'future'
  summary: string
}

export interface Goal {
  id: string
  patientId: string
  stage: string
  title: string
  detail: string
  status: ItemStatus
  category?: string
  period?: string
  owner?: string
  visibleToFamily?: boolean
}

export interface GrowthRecord {
  id: string
  patientId: string
  date: string
  weight: number
  length: number
  head: number
}

export interface Evolution {
  id: string
  patientId: string
  date: string
  author: string
  title: string
  notes: string
}

export interface Guidance {
  id: string
  patientId: string
  title: string
  category: string
  visibility: Visibility
  date: string
  body: string
  sharedBy?: string
  period?: string
  message?: string
  libraryId?: string
}

export interface MuralPost {
  id: string
  title: string
  summary: string
  category: 'Orientação' | 'Aviso' | 'Conteúdo' | 'Lembrete'
  body: string
  audience: 'Todos do programa' | 'Programa 6 meses' | 'Programa 12 meses'
  date: string
  author: string
  status: 'Publicado' | 'Arquivado'
}

export interface LibraryOrientation {
  id: string
  title: string
  category: 'Sono' | 'Alimentação' | 'Desenvolvimento' | 'Rotina' | 'Cuidados' | 'Próxima fase'
  summary: string
  body: string
  author: string
  updatedAt: string
}

export interface Patient {
  id: string
  name: string
  birthDate: string
  age: string
  ageMonths: number
  guardian: string
  relation: string
  programMonths: 6 | 12
  nextAppointment: string
  status: PatientStatus
  progress: number
  active: boolean
  color: string
  stages: TimelineStage[]
}

export interface Appointment {
  id: string
  patientId: string
  date: string
  time: string
  type: string
  professional: string
  status: 'Agendada' | 'Concluída' | 'Cancelada'
}

export interface Task {
  id: string
  patientId: string
  title: string
  due: string
  status: 'Pendente' | 'Em andamento' | 'Concluída'
  priority: 'Alta' | 'Média' | 'Normal'
  familyVisible?: boolean
}

export interface ChatMessage {
  id: string
  author: string
  role: 'doctor' | 'team' | 'parent'
  text: string
  time: string
  attachment?: string
}

export interface Conversation {
  id: string
  patientId: string
  guardian: string
  assigned: 'Dr. André' | 'Equipe'
  status: 'Aberta' | 'Aguardando equipe' | 'Aguardando Dr. André' | 'Resolvida'
  unread: boolean
  messages: ChatMessage[]
}

export interface DocumentItem {
  id: string
  patientId: string
  name: string
  kind: string
  date: string
  visibility: Visibility
  size: string
}

export interface Notice {
  id: string
  title: string
  detail: string
  page: Page
  patientId?: string
  conversationId?: string
  read: boolean
  date: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  initials: string
  color: string
  permissions: string[]
}

export interface AppData {
  patients: Patient[]
  appointments: Appointment[]
  tasks: Task[]
  goals: Goal[]
  growth: GrowthRecord[]
  evolutions: Evolution[]
  guidance: Guidance[]
  conversations: Conversation[]
  documents: DocumentItem[]
  notices: Notice[]
  team: TeamMember[]
  mural: MuralPost[]
  library: LibraryOrientation[]
}