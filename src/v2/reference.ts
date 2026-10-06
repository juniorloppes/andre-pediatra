import type { Program, ProgramStep, Sex, VaccineDose } from './types'

/* ------------------------------------------------------------------ */
/* Programas                                                           */
/* ------------------------------------------------------------------ */

const step = (n: number, startDay: number, endDay: number, data: Omit<ProgramStep, 'n' | 'startDay' | 'endDay'>): ProgramStep => ({ n, startDay, endDay, ...data })

export const PROGRAM_0_1: Program = {
  id: 'pp-0-1',
  name: 'Primeiros Passos',
  ageLabel: '0 a 1 ano',
  startAgeDays: 0,
  endAgeDays: 360,
  cadenceDays: 45,
  price: 4000,
  active: true,
  description: 'Acompanhamento do primeiro ano em 8 passos, com encontro a cada 45 dias, orientações por fase e canal direto com a equipe.',
  steps: [
    step(1, 0, 45, {
      title: 'Chegada e adaptação', subtitle: 'O bebê chega em casa',
      goal: 'Dar segurança à família nas primeiras semanas: amamentação, sono, cuidados com o coto umbilical e sinais de alerta.',
      themes: ['Amamentação e pega', 'Sono seguro', 'Cuidados com o coto e a pele', 'Sinais de alerta'],
      orientations: ['Livre demanda nas primeiras semanas', 'Dormir de barriga para cima, no berço, sem objetos', 'Banho de sol não é necessário — vitamina D conforme prescrição', 'Procurar atendimento se febre ≥ 37,8 °C'],
      checklist: ['Teste do pezinho realizado', 'Vacinas BCG e Hepatite B aplicadas', 'Teste da orelhinha e do olhinho', 'Rotina de sono seguro montada'],
      challenge: 'Registre durante 3 dias os horários de mamada e sono — leve para o próximo encontro.',
      celebration: 'Primeiro mês completo! Compartilhe uma foto com a equipe.',
    }),
    step(2, 45, 90, {
      title: 'Primeiros sorrisos', subtitle: 'O bebê começa a se comunicar',
      goal: 'Acompanhar ganho de peso, estimular contato visual e preparar a família para as vacinas dos 2 meses.',
      themes: ['Sorriso social', 'Cólicas e choro', 'Tummy time (barriguinha para baixo)', 'Vacinas dos 2 meses'],
      orientations: ['Tummy time 3 a 5 vezes ao dia, acordado e supervisionado', 'Massagem abdominal para cólicas', 'Conversar e cantar olhando nos olhos do bebê'],
      checklist: ['Vacinas dos 2 meses aplicadas', 'Tummy time diário', 'Primeiro sorriso registrado'],
      challenge: 'Faça 5 minutos de tummy time por dia durante uma semana.',
      celebration: 'O primeiro sorriso! Registre o momento.',
    }),
    step(3, 90, 135, {
      title: 'O bebê começa a interagir', subtitle: 'Passo 3 — 90 a 135 dias',
      goal: 'Reduzir a ansiedade comparativa dos pais com marcos de desenvolvimento.',
      themes: ['Ganho de peso e refluxo', 'Rolar e olhar responsivo', 'Ansiedade com marcos', 'Comparação com outros bebês'],
      orientations: ['Cada bebê tem seu ritmo — marcos têm janelas, não datas', 'Refluxo fisiológico melhora com o tempo; manter posição elevada após mamadas', 'Oferecer brinquedos coloridos ao alcance das mãos'],
      checklist: ['Sustenta bem a cabeça', 'Segue objetos com o olhar', 'Leva as mãos à boca', 'Vacinas dos 3 e 4 meses'],
      challenge: 'Um exercício de estímulo visual/auditivo por dia (5 minutos), registrado no checklist.',
      celebration: 'Roda de conversa com outras famílias do mesmo passo.',
    }),
    step(4, 135, 180, {
      title: 'Descobrindo o corpo', subtitle: 'Preparação para a introdução alimentar',
      goal: 'Preparar a família para a introdução alimentar e acompanhar o desenvolvimento motor.',
      themes: ['Sinais de prontidão para comer', 'Rolar e apoiar nos antebraços', 'Retorno ao trabalho', 'Rotina de sono'],
      orientations: ['Introdução alimentar a partir dos 6 meses', 'Planejar a rotina com cuidadores', 'Ritual de sono consistente'],
      checklist: ['Rola de barriga para cima e para baixo', 'Vacinas dos 5 meses', 'Lista de utensílios para introdução alimentar'],
      challenge: 'Monte um cardápio-teste da primeira semana de introdução alimentar.',
      celebration: 'Meio caminho do primeiro ano!',
    }),
    step(5, 180, 225, {
      title: 'Introdução alimentar', subtitle: 'Primeiras comidas',
      goal: 'Conduzir a introdução alimentar com segurança e sem pressão.',
      themes: ['Papinhas x BLW', 'Engasgo x reflexo de gag', 'Alergias alimentares', 'Água e sucos'],
      orientations: ['Oferecer água a partir do início da alimentação', 'Sem açúcar e sem mel antes de 1 ano', 'Alimentos alergênicos podem ser introduzidos cedo'],
      checklist: ['Primeira refeição salgada', 'Primeira fruta', 'Vacinas dos 6 meses', 'Curso de primeiros socorros (engasgo)'],
      challenge: 'Registre as reações a 5 alimentos novos.',
      celebration: 'Primeira refeição em família!',
    }),
    step(6, 225, 270, {
      title: 'Sentar e explorar', subtitle: 'O mundo ao alcance das mãos',
      goal: 'Acompanhar o sentar sem apoio, a pinça e a segurança da casa.',
      themes: ['Sentar sem apoio', 'Segurança da casa', 'Ansiedade de separação', 'Dentição'],
      orientations: ['Proteger tomadas, quinas e escadas', 'Despedidas curtas e previsíveis', 'Higiene da gengiva e dos primeiros dentes'],
      checklist: ['Senta sem apoio', 'Casa adaptada para engatinhar', 'Primeira escova de dentes'],
      challenge: 'Brincadeira de esconde-esconde (“cadê-achou”) todos os dias.',
      celebration: 'Primeiro dentinho!',
    }),
    step(7, 270, 315, {
      title: 'Em movimento', subtitle: 'Engatinhar e ficar em pé',
      goal: 'Estimular o deslocamento e a linguagem.',
      themes: ['Engatinhar', 'Primeiras sílabas', 'Vacinas dos 9 meses (febre amarela)', 'Comida em pedaços'],
      orientations: ['Ler livros de pano/cartonados diariamente', 'Oferecer alimentos em pedaços macios', 'Evitar andador'],
      checklist: ['Engatinha ou se desloca', 'Fala sílabas (ma-ma, pa-pa)', 'Vacina febre amarela'],
      challenge: 'Leia um livro por dia durante 2 semanas.',
      celebration: 'Primeiro “mamã” ou “papá”!',
    }),
    step(8, 315, 360, {
      title: 'Rumo ao primeiro ano', subtitle: 'Fechamento do ciclo',
      goal: 'Consolidar o primeiro ano, preparar vacinas dos 12 meses e planejar o próximo ciclo.',
      themes: ['Primeiros passos', 'Transição do leite', 'Festa de 1 ano', 'Programa 1–2 anos'],
      orientations: ['Leite de vaca integral a partir de 1 ano', 'Calçados só para proteção, fora de casa', 'Agendar vacinas dos 12 meses'],
      checklist: ['Fica em pé com apoio', 'Bebe no copo', 'Consulta de 1 ano agendada'],
      challenge: 'Monte um álbum com um registro de cada passo do programa.',
      celebration: 'Formatura do Primeiros Passos 🎓',
    }),
  ],
}

