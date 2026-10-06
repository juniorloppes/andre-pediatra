import { DEFAULT_PROGRAMS, DEFAULT_VACCINES, curveRows } from './reference'
import type { AppState, Appointment, Content, Conversation, FollowUp, GrowthRecord, Patient, Sale, VaccineRecord } from './types'
import { addDays, addMonths, ageMonthsExact, TODAY } from './utils'

export const STATE_VERSION = 3

const patients: Patient[] = [
  { id: 'p-laura', name: 'Laura Mendes', sex: 'F', birthDate: '2026-06-20', guardian: 'Ana Beatriz Mendes', guardianRelation: 'Mãe', phone: '(11) 98123-4455', email: 'ana.mendes@email.com', createdAt: '2026-06-24' },
  { id: 'p-gabriel', name: 'Gabriel Souza', sex: 'M', birthDate: '2025-08-15', guardian: 'Carolina Souza', guardianRelation: 'Mãe', phone: '(11) 99812-3301', email: 'carolina.souza@email.com', createdAt: '2025-08-20' },
  { id: 'p-helena', name: 'Helena Lima', sex: 'F', birthDate: '2026-06-02', guardian: 'Juliana Lima', guardianRelation: 'Mãe', phone: '(11) 97654-1200', email: 'juliana.lima@email.com', createdAt: '2026-10-01' },
  { id: 'p-miguel', name: 'Miguel Rocha', sex: 'M', birthDate: '2024-11-20', guardian: 'Renata Rocha', guardianRelation: 'Mãe', phone: '(11) 98777-0098', email: 'renata.rocha@email.com', createdAt: '2024-11-25' },
  { id: 'p-sophia', name: 'Sophia Costa', sex: 'F', birthDate: '2026-01-10', guardian: 'Fernanda Costa', guardianRelation: 'Mãe', phone: '(11) 99001-2244', email: 'fernanda.costa@email.com', createdAt: '2026-01-15' },
  { id: 'p-pedro', name: 'Pedro Almeida', sex: 'M', birthDate: '2025-12-01', guardian: 'Paulo Almeida', guardianRelation: 'Pai', phone: '(11) 98450-7781', email: 'paulo.almeida@email.com', createdAt: '2026-02-03', notes: 'Consultas avulsas — sem programa contratado.' },
  { id: 'p-alice', name: 'Alice Martins', sex: 'F', birthDate: '2026-09-12', guardian: 'Mariana Martins', guardianRelation: 'Mãe', phone: '(11) 97700-5512', email: 'mariana.martins@email.com', createdAt: '2026-09-14' },
  { id: 'p-theo', name: 'Theo Ribeiro', sex: 'M', birthDate: '2025-03-10', guardian: 'Lucas Ribeiro', guardianRelation: 'Pai', phone: '(11) 96655-4433', email: 'lucas.ribeiro@email.com', createdAt: '2025-03-12' },
]

const sale = (id: string, patientId: string, programId: string, saleDate: string, startDate: string, status: Sale['status'], payment: Sale['payment'] = 'PIX', discount = 0): Sale => ({
  id, patientId, programId, listPrice: programId === 'pp-0-1' ? 4000 : 6000, discount, payment,
  installments: payment === 'Cartão de crédito' ? 10 : 1, saleDate, startDate, status, createdBy: 'Marina Costa',
})

const sales: Sale[] = [
  sale('s-miguel-1', 'p-miguel', 'pp-0-1', '2024-11-25', '2024-11-25', 'Pago', 'Cartão de crédito'),
  sale('s-theo', 'p-theo', 'pp-0-1', '2025-03-12', '2025-03-12', 'Cancelado', 'Boleto'),
  sale('s-miguel-2', 'p-miguel', 'pp-1-2', '2025-11-10', '2025-11-20', 'Pago', 'PIX', 300),
  sale('s-sophia', 'p-sophia', 'pp-0-1', '2026-01-15', '2026-01-15', 'Pago', 'Cartão de crédito'),
  sale('s-laura', 'p-laura', 'pp-0-1', '2026-06-24', '2026-06-24', 'Pago', 'PIX'),
  sale('s-gabriel', 'p-gabriel', 'pp-1-2', '2026-07-15', '2026-08-15', 'Pago', 'Cartão de crédito'),
  sale('s-alice', 'p-alice', 'pp-0-1', '2026-09-14', '2026-09-14', 'Pago', 'PIX', 200),
  sale('s-helena', 'p-helena', 'pp-0-1', '2026-10-05', '2026-10-05', 'Pendente', 'Boleto'),
]

