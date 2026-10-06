import type { Program, ProgramStep, Sex, VaccineDose } from './types'

/* ------------------------------------------------------------------ */
/* Programa "Meus Primeiros Passos" — documento oficial do Dr. André   */
/* "Cada passo, uma conquista." · 0 a 24 meses · 16 passos de 45 dias  */
/* · dois contratos anuais                                              */
/* ------------------------------------------------------------------ */

export const ENCOUNTER_DEFINITION = 'Consulta com o médico ou triagem com a equipe'
export const STEP_DAYS = 45

/** Pilares do método (documento, seção 1). Usados nos desafios e no Mapa do Passo. */
export const PILLARS = ['Saúde física', 'Neuropsicomotor', 'Comportamento/emoção', 'Relações e parentalidade']

type DocStep = [range: string, title: string, challenges: string, goal: string, parentChallenge: string, celebration: string]

/** Texto do documento "Meus Primeiros Passos" (seção 3), transcrito sem reescrita. */
const DOC_STEPS: DocStep[] = [
  ['0 a 45 dias', 'O impacto do nascimento',
    'Amamentação, icterícia, sono desorganizado; reflexos primitivos; choro inconsolável e confusão dia-noite; culpa e exaustão materna.',
    'Estabelecer os primeiros sinais de vínculo e rotina mínima de sono, banho e alimentação.',
    'Nos próximos 45 dias, reservar 10 minutos por dia sem celular só para contato pele a pele e contato visual com o bebê.',
    'Foto temática do ‘primeiro passo vencido’ + mensagem de orgulho enviada pela equipe.'],
  ['45 a 90 dias', 'Da sobrevivência à rotina',
    'Cólica, pico de crescimento, vacinação; sustentação cervical; irritabilidade por saltos de desenvolvimento; dificuldade em estabelecer rotina.',
    'Consolidar um horário aproximado de sono e alimentação, mesmo que ainda flexível.',
    'Registrar por 7 dias os horários de sono/mamada num diário simples, para identificar um padrão emergente.',
    'Envio de ‘Diploma de Sobrevivência ao 1º Trimestre’ para a família.'],
  ['90 a 135 dias', 'O bebê começa a interagir',
    'Ganho de peso e refluxo; rolar e olhar responsivo; ansiedade parental com marcos; comparação com outros bebês.',
    'Reduzir a ansiedade comparativa dos pais com marcos de desenvolvimento.',
    'Um exercício de estímulo visual/auditivo por dia (5 minutos), registrado no checklist.',
    'Roda de conversa (mesmo que por vídeo) com outras famílias do mesmo passo.'],
  ['135 a 180 dias', 'A entrada na alimentação',
    'Introdução alimentar, alergias, constipação; sustentação para sentar; medo de engasgo; dúvidas sobre consistência dos alimentos.',
    'Introduzir 3 novos alimentos com segurança e sem punir a rejeição inicial.',
    'Oferecer 1 alimento novo por semana, sem forçar, anotando reação no checklist.',
    '‘Festa do primeiro purê’ — foto e registro no diário da infância.'],
  ['180 a 225 dias', 'O bebê quer o mundo',
    'Sono fragmentado; sentar sem apoio e início do engatinhar; medo de separação; dilema entre rigidez e flexibilidade na rotina.',
    'Criar um ritual fixo de sono (mesmo horário, mesma sequência) por 3 semanas seguidas.',
    'Escolher 1 momento do dia (banho ou leitura) para virar ritual protegido e repetido todo dia.',
    'Selo ‘Ritual Conquistado’ entregue à família.'],
  ['225 a 270 dias', 'Autonomia emergente',
    'Quedas e infecções respiratórias; engatinhar e levantar com apoio; frustração com limites físicos; retorno da mãe ao trabalho.',
    'Redistribuir tarefas de cuidado entre os responsáveis, reduzindo sobrecarga de um só cuidador.',
    'Mapear com o casal (ou rede de apoio) quem faz o quê na semana — dividir 2 tarefas novas.',
    'Café com a rede de apoio (avós, babá) para alinhar a nova rotina.'],
  ['270 a 315 dias', 'Comunicação em construção',
    'Redução da amamentação noturna; primeiros gestos e tentativas de fala; explosões emocionais; medo de atraso na fala.',
    'Estimular 5 gestos de comunicação (tchau, aponta, bate palma) de forma consistente.',
    'Nomear em voz alta tudo o que a criança aponta ou olha, por 10 minutos ao dia.',
    'Vídeo-registro dos primeiros ‘gestos de conversa’ do bebê.'],
  ['315 a 360 dias', 'Primeiros passos, primeiro ano',
    'Caminhar com apoio e seletividade alimentar; aumento da mobilidade; crises de separação e birras incipientes; dúvida sobre creche.',
    'Preparar a transição para a creche/berçário, se aplicável, com visita prévia.',
    'Visitar (ou revisar) o ambiente de creche/berçário com a criança antes da matrícula.',
    'Festa simbólica de 1 ano — encerramento do primeiro passo anual do programa.'],
  ['12 a 13,5 meses', 'Caminhar é libertador, mas assusta',
    'Quedas, início da dentição; birras físicas (jogar no chão, bater); medo de estranhos; primeiras visitas a creches.',
    'Reduzir acidentes domésticos com ajustes simples no ambiente da casa.',
    'Fazer uma ‘ronda de segurança’ pela casa identificando 3 riscos a corrigir.',
    'Selo ‘Casa Segura’ entregue após a ronda de segurança.'],
  ['13,5 a 15 meses', 'O bebê ‘opina’',
    'Padrão de sono mutável; subir degraus, coordenação melhorando; frustração com ‘nãos’; dificuldade em ser firme sem culpa.',
    'Estabelecer 2 regras simples e consistentes (mesmo horário e mesma resposta dos pais).',
    'Praticar dizer ‘não’ com calma, sem repetir a explicação mais de uma vez.',
    'Reconhecimento verbal em família: ‘esta semana conseguimos ser firmes e calmos’.'],
  ['15 a 16,5 meses', 'A linguagem desponta',
    'Interrupções de sono, vacinação; primeiras palavras e imitação; apego intenso à rotina; medo de atraso na fala.',
    'Ampliar o vocabulário funcional da criança com nomeação ativa no dia a dia.',
    'Nomear objetos e ações em voz alta durante as rotinas (troca, banho, refeição).',
    '‘Caderno das primeiras palavras’ iniciado com a família.'],
  ['16,5 a 18 meses', 'O senso de ‘eu’ se intensifica',
    'Dificuldade em dormir sozinho; fase do ‘não’, testes de autoridade; queixas da escola sobre comportamento (morder, bater).',
    'Reduzir episódios de mordida/agressão por meio de resposta consistente da família.',
    'Combinar com todos os cuidadores uma única frase de resposta a comportamentos agressivos.',
    'Reunião curta com a escola/creche para alinhar a mesma abordagem.'],
  ['18 a 19,5 meses', 'O corpo vai rápido, o emocional ainda não',
    'Primeiras quedas mais sérias; correr e empilhar; agressividade e teimosia; medo de estar ‘criando uma criança agressiva’.',
    'Oferecer canais físicos seguros para descarregar energia e frustração.',
    '20 minutos diários de brincadeira de movimento livre (correr, pular, dançar).',
    '‘Diploma de Energia Bem Canalizada’ para a família.'],
  ['19,5 a 21 meses', 'A fala começa a ‘traduzir’ emoções',
    'Autonomia na mastigação; frases de 2 palavras; birras com palavras, início da chantagem emocional; dúvida sobre quanto ceder.',
    'Ensinar a criança a nomear 3 emoções básicas (bravo, triste, feliz).',
    'Nomear a emoção da criança antes de resolver o conflito (‘vejo que você está bravo porque...’).',
    'Mural das emoções montado em casa com a criança.'],
  ['21 a 22,5 meses', 'Desfralde em vista',
    'Interesse pelo banheiro, constipação por retenção; brincadeiras paralelas; resistência ao controle; pressão da escola por desfralde.',
    'Iniciar o processo de desfralde sem punição, no ritmo da criança.',
    'Levar a criança ao banheiro em 3 horários fixos do dia, sem cobrança.',
    'Celebração simbólica da ‘primeira vitória no troninho’.'],
  ['22,5 a 24 meses', 'O bebê vira criança',
    'Transição para a cama, acidentes; frases completas, vestir-se com ajuda; ‘eu faço sozinho’ com crises de frustração; dúvida sobre rigidez vs. liberdade.',
    'Consolidar 3 tarefas de autonomia que a criança já pode fazer sozinha.',
    'Deixar a criança tentar 1 tarefa sozinha por dia (vestir, comer, guardar), mesmo que demore mais.',
    'Festa de encerramento do 2º ano — renovação para o próximo passo (3 a 4 anos).'],
]

