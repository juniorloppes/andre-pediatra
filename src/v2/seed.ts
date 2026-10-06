import { DEFAULT_PROGRAMS, DEFAULT_VACCINES, curveRows } from './reference'
import type { AppState, Appointment, Content, Conversation, EncounterKind, FollowUp, GrowthRecord, Patient, PaymentMethod, Sale, VaccineRecord } from './types'
import { addDays, addMonths, ageMonthsExact, TODAY } from './utils'

export const STATE_VERSION = 5

const patients: Patient[] = [
  { id: 'p-laura', name: 'Laura Mendes', sex: 'F', birthDate: '2026-06-20', guardian: 'Ana Beatriz Mendes', guardianRelation: 'Mãe', phone: '(11) 98123-4455', email: 'ana.mendes@email.com', createdAt: '2026-06-24' },
  { id: 'p-gabriel', name: 'Gabriel Souza', sex: 'M', birthDate: '2025-08-15', guardian: 'Carolina Souza', guardianRelation: 'Mãe', phone: '(11) 99812-3301', email: 'carolina.souza@email.com', createdAt: '2025-08-20' },
  { id: 'p-helena', name: 'Helena Lima', sex: 'F', birthDate: '2026-06-02', guardian: 'Juliana Lima', guardianRelation: 'Mãe', phone: '(11) 97654-1200', email: 'juliana.lima@email.com', createdAt: '2026-10-01' },
  { id: 'p-miguel', name: 'Miguel Rocha', sex: 'M', birthDate: '2024-11-20', guardian: 'Renata Rocha', guardianRelation: 'Mãe', phone: '(11) 98777-0098', email: 'renata.rocha@email.com', createdAt: '2024-11-25' },
  { id: 'p-sophia', name: 'Sophia Costa', sex: 'F', birthDate: '2026-01-10', guardian: 'Fernanda Costa', guardianRelation: 'Mãe', phone: '(11) 99001-2244', email: 'fernanda.costa@email.com', createdAt: '2026-01-15' },
  { id: 'p-pedro', name: 'Pedro Almeida', sex: 'M', birthDate: '2025-12-01', guardian: 'Paulo Almeida', guardianRelation: 'Pai', phone: '(11) 98450-7781', email: 'paulo.almeida@email.com', createdAt: '2026-02-03', notes: 'Família com conta no Crescer, sem programa contratado.' },
  { id: 'p-alice', name: 'Alice Martins', sex: 'F', birthDate: '2026-09-12', guardian: 'Mariana Martins', guardianRelation: 'Mãe', phone: '(11) 97700-5512', email: 'mariana.martins@email.com', createdAt: '2026-09-14' },
  { id: 'p-theo', name: 'Theo Ribeiro', sex: 'M', birthDate: '2025-03-10', guardian: 'Lucas Ribeiro', guardianRelation: 'Pai', phone: '(11) 96655-4433', email: 'lucas.ribeiro@email.com', createdAt: '2025-03-12' },
]

/* Vendas: produto "Meus Primeiros Passos", contratos Ano 1 / Ano 2 com vigência de 12 meses. */
const sale = (id: string, patientId: string, contractId: 'ano1' | 'ano2', saleDate: string, startDate: string, paymentStatus: Sale['paymentStatus'], payment: PaymentMethod = 'PIX', discount = 0): Sale => ({
  id, patientId, programId: 'mpp', contractId, listPrice: 4000, discount, payment,
  installments: payment === 'Cartão de crédito' ? 10 : 1, saleDate, startDate, endDate: addMonths(startDate, 12),
  paymentStatus, paidAt: paymentStatus === 'Pago' ? saleDate : undefined, createdBy: 'Marina Costa',
})