const STEPS_1_2: Array<[string, string, string[]]> = [
  ['Primeiros passos de verdade', 'Andar com segurança e autonomia', ['Andar', 'Calçados', 'Quedas e segurança']],
  ['Explosão de palavras', 'Linguagem e comunicação', ['Vocabulário', 'Telas', 'Leitura compartilhada']],
  ['Comer sozinho', 'Autonomia à mesa', ['Seletividade alimentar', 'Talheres', 'Rotina de refeições']],
  ['Birras e limites', 'Emoções e comportamento', ['Birras', 'Limites gentis', 'Rotina previsível']],
  ['Brincar e socializar', 'Brincadeira e convivência', ['Brincar livre', 'Escola/creche', 'Compartilhar']],
  ['Rumo aos 2 anos', 'Fechamento do ciclo', ['Desfralde (sinais)', 'Sono', 'Consulta de 2 anos']],
]

export const PROGRAM_1_2: Program = {
  id: 'pp-1-2',
  name: 'Primeiros Passos',
  ageLabel: '1 a 2 anos',
  startAgeDays: 365,
  endAgeDays: 730,
  cadenceDays: 60,
  price: 6000,
  active: true,
  description: 'Segundo ano de vida em 6 passos, com encontro a cada 60 dias: linguagem, autonomia, comportamento e alimentação.',
  steps: STEPS_1_2.map(([title, subtitle, themes], i) => step(i + 1, 365 + i * 61, i === 5 ? 730 : 365 + (i + 1) * 61, {
    title, subtitle,
    goal: `Acompanhar ${subtitle.toLowerCase()} respeitando o ritmo da criança.`,
    themes,
    orientations: themes.map((t) => `Orientação da equipe sobre ${t.toLowerCase()}`),
    checklist: themes.map((t) => `${t}: conversado com a equipe`),
    challenge: 'Desafio da fase definido no encontro com a equipe.',
    celebration: 'Celebração da fase com a família.',
  })),
}