/**
 * O documento define o Mapa do Passo como "avaliação objetiva sim/não por pilar", mas NÃO traz as
 * perguntas de cada passo. Por isso `map` fica vazio (perguntas pendentes de definição pelo Dr. André).
 * Os desafios são mantidos exatamente como o documento os lista (separados por ";"), sem rotular pilar
 * a pilar — o passo 12 traz 3 grupos em vez de 4, então a correspondência com os pilares não é explícita.
 */
const steps: ProgramStep[] = DOC_STEPS.map(([rangeLabel, title, challenges, goal, parentChallenge, celebration], i) => ({
  n: i + 1,
  startDay: i * STEP_DAYS,
  endDay: (i + 1) * STEP_DAYS,
  rangeLabel,
  title,
  challenges: challenges.replace(/\.$/, '').split(';').map((c) => c.trim()).map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
  encounter: ENCOUNTER_DEFINITION,
  map: [],
  goal,
  parentChallenge,
  celebration,
  source: 'documento',
}))

export const PROGRAM_MPP: Program = {
  id: 'mpp',
  name: 'Meus Primeiros Passos',
  ageLabel: '0 a 24 meses',
  description: '“Cada passo, uma conquista.” Plano de Acompanhamento Contínuo da Infância: primeiros 24 meses em 16 passos de 45 dias, reunidos em dois contratos anuais.',
  startAgeDays: 0,
  endAgeDays: 16 * STEP_DAYS,
  stepDays: STEP_DAYS,
  active: true,
  benefits: [
    'Passos do programa: tema central, desafios, meta evolutiva, desafio para os pais e comemoração',
    'Encontro do passo (consulta com o médico ou triagem com a equipe)',
    'Mapa do Passo (checklist sim/não por pilar)',
    'Canal de mensagens com o Dr. André e a equipe',
  ],
  // Fase piloto do documento: R$ 4.000/ano, travado pelos 2 primeiros anos — configurável em Programas.
  contracts: [
    { id: 'ano1', label: 'Ano 1 — 0 a 12 meses', fromStep: 1, toStep: 8, durationMonths: 12, price: 4000 },
    { id: 'ano2', label: 'Ano 2 — 12 a 24 meses', fromStep: 9, toStep: 16, durationMonths: 12, price: 4000 },
  ],
  steps,
}