const sales: Sale[] = [
  sale('s-miguel-1', 'p-miguel', 'ano1', '2024-11-25', '2024-11-25', 'Pago', 'Cartão de crédito'),
  sale('s-theo-1', 'p-theo', 'ano1', '2025-03-12', '2025-03-12', 'Pago', 'Boleto'),
  sale('s-gabriel-1', 'p-gabriel', 'ano1', '2025-08-20', '2025-08-20', 'Pago', 'PIX'),
  sale('s-miguel-2', 'p-miguel', 'ano2', '2025-11-10', '2025-11-20', 'Pago', 'PIX', 300),
  sale('s-sophia-1', 'p-sophia', 'ano1', '2026-01-15', '2026-01-15', 'Pago', 'Cartão de crédito'),
  sale('s-pedro-1', 'p-pedro', 'ano1', '2026-02-03', '2026-02-03', 'Cancelado', 'Boleto'),
  sale('s-laura-1', 'p-laura', 'ano1', '2026-06-24', '2026-06-24', 'Pago', 'PIX'),
  sale('s-gabriel-2', 'p-gabriel', 'ano2', '2026-08-10', '2026-08-15', 'Pago', 'Cartão de crédito'),
  sale('s-alice-1', 'p-alice', 'ano1', '2026-09-14', '2026-09-14', 'Pago', 'PIX', 200),
  sale('s-helena-1', 'p-helena', 'ano1', '2026-10-05', '2026-10-05', 'Pendente', 'A definir'),
]

/* Vacinas: doses já devidas marcadas como aplicadas, exceto as listadas como em aberto. */
const missingDoses: Record<string, string[]> = {
  'p-laura': ['menb-1', 'menc-1'],
  'p-helena': ['hepb-3', 'dtp-2', 'hib-2', 'vip-2', 'pnc-2', 'rota-2'],
  'p-sophia': ['flu-1', 'flu-2', 'covid-1'],
  'p-pedro': ['menb-2', 'flu-1', 'flu-2', 'fa-1', 'covid-1'],
  'p-miguel': ['hepa-2'],
  'p-theo': ['var-2', 'hepa-2'],
  'p-gabriel': ['scr-1', 'var-1', 'menb-r'],
}

const vaccineRecords: VaccineRecord[] = patients.flatMap((p) => {
  const months = ageMonthsExact(p.birthDate)
  return DEFAULT_VACCINES
    .filter((d) => d.ageMonths <= months && !(missingDoses[p.id] ?? []).includes(d.id))
    .map((d) => ({
      id: `vr-${p.id}-${d.id}`,
      patientId: p.id,
      doseId: d.id,
      date: d.ageMonths === 0 ? p.birthDate : addDays(addMonths(p.birthDate, d.ageMonths), 3),
      place: 'Clínica Crescer',
    }))
})

/* Crescimento: Laura com dados explícitos; demais crianças acompanham um percentil próprio. */
const laura: Array<[string, number, number, number]> = [
  ['2026-06-20', 3.21, 49.0, 34.0],
  ['2026-07-01', 3.36, 50.5, 35.0],
  ['2026-08-05', 4.55, 54.5, 37.6],
  ['2026-09-10', 5.52, 58.0, 39.2],
  ['2026-10-01', 6.05, 60.2, 40.1],
]

const factors: Record<string, number> = { 'p-gabriel': 1.06, 'p-helena': 0.94, 'p-miguel': 1.0, 'p-sophia': 0.97, 'p-pedro': 1.1, 'p-alice': 1.02, 'p-theo': 0.99 }

const interp = (rows: ReturnType<typeof curveRows>, m: number) => {
  const i = Math.max(0, rows.findIndex((r) => r.m >= m) - 1)
  const a = rows[i]
  const b = rows[Math.min(rows.length - 1, i + 1)]
  const k = b.m === a.m ? 0 : (m - a.m) / (b.m - a.m)
  return a.P50 + (b.P50 - a.P50) * k
}