export const DEFAULT_PROGRAMS = [PROGRAM_0_1, PROGRAM_1_2]

/* ------------------------------------------------------------------ */
/* Calendário de vacinação — baseado na SBP 2025/2026 (0 a 2 anos)     */
/* ------------------------------------------------------------------ */

const v = (id: string, vaccine: string, dose: string, ageMonths: number, network: VaccineDose['network'] = 'SUS + particular', notes?: string): VaccineDose =>
  ({ id, vaccine, dose, ageMonths, network, notes })

export const DEFAULT_VACCINES: VaccineDose[] = [
  v('bcg', 'BCG', 'Dose única', 0),
  v('hepb-1', 'Hepatite B', '1ª dose', 0, 'SUS + particular', 'Nas primeiras 12 horas de vida'),
  v('hepb-2', 'Hepatite B', '2ª dose', 2, 'SUS + particular', 'Na penta/hexavalente'),
  v('dtp-1', 'DTPa/DTP', '1ª dose', 2),
  v('hib-1', 'Hib', '1ª dose', 2),
  v('vip-1', 'VIP', '1ª dose', 2),
  v('pnc-1', 'Pneumocócica conjugada', '1ª dose', 2),
  v('rota-1', 'Rotavírus', '1ª dose', 2),
  v('menb-1', 'Meningocócica B', '1ª dose', 3, 'Particular'),
  v('menc-1', 'Meningocócica C/ACWY', '1ª dose', 3),
  v('hepb-3', 'Hepatite B', '3ª dose', 4, 'SUS + particular', 'Na hexavalente (particular)'),
  v('dtp-2', 'DTPa/DTP', '2ª dose', 4),
  v('hib-2', 'Hib', '2ª dose', 4),
  v('vip-2', 'VIP', '2ª dose', 4),
  v('pnc-2', 'Pneumocócica conjugada', '2ª dose', 4),
  v('rota-2', 'Rotavírus', '2ª dose', 4),
  v('menb-2', 'Meningocócica B', '2ª dose', 5, 'Particular'),
  v('menc-2', 'Meningocócica C/ACWY', '2ª dose', 5),
  v('hepb-4', 'Hepatite B', '4ª dose', 6, 'SUS + particular', 'Na penta (SUS)'),
  v('dtp-3', 'DTPa/DTP', '3ª dose', 6),
  v('hib-3', 'Hib', '3ª dose', 6),
  v('vip-3', 'VIP', '3ª dose', 6),
  v('pnc-3', 'Pneumocócica conjugada', '3ª dose', 6, 'Particular', 'Esquema 3+1 na rede privada'),
  v('rota-3', 'Rotavírus', '3ª dose', 6, 'Particular', 'Vacina pentavalente'),
  v('flu-1', 'Influenza', '1ª dose', 6, 'SUS + particular', 'Anual, a partir de 6 meses'),
  v('covid-1', 'COVID-19', '1ª dose', 6),
  v('fa-1', 'Febre amarela', '1ª dose', 9),
  v('scr-1', 'Tríplice viral', '1ª dose', 12),
  v('pnc-r', 'Pneumocócica conjugada', 'Reforço', 12),
  v('menc-r', 'Meningocócica C/ACWY', 'Reforço', 12),
  v('menb-r', 'Meningocócica B', 'Reforço', 12, 'Particular'),
  v('hepa-1', 'Hepatite A', '1ª dose', 12),
  v('dtp-r1', 'DTPa/DTP', '1º reforço', 15),
  v('hib-r', 'Hib', 'Reforço', 15),
  v('vip-r', 'VIP', 'Reforço', 15),
  v('scr-2', 'Tríplice viral', '2ª dose', 15, 'SUS + particular', 'Pode ser como tetra viral'),
  v('var-1', 'Varicela', '1ª dose', 15),
  v('hepa-2', 'Hepatite A', '2ª dose', 18, 'Particular'),
]