export const DEFAULT_PROGRAMS = [PROGRAM_MPP]

/** Estratégia de precificação do documento (seção 2) — referência; valores seguem configuráveis. */
export const PRICING_REFERENCE = [
  { stage: 'Fase piloto', audience: '15 a 20 famílias fundadoras (convênio migrado)', value: 4000, duration: 'Travado pelos 2 primeiros anos (Ano 1 e Ano 2)' },
  { stage: 'Fase de mercado aberto', audience: 'Novas famílias, a partir da validação do piloto', value: 6000, duration: 'Valor vigente para novos contratos' },
]

/**
 * "Quando Envolver Outros Profissionais" (documento, seção 4): SINALIZADORES de triagem a partir do
 * Mapa do Passo. Nunca substituem a avaliação clínica do médico responsável, que decide caso a caso.
 */
export const TRIAGE_FLAGS: Array<{ phase: string; fromStep: number; toStep: number; area: string; trigger: string }> = [
  { phase: '4 a 6 meses', fromStep: 3, toStep: 4, area: 'Fonoaudiologia', trigger: 'Dificuldade persistente de sucção/amamentação ou recusa alimentar significativa.' },
  { phase: '9 a 12 meses', fromStep: 6, toStep: 8, area: 'Nutrição infantil', trigger: 'Seletividade alimentar acentuada ou dificuldade real na introdução de grupos alimentares.' },
  { phase: '12 a 18 meses', fromStep: 9, toStep: 12, area: 'Psicologia infantil', trigger: 'Ansiedade de separação intensa e prolongada, ou adaptação escolar muito difícil.' },
  { phase: '18 a 24 meses', fromStep: 14, toStep: 16, area: 'Fonoaudiologia', trigger: 'Vocabulário muito abaixo do esperado para a idade (poucas palavras com sentido).' },
  { phase: '18 a 24 meses', fromStep: 14, toStep: 16, area: 'Terapia Ocupacional', trigger: 'Atraso motor relevante ou seletividade sensorial marcante (texturas, sons, roupas).' },
]