const growth: GrowthRecord[] = patients.flatMap((p) => {
  if (p.id === 'p-laura') return laura.map(([date, weight, height, head], i) => ({ id: `g-laura-${i}`, patientId: p.id, date, weight, height, head }))
  const f = factors[p.id] ?? 1
  const age = ageMonthsExact(p.birthDate)
  const points = [0, 1, 2, 4, 6, 9, 12, 15, 18, 21].filter((m) => m <= age - 0.3)
  const w = curveRows(p.sex, 'weight')
  const h = curveRows(p.sex, 'height')
  const hc = curveRows(p.sex, 'head')
  const hf = 1 + (f - 1) / 3
  return points.map((m, i) => ({
    id: `g-${p.id}-${i}`,
    patientId: p.id,
    date: addDays(addMonths(p.birthDate, m), m ? 4 : 0),
    weight: +(interp(w, m) * f).toFixed(2),
    height: +(interp(h, m) * hf).toFixed(1),
    head: +(interp(hc, m) * hf).toFixed(1),
  }))
})

/* Encontros do passo (consulta com o médico ou triagem com a equipe). */
const fu = (patientId: string, stepN: number, date: string, kind: EncounterKind, evolution: string, orientations: string, pendencies: Array<[string, boolean, boolean?]> = []): FollowUp => ({
  id: `f-${patientId}-${stepN}`, patientId, programId: 'mpp', step: stepN, kind, date,
  author: kind === 'Consulta com o Dr. André' ? 'Dr. André' : 'Equipe (técnica de enfermagem)',
  mapAnswers: {}, evolution, orientations,
  pendencies: pendencies.map(([text, done, familyVisible = true], i) => ({ id: `pd-${patientId}-${stepN}-${i}`, text, done, familyVisible })),
})

const CONSULTA: EncounterKind = 'Consulta com o Dr. André'
const TRIAGEM: EncounterKind = 'Triagem com a equipe'

/** Encontros históricos simples (dados de demonstração). */
const history = (patientId: string, birth: string, steps: number[]) =>
  steps.map((n, i) => fu(patientId, n, addDays(birth, n * 45 - 10), i % 2 ? TRIAGEM : CONSULTA, 'Encontro do passo registrado (dado de demonstração).', 'Orientações do passo reforçadas com a família.'))