/* Vacinas: doses já devidas marcadas como aplicadas, exceto as listadas como pendentes. */
const missingDoses: Record<string, string[]> = {
  'p-laura': ['menb-1', 'menc-1'],
  'p-helena': ['hepb-3', 'dtp-2', 'hib-2', 'vip-2', 'pnc-2', 'rota-2'],
  'p-sophia': ['flu-1', 'covid-1'],
  'p-pedro': ['menb-2', 'flu-1', 'fa-1', 'covid-1'],
  'p-miguel': ['hepa-2'],
  'p-theo': ['var-1', 'hepa-2'],
  'p-gabriel': ['scr-1', 'menb-r'],
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
      place: d.network === 'Particular' ? 'Clínica Crescer' : 'UBS',
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

const fu = (patientId: string, programId: string, stepN: number, date: string, evolution: string, orientations: string, pendencies: Array<[string, boolean, boolean?]> = []): FollowUp => ({
  id: `f-${patientId}-${programId}-${stepN}`, patientId, programId, step: stepN, date, author: 'Dr. André', evolution, orientations,
  pendencies: pendencies.map(([text, done, familyVisible = true], i) => ({ id: `pd-${patientId}-${stepN}-${i}`, text, done, familyVisible })),
})

const followUps: FollowUp[] = [
  fu('p-laura', 'pp-0-1', 1, '2026-07-01', 'Boa pega, ganho de peso adequado (+150 g em 11 dias). Coto umbilical caiu no 9º dia.', 'Manter livre demanda. Vitamina D 400 UI/dia. Sono seguro reforçado.', [['Teste da orelhinha', true], ['Teste do olhinho', true]]),
  fu('p-laura', 'pp-0-1', 2, '2026-08-05', 'Sorriso social presente, cólicas no fim da tarde. Desenvolvimento adequado.', 'Massagem abdominal, tummy time 3–5x/dia. Vacinas dos 2 meses agendadas.', [['Vacinas dos 2 meses', true], ['Registrar episódios de cólica por 1 semana', false]]),
  fu('p-sophia', 'pp-0-1', 1, '2026-02-10', 'Adaptação tranquila. Aleitamento exclusivo.', 'Sono seguro, vitamina D.'),
  fu('p-sophia', 'pp-0-1', 2, '2026-03-28', 'Ganho de peso adequado, sorriso social.', 'Tummy time diário.'),
  fu('p-sophia', 'pp-0-1', 3, '2026-05-10', 'Rola de lado, refluxo leve.', 'Posição elevada após mamadas.'),
  fu('p-sophia', 'pp-0-1', 4, '2026-06-25', 'Sinais de prontidão para introdução alimentar.', 'Plano de introdução alimentar entregue.', [['Comprar cadeira de alimentação', true]]),
  fu('p-sophia', 'pp-0-1', 5, '2026-08-08', 'Introdução alimentar bem aceita. Senta com apoio.', 'Oferecer água, variar texturas.', [['Curso de primeiros socorros', false], ['Vacina influenza', false]]),
  fu('p-alice', 'pp-0-1', 1, '2026-09-20', 'Recém-nascida a termo, boa sucção. Perda de peso fisiológica recuperada.', 'Livre demanda, sono seguro, banho.', [['Teste da orelhinha', false]]),
  ...[1, 2, 3, 4].map((n) => fu('p-miguel', 'pp-1-2', n, addDays('2025-11-20', 50 + (n - 1) * 61), `Encontro do passo ${n}: desenvolvimento adequado para a idade.`, 'Orientações da fase entregues à família.')),
  fu('p-gabriel', 'pp-1-2', 1, '2026-08-20', 'Anda com segurança, primeiras palavras.', 'Leitura diária, limitar telas.', [['Vacina tríplice viral (12 meses)', false], ['Meningocócica B — reforço', false]]),
]

const ap = (id: string, patientId: string, date: string, time: string, kind: string, status: Appointment['status'] = 'Agendado', professional = 'Dr. André'): Appointment => ({ id, patientId, date, time, kind, professional, status })

const appointments: Appointment[] = [
  ap('a1', 'p-laura', TODAY, '08:00', 'Acompanhamento — Passo 3'),
  ap('a2', 'p-gabriel', TODAY, '08:40', 'Acompanhamento — Passo 1 (1–2 anos)'),
  ap('a3', 'p-helena', TODAY, '09:20', 'Avaliação de crescimento'),
  ap('a4', 'p-miguel', TODAY, '10:00', 'Acompanhamento — Passo 5 (1–2 anos)'),
  ap('a5', 'p-pedro', TODAY, '14:30', 'Consulta avulsa'),
  ap('a6', 'p-sophia', '2026-10-08', '09:00', 'Acompanhamento — Passo 6'),
  ap('a7', 'p-alice', '2026-10-12', '10:30', 'Acompanhamento — Passo 2'),
  ap('a8', 'p-laura', '2026-10-28', '08:00', 'Vacinas dos 4 meses', 'Agendado', 'Enfermagem'),
  ap('a9', 'p-theo', '2026-10-15', '16:00', 'Consulta avulsa'),
  ap('a10', 'p-laura', '2026-08-05', '08:00', 'Acompanhamento — Passo 2', 'Realizado'),
  ap('a11', 'p-alice', '2026-09-20', '11:00', 'Acompanhamento — Passo 1', 'Realizado'),
]

const msg = (from: 'family' | 'team', author: string, text: string, at: string) => ({ id: `${at}-${author}`, from, author, text, at })

const conversations: Conversation[] = [
  {
    id: 'c-laura-equipe', patientId: 'p-laura', channel: 'Equipe Crescer', readByTeam: true, readByFamily: false,
    messages: [
      msg('team', 'Marina Costa', 'Olá, Ana! Tudo bem? Passando para lembrar que a próxima consulta da Laura está agendada para 06/10 às 08:00. Qualquer dúvida, estamos à disposição! 😊', '2026-10-05T10:24'),
      msg('family', 'Ana Beatriz Mendes', 'Obrigada! Vamos confirmar.', '2026-10-05T10:32'),
    ],
  },
  {
    id: 'c-laura-dr', patientId: 'p-laura', channel: 'Dr. André', readByTeam: false, readByFamily: true,
    messages: [
      msg('family', 'Ana Beatriz Mendes', 'Dr. André, a Laura está golfando um pouco mais depois das mamadas. É normal nessa fase?', '2026-10-04T21:10'),
    ],
  },
  {
    id: 'c-laura-nutri', patientId: 'p-laura', channel: 'Nutrição', readByTeam: true, readByFamily: true,
    messages: [msg('team', 'Equipe de Nutrição', 'Oi, Ana! Quando chegar o passo 4 vamos montar juntas o plano de introdução alimentar.', '2026-10-01T14:00')],
  },
  {
    id: 'c-sophia-equipe', patientId: 'p-sophia', channel: 'Equipe Crescer', readByTeam: false, readByFamily: true,
    messages: [msg('family', 'Fernanda Costa', 'Bom dia! Conseguimos remarcar a vacina da gripe para essa semana?', '2026-10-06T07:45')],
  },
  {
    id: 'c-gabriel-dr', patientId: 'p-gabriel', channel: 'Dr. André', readByTeam: true, readByFamily: true,
    messages: [
      msg('family', 'Carolina Souza', 'O Gabriel está recusando legumes. Alguma dica?', '2026-09-28T19:02'),
      msg('team', 'Dr. André', 'Oi, Carolina! É esperado nessa fase. Continue oferecendo sem pressão, várias vezes, e comam juntos. Conversamos no encontro.', '2026-09-29T08:15'),
    ],
  },
  {
    id: 'c-miguel-equipe', patientId: 'p-miguel', channel: 'Equipe Crescer', readByTeam: true, readByFamily: true,
    messages: [msg('team', 'Marina Costa', 'Renata, confirmamos o encontro do Miguel para hoje às 10:00.', '2026-10-03T11:00')],
  },
]

const c = (id: string, type: Content['type'], title: string, summary: string, body: string, programId: string, step: number, url?: string, createdAt = '2026-09-01'): Content =>
  ({ id, type, title, summary, body, programId, step, url, createdAt, author: 'Dr. André', published: true })

const contents: Content[] = [
  c('ct1', 'texto', 'Amamentação: a pega correta', 'Como saber se a pega está boa e quando procurar ajuda.', 'A boca do bebê deve abocanhar boa parte da aréola, com lábios virados para fora e queixo encostado na mama.\n\nSinais de pega adequada: bochechas arredondadas, deglutição audível e ausência de dor persistente.\n\nProcure a equipe se houver fissuras, dor intensa ou pouco ganho de peso.', 'pp-0-1', 1),
  c('ct2', 'video', 'Sono seguro do recém-nascido', 'Vídeo curto com as principais recomendações.', 'Bebês devem dormir de barriga para cima, em superfície firme, sem travesseiros, protetores ou bichos de pelúcia.', 'pp-0-1', 1, 'https://www.youtube.com/watch?v=0wO1T3bOs3s'),
  c('ct3', 'imagem', 'Guia visual: cólicas', 'Infográfico com massagem e posições de alívio.', 'Movimentos circulares no sentido horário, “bicicletinha” com as pernas e posição de “tigre no galho”.', 'pp-0-1', 2),
  c('ct4', 'texto', 'Tummy time: por que e como', 'Fortalecimento de pescoço e tronco.', 'Comece com 1 a 2 minutos várias vezes ao dia e aumente aos poucos. Sempre acordado e supervisionado.', 'pp-0-1', 2),
  c('ct5', 'video', 'Como estimular o desenvolvimento', 'Brincadeiras simples para 3 a 4 meses.', 'Chocalhos, espelho, músicas e conversas olhando nos olhos estimulam a interação.', 'pp-0-1', 3, 'https://www.youtube.com/watch?v=3wR0oJx0qAk'),
  c('ct6', 'texto', 'Marcos não são datas', 'Como lidar com a comparação entre bebês.', 'Os marcos do desenvolvimento acontecem dentro de janelas de tempo. Comparar com outros bebês costuma gerar ansiedade desnecessária. Converse com a equipe sobre qualquer dúvida.', 'pp-0-1', 3),
  c('ct7', 'imagem', 'Refluxo: posições após mamadas', 'Ilustração das posições recomendadas.', 'Mantenha o bebê em posição elevada por 20–30 minutos após as mamadas.', 'pp-0-1', 3),
  c('ct8', 'video', 'Rotina de sono dos 3 aos 6 meses', 'Construindo um ritual de sono.', 'Ritual curto e previsível: banho, mamada, música calma, berço.', 'pp-0-1', 4, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  c('ct9', 'texto', 'Introdução alimentar na prática', 'Primeira semana, utensílios e consistência.', 'Comece com legumes amassados e frutas. Ofereça água. Sem açúcar e sem mel antes de 1 ano.', 'pp-0-1', 5),
  c('ct10', 'texto', 'Segurança da casa', 'Checklist de segurança para bebês que engatinham.', 'Protetores de tomada, travas de gaveta, portões em escadas e produtos de limpeza fora do alcance.', 'pp-0-1', 6),
  c('ct11', 'texto', 'Birras: o que fazer', 'Limites gentis e firmes.', 'Nomeie a emoção, mantenha o limite e ofereça escolhas simples.', 'pp-1-2', 4),
  c('ct12', 'video', 'Leitura compartilhada', 'Como ler com crianças pequenas.', 'Aponte figuras, imite sons e deixe a criança virar as páginas.', 'pp-1-2', 2, 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'),
  c('ct13', 'texto', 'Sinais de alerta: quando procurar atendimento', 'Febre, desidratação, dificuldade para respirar.', 'Procure atendimento imediato se houver febre em menores de 3 meses, dificuldade para respirar, sonolência excessiva ou sinais de desidratação.', 'all', 0),
]

export const createSeed = (): AppState => ({
  version: STATE_VERSION,
  users: [
    { id: 'u-andre', name: 'Dr. André', email: 'andre@crescer.med.br', role: 'doctor', title: 'Pediatra', active: true },
    { id: 'u-marina', name: 'Marina Costa', email: 'secretaria@crescer.med.br', role: 'secretary', title: 'Secretaria', active: true },
    { id: 'u-rafael', name: 'Rafael Torres', email: 'admin@crescer.med.br', role: 'admin', title: 'Administrador', active: true },
    { id: 'u-ana', name: 'Ana Beatriz Mendes', email: 'ana.mendes@email.com', role: 'parent', title: 'Mãe da Laura', active: true, patientIds: ['p-laura'] },
    { id: 'u-carolina', name: 'Carolina Souza', email: 'carolina.souza@email.com', role: 'parent', title: 'Mãe do Gabriel', active: true, patientIds: ['p-gabriel'] },
    { id: 'u-juliana', name: 'Juliana Lima', email: 'juliana.lima@email.com', role: 'parent', title: 'Mãe da Helena', active: true, patientIds: ['p-helena'] },
    { id: 'u-paulo', name: 'Paulo Almeida', email: 'paulo.almeida@email.com', role: 'parent', title: 'Pai do Pedro', active: true, patientIds: ['p-pedro'] },
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
  stepProgress: { 'p-laura:pp-0-1:3': [0, 1] },
})