/** "O Que a Técnica de Enfermagem Pode Conduzir" (documento, seção 5) — texto do documento. */
export const TEAM_INTRO = 'A técnica de enfermagem atua sob supervisão do médico responsável e não substitui a avaliação clínica.'
export const TEAM_CAN = [
  'Aplicar o checklist padronizado do passo (Mapa do Passo) e registrar as respostas.',
  'Reforçar orientações já definidas pelo médico (rotina de sono, plano alimentar, cuidados de higiene).',
  'Responder dúvidas simples e recorrentes pelo canal de WhatsApp do programa.',
  'Pesar, medir e acompanhar curva de crescimento entre consultas.',
  'Lembrar sobre vacinas e agendar os próximos encontros do passo.',
  'Oferecer escuta ativa e acolhimento emocional aos pais nos momentos de sobrecarga.',
]
export const TEAM_CANNOT = [
  'Diagnosticar qualquer condição ou atraso de desenvolvimento.',
  'Prescrever medicamentos ou alterar orientações clínicas já definidas.',
  'Interpretar exames ou decidir sobre encaminhamentos a especialistas.',
  'Qualquer sinal de alerta identificado no checklist deve ser escalado ao médico antes de qualquer nova orientação ser passada à família.',
]

/* ------------------------------------------------------------------ */
/* Calendário de vacinação — SBP 2025/2026 (Documento Científico nº 12, */
/* 20/10/2025), faixa de 0 a 24 meses                                   */
/* ------------------------------------------------------------------ */

export const VACCINE_SOURCE = 'Calendário de Vacinação da SBP — Atualização 2025/2026 (Documento Científico nº 12, 20/10/2025)'

const v = (id: string, vaccine: string, dose: string, ageMonths: number, notes?: string): VaccineDose => ({ id, vaccine, dose, ageMonths, notes })