const followUps: FollowUp[] = [
  fu('p-laura', 1, '2026-07-01', CONSULTA, 'Encontro do passo 1 registrado (dado de demonstração).', 'Orientações do passo 1 entregues à família.', [['Teste da orelhinha', true], ['Teste do olhinho', true]]),
  fu('p-laura', 2, '2026-08-05', TRIAGEM, 'Triagem: peso e medidas registrados; Mapa do Passo aplicado (dado de demonstração).', 'Orientações previamente definidas pelo Dr. André reforçadas.', [['Registrar episódios de cólica por 1 semana', false]]),
  ...history('p-sophia', '2026-01-10', [1, 2, 3, 4, 5]),
  fu('p-alice', 1, '2026-09-20', CONSULTA, 'Encontro do passo 1 registrado (dado de demonstração).', 'Orientações do passo 1 entregues à família.', [['Teste da orelhinha', false]]),
  ...history('p-gabriel', '2025-08-15', [1, 2, 3, 4, 5, 6, 7, 8, 9]),
  ...history('p-miguel', '2024-11-20', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
  ...history('p-theo', '2025-03-10', [1, 2, 3, 4, 5, 6, 7, 8]),
]

const ap = (id: string, patientId: string, date: string, time: string, kind: string, status: Appointment['status'] = 'Agendado', professional = 'Dr. André'): Appointment => ({ id, patientId, date, time, kind, professional, status })

const appointments: Appointment[] = [
  ap('a1', 'p-laura', TODAY, '08:00', 'Encontro do Passo 3 — consulta'),
  ap('a2', 'p-gabriel', TODAY, '08:40', 'Encontro do Passo 10 — triagem', 'Agendado', 'Equipe (técnica de enfermagem)'),
  ap('a3', 'p-helena', TODAY, '09:20', 'Consulta'),
  ap('a4', 'p-miguel', TODAY, '10:00', 'Encontro do Passo 16 — consulta'),
  ap('a5', 'p-pedro', TODAY, '14:30', 'Consulta (sem programa)'),
  ap('a6', 'p-sophia', '2026-10-08', '09:00', 'Encontro do Passo 6 — triagem', 'Agendado', 'Equipe (técnica de enfermagem)'),
  ap('a7', 'p-alice', '2026-10-12', '10:30', 'Encontro do Passo 1 — triagem', 'Agendado', 'Equipe (técnica de enfermagem)'),
  ap('a8', 'p-laura', '2026-10-28', '08:00', 'Vacinas dos 4 meses', 'Agendado', 'Equipe (técnica de enfermagem)'),
  ap('a9', 'p-theo', '2026-10-15', '16:00', 'Consulta'),
  ap('a10', 'p-laura', '2026-08-05', '08:00', 'Encontro do Passo 2 — triagem', 'Realizado', 'Equipe (técnica de enfermagem)'),
  ap('a11', 'p-alice', '2026-09-20', '11:00', 'Encontro do Passo 1 — consulta', 'Realizado'),
]

const fam = (author: string, text: string, at: string) => ({ id: `${at}-${author}`, from: 'family' as const, author, text, at })
const team = (author: string, authorRole: string, text: string, at: string) => ({ id: `${at}-${author}`, from: 'team' as const, author, authorRole, text, at })

/* Caixa de mensagens Crescer: uma conversa por família; Dr. André e secretaria respondem. */
const conversations: Conversation[] = [
  {
    id: 'c-laura', patientId: 'p-laura', readByTeam: false, readByFamily: true, needsDoctor: true,
    messages: [
      fam('Ana Beatriz Mendes', 'Dr. André, a Laura completou 3 meses. Posso começar a deixá-la mais tempo de bruços?', '2026-09-22T19:40'),
      team('Dr. André', 'Médico', 'Oi, Ana! Pode sim, sempre acordada e com alguém por perto. Conversamos mais no encontro do passo 3.', '2026-09-23T08:10'),
      team('Marina Costa', 'Secretaria', 'Olá, Ana! Lembrando que o encontro do passo 3 da Laura está agendado para 06/10 às 08:00. 😊', '2026-10-05T10:24'),
      fam('Ana Beatriz Mendes', 'Obrigada! Vamos confirmar. Uma dúvida: ela está golfando mais depois das mamadas, é normal?', '2026-10-05T21:10'),
    ],
  },
  {
    id: 'c-sophia', patientId: 'p-sophia', readByTeam: false, readByFamily: true,
    messages: [fam('Fernanda Costa', 'Bom dia! Conseguimos remarcar o encontro desta semana para quinta à tarde?', '2026-10-06T07:45')],
  },
  {
    id: 'c-gabriel', patientId: 'p-gabriel', readByTeam: true, readByFamily: true,
    messages: [
      fam('Carolina Souza', 'O Gabriel está recusando legumes. Alguma dica?', '2026-09-28T19:02'),
      team('Dr. André', 'Médico', 'Oi, Carolina! Vamos conversar sobre isso no encontro do passo 10. Até lá, continue oferecendo sem pressão.', '2026-09-29T08:15'),
    ],
  },
  {
    id: 'c-miguel', patientId: 'p-miguel', readByTeam: true, readByFamily: true,
    messages: [team('Marina Costa', 'Secretaria', 'Renata, confirmamos o encontro do Miguel para hoje às 10:00.', '2026-10-03T11:00')],
  },
  {
    id: 'c-theo', patientId: 'p-theo', readByTeam: true, readByFamily: true,
    messages: [
      fam('Lucas Ribeiro', 'Obrigado pelo acompanhamento deste primeiro ano!', '2026-03-05T18:20'),
      team('Marina Costa', 'Secretaria', 'Nós que agradecemos, Lucas! Qualquer coisa, estamos por aqui.', '2026-03-06T09:00'),
    ],
  },
]

const c = (id: string, type: Content['type'], title: string, summary: string, body: string, step: number, url?: string, programId = 'mpp'): Content =>
  ({ id, type, title, summary, body, programId, step, url, createdAt: '2026-09-01', author: 'Conteúdo de demonstração', published: true })

/* Conteúdos de DEMONSTRAÇÃO para mostrar a liberação por etapa — substituir pelos materiais da clínica. */
const contents: Content[] = [
  c('ct1', 'texto', 'Boas-vindas ao passo 1', 'Material de exemplo do passo 1.', 'Texto de demonstração. Os materiais reais de cada passo serão cadastrados pela equipe do Dr. André.', 1),
  c('ct2', 'video', 'Vídeo do passo 1', 'Vídeo de exemplo.', 'Vídeo de demonstração.', 1, 'https://www.youtube.com/watch?v=0wO1T3bOs3s'),
  c('ct3', 'imagem', 'Material visual do passo 2', 'Imagem de exemplo.', 'Imagem de demonstração.', 2),
  c('ct4', 'texto', 'Leitura do passo 2', 'Texto de exemplo.', 'Texto de demonstração.', 2),
  c('ct5', 'video', 'Como estimular o desenvolvimento', 'Vídeo de exemplo do passo 3.', 'Vídeo de demonstração.', 3, 'https://www.youtube.com/watch?v=3wR0oJx0qAk'),
  c('ct6', 'texto', 'Marcos não são datas', 'Texto de exemplo do passo 3.', 'Texto de demonstração.', 3),
  c('ct7', 'imagem', 'Material visual do passo 3', 'Imagem de exemplo do passo 3.', 'Imagem de demonstração.', 3),
  c('ct8', 'video', 'Vídeo do passo 4', 'Vídeo de exemplo.', 'Vídeo de demonstração.', 4, 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'),
  c('ct9', 'texto', 'Leitura do passo 6', 'Texto de exemplo.', 'Texto de demonstração.', 6),
  c('ct10', 'texto', 'Leitura do passo 10', 'Texto de exemplo do Ano 2.', 'Texto de demonstração.', 10),
  c('ct11', 'video', 'Vídeo do passo 16', 'Vídeo de exemplo do Ano 2.', 'Vídeo de demonstração.', 16, 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'),
  c('ct12', 'texto', 'Conteúdo geral do Crescer', 'Conteúdo aberto a todas as famílias (exemplo).', 'Texto de demonstração. Quais conteúdos ficam disponíveis no acesso gratuito ainda será definido com o Dr. André.', 0, undefined, 'all'),
]

export const createSeed = (): AppState => ({
  version: STATE_VERSION,
  users: [
    { id: 'u-andre', name: 'Dr. André', email: 'andre@crescer.med.br', role: 'doctor', title: 'Médico e proprietário', active: true },
    { id: 'u-marina', name: 'Marina Costa', email: 'secretaria@crescer.med.br', role: 'secretary', title: 'Secretaria', active: true },
    { id: 'u-rafael', name: 'Rafael Torres', email: 'admin@crescer.med.br', role: 'admin', title: 'Administrador', active: true },
    { id: 'u-ana', name: 'Ana Beatriz Mendes', email: 'ana.mendes@email.com', role: 'parent', title: 'Mãe da Laura', active: true, patientIds: ['p-laura'] },
    { id: 'u-carolina', name: 'Carolina Souza', email: 'carolina.souza@email.com', role: 'parent', title: 'Mãe do Gabriel', active: true, patientIds: ['p-gabriel'] },
    { id: 'u-juliana', name: 'Juliana Lima', email: 'juliana.lima@email.com', role: 'parent', title: 'Mãe da Helena', active: true, patientIds: ['p-helena'] },
    { id: 'u-paulo', name: 'Paulo Almeida', email: 'paulo.almeida@email.com', role: 'parent', title: 'Pai do Pedro', active: true, patientIds: ['p-pedro'] },
    { id: 'u-lucas', name: 'Lucas Ribeiro', email: 'lucas.ribeiro@email.com', role: 'parent', title: 'Pai do Theo', active: true, patientIds: ['p-theo'] },
  ],
  patients,
  programs: structuredClone(DEFAULT_PROGRAMS),
  sales,
  followUps,
  contents,
  vaccineCatalog: structuredClone(DEFAULT_VACCINES),
  vaccineRecords,
  growth,
  appointments,
  conversations,
  stepProgress: { 'p-laura:mpp:3': [0] },
})
