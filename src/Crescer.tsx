import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity, Archive, ArrowLeft, ArrowRight, Baby, Bell, BookOpen, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Clock3,
  FileText, Filter, Heart, Home, Inbox, LayoutDashboard, ListChecks, LockKeyhole, Megaphone,
  Menu, MessageCircle, MoreHorizontal, Paperclip, Plus, Search, Send, Settings,
  Share2, ShieldCheck, Sparkles, Stethoscope, TrendingUp, UserRound, Users, X,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { initialData } from './data'
import type { AppData, Appointment, Conversation, Evolution, Goal, GrowthRecord, Guidance, LibraryOrientation, MuralPost, Notice, Page, Patient, Role, Task, ThemeName, Visibility } from './model'
import './Crescer.css'

const today = '15/10/2026'
const newId = () => Math.random().toString(36).slice(2, 9)
const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) as T : fallback
  } catch {
    return fallback
  }
}
const readAppData = (): AppData => {
  const saved = readLocal<Partial<AppData>>('crescer-demo-data', {})
  const refreshLegacySeeds = localStorage.getItem('crescer-demo-data-version') !== '2'
  const patients = saved.patients ?? initialData.patients
  const goals = (saved.goals ?? initialData.goals).map((goal) => {
    const patient = patients.find((item) => item.id === goal.patientId)
    const seed = initialData.goals.find((item) => item.id === goal.id)
    const isUntouchedLegacyGoal = refreshLegacySeeds && seed && (
      (goal.id === 'g1' && goal.title === 'Crescimento' && goal.stage === '4 meses') ||
      (goal.id === 'g2' && goal.title === 'Desenvolvimento' && goal.stage === '4 meses') ||
      (goal.id === 'g3' && goal.title === 'Preparação da próxima fase')
    )
    return {
      ...goal,
      ...(isUntouchedLegacyGoal ? seed : {}),
      period: goal.period ?? (patient ? `${patient.ageMonths}º → ${patient.ageMonths + 1}º mês` : goal.stage),
      category: goal.category ?? 'Acompanhamento',
      owner: goal.owner ?? 'Dr. André',
      visibleToFamily: goal.visibleToFamily ?? true,
    }
  })
  const tasks = (saved.tasks ?? initialData.tasks).map((task) => ({ ...task, familyVisible: task.familyVisible ?? initialData.tasks.find((item) => item.id === task.id)?.familyVisible }))
  const guidance = (saved.guidance ?? initialData.guidance).map((item) => item.id === 'o1' && item.title === 'Sono seguro nos primeiros meses' ? initialData.guidance[0] : item)
  return { ...initialData, ...saved, patients, goals, tasks, guidance, mural: saved.mural ?? initialData.mural, library: saved.library ?? initialData.library }
}
const patientName = (data: AppData, id: string) => data.patients.find((patient) => patient.id === id)?.name ?? 'Paciente'
const shortName = (name: string) => name.split(' ')[0]
const dateLabel = (date: string) => date.replace('/2026', '')
const getNextAppointment = (data: AppData, patientId: string) => data.appointments
  .filter((appointment) => appointment.patientId === patientId && appointment.status === 'Agendada')
  .sort((left, right) => left.date.split('/').reverse().join('').localeCompare(right.date.split('/').reverse().join('')) || left.time.localeCompare(right.time))[0]

type DialogState = { kind: string; title: string; record?: unknown } | null
type EditableRecord = { title?: string; category?: string; period?: string; owner?: string; status?: Goal['status']; stage?: string; detail?: string; visibleToFamily?: boolean; summary?: string; body?: string; audience?: MuralPost['audience']; date?: string }

const clinicianNavigation: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Visão geral', icon: <LayoutDashboard /> },
  { id: 'patients', label: 'Pacientes', icon: <Baby /> },
  { id: 'agenda', label: 'Agenda', icon: <CalendarDays /> },
  { id: 'follow', label: 'Acompanhamentos', icon: <Activity /> },
  { id: 'pending', label: 'Pendências', icon: <ListChecks /> },
  { id: 'messages', label: 'Mensagens', icon: <MessageCircle /> },
  { id: 'documents', label: 'Documentos', icon: <FileText /> },
  { id: 'library', label: 'Biblioteca', icon: <BookOpen /> },
  { id: 'mural', label: 'Mural', icon: <Megaphone /> },
  { id: 'reports', label: 'Relatórios', icon: <TrendingUp /> },
  { id: 'team', label: 'Equipe', icon: <Users /> },
  { id: 'settings', label: 'Configurações', icon: <Settings /> },
]

const familyNavigation: { id: Page; label: string; icon: ReactNode; locked?: boolean }[] = [
  { id: 'home', label: 'Início', icon: <Home /> },
  { id: 'child', label: 'Meu filho', icon: <Baby />, locked: true },
  { id: 'journey', label: 'Jornada', icon: <Activity />, locked: true },
  { id: 'goals', label: 'Metas', icon: <ListChecks />, locked: true },
  { id: 'guidance', label: 'Orientações', icon: <Heart />, locked: true },
  { id: 'documents', label: 'Documentos', icon: <FileText />, locked: true },
  { id: 'messages', label: 'Mensagens', icon: <MessageCircle /> },
  { id: 'mural', label: 'Mural', icon: <Megaphone />, locked: true },
  { id: 'notifications', label: 'Notificações', icon: <Bell /> },
  { id: 'profile', label: 'Perfil', icon: <UserRound /> },
]

const pageTitle: Partial<Record<Page, string>> = {
  dashboard: 'Visão geral', patients: 'Pacientes', agenda: 'Agenda', follow: 'Acompanhamentos', pending: 'Pendências',
  messages: 'Mensagens', documents: 'Documentos', reports: 'Relatórios', team: 'Equipe', settings: 'Configurações',
  library: 'Biblioteca de orientações', mural: 'Mural',
  home: 'Olá, Mariana', child: 'Meu filho', journey: 'Jornada', goals: 'Plano de metas', guidance: 'Orientações',
  profile: 'Meu perfil', notifications: 'Notificações',
}