/* ------------------------------------------------------------------ */
/* Curvas de crescimento — referência OMS 0–24 meses (aproximadas)     */
/* ------------------------------------------------------------------ */

export const CURVE_MONTHS = [0, 1, 2, 3, 4, 6, 9, 12, 15, 18, 21, 24]
export const PERCENTILES = ['P3', 'P15', 'P50', 'P85', 'P97'] as const
export type Percentile = (typeof PERCENTILES)[number]
export type Metric = 'weight' | 'height' | 'head' | 'bmi'

type Table = Record<Percentile, number[]>

const fromSd = (median: number[], sd: number[]): Table => ({
  P3: median.map((m, i) => +(m - 1.88 * sd[i]).toFixed(1)),
  P15: median.map((m, i) => +(m - 1.04 * sd[i]).toFixed(1)),
  P50: median,
  P85: median.map((m, i) => +(m + 1.04 * sd[i]).toFixed(1)),
  P97: median.map((m, i) => +(m + 1.88 * sd[i]).toFixed(1)),
})

const CURVES: Record<Sex, Record<Metric, Table>> = {
  F: {
    weight: {
      P3: [2.4, 3.2, 4.0, 4.6, 5.1, 5.8, 6.6, 7.1, 7.6, 8.1, 8.6, 9.0],
      P15: [2.8, 3.6, 4.5, 5.1, 5.6, 6.4, 7.2, 7.9, 8.5, 9.0, 9.6, 10.1],
      P50: [3.2, 4.2, 5.1, 5.8, 6.4, 7.3, 8.2, 8.9, 9.6, 10.2, 10.9, 11.5],
      P85: [3.7, 4.8, 5.8, 6.6, 7.3, 8.3, 9.3, 10.1, 10.9, 11.6, 12.3, 13.0],
      P97: [4.2, 5.4, 6.5, 7.4, 8.1, 9.2, 10.4, 11.3, 12.2, 13.0, 13.9, 14.8],
    },
    height: fromSd([49.1, 53.7, 57.1, 59.8, 62.1, 65.7, 70.1, 74.0, 77.5, 80.7, 83.7, 86.4], [1.86, 1.95, 2.04, 2.13, 2.2, 2.3, 2.5, 2.6, 2.8, 3.0, 3.1, 3.2]),
    head: fromSd([33.9, 36.5, 38.3, 39.5, 40.6, 42.2, 43.8, 44.9, 45.7, 46.2, 46.7, 47.2], [1.18, 1.17, 1.17, 1.18, 1.19, 1.21, 1.23, 1.25, 1.27, 1.29, 1.3, 1.32]),
    bmi: fromSd([13.3, 14.6, 15.8, 16.4, 16.7, 16.9, 16.7, 16.4, 16.0, 15.7, 15.5, 15.4], [1.1, 1.2, 1.3, 1.3, 1.3, 1.3, 1.3, 1.25, 1.2, 1.2, 1.15, 1.15]),
  },
  M: {
    weight: {
      P3: [2.5, 3.4, 4.4, 5.1, 5.6, 6.4, 7.2, 7.8, 8.4, 8.9, 9.4, 9.9],
      P15: [2.9, 3.9, 4.9, 5.6, 6.2, 7.1, 7.9, 8.6, 9.2, 9.7, 10.3, 10.8],
      P50: [3.3, 4.5, 5.6, 6.4, 7.0, 7.9, 8.9, 9.6, 10.3, 10.9, 11.5, 12.2],
      P85: [3.7, 5.1, 6.3, 7.2, 7.8, 8.8, 9.9, 10.7, 11.5, 12.2, 12.9, 13.6],
      P97: [4.3, 5.7, 7.0, 7.9, 8.6, 9.7, 10.9, 11.8, 12.6, 13.5, 14.3, 15.1],
    },
    height: fromSd([49.9, 54.7, 58.4, 61.4, 63.9, 67.6, 72.0, 75.7, 79.1, 82.3, 85.1, 87.8], [1.89, 1.95, 2.0, 2.07, 2.13, 2.2, 2.3, 2.5, 2.7, 2.9, 3.0, 3.1]),
    head: fromSd([34.5, 37.3, 39.1, 40.5, 41.6, 43.3, 44.8, 45.8, 46.6, 47.2, 47.7, 48.3], [1.24, 1.2, 1.17, 1.16, 1.16, 1.18, 1.2, 1.22, 1.24, 1.26, 1.28, 1.3]),
    bmi: fromSd([13.4, 14.9, 16.3, 16.9, 17.2, 17.3, 17.1, 16.8, 16.4, 16.1, 15.9, 15.7], [1.1, 1.2, 1.3, 1.3, 1.3, 1.3, 1.3, 1.25, 1.2, 1.2, 1.15, 1.15]),
  },
}