export const DEFAULT_VACCINES: VaccineDose[] = [
  v('bcg', 'BCG ID', 'Dose única', 0, 'O mais precocemente possível, desde que peso > 2.000 g'),
  v('hepb-1', 'Hepatite B', '1ª dose', 0, 'Idealmente nas primeiras 12 horas de vida'),
  v('vsr', 'Anticorpo monoclonal contra VSR (nirsevimabe)', 'Dose única', 0, 'Ao nascer, o mais precocemente possível no primeiro ano de vida'),
  v('hepb-2', 'Hepatite B', '2ª dose', 2),
  v('dtp-1', 'DTP/DTPa', '1ª dose', 2),
  v('hib-1', 'Hib', '1ª dose', 2),
  v('vip-1', 'VIP', '1ª dose', 2),
  v('pnc-1', 'Pneumocócica conjugada', '1ª dose', 2),
  v('rota-1', 'Rotavírus', '1ª dose', 2, '1ª dose até, no máximo, 11 meses e 29 dias'),
  v('menc-1', 'Meningocócicas conjugadas C e ACWY', '1ª dose', 3),
  v('menb-1', 'Meningocócica B recombinante', '1ª dose', 3),
  v('hepb-3', 'Hepatite B', 'Dose dos 4 meses', 4, 'Quem usa a Penta (PNI) recebe 4 doses; o esquema privado pode ter 3 doses (0, 2 e 6 meses)'),
  v('dtp-2', 'DTP/DTPa', '2ª dose', 4),
  v('hib-2', 'Hib', '2ª dose', 4),
  v('vip-2', 'VIP', '2ª dose', 4),
  v('pnc-2', 'Pneumocócica conjugada', '2ª dose', 4),
  v('rota-2', 'Rotavírus', '2ª dose', 4, 'Última dose até 23 meses e 29 dias'),
  v('menc-2', 'Meningocócicas conjugadas C e ACWY', '2ª dose', 5),
  v('menb-2', 'Meningocócica B recombinante', '2ª dose', 5),
  v('hepb-4', 'Hepatite B', 'Dose dos 6 meses', 6),
  v('dtp-3', 'DTP/DTPa', '3ª dose', 6),
  v('hib-3', 'Hib', '3ª dose', 6),
  v('vip-3', 'VIP', '3ª dose', 6),
  v('pnc-3', 'Pneumocócica conjugada', '3ª dose', 6, 'SBP recomenda esquema 3+1 (VPC13, 15 ou 20); o PNI usa VPC10 em 2+1'),
  v('rota-3', 'Rotavírus', '3ª dose', 6, 'Somente para a vacina pentavalente (RV5)'),
  v('flu-1', 'Influenza', '1ª dose', 6, 'A partir dos 6 meses; primovacinação com 2 doses (intervalo de 1 mês); depois anual'),
  v('flu-2', 'Influenza', '2ª dose', 7, '1 mês após a 1ª dose (primovacinação)'),
  v('covid-1', 'COVID-19', 'Conforme recomendações vigentes', 6, 'Rotina a partir dos 6 meses até menores de 5 anos'),
  v('fa-1', 'Febre amarela', '1ª dose', 9, 'Segunda dose aos 4 anos'),
  v('scr-1', 'Tríplice viral (SCR)', '1ª dose', 12, 'Na mesma visita da varicela (ou tetraviral SCRV)'),
  v('var-1', 'Varicela', '1ª dose', 12, 'Na mesma visita da SCR (ou tetraviral SCRV)'),
  v('pnc-r', 'Pneumocócica conjugada', 'Reforço', 12, 'Reforço entre 12 e 15 meses'),
  v('menc-r', 'Meningocócicas conjugadas C e ACWY', 'Reforço', 12),
  v('menb-r', 'Meningocócica B recombinante', 'Reforço', 12),
  v('hepa-1', 'Hepatite A', '1ª dose', 12),
  v('dtp-r1', 'DTP/DTPa', '1º reforço', 15),
  v('hib-r', 'Hib', 'Reforço', 15),
  v('vip-r', 'VIP', 'Reforço', 15),
  v('scr-2', 'Tríplice viral (SCR)', '2ª dose', 15, 'Preferencialmente como tetraviral (SCRV)'),
  v('var-2', 'Varicela', '2ª dose', 15, 'Preferencialmente como tetraviral (SCRV)'),
  v('hepa-2', 'Hepatite A', '2ª dose', 18, 'O PNI oferece dose única aos 15 meses'),
]

/* ------------------------------------------------------------------ */
/* Curvas de crescimento — VALORES APROXIMADOS DE DEMONSTRAÇÃO          */
/* Substituir pelas tabelas oficiais (OMS/LMS) antes de uso clínico.   */
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