function App() {
  const [role, setRole] = useState<Role | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [data, setData] = useState<AppData>(readAppData)
  const [theme, setTheme] = useState<ThemeName>(() => readLocal('crescer-demo-theme', 'mint'))
  const [selectedPatientId, setSelectedPatientId] = useState('joao')
  const [patientTab, setPatientTab] = useState('Visão geral')
  const [selectedConversationId, setSelectedConversationId] = useState('m1')
  const [sharePatientId, setSharePatientId] = useState('joao')
  const [search, setSearch] = useState('')
  const [patientFilter, setPatientFilter] = useState('Todos')
  const [taskFilter, setTaskFilter] = useState('Todas')
  const [messageFilter, setMessageFilter] = useState('Todas')
  const [muralFilter, setMuralFilter] = useState<'Publicados' | 'Arquivados'>('Publicados')
  const [libraryCategory, setLibraryCategory] = useState('Todas')
  const [agendaMode, setAgendaMode] = useState<'Hoje' | 'Semana'>('Semana')
  const [noticePanel, setNoticePanel] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [composer, setComposer] = useState('')
  const [attachment, setAttachment] = useState('')
  const [basicMessage, setBasicMessage] = useState('')
  const [basicSent, setBasicSent] = useState(false)
  const [profileName, setProfileName] = useState(() => readLocal('crescer-demo-profile', 'Dr. André'))
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [preferences, setPreferences] = useState(() => readLocal('crescer-demo-preferences', { reminders: true, messages: true, weeklySummary: false }))

  useEffect(() => {
    localStorage.setItem('crescer-demo-data', JSON.stringify(data))
    localStorage.setItem('crescer-demo-data-version', '2')
  }, [data])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('crescer-demo-theme', JSON.stringify(theme))
  }, [theme])
  useEffect(() => { localStorage.setItem('crescer-demo-profile', JSON.stringify(profileName)) }, [profileName])
  useEffect(() => { localStorage.setItem('crescer-demo-preferences', JSON.stringify(preferences)) }, [preferences])

  const isFamily = role === 'parent-active' || role === 'parent-basic'
  const isBasic = role === 'parent-basic'
  const currentPatient = data.patients.find((patient) => patient.id === selectedPatientId) ?? data.patients[0]
  const unreadCount = data.notices.filter((notice) => !notice.read && (!isFamily || (role === 'parent-active' && notice.patientId === 'joao'))).length
  const pendingCount = data.tasks.filter((task) => task.status !== 'Concluída').length

  const navigate = (target: Page) => {
    setPage(target)
    setMobileMenu(false)
    setNoticePanel(false)
    if (target !== 'messages') setMobileChatOpen(false)
    if (target === 'patients') setSelectedPatientId('')
  }

  const openPatient = (id: string) => {
    setSelectedPatientId(id)
    setPatientTab('Visão geral')
    setPage('patients')
    setNoticePanel(false)
  }

  const openConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id)
    setMobileChatOpen(true)
    setPage('messages')
    setData((current) => ({ ...current, conversations: current.conversations.map((item) => item.id === conversation.id ? { ...item, unread: false } : item), notices: current.notices.map((notice) => notice.conversationId === conversation.id || (notice.page === 'messages' && notice.patientId === conversation.patientId) ? { ...notice, read: true } : notice) }))
  }

  const updateConversation = (id: string, change: Partial<Conversation>) => {
    setData((current) => ({ ...current, conversations: current.conversations.map((conversation) => conversation.id === id ? { ...conversation, ...change } : conversation) }))
  }

  const updateGoal = (id: string, change: Partial<Goal>) => {
    setData((current) => ({ ...current, goals: current.goals.map((goal) => goal.id === id ? { ...goal, ...change } : goal) }))
  }

  const openShareDialog = (material: LibraryOrientation, patientId = currentPatient.id) => {
    setSharePatientId(patientId)
    setDialog({ kind: 'share-guidance', title: 'Compartilhar com paciente', record: material })
  }

  const toggleMuralArchive = (post: MuralPost) => {
    setData((current) => ({ ...current, mural: current.mural.map((item) => item.id === post.id ? { ...item, status: item.status === 'Arquivado' ? 'Publicado' : 'Arquivado' } : item) }))
  }

  const simulateIncomingMessage = () => {
    const conversation = data.conversations.find((item) => item.id === 'm1') ?? data.conversations[0]
    if (!conversation) return
    const message = { id: newId(), author: 'Mariana Almeida', role: 'parent' as const, text: 'Estou com uma dúvida sobre a próxima consulta do João Pedro.', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    const notice: Notice = { id: newId(), title: 'Nova mensagem de Mariana', detail: 'Responsável por João Pedro · “Estou com uma dúvida sobre a próxima consulta...”', page: 'messages', patientId: 'joao', conversationId: conversation.id, read: false, date: 'Agora' }
    setData((current) => ({ ...current, conversations: current.conversations.map((item) => item.id === conversation.id ? { ...item, assigned: 'Equipe', status: 'Aguardando equipe', unread: true, messages: [...item.messages, message] } : item), notices: [notice, ...current.notices] }))
  }

  const updateTask = (task: Task) => {
    const nextStatus: Task['status'] = task.status === 'Pendente' ? 'Em andamento' : task.status === 'Em andamento' ? 'Concluída' : 'Pendente'
    setData((current) => {
      const tasks = current.tasks.map((item) => item.id === task.id ? { ...item, status: nextStatus } : item)
      const stillPending = tasks.some((item) => item.patientId === task.patientId && item.status !== 'Concluída')
      const patients = current.patients.map((item) => item.id === task.patientId && item.status === 'Pendência' && !stillPending ? { ...item, status: 'Em acompanhamento' as const } : item)
      return { ...current, tasks, patients }
    })
  }

  const selectRole = (nextRole: Role) => {
    setRole(nextRole)
    setPage(nextRole === 'parent-active' || nextRole === 'parent-basic' ? 'home' : 'dashboard')
    setSelectedPatientId(nextRole === 'parent-active' ? 'joao' : '')
    setMobileChatOpen(false)
    setNoticePanel(false)
  }

  const showDetails = (title: string, record: unknown) => setDialog({ kind: 'details', title, record })

  const saveDialog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dialog) return
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const id = newId()
    if (dialog.kind === 'patient') {
      const name = String(values.name || 'Novo paciente')
      const programMonths = Number(values.programMonths) === 6 ? 6 : 12
      const stages = [{ id: 'registration', label: 'Cadastro', date: today, state: 'current' as const, summary: 'Primeira etapa do acompanhamento.' }, ...Array.from({ length: programMonths }, (_, index) => ({ id: `stage-${index}`, label: `${index + 1} mês`, date: 'A definir', state: 'future' as const, summary: 'Etapa planejada do programa.' }))]
      const patient: Patient = { id, name, birthDate: String(values.birthDate || today), age: String(values.age || 'Recém-nascido'), ageMonths: 0, guardian: String(values.guardian || 'Responsável'), relation: String(values.relation || 'Responsável'), programMonths, nextAppointment: 'A agendar', status: 'Em acompanhamento', progress: 0, active: true, color: 'blue', stages }
      setData((current) => ({ ...current, patients: [patient, ...current.patients] }))
      setSelectedPatientId(id)
      setPage('patients')
      setPatientTab('Visão geral')
    } else if (dialog.kind === 'goal' || dialog.kind === 'goal-edit') {
      const previous = dialog.record as Goal | undefined
      const goal: Goal = { id: previous?.id ?? id, patientId: String(values.patientId || currentPatient.id), stage: String(values.stage || currentPatient.age), title: String(values.title || 'Nova meta'), detail: String(values.detail || ''), status: String(values.status || 'Planejada') as Goal['status'], category: String(values.category || 'Acompanhamento'), period: String(values.period || values.stage || currentPatient.age), owner: String(values.owner || profileName), visibleToFamily: values.visibleToFamily === 'on' }
      setData((current) => ({ ...current, goals: previous ? current.goals.map((item) => item.id === previous.id ? goal : item) : [goal, ...current.goals] }))
    } else if (dialog.kind === 'growth') {
      const record: GrowthRecord = { id, patientId: String(values.patientId || currentPatient.id), date: String(values.date || today), weight: Number(values.weight), length: Number(values.length), head: Number(values.head) }
      setData((current) => ({ ...current, growth: [...current.growth, record] }))
    } else if (dialog.kind === 'evolution') {
      const record: Evolution = { id, patientId: String(values.patientId || currentPatient.id), date: String(values.date || today), author: role === 'team' ? 'Ana Paula' : profileName, title: String(values.title || 'Evolução clínica'), notes: String(values.notes || '') }
      setData((current) => ({ ...current, evolutions: [record, ...current.evolutions] }))
    } else if (dialog.kind === 'guidance') {
      const record: Guidance = { id, patientId: String(values.patientId || currentPatient.id), title: String(values.title || 'Nova orientação'), category: String(values.category || 'Rotina'), visibility: String(values.visibility) === 'Compartilhado' ? 'Compartilhado' : 'Interno', date: today, body: String(values.body || ''), sharedBy: role === 'team' ? 'Ana Paula' : profileName }
      setData((current) => ({ ...current, guidance: [record, ...current.guidance] }))
    } else if (dialog.kind === 'share-guidance') {
      const material = dialog.record as LibraryOrientation
      const patientId = String(values.patientId || sharePatientId)
      const record: Guidance = { id, patientId, title: material.title, category: material.category, visibility: 'Compartilhado', date: String(values.date || today), body: material.body, sharedBy: role === 'team' ? 'Ana Paula' : profileName, period: String(values.period || ''), message: String(values.message || ''), libraryId: material.id }
      const notice: Notice = { id: newId(), title: 'Nova orientação compartilhada', detail: `${patientName(data, patientId)} · ${material.title}`, page: 'guidance', patientId, read: false, date: 'Agora' }
      setData((current) => ({ ...current, guidance: [record, ...current.guidance], notices: [notice, ...current.notices] }))
    } else if (dialog.kind === 'protocol') {
      const previous = dialog.record as LibraryOrientation | undefined
      const item: LibraryOrientation = { id: previous?.id ?? id, title: String(values.title || 'Nova orientação'), category: String(values.category || 'Rotina') as LibraryOrientation['category'], summary: String(values.summary || ''), body: String(values.body || ''), author: role === 'team' ? 'Ana Paula' : profileName, updatedAt: today }
      setData((current) => ({ ...current, library: previous ? current.library.map((entry) => entry.id === previous.id ? item : entry) : [item, ...current.library] }))
    } else if (dialog.kind === 'mural-post') {
      const previous = dialog.record as MuralPost | undefined
      const post: MuralPost = { id: previous?.id ?? id, title: String(values.title || 'Nova publicação'), summary: String(values.summary || ''), category: String(values.category || 'Aviso') as MuralPost['category'], body: String(values.body || ''), audience: String(values.audience || 'Todos do programa') as MuralPost['audience'], date: String(values.date || today), author: role === 'team' ? 'Equipe Crescer' : profileName, status: previous?.status ?? 'Publicado' }
      setData((current) => ({ ...current, mural: previous ? current.mural.map((item) => item.id === previous.id ? post : item) : [post, ...current.mural] }))
    } else if (dialog.kind === 'appointment') {
      const patientId = String(values.patientId || currentPatient.id)
      const appointment: Appointment = { id, patientId, date: String(values.date || today), time: String(values.time || '09:00'), type: String(values.type || 'Consulta de acompanhamento'), professional: profileName, status: 'Agendada' }
      setData((current) => ({ ...current, appointments: [...current.appointments, appointment], patients: current.patients.map((patient) => patient.id === patientId ? { ...patient, nextAppointment: appointment.date, stages: patient.stages.map((stage) => stage.state === 'current' ? { ...stage, date: appointment.date, summary: `${appointment.type} · ${appointment.time}` } : stage) } : patient) }))
    } else if (dialog.kind === 'document') {
      const record = { id, patientId: String(values.patientId || currentPatient.id), name: String(values.name || 'Documento demonstrativo'), kind: String(values.kind || 'Documento'), date: today, visibility: String(values.visibility) === 'Compartilhado' ? 'Compartilhado' as const : 'Interno' as const, size: 'Arquivo simulado' }
      setData((current) => ({ ...current, documents: [record, ...current.documents] }))
    }
    setDialog(null)
  }

  const formForDialog = () => {
    if (!dialog) return null
    const record = dialog.record as EditableRecord | undefined
    const patientOptions = data.patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)
    const field = (label: string, name: string, type = 'text', defaultValue?: string, required = true) => <label className="field" key={name}><span>{label}</span><input name={name} type={type} defaultValue={defaultValue} required={required} /></label>
    const patientField = <label className="field"><span>Paciente</span><select name="patientId" defaultValue={currentPatient.id}>{patientOptions}</select></label>
    const visibilityField = <label className="field"><span>Visibilidade</span><select name="visibility"><option>Interno</option><option>Compartilhado</option></select></label>
    let fields: ReactNode
    if (dialog.kind === 'patient') fields = <div className="form-grid">{field('Nome da criança', 'name')}{field('Data de nascimento', 'birthDate', 'text', today)}{field('Idade', 'age', 'text', '1 mês')}{field('Nome do responsável', 'guardian')}{<label className="field"><span>Vínculo</span><select name="relation"><option>Mãe</option><option>Pai</option><option>Responsável</option></select></label>}{<label className="field"><span>Programa</span><select name="programMonths"><option value="12">12 meses</option><option value="6">6 meses</option></select></label>}</div>
    else if (dialog.kind === 'goal' || dialog.kind === 'goal-edit') fields = <>{patientField}<div className="form-grid">{field('Título da meta', 'title', 'text', record?.title)}{field('Categoria', 'category', 'text', record?.category ?? 'Acompanhamento')}{field('Período', 'period', 'text', record?.period ?? `${currentPatient.ageMonths}º → ${currentPatient.ageMonths + 1}º mês`)}{field('Responsável', 'owner', 'text', record?.owner ?? profileName)}<label className="field"><span>Status</span><select name="status" defaultValue={record?.status ?? 'Planejada'}><option>Planejada</option><option>Em andamento</option><option>Concluída</option><option>Atenção</option></select></label><label className="field"><span>Etapa</span><input name="stage" defaultValue={record?.stage ?? currentPatient.age} /></label></div><label className="field"><span>Descrição</span><textarea name="detail" rows={3} defaultValue={record?.detail} /></label><label className="preference-row"><span><b>Visível para a família</b><small>O responsável poderá acompanhar esta meta no portal.</small></span><input type="checkbox" name="visibleToFamily" defaultChecked={record?.visibleToFamily ?? true} /></label></>
    else if (dialog.kind === 'growth') fields = <>{patientField}<div className="form-grid">{field('Data', 'date', 'text', today)}{field('Peso (kg)', 'weight', 'number', '', true)}{field('Comprimento/altura (cm)', 'length', 'number')}{field('Perímetro cefálico (cm)', 'head', 'number')}</div></>
    else if (dialog.kind === 'evolution') fields = <>{patientField}<div className="form-grid">{field('Data', 'date', 'text', today)}{field('Título', 'title', 'text', 'Consulta de acompanhamento')}</div><label className="field"><span>Observações clínicas</span><textarea name="notes" rows={5} required /></label></>
    else if (dialog.kind === 'guidance') fields = <>{patientField}<div className="form-grid">{field('Título', 'title')}{field('Categoria', 'category', 'text', 'Rotina')}{visibilityField}</div><label className="field"><span>Orientação</span><textarea name="body" rows={4} required /></label></>
    else if (dialog.kind === 'share-guidance') {
      const material = dialog.record as LibraryOrientation
      const patient = data.patients.find((item) => item.id === sharePatientId) ?? currentPatient
      fields = <><div className="share-material-preview"><BookOpen size={18} /><span><b>{material.title}</b><small>{material.category} · conteúdo da biblioteca</small></span></div><label className="field"><span>Paciente</span><select name="patientId" value={sharePatientId} onChange={(event) => setSharePatientId(event.target.value)}>{patientOptions}</select><small>Responsável: {patient.guardian}</small></label><div className="form-grid">{field('Etapa / período', 'period', 'text', `${patient.ageMonths}º → ${patient.ageMonths + 1}º mês`)}{field('Data de compartilhamento', 'date', 'text', today)}</div><label className="field"><span>Mensagem complementar</span><textarea name="message" rows={3} defaultValue={`Olá, ${patient.guardian.split(' ')[0]}, deixamos estas orientações disponíveis para esta fase do acompanhamento.`} /></label></>
    }
    else if (dialog.kind === 'protocol') fields = <div className="form-grid">{field('Título', 'title', 'text', record?.title)}{<label className="field"><span>Categoria</span><select name="category" defaultValue={record?.category ?? 'Rotina'}>{['Sono', 'Alimentação', 'Desenvolvimento', 'Rotina', 'Cuidados', 'Próxima fase'].map((category) => <option key={category}>{category}</option>)}</select></label>}{field('Resumo', 'summary', 'text', record?.summary)}<label className="field full-field"><span>Conteúdo</span><textarea name="body" rows={4} defaultValue={record?.body} required /></label></div>
    else if (dialog.kind === 'mural-post') fields = <><div className="form-grid">{field('Título', 'title', 'text', record?.title)}<label className="field"><span>Categoria</span><select name="category" defaultValue={record?.category ?? 'Aviso'}>{['Orientação', 'Aviso', 'Conteúdo', 'Lembrete'].map((category) => <option key={category}>{category}</option>)}</select></label>{field('Resumo', 'summary', 'text', record?.summary)}<label className="field"><span>Público</span><select name="audience" defaultValue={record?.audience ?? 'Todos do programa'}>{['Todos do programa', 'Programa 6 meses', 'Programa 12 meses'].map((audience) => <option key={audience}>{audience}</option>)}</select></label>{field('Data de publicação', 'date', 'text', record?.date ?? today)}</div><label className="field"><span>Conteúdo</span><textarea name="body" rows={4} defaultValue={record?.body} required /></label></>
    else if (dialog.kind === 'appointment') fields = <>{patientField}<div className="form-grid">{field('Data', 'date', 'text', today)}{field('Horário', 'time', 'time', '09:00')}{field('Tipo de consulta', 'type', 'text', 'Consulta de acompanhamento')}</div></>
    else if (dialog.kind === 'document') fields = <>{patientField}<div className="form-grid">{field('Nome do documento', 'name')}{field('Tipo', 'kind', 'text', 'Documento')}{visibilityField}</div><div className="upload-sim"><Paperclip size={17} /> Arquivo simulado para a demonstração</div></>
    else return null
    const submitLabel = dialog.kind === 'share-guidance' ? 'Compartilhar' : dialog.record ? 'Salvar alterações' : 'Salvar'
    return <form className="dialog-form" onSubmit={saveDialog}>{fields}<div className="dialog-actions"><button type="button" className="button button-quiet" onClick={() => setDialog(null)}>Cancelar</button><button className="button button-primary">{dialog.kind === 'share-guidance' ? <Share2 size={15} /> : <Check size={16} />}{submitLabel}</button></div></form>
  }

  const visiblePatients = useMemo(() => data.patients.filter((patient) => {
    const matchesSearch = `${patient.name} ${patient.guardian}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))
    const matchesFilter = patientFilter === 'Todos' || (patientFilter === 'Em acompanhamento' && patient.status === 'Em acompanhamento') || (patientFilter === 'Atenção' && patient.status !== 'Em acompanhamento') || (patientFilter === '6 meses' && patient.programMonths === 6) || (patientFilter === '12 meses' && patient.programMonths === 12)
    return matchesSearch && matchesFilter
  }), [data.patients, patientFilter, search])

  const familyPatient = data.patients.find((patient) => patient.id === 'joao') ?? data.patients[0]
  const familyNextAppointment = getNextAppointment(data, familyPatient.id)
  const familyPlanGoals = data.goals.filter((goal) => goal.patientId === familyPatient.id && goal.visibleToFamily !== false)
  const familyTasks = data.tasks.filter((task) => task.patientId === familyPatient.id && task.familyVisible && task.status !== 'Concluída')
  const familySharedGuidance = data.guidance.filter((item) => item.patientId === familyPatient.id && item.visibility === 'Compartilhado')
  const familyNewGuidanceCount = familySharedGuidance.filter((item) => item.date === today).length
  const familyMuralPosts = data.mural.filter((post) => post.status === 'Publicado' && (post.audience === 'Todos do programa' || post.audience === `Programa ${familyPatient.programMonths} meses`))
  const patient = familyPatient
  const nextAppointment = familyNextAppointment
  const patientPlanGoals = familyPlanGoals
  const patientTasks = familyTasks
  const newSharedGuidance = familyNewGuidanceCount
  const familyMural = familyMuralPosts
  const familyNotices = data.notices.filter((notice) => role === 'parent-active' && notice.patientId === 'joao')

  const markNoticeRead = (notice: Notice) => {
    setData((current) => ({ ...current, notices: current.notices.map((item) => item.id === notice.id ? { ...item, read: true } : item) }))
    setNoticePanel(false)
    if (notice.page === 'messages') {
      const conversation = data.conversations.find((item) => item.id === notice.conversationId || item.patientId === notice.patientId)
      if (conversation) {
        openConversation(conversation)
        return
      }
    }
    if (notice.page === 'guidance' && notice.patientId) {
      if (isFamily) navigate('guidance')
      else {
        openPatient(notice.patientId)
        setPatientTab('Orientações')
      }
      return
    }
    if (isFamily && notice.page === 'agenda') {
      navigate('journey')
      return
    }
    if (notice.page === 'patients' && notice.patientId) {
      openPatient(notice.patientId)
      return
    }
    navigate(notice.page)
  }

  const submitMessage = () => {
    if ((!composer.trim() && !attachment) || !activeConversation) return
    const authorRole = role === 'team' ? 'team' : role === 'parent-active' ? 'parent' : 'doctor'
    const author = authorRole === 'team' ? 'Ana Paula' : authorRole === 'parent' ? 'Mariana Almeida' : profileName
    const message = { id: newId(), author, role: authorRole as 'doctor' | 'team' | 'parent', text: composer.trim() || 'Arquivo enviado para a conversa.', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), ...(attachment ? { attachment } : {}) }
    setData((current) => ({ ...current, conversations: current.conversations.map((conversation) => conversation.id === activeConversation.id ? { ...conversation, status: authorRole === 'parent' ? 'Aguardando equipe' : 'Aberta', assigned: authorRole === 'parent' ? 'Equipe' : conversation.assigned, unread: authorRole === 'parent', messages: [...conversation.messages, message] } : conversation) }))
    setComposer('')
    setAttachment('')
  }

  const activeConversation = data.conversations.find((conversation) => conversation.id === selectedConversationId) ?? data.conversations[0]
  const conversationsForView = role === 'parent-active' ? data.conversations.filter((conversation) => conversation.patientId === 'joao') : data.conversations
  const filteredConversations = conversationsForView.filter((conversation) => {
    if (messageFilter === 'Minhas') return conversation.assigned === (role === 'team' ? 'Equipe' : 'Dr. André')
    if (messageFilter === 'Não lidas') return conversation.unread
    if (messageFilter === 'Aguardando equipe') return conversation.status === 'Aguardando equipe'
    if (messageFilter === 'Aguardando Dr. André') return conversation.status === 'Aguardando Dr. André'
    if (messageFilter === 'Resolvidas') return conversation.status === 'Resolvida'
    return true
  })

  if (!role) return <Login onSelect={selectRole} />

  const sidebarNavigation: { id: Page; label: string; icon: ReactNode; locked?: boolean }[] = isFamily ? familyNavigation : clinicianNavigation.filter((item) => role !== 'team' || item.id !== 'reports')
  const visibleNotices = isFamily ? familyNotices : data.notices
  const tabs = ['Visão geral', 'Timeline', 'Plano de metas', 'Crescimento', 'Evoluções', 'Orientações', 'Documentos', 'Mensagens']

  const renderTask = (task: Task) => <div className="task-row" key={task.id} onClick={() => showDetails(task.title, { ...task, child: patientName(data, task.patientId) })}>
    <span className={`task-check ${task.status === 'Concluída' ? 'is-done' : ''}`}><Check size={14} /></span>
    <span className="task-copy"><b>{task.title}</b><small>{patientName(data, task.patientId)} · vence {dateLabel(task.due)}</small></span>
    <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
    <button className="icon-button" title="Alterar status" onClick={(event) => { event.stopPropagation(); updateTask(task) }}><MoreHorizontal size={18} /></button>
  </div>

  const renderPatientTable = () => <div className="patient-table">
    <div className="patient-table-head"><span>Paciente</span><span>Idade</span><span>Responsável</span><span>Programa</span><span>Próxima consulta</span><span>Status</span></div>
    {visiblePatients.map((patient) => <button className="patient-table-row" key={patient.id} onClick={() => openPatient(patient.id)}>
      <span className="patient-cell"><Avatar name={patient.name} color={patient.color} /><span><b>{patient.name}</b><small>Última atualização há 2 dias</small></span></span>
      <span>{patient.age}</span><span>{patient.guardian}</span><span>{patient.programMonths} meses</span><span>{patient.nextAppointment}</span><span><StatusBadge value={patient.status} /></span>
    </button>)}
    {visiblePatients.length === 0 && <div className="empty-state"><Search size={23} /><b>Nenhum paciente encontrado</b><span>Ajuste a busca ou o filtro.</span></div>}
  </div>

  const renderConversationPanel = () => {
    const conversation = activeConversation
    if (!conversation) return <div className="empty-state">Nenhuma conversa disponível.</div>
    const patient = data.patients.find((item) => item.id === conversation.patientId)
    return <div className={`messenger ${mobileChatOpen ? 'chat-open' : ''}`}>
      <aside className="conversation-list">
        <div className="conversation-list-top"><b>Conversas</b><button className="icon-button" aria-label="Mais opções"><MoreHorizontal size={18} /></button></div>
        {filteredConversations.map((item) => <button className={`conversation-preview ${item.id === conversation.id ? 'selected' : ''}`} key={item.id} onClick={() => openConversation(item)}>
          <Avatar name={item.guardian} color={item.patientId === 'joao' ? 'mint' : 'lilac'} /><span className="conversation-preview-copy"><b>{item.guardian}</b><small>{item.messages.at(-1)?.text ?? 'Inicie uma conversa'}</small><small>{patientName(data, item.patientId)} · {item.assigned}</small></span>{item.unread && <i className="unread-dot" />}
        </button>)}
        {filteredConversations.length === 0 && <div className="empty-state compact">Sem conversas neste filtro.</div>}
      </aside>
      <section className="chat-room">
        <header className="chat-header"><button className="icon-button chat-back" onClick={() => setMobileChatOpen(false)} aria-label="Voltar às conversas"><ArrowLeft size={18} /></button><Avatar name={conversation.guardian} color="mint" /><span className="chat-heading"><b>{conversation.guardian}</b><small>Responsável por {patient?.name ?? 'paciente'} · {patient?.age ?? ''}</small></span><span className="chat-status">{conversation.status}</span><button className="icon-button" onClick={() => showDetails('Detalhes da conversa', { paciente: patient?.name, responsável: conversation.guardian, atribuída: conversation.assigned, status: conversation.status })}><MoreHorizontal size={19} /></button></header>
        <div className="chat-context"><ShieldCheck size={15} /> Conversa protegida da equipe Crescer <span>•</span> histórico compartilhado</div>
        <div className="message-stream">{conversation.messages.map((message) => <div className={`message-line ${message.role === (isFamily ? 'parent' : role === 'team' ? 'team' : 'doctor') ? 'mine' : ''}`} key={message.id}>
          <div className={`message-bubble bubble-${message.role}`}>{message.role !== (isFamily ? 'parent' : role === 'team' ? 'team' : 'doctor') && <small>{message.author} · {message.role === 'doctor' ? 'Médico' : message.role === 'team' ? 'Equipe' : 'Responsável'}</small>}{message.text}{message.attachment && <span className="message-attachment"><Paperclip size={13} /> {message.attachment}</span>}<time>{message.time}</time></div>
        </div>)}</div>
        <div className="chat-compose"><div className="compose-field"><button className="icon-button" title="Simular anexo" onClick={() => setAttachment(attachment ? '' : 'arquivo-exemplo.pdf')}><Paperclip size={17} /></button><input value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitMessage() } }} placeholder="Escreva sua mensagem..." /><button className="send-button" onClick={submitMessage} aria-label="Enviar mensagem"><Send size={17} /></button></div>{attachment && <small className="attachment-pending"><Paperclip size={12} /> {attachment} <button onClick={() => setAttachment('')}><X size={12} /></button></small>}<small className="compose-disclaimer">Este canal não substitui atendimento de urgência.</small></div>
        {!isFamily && <div className="conversation-actions"><span>Atribuída a <b>{conversation.assigned}</b></span><button className="button button-quiet" onClick={() => updateConversation(conversation.id, { assigned: conversation.assigned === 'Equipe' ? 'Dr. André' : 'Equipe', status: conversation.assigned === 'Equipe' ? 'Aguardando Dr. André' : 'Aguardando equipe' })}>Atribuir à {conversation.assigned === 'Equipe' ? 'Dr. André' : 'equipe'}</button><button className="button button-quiet" onClick={() => updateConversation(conversation.id, { status: conversation.status === 'Resolvida' ? 'Aberta' : 'Resolvida' })}>{conversation.status === 'Resolvida' ? 'Reabrir' : 'Resolver'}</button></div>}
      </section>
    </div>
  }

  const renderPatientDetail = () => {
    const patient = currentPatient
    const patientGoals = data.goals.filter((goal) => goal.patientId === patient.id && goal.visibleToFamily !== false)
    const patientGrowth = data.growth.filter((record) => record.patientId === patient.id)
    const patientEvolutions = data.evolutions.filter((record) => record.patientId === patient.id)
    const patientGuidance = data.guidance.filter((item) => item.patientId === patient.id)
    const patientDocuments = data.documents.filter((item) => item.patientId === patient.id)
    const patientTasks = data.tasks.filter((task) => task.patientId === patient.id)
    const patientConversation = data.conversations.find((item) => item.patientId === patient.id)
    const nextAppointment = getNextAppointment(data, patient.id)
    const currentPeriod = `${patient.ageMonths}º → ${patient.ageMonths + 1}º mês`
    const currentPlanGoals = patientGoals.filter((goal) => goal.period === currentPeriod || goal.stage === currentPeriod)
    const openPlanGoals = currentPlanGoals.filter((goal) => goal.status === 'Planejada' || goal.status === 'Em andamento' || goal.status === 'Atenção')
    const planGuidanceCount = patientGuidance.filter((item) => item.date === today && item.visibility === 'Compartilhado').length
    return <>
      <button className="back-link" onClick={() => { setSelectedPatientId(''); setPage('patients') }}><ArrowLeft size={16} /> Todos os pacientes</button>
      <section className="patient-profile panel-surface"><Avatar name={patient.name} color={patient.color} large /><div className="patient-profile-main"><div className="eyebrow">ACOMPANHAMENTO PEDIÁTRICO</div><h1>{patient.name}</h1><p>{patient.age} <span>·</span> {patient.guardian} ({patient.relation}) <span>·</span> Programa {patient.programMonths} meses</p><div className="patient-next"><CalendarDays size={15} /> Próxima consulta <b>{nextAppointment ? `${nextAppointment.date} · ${nextAppointment.time}` : patient.nextAppointment}</b></div></div><div className="patient-progress"><b>{patient.progress}%</b><span>do programa</span><div className="progress-track"><i style={{ width: `${patient.progress}%` }} /></div></div><StatusBadge value={patient.status} /></section>
      <div className="tab-strip">{tabs.map((tab) => <button key={tab} className={patientTab === tab ? 'active' : ''} onClick={() => { setPatientTab(tab); if (tab === 'Mensagens' && patientConversation) openConversation(patientConversation) }}>{tab}</button>)}</div>
      {patientTab === 'Visão geral' && <div className="content-grid two-col"><section className="panel-surface"><SectionHeader title="Próxima etapa" action={<button className="text-button" onClick={() => setPatientTab('Timeline')}>Ver jornada <ArrowRight size={14} /></button>} /><div className="next-stage"><span className="stage-index">04</span><div><b>Avaliação do 4º mês</b><p>15 de outubro de 2026 · 09:00</p><small>Crescimento, desenvolvimento, alimentação e vacinas</small></div><button className="icon-button" onClick={() => navigate('agenda')} aria-label="Abrir agenda"><ArrowRight size={17} /></button></div><div className="checklist">{['Crescimento', 'Desenvolvimento', 'Alimentação', 'Esquema vacinal'].map((item, index) => <span key={item}><i className={index < 2 ? 'checked' : ''}>{index < 2 && <Check size={11} />}</i>{item}</span>)}</div></section><section className="panel-surface"><SectionHeader title="Pendências" action={<button className="text-button" onClick={() => navigate('pending')}>Ver todas <ArrowRight size={14} /></button>} />{patientTasks.length ? patientTasks.slice(0, 3).map(renderTask) : <Empty message="Nenhuma pendência para este paciente." />}</section><section className="panel-surface"><SectionHeader title="Última evolução" action={<button className="text-button" onClick={() => setPatientTab('Evoluções')}>Histórico <ArrowRight size={14} /></button>} />{patientEvolutions[0] ? <button className="record-preview" onClick={() => showDetails(patientEvolutions[0].title, patientEvolutions[0])}><span className="record-date">{patientEvolutions[0].date}</span><b>{patientEvolutions[0].title}</b><p>{patientEvolutions[0].notes}</p><small>{patientEvolutions[0].author}</small></button> : <Empty message="Ainda não há evolução registrada." />}</section><section className="panel-surface"><SectionHeader title="Crescimento" action={<button className="text-button" onClick={() => setPatientTab('Crescimento')}>Ver histórico <ArrowRight size={14} /></button>} />{patientGrowth.length ? <GrowthChart records={patientGrowth} compact /> : <Empty message="Registre a primeira medida deste paciente." />}</section></div>}
      {patientTab === 'Timeline' && <section className="panel-surface"><SectionHeader title="Jornada de acompanhamento" description="Cada etapa reúne consultas, registros e orientações." /><div className="timeline">{patient.stages.map((stage, index) => <button className={`timeline-item state-${stage.state}`} key={stage.id} onClick={() => showDetails(`Etapa ${stage.label}`, { ...stage, paciente: patient.name })}><span className="timeline-marker">{stage.state === 'done' ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span><span className="timeline-copy"><span className="timeline-topline"><b>{stage.label}</b><small>{stage.date}</small></span><span>{stage.summary}</span><em>{stage.state === 'done' ? 'Concluída' : stage.state === 'current' ? 'Etapa atual' : stage.state === 'pending' ? 'Pendente' : 'Futura'}</em></span><ChevronRight size={16} /></button>)}</div></section>}
      {patientTab === 'Plano de metas' && <div className="section-stack"><section className="current-plan panel-surface"><div className="current-plan-top"><span className="eyebrow">PLANO ATUAL</span><b>{currentPeriod}</b></div><div className="current-plan-summary"><span><CalendarDays size={16} /><small>Próxima consulta</small><b>{nextAppointment ? `${nextAppointment.date} · ${nextAppointment.time}` : patient.nextAppointment}</b></span><span><ListChecks size={16} /><small>Metas em aberto</small><b>{openPlanGoals.length}</b></span><span><Heart size={16} /><small>Orientações novas</small><b>{planGuidanceCount}</b></span><span><CircleAlert size={16} /><small>Pendências</small><b>{patientTasks.filter((task) => task.status !== 'Concluída').length}</b></span></div><button className="button button-quiet" onClick={() => setDialog({ kind: 'appointment', title: 'Definir próxima consulta' })}><CalendarDays size={14} /> Definir próxima consulta</button></section><div className="section-toolbar"><div><h2>Plano individual</h2><p>Metas para o período entre esta consulta e a próxima.</p></div><div className="goal-toolbar"><button className="button button-quiet" onClick={() => navigate('library')}><BookOpen size={15} /> Adicionar orientação</button><button className="button button-primary" onClick={() => setDialog({ kind: 'goal', title: 'Adicionar meta' })}><Plus size={16} /> Adicionar meta</button></div></div>{currentPlanGoals.map((goal) => <article className="plan-goal-card panel-surface" key={goal.id}><div className="plan-goal-main"><span className="goal-category">{goal.category ?? 'Acompanhamento'} · {goal.period ?? goal.stage}</span><h3>{goal.title}</h3><p>{goal.detail}</p><small>Responsável: {goal.owner ?? profileName} · {goal.visibleToFamily ? 'Visível para a família' : 'Somente equipe'}</small></div><StatusBadge value={goal.status} /><div className="plan-goal-actions"><button className="button button-quiet" onClick={() => setDialog({ kind: 'goal-edit', title: 'Editar meta', record: goal })}>Editar</button><button className="button button-quiet" onClick={() => updateGoal(goal.id, { status: goal.status === 'Concluída' ? 'Em andamento' : 'Concluída' })}>{goal.status === 'Concluída' ? 'Reabrir' : 'Concluir'}</button><button className="icon-button" title="Marcar atenção" onClick={() => updateGoal(goal.id, { status: goal.status === 'Atenção' ? 'Em andamento' : 'Atenção' })}><CircleAlert size={16} /></button></div></article>)}{!currentPlanGoals.length && <Empty message="Este plano ainda não tem metas para o período atual." />}</div>}
      {patientTab === 'Crescimento' && <div className="section-stack"><div className="section-toolbar"><div><h2>Crescimento</h2><p>Histórico demonstrativo de medidas registradas nas consultas.</p></div><button className="button button-primary" onClick={() => setDialog({ kind: 'growth', title: 'Registrar medidas' })}><Plus size={16} /> Registrar medidas</button></div><div className="metric-row"><Metric label="Peso mais recente" value={patientGrowth.at(-1) ? `${patientGrowth.at(-1)?.weight.toFixed(1)} kg` : '—'} icon={<Activity />} /><Metric label="Comprimento / altura" value={patientGrowth.at(-1) ? `${patientGrowth.at(-1)?.length} cm` : '—'} icon={<TrendingUp />} /><Metric label="Perímetro cefálico" value={patientGrowth.at(-1) ? `${patientGrowth.at(-1)?.head} cm` : '—'} icon={<Baby />} /></div><section className="panel-surface"><SectionHeader title="Evolução das medidas" /><GrowthChart records={patientGrowth} /></section><section className="panel-surface"><SectionHeader title="Registros por data" />{patientGrowth.slice().reverse().map((item) => <div className="data-row" key={item.id}><b>{item.date}</b><span>{item.weight.toFixed(1)} kg</span><span>{item.length} cm</span><span>PC {item.head} cm</span></div>)}</section></div>}
      {patientTab === 'Evoluções' && <div className="section-stack"><div className="section-toolbar"><div><h2>Evoluções clínicas</h2><p>Histórico preservado de registros deste paciente.</p></div><button className="button button-primary" onClick={() => setDialog({ kind: 'evolution', title: 'Registrar evolução' })}><Plus size={16} /> Nova evolução</button></div>{patientEvolutions.map((evolution) => <button className="evolution-card panel-surface" key={evolution.id} onClick={() => showDetails(evolution.title, evolution)}><span className="record-date">{evolution.date}</span><b>{evolution.title}</b><p>{evolution.notes}</p><span className="record-author"><Stethoscope size={14} /> {evolution.author} <ChevronRight size={15} /></span></button>)}</div>}
      {patientTab === 'Orientações' && <div className="section-stack"><div className="section-toolbar"><div><h2>Orientações</h2><p>Conteúdo interno da equipe e conteúdo compartilhado com a família.</p></div><button className="button button-primary" onClick={() => setDialog({ kind: 'guidance', title: 'Criar orientação' })}><Plus size={16} /> Nova orientação</button></div>{patientGuidance.map((item) => <button className="guidance-card panel-surface" key={item.id} onClick={() => showDetails(item.title, item)}><span className="guidance-icon"><Heart size={18} /></span><span className="grow"><b>{item.title}</b><small>{item.category} · {item.date}</small><p>{item.body}</p></span><VisibilityBadge value={item.visibility} /><ChevronRight size={16} /></button>)}</div>}
      {patientTab === 'Documentos' && <DocumentList documents={patientDocuments} data={data} setDialog={setDialog} onOpen={showDetails} />}
      {patientTab === 'Mensagens' && <div className="message-patient-link panel-surface"><MessageCircle size={23} /><div><b>Conversa com {patient.guardian}</b><p>Histórico compartilhado entre a família e a equipe Crescer.</p></div>{patientConversation ? <button className="button button-primary" onClick={() => openConversation(patientConversation)}>Abrir conversa</button> : <span className="muted">Nenhuma conversa</span>}</div>}
    </>
  }

  const renderDoctorPage = () => {
    if (page === 'patients' && selectedPatientId) return renderPatientDetail()
    if (page === 'dashboard') return <>
      <div className="welcome-row"><div><div className="eyebrow">QUINTA-FEIRA, 15 DE OUTUBRO</div><h1>Bom dia, {profileName.split(' ')[1] ?? profileName} <span className="wave">☀</span></h1><p>Seu time acompanha <b>{data.patients.filter((patient) => patient.active).length} famílias</b> hoje. Aqui está o resumo do consultório.</p></div><div className="welcome-actions"><button className="button button-quiet" onClick={simulateIncomingMessage}><MessageCircle size={15} /> Simular mensagem</button><button className="button button-primary" onClick={() => setDialog({ kind: 'appointment', title: 'Nova consulta' })}><Plus size={16} /> Nova consulta</button></div></div>
      <div className="metric-row dashboard-metrics"><Metric label="Pacientes ativos" value={String(data.patients.filter((patient) => patient.active).length)} detail="em acompanhamento" icon={<Baby />} onClick={() => navigate('patients')} /><Metric label="Consultas hoje" value={String(data.appointments.filter((appointment) => appointment.date === today && appointment.status === 'Agendada').length)} detail="na agenda do dia" icon={<CalendarDays />} onClick={() => { setAgendaMode('Hoje'); navigate('agenda') }} /><Metric label="Pendências" value={String(pendingCount)} detail="precisam de atenção" icon={<CircleAlert />} tone="coral" onClick={() => navigate('pending')} /><Metric label="Mensagens novas" value={String(data.conversations.filter((conversation) => conversation.unread).length)} detail="aguardando resposta" icon={<MessageCircle />} tone="blue" onClick={() => navigate('messages')} /></div>
      <div className="dashboard-grid"><section className="panel-surface"><SectionHeader title="Agenda de hoje" action={<button className="text-button" onClick={() => navigate('agenda')}>Abrir agenda <ArrowRight size={14} /></button>} />{data.appointments.filter((appointment) => appointment.date === today).sort((a, b) => a.time.localeCompare(b.time)).map((appointment) => <button className="appointment-row" key={appointment.id} onClick={() => showDetails(`${appointment.time} · ${patientName(data, appointment.patientId)}`, appointment)}><span className="appointment-time">{appointment.time}</span><span className="appointment-rule" /><Avatar name={patientName(data, appointment.patientId)} color={data.patients.find((item) => item.id === appointment.patientId)?.color ?? 'mint'} /><span className="appointment-copy"><b>{patientName(data, appointment.patientId)}</b><small>{appointment.type}</small></span><ChevronRight size={16} /></button>)}</section><section className="panel-surface"><SectionHeader title="Precisam de atenção" action={<button className="text-button" onClick={() => navigate('pending')}>Ver pendências <ArrowRight size={14} /></button>} />{data.tasks.filter((task) => task.status !== 'Concluída').slice(0, 4).map((task) => <button className="attention-row" key={task.id} onClick={() => showDetails(task.title, { ...task, child: patientName(data, task.patientId) })}><span className={`attention-mark priority-${task.priority.toLowerCase()}`}><CircleAlert size={16} /></span><span><b>{shortName(patientName(data, task.patientId))} {patientName(data, task.patientId).split(' ')[1]}</b><small>{task.title}</small></span><span className="due-label">{dateLabel(task.due)}</span></button>)}</section></div>
      <div className="dashboard-grid lower-grid"><section className="panel-surface"><SectionHeader title="Acompanhamentos ativos" action={<button className="text-button" onClick={() => navigate('follow')}>Ver todos <ArrowRight size={14} /></button>} />{data.patients.slice(0, 4).map((patient) => <button className="follow-row" key={patient.id} onClick={() => openPatient(patient.id)}><Avatar name={patient.name} color={patient.color} /><span className="follow-copy"><b>{patient.name}</b><small>{patient.age} · programa {patient.programMonths} meses</small><span className="progress-track"><i style={{ width: `${patient.progress}%` }} /></span></span><b className="progress-value">{patient.progress}%</b><ChevronRight size={15} /></button>)}</section><section className="panel-surface"><SectionHeader title="Mensagens recentes" action={<button className="text-button" onClick={() => navigate('messages')}>Caixa de entrada <ArrowRight size={14} /></button>} />{data.conversations.slice(0, 3).map((conversation) => <button className="recent-message" key={conversation.id} onClick={() => openConversation(conversation)}><Avatar name={conversation.guardian} color="coral" /><span><b>{conversation.guardian}</b><small>{conversation.messages.at(-1)?.text}</small></span>{conversation.unread && <i className="unread-dot" />}</button>)}</section></div>
    </>
    if (page === 'patients') return <><div className="section-toolbar"><div><h2>Todos os pacientes</h2><p>Uma visão conectada das crianças e das famílias em acompanhamento.</p></div><button className="button button-primary" onClick={() => setDialog({ kind: 'patient', title: 'Adicionar paciente' })}><Plus size={16} /> Novo paciente</button></div><div className="list-toolbar"><label className="search-box"><Search size={17} /><input placeholder="Buscar paciente ou responsável" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><label className="filter-select"><Filter size={16} /><select value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)}><option>Todos</option><option>Em acompanhamento</option><option>Atenção</option><option>6 meses</option><option>12 meses</option></select><ChevronDown size={14} /></label><span className="list-count">{visiblePatients.length} pacientes</span></div><section className="panel-surface table-surface">{renderPatientTable()}</section></>
    if (page === 'mural') return <><div className="section-toolbar"><div><h2>Publicações para as famílias</h2><p>Avisos e conteúdos gerais dos programas de acompanhamento.</p></div><button className="button button-primary" onClick={() => setDialog({ kind: 'mural-post', title: 'Nova publicação' })}><Plus size={16} /> Nova publicação</button></div><div className="mural-admin-banner"><Megaphone size={18} /><span><b>Mural Crescer</b><small>Publicações visíveis apenas para famílias do público selecionado.</small></span><span className="mural-post-count">{data.mural.filter((post) => post.status === 'Publicado').length} publicadas</span></div><div className="filter-chips"><button className={muralFilter === 'Publicados' ? 'active' : ''} onClick={() => setMuralFilter('Publicados')}>Publicados</button><button className={muralFilter === 'Arquivados' ? 'active' : ''} onClick={() => setMuralFilter('Arquivados')}>Arquivados</button></div><div className="mural-admin-grid">{data.mural.filter((post) => post.status === (muralFilter === 'Publicados' ? 'Publicado' : 'Arquivado')).map((post) => <article className="mural-admin-card panel-surface" key={post.id}><div className="mural-card-top"><span className={`mural-category category-${post.category.toLowerCase()}`}>{post.category}</span><StatusBadge value={post.status} /></div><h3>{post.title}</h3><p>{post.summary}</p><div className="mural-card-meta"><span>{post.author}</span><span>{post.date}</span></div><div className="mural-card-audience"><Users size={13} /> {post.audience}</div><div className="mural-card-actions"><button className="button button-quiet" onClick={() => setDialog({ kind: 'mural-post', title: 'Editar publicação', record: post })}>Editar</button><button className="button button-quiet" onClick={() => toggleMuralArchive(post)}><Archive size={14} /> {post.status === 'Publicado' ? 'Arquivar' : 'Restaurar'}</button><button className="icon-button" aria-label="Visualizar publicação" onClick={() => showDetails(post.title, post)}><ArrowRight size={16} /></button></div></article>)}</div>{!data.mural.some((post) => post.status === (muralFilter === 'Publicados' ? 'Publicado' : 'Arquivado')) && <Empty message="Não há publicações nesta lista." />}</>
    if (page === 'library') return <><div className="section-toolbar"><div><h2>Protocolos e orientações</h2><p>Materiais demonstrativos para compartilhar com pacientes específicos.</p></div><button className="button button-primary" onClick={() => setDialog({ kind: 'protocol', title: 'Novo material' })}><Plus size={16} /> Novo material</button></div><div className="library-notice"><BookOpen size={17} /><span><b>Biblioteca de orientações</b><small>Conteúdos selecionados pela equipe. Não há protocolos clínicos automatizados.</small></span></div><div className="filter-chips library-filters">{['Todas', 'Sono', 'Alimentação', 'Desenvolvimento', 'Rotina', 'Cuidados', 'Próxima fase'].map((category) => <button key={category} className={libraryCategory === category ? 'active' : ''} onClick={() => setLibraryCategory(category)}>{category}</button>)}</div><div className="library-grid">{data.library.filter((item) => libraryCategory === 'Todas' || item.category === libraryCategory).map((item) => <article className="library-card panel-surface" key={item.id}><span className="library-card-icon"><BookOpen size={18} /></span><span className="library-category">{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p><small>Atualizado em {item.updatedAt} · {item.author}</small><div className="library-card-actions"><button className="button button-quiet" onClick={() => showDetails(item.title, { ...item, conteudo: item.body })}>Visualizar</button><button className="button button-quiet" onClick={() => setDialog({ kind: 'protocol', title: 'Editar material', record: item })}>Editar</button><button className="button button-primary" onClick={() => openShareDialog(item)}><Share2 size={14} /> Compartilhar</button></div></article>)}</div></>
    if (page === 'follow') return <><div className="section-toolbar"><div><h2>Jornadas ativas</h2><p>Progresso e próxima etapa de cada programa em curso.</p></div></div><div className="metric-row"><Metric label="Programas ativos" value={String(data.patients.filter((patient) => patient.active).length)} icon={<Activity />} /><Metric label="Programa 6 meses" value={String(data.patients.filter((patient) => patient.programMonths === 6).length)} icon={<Clock3 />} /><Metric label="Programa 12 meses" value={String(data.patients.filter((patient) => patient.programMonths === 12).length)} icon={<CalendarDays />} /></div><section className="panel-surface list-panel">{data.patients.map((patient) => <button className="follow-row" key={patient.id} onClick={() => openPatient(patient.id)}><Avatar name={patient.name} color={patient.color} /><span className="follow-copy"><b>{patient.name}</b><small>{patient.age} · {patient.guardian} · programa {patient.programMonths} meses</small><span className="progress-track"><i style={{ width: `${patient.progress}%` }} /></span></span><span className="next-follow-date">Próxima etapa<strong>{patient.nextAppointment}</strong></span><StatusBadge value={patient.status} /><ChevronRight size={15} /></button>)}</section></>
    if (page === 'agenda') {
      const weekDays = ['Seg 12', 'Ter 13', 'Qua 14', 'Qui 15', 'Sex 16', 'Sáb 17', 'Dom 18']
      return <><div className="section-toolbar"><div><h2>Agenda clínica</h2><p>15 de outubro de 2026 · compromissos do consultório.</p></div><button className="button button-primary" onClick={() => setDialog({ kind: 'appointment', title: 'Nova consulta' })}><Plus size={16} /> Nova consulta</button></div><div className="agenda-toolbar"><div className="segmented"><button className={agendaMode === 'Hoje' ? 'selected' : ''} onClick={() => setAgendaMode('Hoje')}>Hoje</button><button className={agendaMode === 'Semana' ? 'selected' : ''} onClick={() => setAgendaMode('Semana')}>Semana</button></div><div className="date-switch"><button className="icon-button"><ChevronLeft size={17} /></button><b>{agendaMode === 'Hoje' ? 'Quinta-feira, 15 de outubro' : '12 — 18 de outubro de 2026'}</b><button className="icon-button"><ChevronRight size={17} /></button></div><span className="muted">{agendaMode === 'Hoje' ? '3 consultas' : '4 consultas'}</span></div>{agendaMode === 'Semana' ? <div className="calendar-grid">{weekDays.map((day, index) => { const dayNumber = day.slice(-2); const items = data.appointments.filter((appointment) => appointment.date.slice(0, 2) === dayNumber); return <section className={`calendar-day ${dayNumber === '15' ? 'today' : ''}`} key={day}><div className="calendar-day-header"><span>{day.slice(0, 3)}</span><b>{dayNumber}</b></div>{items.map((item) => <button className="calendar-event" key={item.id} onClick={() => showDetails(`${item.time} · ${patientName(data, item.patientId)}`, item)}><time>{item.time}</time><b>{shortName(patientName(data, item.patientId))} {patientName(data, item.patientId).split(' ')[1]}</b><small>{item.type}</small></button>)}{index === 0 && <button className="calendar-add" onClick={() => setDialog({ kind: 'appointment', title: 'Nova consulta' })}><Plus size={13} /> Adicionar</button>}</section> })}</div> : <section className="panel-surface day-agenda">{data.appointments.filter((appointment) => appointment.date === today).sort((a, b) => a.time.localeCompare(b.time)).map((appointment) => <button className="appointment-row" key={appointment.id} onClick={() => showDetails(`${appointment.time} · ${patientName(data, appointment.patientId)}`, appointment)}><span className="appointment-time">{appointment.time}</span><span className="appointment-rule" /><Avatar name={patientName(data, appointment.patientId)} color="mint" /><span className="appointment-copy"><b>{patientName(data, appointment.patientId)}</b><small>{appointment.type} · {appointment.professional}</small></span><StatusBadge value={appointment.status} /><ChevronRight size={16} /></button>)}</section>}<div className="agenda-note"><Sparkles size={16} /> Clique em uma consulta para ver o resumo ou use “Nova consulta” para adicionar um horário demonstrativo.</div></>
    }
    if (page === 'pending') return <><div className="section-toolbar"><div><h2>Central de pendências</h2><p>Acompanhe próximos passos da equipe e dos pacientes.</p></div><span className="pending-total"><CircleAlert size={16} /> {pendingCount} em aberto</span></div><div className="filter-chips">{['Todas', 'Pendente', 'Em andamento', 'Concluída'].map((filter) => <button key={filter} className={taskFilter === filter ? 'active' : ''} onClick={() => setTaskFilter(filter)}>{filter}</button>)}</div><section className="panel-surface list-panel">{data.tasks.filter((task) => taskFilter === 'Todas' || task.status === taskFilter).map((task) => <div className="pending-row" key={task.id}><span className={`pending-icon priority-${task.priority.toLowerCase()}`}><ListChecks size={17} /></span><span className="pending-copy"><b>{task.title}</b><small>{patientName(data, task.patientId)} · responsável: {data.patients.find((patient) => patient.id === task.patientId)?.guardian}</small></span><span className="pending-due"><small>Prazo</small><b>{task.due}</b></span><StatusBadge value={task.status} /><button className="button button-quiet" onClick={() => updateTask(task)}>{task.status === 'Concluída' ? 'Reabrir' : task.status === 'Pendente' ? 'Iniciar' : 'Concluir'}</button><button className="icon-button" onClick={() => openPatient(task.patientId)} title="Abrir paciente"><ArrowRight size={16} /></button></div>)}</section></>
    if (page === 'messages') return <><div className="section-toolbar"><div><h2>Caixa de mensagens</h2><p>Converse com as famílias usando o canal da equipe.</p></div></div><div className="filter-chips message-filters">{['Todas', 'Minhas', 'Não lidas', 'Aguardando equipe', 'Aguardando Dr. André', 'Resolvidas'].map((filter) => <button key={filter} className={messageFilter === filter ? 'active' : ''} onClick={() => setMessageFilter(filter)}>{filter}</button>)}</div><section className="panel-surface message-surface">{renderConversationPanel()}</section></>
    if (page === 'documents') return <DocumentList documents={data.documents} data={data} setDialog={setDialog} onOpen={showDetails} />
    if (page === 'reports') {
      const programs = [{ name: '6 meses', value: data.patients.filter((patient) => patient.programMonths === 6).length }, { name: '12 meses', value: data.patients.filter((patient) => patient.programMonths === 12).length }]
      const monthly = [{ label: 'Jun', value: 1 }, { label: 'Jul', value: 2 }, { label: 'Ago', value: 3 }, { label: 'Set', value: 4 }, { label: 'Out', value: data.patients.length }]
      return <><div className="section-toolbar"><div><h2>Visão do consultório</h2><p>Indicadores fictícios conectados aos dados desta demonstração.</p></div><button className="button button-quiet" onClick={() => showDetails('Sobre os dados do relatório', 'Os indicadores são calculados a partir dos registros demonstrativos desta sessão e podem mudar conforme você interage com o protótipo.')}>Sobre os indicadores</button></div><div className="metric-row report-metrics"><Metric label="Pacientes ativos" value={String(data.patients.filter((patient) => patient.active).length)} icon={<Baby />} /><Metric label="Programas ativos" value={String(data.patients.filter((patient) => patient.active).length)} icon={<Activity />} /><Metric label="Programas de 6 meses" value={String(programs[0].value)} icon={<Clock3 />} /><Metric label="Programas de 12 meses" value={String(programs[1].value)} icon={<CalendarDays />} /><Metric label="Pendências abertas" value={String(pendingCount)} icon={<CircleAlert />} tone="coral" /><Metric label="Etapas em dia" value="88%" icon={<CircleCheck />} /><Metric label="Mensagens abertas" value={String(data.conversations.filter((conversation) => conversation.status !== 'Resolvida').length)} icon={<MessageCircle />} /></div><div className="dashboard-grid report-grid"><section className="panel-surface chart-panel"><SectionHeader title="Novos acompanhamentos" description="Entradas por mês (mock demonstrativo)" /><ResponsiveContainer width="100%" height={245}><AreaChart data={monthly} margin={{ left: -20, right: 8, top: 12 }}><defs><linearGradient id="enrollmentFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} fill="url(#enrollmentFill)" /></AreaChart></ResponsiveContainer></section><section className="panel-surface chart-panel"><SectionHeader title="Programas ativos" description="Distribuição por duração" /><div className="program-chart"><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={programs} dataKey="value" innerRadius={57} outerRadius={82} paddingAngle={5}>{programs.map((_, index) => <Cell key={index} fill={index ? 'var(--coral)' : 'var(--accent)'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="program-legend">{programs.map((program, index) => <span key={program.name}><i style={{ background: index ? 'var(--coral)' : 'var(--accent)' }} />{program.name}<b>{program.value}</b></span>)}</div></div></section></div></>
    }
    if (page === 'team') return <><div className="section-toolbar"><div><h2>Equipe Crescer</h2><p>Pessoas, responsabilidades e conversas atribuídas.</p></div><button className="button button-primary" onClick={() => showDetails('Adicionar membro à equipe', 'Nesta demonstração, os perfis abaixo ilustram permissões conceituais por função.') }><Plus size={16} /> Membro</button></div><div className="team-grid">{data.team.map((member) => <button className="team-card panel-surface" key={member.id} onClick={() => showDetails(member.name, { ...member, conversas: data.conversations.filter((conversation) => (member.id === 'doctor' ? conversation.assigned === 'Dr. André' : conversation.assigned === 'Equipe')).length })}><Avatar name={member.initials} color={member.color} large /><span className="team-card-copy"><b>{member.name}</b><small>{member.role}</small><span className="team-online"><i /> Disponível para atendimento</span></span><span className="team-open">Ver perfil <ArrowRight size={14} /></span></button>)}</div><section className="panel-surface team-principle"><ShieldCheck size={21} /><div><b>Conversa com o serviço, não com um telefone pessoal</b><p>Mensagens e atribuições ficam visíveis à equipe conforme suas permissões, mantendo o contexto e o histórico do atendimento.</p></div></section></>
    if (page === 'settings') return <><div className="section-toolbar"><div><h2>Preferências do consultório</h2><p>Personalize a demonstração para a conversa com o Dr. André.</p></div>{settingsSaved && <span className="saved-state"><CheckCircle2 size={16} /> Preferências salvas</span>}</div><div className="settings-grid"><section className="panel-surface settings-section"><SectionHeader title="Perfil" /><label className="field"><span>Nome profissional</span><input value={profileName} onChange={(event) => { setProfileName(event.target.value); setSettingsSaved(false) }} /></label><label className="field"><span>Especialidade</span><input defaultValue="Pediatria" /></label><label className="field"><span>Nome do consultório</span><input defaultValue="Crescer · Acompanhamento pediátrico" /></label><button className="button button-primary" onClick={() => setSettingsSaved(true)}>Salvar perfil</button></section><section className="panel-surface settings-section"><SectionHeader title="Aparência" description="O tema é aplicado em todas as experiências." /><div className="theme-options">{([{ id: 'mint', name: 'Menta', color: '#4f9c84', swatch: '#dcefe6' }, { id: 'lavender', name: 'Lavanda', color: '#7a70a7', swatch: '#eae7f4' }, { id: 'peach', name: 'Pêssego', color: '#c77457', swatch: '#f8e4d9' }] as const).map((option) => <button className={`theme-option ${theme === option.id ? 'chosen' : ''}`} key={option.id} onClick={() => setTheme(option.id)}><span style={{ background: option.swatch }}><i style={{ background: option.color }} /></span><b>{option.name}</b>{theme === option.id && <CheckCircle2 size={15} />}</button>)}</div></section><section className="panel-surface settings-section"><SectionHeader title="Notificações" description="Escolha quais avisos aparecem nesta demonstração." />{([['reminders', 'Lembretes de consultas', 'Avisos sobre as próximas etapas da agenda'], ['messages', 'Mensagens não lidas', 'Notificação quando uma família iniciar uma conversa'], ['weeklySummary', 'Resumo semanal', 'Resumo de pacientes, etapas e pendências']] as const).map(([key, label, detail]) => <label className="preference-row" key={key}><span><b>{label}</b><small>{detail}</small></span><input type="checkbox" checked={preferences[key]} onChange={(event) => { setPreferences((current) => ({ ...current, [key]: event.target.checked })); setSettingsSaved(false) }} /></label>)}</section><section className="panel-surface settings-section"><SectionHeader title="Informações da equipe" /><div className="settings-fact"><span>Profissionais</span><b>{data.team.length - 1}</b></div><div className="settings-fact"><span>Canal de atendimento</span><b>Caixa compartilhada</b></div><div className="settings-fact"><span>Registro de demonstração</span><b>Dados fictícios locais</b></div><button className="button button-quiet" onClick={() => showDetails('Privacidade nesta demonstração', 'Os dados são fictícios e ficam salvos somente neste navegador. Esta V0 não implementa autenticação real, transmissão clínica nem controles de acesso de produção.')}>Ver informações de privacidade</button></section></div></>
    return <div className="panel-surface empty-state"><Inbox size={25} /><b>Esta área estará disponível na navegação Crescer.</b><button className="button button-quiet" onClick={() => navigate('dashboard')}>Voltar à visão geral</button></div>
  }

  const renderFamilyPage = () => {
    if (isBasic) {
      if (page === 'messages') return <section className="panel-surface basic-message"><div className="basic-message-icon"><MessageCircle size={22} /></div><span className="eyebrow">CANAL DA CLÍNICA</span><h2>Fale com a equipe</h2><p>Você pode enviar uma mensagem para a equipe de atendimento do consultório. Acompanhamento, jornada, metas e orientações ficam disponíveis no Programa de Acompanhamento.</p>{basicSent ? <div className="success-banner"><CircleCheck size={18} /> Mensagem enviada para a equipe. Você receberá uma resposta por este canal.</div> : <form onSubmit={(event) => { event.preventDefault(); if (basicMessage.trim()) setBasicSent(true) }}><label className="field"><span>Sua mensagem</span><textarea rows={4} value={basicMessage} onChange={(event) => setBasicMessage(event.target.value)} placeholder="Escreva sua dúvida para a equipe..." /></label><button className="button button-primary" disabled={!basicMessage.trim()}><Send size={15} /> Enviar mensagem</button></form>}</section>
      if (page === 'profile') return <section className="panel-surface settings-section basic-profile"><SectionHeader title="Meu perfil" description="Acesso básico do responsável" /><Avatar name="Responsável" color="blue" large /><label className="field"><span>Seu nome</span><input defaultValue="Responsável da família" /></label><label className="field"><span>Contato</span><input defaultValue="E-mail cadastrado" /></label><div className="access-note"><LockKeyhole size={16} /> Acesso básico ativo. Informações de acompanhamento são disponibilizadas no programa.</div></section>
      if (page === 'notifications') return <section className="panel-surface"><SectionHeader title="Notificações" description="Avisos de atendimento para este acesso." /><div className="empty-state"><Bell size={24} /><b>Você está em dia</b><span>Novas respostas da equipe aparecem aqui.</span></div></section>
      return <><section className="basic-hero"><span className="eyebrow">CRESCER · ÁREA DA FAMÍLIA</span><div className="basic-hero-content"><div><h1>Bem-vinda à Crescer.</h1><p>Este é seu acesso básico ao consultório. O canal de mensagens e seu perfil estão disponíveis.</p><button className="button button-dark" onClick={() => navigate('messages')}>Falar com a equipe <ArrowRight size={15} /></button></div><div className="basic-illustration"><div className="sun-disc"><Heart size={35} /></div><span>cuidado próximo,<br />em cada conversa</span></div></div></section><div className="section-toolbar basic-access-heading"><div><h2>Seu acesso</h2><p>Recursos disponíveis e incluídos no acompanhamento pediátrico.</p></div><span className="basic-pill"><ShieldCheck size={14} /> Acesso básico</span></div><div className="access-grid"><button className="access-card available" onClick={() => navigate('messages')}><span className="access-icon"><MessageCircle /></span><b>Mensagens</b><small>Converse com a equipe do consultório.</small><span className="access-link">Disponível <ArrowRight size={14} /></span></button><button className="access-card available" onClick={() => navigate('profile')}><span className="access-icon"><UserRound /></span><b>Meu perfil</b><small>Consulte e atualize seus dados básicos.</small><span className="access-link">Disponível <ArrowRight size={14} /></span></button>{[{ id: 'journey' as Page, icon: <Activity />, name: 'Jornada' }, { id: 'goals' as Page, icon: <ListChecks />, name: 'Plano de metas' }, { id: 'guidance' as Page, icon: <Heart />, name: 'Orientações' }, { id: 'documents' as Page, icon: <FileText />, name: 'Documentos' }].map((item) => <button className="access-card locked" key={item.id} onClick={() => setDialog({ kind: 'locked', title: item.name })}><span className="access-icon">{item.icon}</span><span className="lock-mark"><LockKeyhole size={14} /></span><b>{item.name}</b><small>Conteúdo do acompanhamento infantil.</small><span className="access-link">Disponível no programa <ArrowRight size={14} /></span></button>)}</div><p className="basic-footer-note"><LockKeyhole size={14} /> Não há pagamento nesta demonstração. O acesso básico mostra apenas os recursos disponíveis neste perfil.</p></>
    }
    const patient = familyPatient
    const patientGoals = data.goals.filter((goal) => goal.patientId === patient.id)
    const patientGuidance = data.guidance.filter((item) => item.patientId === patient.id && item.visibility === 'Compartilhado')
    const patientDocuments = data.documents.filter((item) => item.patientId === patient.id && item.visibility === 'Compartilhado')
    const patientGrowth = data.growth.filter((record) => record.patientId === patient.id)
    const familyMural = data.mural.filter((post) => post.status === 'Publicado' && (post.audience === 'Todos do programa' || post.audience === `Programa ${patient.programMonths} meses`))
    if (page === 'mural') return <><section className="family-page-intro"><span className="eyebrow">DR. ANDRÉ E EQUIPE</span><h1>Mural Crescer</h1><p>Avisos, orientações e novidades para as famílias do programa.</p></section><div className="family-mural-list">{familyMural.map((post) => <article className="family-mural-card panel-surface" key={post.id}><div className="family-mural-header"><span className={`mural-category category-${post.category.toLowerCase()}`}>{post.category}</span><span>{post.date}</span></div><h2>{post.title}</h2><p>{post.summary}</p><div className="family-mural-footer"><span>{post.author} · Crescer</span>{post.category === 'Lembrete' ? <button className="button button-primary" onClick={() => navigate('journey')}>Ver consulta <ArrowRight size={14} /></button> : <button className="text-button" onClick={() => showDetails(post.title, post)}>Ler <ArrowRight size={14} /></button>}</div></article>)}{!familyMural.length && <Empty message="Novas publicações para o seu programa aparecerão aqui." />}</div></>
    if (page === 'home') return <><section className="family-welcome"><div><span className="eyebrow">QUINTA-FEIRA, 15 DE OUTUBRO</span><h1>Olá, Mariana <span className="wave">☀</span></h1><p>Um espaço para acompanhar cada descoberta do João Pedro.</p></div><button className="button button-quiet" onClick={() => navigate('notifications')}><Bell size={17} /> Avisos <span className="notice-count">{familyNotices.filter((notice) => !notice.read).length}</span></button></section><section className="child-hero"><div className="child-hero-copy"><span className="eyebrow">MEU FILHO</span><h2>{patient.name}</h2><p>{patient.age} <span>·</span> Programa de {patient.programMonths} meses</p><div className="child-progress-label"><span>Jornada de acompanhamento</span><b>{patient.progress}%</b></div><div className="progress-track light"><i style={{ width: `${patient.progress}%` }} /></div></div><div className="child-hero-art"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="baby-avatar"><Baby size={45} /></span></div><button className="child-hero-link" onClick={() => navigate('child')} aria-label="Ver meu filho"><ArrowRight size={19} /></button></section><div className="family-home-grid"><section className="panel-surface family-next"><SectionHeader title="Próxima etapa" action={<button className="text-button" onClick={() => navigate('journey')}>Ver jornada <ArrowRight size={14} /></button>} /><div className="family-appointment"><span className="family-calendar-icon"><CalendarDays size={19} /></span><div><small>CONSULTA DE ACOMPANHAMENTO</small><b>Avaliação do 4º mês</b><span>15 de outubro · 09:00</span></div><ChevronRight size={16} /></div></section><section className="panel-surface family-goals"><SectionHeader title="Metas desta fase" action={<button className="text-button" onClick={() => navigate('goals')}>Ver todas <ArrowRight size={14} /></button>} />{patientGoals.slice(0, 2).map((goal) => <GoalRow goal={goal} key={goal.id} onOpen={() => showDetails(goal.title, goal)} family />)}</section><section className="panel-surface family-guidance"><SectionHeader title="Orientações para você" action={<button className="text-button" onClick={() => navigate('guidance')}>Ver orientações <ArrowRight size={14} /></button>} />{patientGuidance.slice(0, 1).map((item) => <button className="guidance-preview" key={item.id} onClick={() => showDetails(item.title, item)}><span className="guidance-icon"><Heart size={17} /></span><span><b>{item.title}</b><small>{item.category} · compartilhada pela equipe</small></span><ChevronRight size={15} /></button>)}{!patientGuidance.length && <Empty message="Novas orientações aparecerão aqui." />}</section><section className="panel-surface family-messages"><SectionHeader title="Converse com a equipe" /><p>Uma dúvida sobre a consulta? Envie uma mensagem pelo canal seguro do consultório.</p><button className="button button-primary" onClick={() => navigate('messages')}><MessageCircle size={15} /> Abrir conversa</button></section></div></>
    if (page === 'child') return <><section className="panel-surface child-detail"><Avatar name={patient.name} color="mint" large /><div><span className="eyebrow">PERFIL DA CRIANÇA</span><h1>{patient.name}</h1><p>{patient.age} · Nascimento em {patient.birthDate}</p><p>Responsável: Mariana Almeida (Mãe)</p></div></section><div className="metric-row"><Metric label="Programa" value={`${patient.programMonths} meses`} icon={<Activity />} /><Metric label="Etapa atual" value="4º mês" icon={<CalendarDays />} /><Metric label="Próxima consulta" value="15 out · 09:00" icon={<Clock3 />} /></div><section className="panel-surface"><SectionHeader title="Crescimento recente" action={<button className="text-button" onClick={() => navigate('journey')}>Ver jornada <ArrowRight size={14} /></button>} /><div className="family-growth-stats">{patientGrowth.at(-1) && <><Metric label="Último peso" value={`${patientGrowth.at(-1)?.weight.toFixed(1)} kg`} /><Metric label="Comprimento" value={`${patientGrowth.at(-1)?.length} cm`} /><Metric label="Perímetro cefálico" value={`${patientGrowth.at(-1)?.head} cm`} /></>}</div></section></>
    if (page === 'journey') return <><section className="family-page-intro"><span className="eyebrow">A JORNADA DO {patient.name.split(' ')[0].toUpperCase()}</span><h1>Cada etapa, no seu tempo.</h1><p>Acompanhe as etapas do programa e prepare suas dúvidas para a próxima consulta.</p></section><section className="panel-surface family-timeline"><SectionHeader title="Programa de acompanhamento" description={`${patient.progress}% concluído · próxima etapa ${patient.nextAppointment}`} /><div className="timeline family-timeline-list">{patient.stages.map((stage, index) => <button className={`timeline-item state-${stage.state}`} key={stage.id} onClick={() => showDetails(stage.label, { ...stage, nome: patient.name })}><span className="timeline-marker">{stage.state === 'done' ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span><span className="timeline-copy"><span className="timeline-topline"><b>{stage.label}</b><small>{stage.date}</small></span><span>{stage.summary}</span><em>{stage.state === 'done' ? 'Concluída' : stage.state === 'current' ? 'Próxima etapa' : stage.state === 'pending' ? 'Em preparação' : 'Planejada'}</em></span><ChevronRight size={16} /></button>)}</div></section></>
    if (page === 'goals') return <><section className="family-page-intro"><span className="eyebrow">ETAPA ATUAL · 4 MESES</span><h1>Pequenos passos, grandes descobertas.</h1><p>Metas compartilhadas pela equipe para acompanhar junto com o João.</p></section><div className="section-stack">{patientGoals.map((goal) => <GoalRow goal={goal} key={goal.id} onOpen={() => showDetails(goal.title, goal)} family />)}</div></>
    if (page === 'guidance') return <><section className="family-page-intro"><span className="eyebrow">CONTEÚDO DA EQUIPE</span><h1>Orientações para a família.</h1><p>Informações que a equipe compartilhou com você durante o acompanhamento.</p></section><div className="section-stack">{patientGuidance.map((item) => <button className="guidance-card panel-surface" key={item.id} onClick={() => showDetails(item.title, item)}><span className="guidance-icon"><Heart size={18} /></span><span className="grow"><b>{item.title}</b><small>{item.category} · {item.date}</small><p>{item.body}</p></span><ChevronRight size={16} /></button>)}</div></>
    if (page === 'documents') return <DocumentList documents={patientDocuments} data={data} family onOpen={showDetails} />
    if (page === 'messages') return <><section className="family-page-intro compact-intro"><span className="eyebrow">CANAL DO CONSULTÓRIO</span><h1>Converse com a equipe.</h1><p>Seu histórico continua disponível para quem cuida de vocês.</p></section><section className="panel-surface message-surface family-message-surface">{renderConversationPanel()}</section></>
    if (page === 'notifications') return <section className="panel-surface"><SectionHeader title="Avisos do acompanhamento" description="Atualizações do consultório para você e o João." />{familyNotices.map((notice) => <button className={`notice-row ${notice.read ? '' : 'unread'}`} key={notice.id} onClick={() => markNoticeRead(notice)}><span className="notice-icon"><Bell size={17} /></span><span><b>{notice.title}</b><small>{notice.detail}</small></span><time>{notice.date}</time>{!notice.read && <i className="unread-dot" />}</button>)}{!familyNotices.length && <Empty message="Você está em dia. Novos avisos aparecerão aqui." />}</section>
    if (page === 'profile') return <div className="profile-grid"><section className="panel-surface settings-section"><SectionHeader title="Seu perfil" description="Informações de contato da família." /><div className="profile-identity"><Avatar name="Mariana Almeida" color="coral" large /><div><b>Mariana Almeida</b><small>Mãe do João Pedro</small></div></div><label className="field"><span>Nome</span><input defaultValue="Mariana Almeida" /></label><label className="field"><span>E-mail</span><input defaultValue="mariana@email.com" /></label><label className="field"><span>Telefone</span><input defaultValue="(11) 99999-0000" /></label><button className="button button-primary" onClick={() => setSettingsSaved(true)}>Salvar alterações</button></section><section className="panel-surface settings-section"><SectionHeader title="Privacidade e acesso" /><div className="access-note"><ShieldCheck size={17} /> Você vê apenas conteúdos compartilhados pela equipe para sua família.</div><div className="settings-fact"><span>Criança vinculada</span><b>João Pedro</b></div><div className="settings-fact"><span>Programa</span><b>Ativo · 12 meses</b></div><button className="button button-quiet" onClick={() => showDetails('Sobre seus dados', 'Esta experiência usa dados fictícios e locais para demonstrar os fluxos do Crescer. Nenhum dado é enviado para um serviço externo.')}>Ver informações de privacidade</button></section></div>
    return renderFamilyPageHomeFallback()
  }

  const profileLabel = role === 'doctor' ? profileName : role === 'team' ? 'Ana Paula' : role === 'parent-active' ? 'Mariana Almeida' : 'Responsável'
  const mobileNav = isFamily ? familyNavigation.filter((item) => ['home', 'journey', 'messages', 'profile'].includes(item.id)) : clinicianNavigation.filter((item) => ['dashboard', 'patients', 'pending', 'messages'].includes(item.id))

  return <div className={`app-frame ${isFamily ? 'family-frame' : ''}`}>
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <button className="brand" onClick={() => navigate(isFamily ? 'home' : 'dashboard')}><span className="brand-mark"><Sparkles size={16} /></span><span>Crescer<small>pediatria com presença</small></span></button>
      <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMobileMenu(false)}><X size={18} /></button>
      <div className="workspace-label">{isFamily ? 'ÁREA DA FAMÍLIA' : 'CONSULTÓRIO'}</div>
      <nav className="side-nav">{sidebarNavigation.map((item) => <button key={item.id} className={page === item.id || (item.id === 'patients' && page === 'patients') ? 'active' : ''} onClick={() => item.locked && isBasic ? setDialog({ kind: 'locked', title: item.label }) : navigate(item.id)}>{item.icon}<span>{item.label}</span>{item.locked && isBasic && <LockKeyhole size={13} />}{item.id === 'messages' && !isFamily && data.conversations.some((conversation) => conversation.unread) && <i className="nav-badge" />}</button>)}</nav>
      <div className="sidebar-spacer" />
      {isFamily && <div className="sidebar-help"><div className="help-icon"><Heart size={16} /></div><b>Estamos por perto.</b><p>Fale com a equipe sempre que precisar.</p><button onClick={() => navigate('messages')}>Abrir mensagens <ArrowRight size={13} /></button></div>}
      <div className="account-switcher"><Avatar name={profileLabel} color={isFamily ? 'coral' : role === 'team' ? 'blue' : 'mint'} /><span><b>{profileLabel}</b><small>{role === 'doctor' ? 'Pediatra' : role === 'team' ? 'Equipe Crescer' : role === 'parent-active' ? 'Responsável · programa ativo' : 'Acesso básico'}</small></span><button className="icon-button" title="Trocar perfil" onClick={() => setRole(null)}><ChevronDown size={16} /></button></div>
    </aside>
    <div className="app-main">
      <header className="topbar"><button className="icon-button mobile-menu-button" onClick={() => setMobileMenu((current) => !current)} aria-label="Abrir menu"><Menu size={20} /></button><div className="breadcrumbs"><span>{isFamily ? 'Minha família' : 'Consultório'}</span><ChevronRight size={13} /><b>{page === 'patients' && selectedPatientId ? shortName(currentPatient.name) : pageTitle[page]}</b></div><div className="topbar-actions">{!isFamily && <label className="global-search"><Search size={15} /><input placeholder="Buscar paciente, conversa..." value={search} onChange={(event) => setSearch(event.target.value)} onFocus={() => { if (page !== 'patients') navigate('patients') }} /></label>}<button className={`icon-button notification-trigger ${noticePanel ? 'selected' : ''}`} aria-label="Notificações" onClick={() => setNoticePanel((current) => !current)}><Bell size={18} />{unreadCount > 0 && <i />}</button><button className="top-avatar" onClick={() => navigate(isFamily ? 'profile' : 'settings')} title={profileLabel}><Avatar name={profileLabel} color={isFamily ? 'coral' : 'mint'} /></button></div>
        {noticePanel && <div className="notification-popover"><div className="popover-heading"><span><b>Notificações</b><small>{visibleNotices.filter((notice) => !notice.read).length} não lidas</small></span><button className="text-button" onClick={() => setData((current) => ({ ...current, notices: current.notices.map((notice) => ({ ...notice, read: true })) }))}>Marcar todas como lidas</button></div>{visibleNotices.slice(0, 5).map((notice) => <button className={`notice-row ${notice.read ? '' : 'unread'}`} key={notice.id} onClick={() => markNoticeRead(notice)}><span className="notice-icon"><Bell size={16} /></span><span><b>{notice.title}</b><small>{notice.detail}</small><time>{notice.date}</time></span>{!notice.read && <i className="unread-dot" />}</button>)}{!visibleNotices.length && <Empty message="Você está em dia." />}</div>}
      </header>
      <main className={`page-content ${isFamily ? 'family-content' : ''}`}>
        {isFamily ? <>{renderFamilyPage()}{!isBasic && page === 'home' && <><section className="family-plan-overview panel-surface"><div className="family-plan-heading"><span className="eyebrow">PLANO ATUAL</span><b>{patient.ageMonths}º → {patient.ageMonths + 1}º mês</b><small>{patient.progress} / 100% do programa</small></div><div className="family-plan-stats"><span><CalendarDays size={16} /><small>Próxima consulta</small><b>{nextAppointment ? `${nextAppointment.date.slice(0, 5)} · ${nextAppointment.time}` : 'A agendar'}</b></span><span><ListChecks size={16} /><small>Metas atuais</small><b>{patientPlanGoals.filter((goal) => goal.status !== 'Concluída').length}</b></span><span><Heart size={16} /><small>Orientações novas</small><b>{newSharedGuidance}</b></span><span><CircleAlert size={16} /><small>Pendências</small><b>{patientTasks.length}</b></span></div><button className="button button-primary" onClick={() => navigate('goals')}>Ver meu plano <ArrowRight size={14} /></button></section><section className="family-mural-preview"><SectionHeader title="Do Mural" description="Recados da equipe para as famílias" action={<button className="text-button" onClick={() => navigate('mural')}>Ver mural <ArrowRight size={14} /></button>} />{familyMural.slice(0, 2).map((post) => <article className="family-mural-card panel-surface" key={post.id}><span className={`mural-category category-${post.category.toLowerCase()}`}>{post.category}</span><h2>{post.title}</h2><p>{post.summary}</p><button className="text-button" onClick={() => post.category === 'Lembrete' ? navigate('journey') : showDetails(post.title, post)}> {post.category === 'Lembrete' ? 'Ver consulta' : 'Ler'} <ArrowRight size={14} /></button></article>)}</section></>}</> : <>{page !== 'dashboard' && !(page === 'patients' && selectedPatientId) && <div className="page-heading"><span className="eyebrow">{page === 'messages' ? 'ATENDIMENTO COMPARTILHADO' : 'ESPAÇO CLÍNICO'}</span><h1>{pageTitle[page]}</h1></div>}{renderDoctorPage()}</>}
      </main>
      <nav className="mobile-bottom-nav">{mobileNav.map((item) => <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => navigate(item.id)}>{item.icon}<span>{item.label === 'Visão geral' ? 'Início' : item.label}</span></button>)}</nav>
    </div>
    {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><header><div><span className="eyebrow">CRESCER · DEMONSTRAÇÃO</span><h2 id="dialog-title">{dialog.title}</h2></div><button className="icon-button" onClick={() => setDialog(null)} aria-label="Fechar"><X size={18} /></button></header>{dialog.kind === 'locked' ? <div className="locked-dialog"><span className="locked-dialog-icon"><LockKeyhole size={22} /></span><b>Disponível no Programa de Acompanhamento.</b><p>Este conteúdo faz parte da jornada completa da criança e fica disponível para famílias com programa ativo.</p><button className="button button-dark" onClick={() => setDialog(null)}>Entendi</button></div> : dialog.kind === 'details' ? <DetailContent record={dialog.record} /> : formForDialog()}</section></div>}
  </div>

  function renderFamilyPageHomeFallback() { return <section className="panel-surface empty-state"><Home size={24} /><b>Seu espaço Crescer</b><span>Escolha uma opção no menu para continuar.</span></section> }
}

function Login({ onSelect }: { onSelect: (role: Role) => void }) {
  const options: { role: Role; title: string; label: string; description: string; icon: ReactNode; color: string }[] = [
    { role: 'doctor', title: 'Dr. André', label: 'Médico', description: 'Dashboard, pacientes e gestão clínica.', icon: <Stethoscope />, color: 'mint' },
    { role: 'team', title: 'Equipe Crescer', label: 'Equipe', description: 'Agenda, triagem e caixa de mensagens.', icon: <Users />, color: 'blue' },
    { role: 'parent-active', title: 'Mariana Almeida', label: 'Responsável · programa ativo', description: 'A jornada completa do João Pedro.', icon: <Heart />, color: 'coral' },
    { role: 'parent-basic', title: 'Acesso básico', label: 'Responsável · sem programa', description: 'Veja o que está disponível neste perfil.', icon: <UserRound />, color: 'lilac' },
  ]
  return <main className="login-page"><div className="login-scene"><div className="login-brand"><span className="brand-mark"><Sparkles size={16} /></span> Crescer</div><div className="login-message"><div className="login-overline"><span /> CUIDADO QUE ACOMPANHA</div><h1>Todo começo merece<br /><em>um bom caminho.</em></h1><p>Um lugar para cuidar do crescimento, estar perto das famílias e acompanhar cada descoberta.</p><div className="login-decoration"><div className="decoration-ring ring-a" /><div className="decoration-ring ring-b" /><span className="decoration-heart"><Heart size={31} /></span><span className="decoration-caption">crescer junto, sempre</span></div><div className="login-footnote"><span>01</span> ACOMPANHAMENTO PEDIÁTRICO COM PRESENÇA</div></div></div><section className="login-panel"><div className="login-panel-content"><span className="eyebrow">AMBIENTE DE DEMONSTRAÇÃO</span><h2>Entre para explorar.</h2><p>Escolha um perfil para navegar pelos fluxos do Crescer.</p><div className="login-options">{options.map((option) => <button className="login-option" key={option.role} onClick={() => onSelect(option.role)}><span className={`login-option-icon tone-${option.color}`}>{option.icon}</span><span className="login-option-copy"><b>{option.title}</b><small>{option.description}</small><em>{option.label}</em></span><ArrowRight size={17} /></button>)}</div><div className="login-privacy"><ShieldCheck size={15} /> Dados fictícios salvos somente neste navegador.</div></div><div className="login-panel-footer">Crescer <span>·</span> acompanhamento pediátrico</div></section></main>
}

function Avatar({ name, color = 'mint', large = false }: { name: string; color?: string; large?: boolean }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return <span className={`avatar avatar-${color} ${large ? 'avatar-large' : ''}`}>{initials}</span>
}

function StatusBadge({ value }: { value: string }) {
  const style = value === 'Atrasado' || value === 'Pendente' ? 'status-coral' : value === 'Pendência' || value === 'Em andamento' || value === 'Atenção' || value === 'Aguardando Dr. André' || value === 'Aguardando equipe' ? 'status-gold' : value === 'Resolvida' || value === 'Concluída' ? 'status-green' : 'status-blue'
  return <span className={`status-badge ${style}`}><i />{value}</span>
}

function VisibilityBadge({ value }: { value: Visibility }) { return <span className={`visibility-badge ${value === 'Interno' ? 'internal' : 'shared'}`}>{value === 'Interno' ? 'INTERNO' : 'COMPARTILHADO'}</span> }

function Metric({ label, value, detail, icon, tone = 'mint', onClick }: { label: string; value: string; detail?: string; icon?: ReactNode; tone?: string; onClick?: () => void }) {
  const content = <><span className={`metric-icon tone-${tone}`}>{icon}</span><span className="metric-copy"><small>{label}</small><b>{value}</b>{detail && <em>{detail}</em>}</span>{onClick && <ArrowRight className="metric-arrow" size={16} />}</>
  return onClick ? <button className="metric-card panel-surface" onClick={onClick}>{content}</button> : <div className="metric-card panel-surface">{content}</div>
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <header className="section-header"><span><h2>{title}</h2>{description && <p>{description}</p>}</span>{action}</header> }
function Empty({ message }: { message: string }) { return <div className="empty-state"><Inbox size={21} /><span>{message}</span></div> }

function GoalRow({ goal, onOpen, family = false }: { goal: Goal; onOpen: () => void; family?: boolean }) {
  return <button className={`goal-row panel-surface ${family ? 'family-goal-row' : ''}`} onClick={onOpen}><span className={`goal-check ${goal.status === 'Concluída' ? 'done' : ''}`}>{goal.status === 'Concluída' ? <Check size={14} /> : <span />}</span><span className="goal-copy"><small>{goal.stage}</small><b>{goal.title}</b><span>{goal.detail}</span></span><StatusBadge value={goal.status} /><ChevronRight size={15} /></button>
}

function GrowthChart({ records, compact = false }: { records: GrowthRecord[]; compact?: boolean }) {
  const chartRecords = records.map((record, index) => ({ name: `Reg. ${index + 1}`, date: record.date.slice(0, 5), peso: record.weight, comprimento: record.length, perímetro: record.head }))
  if (!records.length) return <Empty message="Ainda não há medidas registradas." />
  return <div className={`growth-chart ${compact ? 'compact-chart' : ''}`}><div className="chart-legend"><span><i className="legend-mint" /> Peso (kg)</span><span><i className="legend-coral" /> Comprimento (cm)</span><span><i className="legend-blue" /> Perímetro cefálico (cm)</span></div><ResponsiveContainer width="100%" height={compact ? 150 : 270}><AreaChart data={chartRecords} margin={{ top: 8, right: 12, left: -19, bottom: 0 }}><defs><linearGradient id="growthMint" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--line)" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} /><Tooltip /><Area type="monotone" dataKey="comprimento" stroke="var(--coral)" fill="transparent" strokeWidth={2} /><Area type="monotone" dataKey="perímetro" stroke="var(--blue)" fill="transparent" strokeWidth={2} /><Area type="monotone" dataKey="peso" stroke="var(--accent)" fill="url(#growthMint)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></div>
}

function DetailContent({ record }: { record: unknown }) {
  if (typeof record === 'string') return <div className="detail-content"><p>{record}</p></div>
  if (!record || typeof record !== 'object') return null
  const entries = Object.entries(record as Record<string, unknown>).filter(([key, value]) => !['id', 'patientId', 'color', 'stages', 'messages', 'permissions'].includes(key) && typeof value !== 'object')
  const permissions = (record as { permissions?: string[] }).permissions
  const messages = (record as { messages?: Conversation['messages'] }).messages
  return <div className="detail-content">{entries.map(([key, value]) => <div className="detail-item" key={key}><small>{key.replace(/([A-Z])/g, ' $1')}</small><b>{String(value)}</b></div>)}{permissions && <div className="detail-list"><b>Permissões conceituais</b>{permissions.map((permission) => <span key={permission}><Check size={14} /> {permission}</span>)}</div>}{messages && <div className="detail-list"><b>Histórico desta conversa</b>{messages.map((message) => <span key={message.id}><b>{message.author}</b>: {message.text}</span>)}</div>}</div>
}

function DocumentList({ documents, data, setDialog, onOpen, family = false }: { documents: AppData['documents']; data: AppData; setDialog?: (value: DialogState) => void; onOpen: (title: string, record: unknown) => void; family?: boolean }) {
  return <div className="section-stack"><div className="section-toolbar"><div><h2>{family ? 'Documentos compartilhados' : 'Biblioteca de documentos'}</h2><p>{family ? 'Arquivos que a equipe disponibilizou para sua família.' : 'Arquivos demonstrativos vinculados ao acompanhamento dos pacientes.'}</p></div>{!family && setDialog && <button className="button button-primary" onClick={() => setDialog({ kind: 'document', title: 'Enviar documento' })}><Plus size={16} /> Enviar documento</button>}</div><section className="panel-surface document-list">{documents.map((document) => <button className="document-row" key={document.id} onClick={() => onOpen(document.name, { ...document, paciente: patientName(data, document.patientId) })}><span className="document-icon"><FileText size={20} /></span><span className="document-copy"><b>{document.name}</b><small>{patientName(data, document.patientId)} · {document.kind} · {document.date}</small></span><VisibilityBadge value={document.visibility} /><span className="document-size">{document.size}</span><ChevronRight size={16} /></button>)}{!documents.length && <Empty message={family ? 'Ainda não há documentos compartilhados.' : 'Nenhum documento cadastrado.'} />}</section></div>
}

export default App