export const curveRows = (sex: Sex, metric: Metric) => {
  const t = CURVES[sex][metric]
  return CURVE_MONTHS.map((m, i) => ({ m, P3: t.P3[i], P15: t.P15[i], P50: t.P50[i], P85: t.P85[i], P97: t.P97[i] }))
}

/** Interpola a mediana/percentis para uma idade e devolve a faixa aproximada do valor. */
export const percentileBand = (sex: Sex, metric: Metric, months: number, value: number) => {
  const rows = curveRows(sex, metric)
  const m = Math.min(24, Math.max(0, months))
  const i = Math.max(0, rows.findIndex((r) => r.m >= m) - 1)
  const a = rows[i]
  const b = rows[Math.min(rows.length - 1, i + 1)]
  const k = b.m === a.m ? 0 : (m - a.m) / (b.m - a.m)
  const at = (p: Percentile) => a[p] + (b[p] - a[p]) * k
  if (value < at('P3')) return '< P3'
  if (value < at('P15')) return 'P3–P15'
  if (value < at('P85')) return 'P15–P85'
  if (value <= at('P97')) return 'P85–P97'
  return '> P97'
}

export const METRIC_LABEL: Record<Metric, { label: string; unit: string }> = {
  weight: { label: 'Peso', unit: 'kg' },
  height: { label: 'Altura', unit: 'cm' },
  head: { label: 'Perímetro cefálico', unit: 'cm' },
  bmi: { label: 'IMC', unit: 'kg/m²' },
}
