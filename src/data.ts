import type { AppData } from './model'

const stages = [
  { id: 'birth', label: 'Nascimento', date: '10/06/2026', state: 'done' as const, summary: 'Cadastro inicial e primeira conversa com a família.' },
  { id: '1m', label: '1 mês', date: '10/07/2026', state: 'done' as const, summary: 'Consulta de rotina, avaliação e orientações iniciais.' },
  { id: '2m', label: '2 meses', date: '10/08/2026', state: 'done' as const, summary: 'Crescimento registrado e desenvolvimento acompanhado.' },
  { id: '3m', label: '3 meses', date: '10/09/2026', state: 'pending' as const, summary: 'Revisar avaliação do desenvolvimento e registrar retorno.' },
  { id: '4m', label: '4 meses', date: '15/10/2026', state: 'current' as const, summary: 'Próxima consulta: crescimento, desenvolvimento, alimentação e vacinas.' },
  { id: '5m', label: '5 meses', date: '10/11/2026', state: 'future' as const, summary: 'Etapa planejada do programa de acompanhamento.' },
  { id: '6m', label: '6 meses', date: '10/12/2026', state: 'future' as const, summary: 'Etapa planejada do programa de acompanhamento.' },
  { id: '12m', label: '12 meses', date: '10/06/2027', state: 'future' as const, summary: 'Encerramento previsto do programa anual.' },
]

export const initialData: AppData = {
  patients: [
    { id: 'joao', name: 'João Pedro Almeida', birthDate: '10/06/2026', age: '4 meses', ageMonths: 4, guardian: 'Mariana Almeida', relation: 'Mãe', programMonths: 12, nextAppointment: '15/10/2026', status: 'Em acompanhamento', progress: 33, active: true, color: 'mint', stages },
    { id: 'marina', name: 'Marina Costa', birthDate: '22/01/2026', age: '8 meses', ageMonths: 8, guardian: 'Carla Santos', relation: 'Mãe', programMonths: 12, nextAppointment: '20/10/2026', status: 'Em acompanhamento', progress: 67, active: true, color: 'lilac', stages: stages.map((item, index) => ({ ...item, state: index < 6 ? 'done' : index === 6 ? 'current' : 'future' })) },
    { id: 'lucas', name: 'Lucas Martins', birthDate: '10/08/2026', age: '2 meses', ageMonths: 2, guardian: 'Roberto Lima', relation: 'Pai', programMonths: 6, nextAppointment: '10/10/2026', status: 'Atrasado', progress: 33, active: true, color: 'coral', stages: stages.slice(0, 7) },
    { id: 'sofia', name: 'Sofia Ribeiro', birthDate: '10/05/2026', age: '5 meses', ageMonths: 5, guardian: 'Fernanda Ribeiro', relation: 'Mãe', programMonths: 12, nextAppointment: '18/10/2026', status: 'Pendência', progress: 42, active: true, color: 'blue', stages },
    { id: 'enzo', name: 'Enzo Carvalho', birthDate: '10/12/2025', age: '10 meses', ageMonths: 10, guardian: 'Juliana Carvalho', relation: 'Mãe', programMonths: 12, nextAppointment: '25/10/2026', status: 'Em acompanhamento', progress: 83, active: true, color: 'gold', stages },
    { id: 'laura', name: 'Laura Mendes', birthDate: '10/09/2026', age: '1 mês', ageMonths: 1, guardian: 'Aline Mendes', relation: 'Mãe', programMonths: 6, nextAppointment: '12/10/2026', status: 'Em acompanhamento', progress: 17, active: true, color: 'mint', stages: stages.slice(0, 7) },
  ],
  appointments: [
    { id: 'a1', patientId: 'joao', date: '15/10/2026', time: '09:00', type: 'Avaliação do 4º mês', professional: 'Dr. André', status: 'Agendada' },
    { id: 'a2', patientId: 'marina', date: '15/10/2026', time: '10:30', type: 'Consulta de acompanhamento', professional: 'Dr. André', status: 'Agendada' },
    { id: 'a3', patientId: 'laura', date: '15/10/2026', time: '14:00', type: 'Consulta de rotina', professional: 'Dr. André', status: 'Agendada' },
    { id: 'a4', patientId: 'sofia', date: '13/10/2026', time: '11:00', type: 'Retorno', professional: 'Dr. André', status: 'Agendada' },
  ],
  tasks: [
    { id: 't1', patientId: 'joao', title: 'Revisar avaliação do 3º mês', due: '12/10/2026', status: 'Pendente', priority: 'Alta', familyVisible: true },
    { id: 't2', patientId: 'marina', title: 'Revisar documento enviado pela família', due: '14/10/2026', status: 'Em andamento', priority: 'Média' },
    { id: 't3', patientId: 'lucas', title: 'Entrar em contato para reagendar retorno', due: '08/10/2026', status: 'Pendente', priority: 'Alta' },
    { id: 't4', patientId: 'sofia', title: 'Compartilhar orientação da próxima etapa', due: '16/10/2026', status: 'Pendente', priority: 'Normal' },
    { id: 't5', patientId: 'enzo', title: 'Confirmar consulta de outubro', due: '20/10/2026', status: 'Concluída', priority: 'Normal' },
  ],
  goals: [
    { id: 'g1', patientId: 'joao', stage: '4º → 5º mês', title: 'Crescimento', detail: 'Registrar peso, comprimento e perímetro cefálico na próxima consulta.', status: 'Em andamento', category: 'Acompanhamento', period: '4º → 5º mês', owner: 'Dr. André', visibleToFamily: true },
    { id: 'g2', patientId: 'joao', stage: '4º → 5º mês', title: 'Rotina', detail: 'Acompanhar a rotina observada pela família e reunir dúvidas para a consulta.', status: 'Em andamento', category: 'Rotina', period: '4º → 5º mês', owner: 'Mariana Almeida', visibleToFamily: true },
    { id: 'g3', patientId: 'joao', stage: '4º → 5º mês', title: 'Próxima fase', detail: 'Preparar a conversa sobre a próxima etapa durante o retorno.', status: 'Planejada', category: 'Desenvolvimento', period: 'Próxima consulta', owner: 'Dr. André', visibleToFamily: true },
    { id: 'g4', patientId: 'marina', stage: '8º → 9º mês', title: 'Rotina do sono', detail: 'Acompanhar mudanças da rotina e trazer dúvidas para a consulta.', status: 'Concluída', category: 'Rotina', period: '8º → 9º mês', owner: 'Carla Santos', visibleToFamily: true },
    { id: 'g5', patientId: 'lucas', stage: '2º → 3º mês', title: 'Retorno de acompanhamento', detail: 'Agendar retorno e atualizar registros de crescimento.', status: 'Atenção', category: 'Acompanhamento', period: '2º → 3º mês', owner: 'Equipe', visibleToFamily: false },
  ],
  growth: [
    { id: 'c1', patientId: 'joao', date: '10/06/2026', weight: 3.4, length: 50, head: 35 },
    { id: 'c2', patientId: 'joao', date: '10/07/2026', weight: 4.2, length: 54, head: 37 },
    { id: 'c3', patientId: 'joao', date: '10/08/2026', weight: 5.1, length: 57, head: 38.5 },
    { id: 'c4', patientId: 'joao', date: '10/09/2026', weight: 6.2, length: 61, head: 40 },
    { id: 'c5', patientId: 'marina', date: '10/09/2026', weight: 7.8, length: 68, head: 43 },
  ],
  evolutions: [
    { id: 'e1', patientId: 'joao', date: '10/09/2026', author: 'Dr. André', title: 'Consulta de acompanhamento • 3 meses', notes: 'Crescimento dentro da trajetória acompanhada. Desenvolvimento observado conforme esperado. Família orientada a registrar dúvidas para a próxima consulta.' },
    { id: 'e2', patientId: 'joao', date: '10/08/2026', author: 'Dr. André', title: 'Consulta de acompanhamento • 2 meses', notes: 'Consulta de rotina registrada. Vacinas conferidas com a família e evolução clínica preservada.' },
    { id: 'e3', patientId: 'marina', date: '10/09/2026', author: 'Dr. André', title: 'Consulta de acompanhamento • 8 meses', notes: 'Boa evolução na consulta. Orientações compartilhadas com a responsável.' },
  ],
  guidance: [
    { id: 'o1', patientId: 'joao', title: 'Preparando-se para a próxima fase', category: 'Próxima fase', visibility: 'Compartilhado', date: '15/10/2026', body: 'Confira as orientações que preparamos para este período e guarde suas dúvidas para conversar com a equipe na próxima consulta.', sharedBy: 'Dr. André', period: '4º mês', message: 'Mariana, deixamos estas orientações disponíveis para esta fase do acompanhamento.' },
    { id: 'o2', patientId: 'joao', title: 'Observações para a próxima consulta', category: 'Nota clínica', visibility: 'Interno', date: '11/09/2026', body: 'Revisar com a família o padrão de sono e as dúvidas registradas desde a última avaliação.' },
    { id: 'o3', patientId: 'marina', title: 'Brincadeiras e desenvolvimento', category: 'Desenvolvimento', visibility: 'Compartilhado', date: '10/09/2026', body: 'Sugestões de interação adequadas à etapa atual, para a família conversar com a equipe durante o acompanhamento.' },
  ],
  conversations: [
    { id: 'm1', patientId: 'joao', guardian: 'Mariana Almeida', assigned: 'Dr. André', status: 'Aguardando Dr. André', unread: true, messages: [
      { id: 'm1a', author: 'Mariana Almeida', role: 'parent', text: 'Bom dia, doutor. Estou com uma dúvida sobre a orientação da última consulta.', time: '09:12' },
      { id: 'm1b', author: 'Ana Paula', role: 'team', text: 'Bom dia, Mariana! Vou deixar sua dúvida registrada para o Dr. André.', time: '09:18' },
      { id: 'm1c', author: 'Mariana Almeida', role: 'parent', text: 'Ele está mamando bem, mas percebi que está mais inquieto à noite.', time: '09:24' },
    ] },
    { id: 'm2', patientId: 'marina', guardian: 'Carla Santos', assigned: 'Equipe', status: 'Aguardando equipe', unread: true, messages: [
      { id: 'm2a', author: 'Carla Santos', role: 'parent', text: 'Consegui enviar os exames. Pode confirmar se chegaram?', time: 'Ontem' },
    ] },
    { id: 'm3', patientId: 'lucas', guardian: 'Roberto Lima', assigned: 'Equipe', status: 'Aberta', unread: false, messages: [
      { id: 'm3a', author: 'Roberto Lima', role: 'parent', text: 'Precisamos reagendar o retorno do Lucas.', time: 'Seg' },
      { id: 'm3b', author: 'Ana Paula', role: 'team', text: 'Claro, vou verificar os horários disponíveis.', time: 'Seg' },
    ] },
    { id: 'm4', patientId: 'sofia', guardian: 'Fernanda Ribeiro', assigned: 'Dr. André', status: 'Resolvida', unread: false, messages: [
      { id: 'm4a', author: 'Fernanda Ribeiro', role: 'parent', text: 'Obrigada pelas orientações, doutor.', time: 'Sex' },
      { id: 'm4b', author: 'Dr. André', role: 'doctor', text: 'Conte com a equipe. Seguimos acompanhando.', time: 'Sex' },
    ] },
  ],
  documents: [
    { id: 'd1', patientId: 'joao', name: 'Orientações da consulta • 3º mês', kind: 'Orientação', date: '10/09/2026', visibility: 'Compartilhado', size: '248 KB' },
    { id: 'd2', patientId: 'marina', name: 'Exame enviado pela família', kind: 'Exame', date: '08/09/2026', visibility: 'Interno', size: '1,2 MB' },
    { id: 'd3', patientId: 'lucas', name: 'Registro complementar', kind: 'Documento', date: '02/09/2026', visibility: 'Interno', size: '180 KB' },
    { id: 'd4', patientId: 'joao', name: 'Resumo do acompanhamento', kind: 'Resumo', date: '10/08/2026', visibility: 'Compartilhado', size: '96 KB' },
  ],
  notices: [
    { id: 'n1', title: 'Nova mensagem de Mariana', detail: 'João Pedro • conversa aguardando sua resposta', page: 'messages', patientId: 'joao', conversationId: 'm1', read: false, date: 'Hoje, 09:24' },
    { id: 'n2', title: 'Consulta se aproxima', detail: 'João Pedro • 15/10 às 09:00', page: 'agenda', patientId: 'joao', read: false, date: 'Hoje, 08:00' },
    { id: 'n3', title: 'Documento aguardando revisão', detail: 'Marina Costa • exame enviado em 08/09', page: 'documents', patientId: 'marina', read: false, date: 'Ontem' },
    { id: 'n4', title: 'Pendência de acompanhamento', detail: 'Lucas Martins • retorno precisa ser reagendado', page: 'pending', patientId: 'lucas', read: true, date: '08/10/2026' },
  ],
  team: [
    { id: 'doctor', name: 'Dr. André', role: 'Pediatra • Médico responsável', initials: 'DA', color: 'mint', permissions: ['Acesso clínico aos pacientes', 'Registrar evoluções e metas', 'Responder e atribuir conversas', 'Compartilhar orientações com famílias'] },
    { id: 'ana', name: 'Ana Paula', role: 'Técnica de enfermagem', initials: 'AP', color: 'coral', permissions: ['Triagem e orientação autorizada', 'Acesso à agenda e pendências', 'Receber e encaminhar conversas', 'Acesso clínico conforme permissão'] },
    { id: 'camila', name: 'Camila Souza', role: 'Atendimento', initials: 'CS', color: 'lilac', permissions: ['Organizar agenda e confirmações', 'Receber documentos', 'Atribuir mensagens à equipe', 'Sem acesso a evoluções clínicas'] },
    { id: 'mariana', name: 'Mariana Almeida', role: 'Responsável • João Pedro', initials: 'MA', color: 'gold', permissions: ['Acesso ao acompanhamento do filho', 'Visualizar itens compartilhados', 'Conversar com a equipe', 'Sem acesso a registros internos'] },
  ],
  mural: [
    { id: 'w1', title: 'Preparando-se para a próxima fase', summary: 'Um material para conversar com a equipe na próxima consulta.', category: 'Orientação', body: 'Cada criança tem seu próprio ritmo. Na próxima consulta, vamos conversar sobre as novidades desta etapa e esclarecer as dúvidas da família.', audience: 'Todos do programa', date: '15/10/2026', author: 'Dr. André', status: 'Publicado' },
    { id: 'w2', title: 'Sua próxima consulta está chegando', summary: 'João Pedro: 15 de outubro, às 09:00.', category: 'Lembrete', body: 'A avaliação do 4º mês está marcada para 15 de outubro, às 09:00. Se precisar ajustar o horário, fale com a equipe pela área de Mensagens.', audience: 'Programa 12 meses', date: '14/10/2026', author: 'Equipe Crescer', status: 'Publicado' },
    { id: 'w3', title: 'Novo conteúdo sobre rotina', summary: 'Ideias para observar e conversar com o pediatra.', category: 'Conteúdo', body: 'Este conteúdo demonstrativo convida a família a registrar dúvidas e observações do cotidiano para compartilhar com o pediatra.', audience: 'Programa 6 meses', date: '12/10/2026', author: 'Ana Paula', status: 'Publicado' },
    { id: 'w4', title: 'Aviso de funcionamento', summary: 'Confira os horários de atendimento da equipe.', category: 'Aviso', body: 'A equipe está disponível pelo canal de mensagens durante o horário de atendimento do consultório.', audience: 'Todos do programa', date: '10/10/2026', author: 'Equipe Crescer', status: 'Publicado' },
  ],
  library: [
    { id: 'l1', title: 'Sono seguro nos primeiros meses', category: 'Sono', summary: 'Conteúdo demonstrativo para conversar sobre rotina e ambiente de sono.', body: 'Material de apoio para a família conversar com o profissional sobre rotina e ambiente de sono. Não substitui a avaliação individual nem cria recomendações automáticas.', author: 'Dr. André', updatedAt: '10/09/2026' },
    { id: 'l2', title: 'Preparando-se para a próxima fase', category: 'Próxima fase', summary: 'Pontos de conversa para a transição entre etapas do acompanhamento.', body: 'Material demonstrativo com espaço para registrar dúvidas e temas que a família gostaria de conversar na próxima consulta.', author: 'Dr. André', updatedAt: '12/10/2026' },
    { id: 'l3', title: 'Brincadeiras e desenvolvimento', category: 'Desenvolvimento', summary: 'Ideias para observar interações do dia a dia.', body: 'Conteúdo educativo fictício para acompanhar as descobertas do bebê e apoiar conversas com a equipe durante a consulta.', author: 'Ana Paula', updatedAt: '08/10/2026' },
    { id: 'l4', title: 'Rotina da família', category: 'Rotina', summary: 'Um registro simples das rotinas e dúvidas para a consulta.', body: 'Material para a família anotar o que funciona em sua rotina e o que deseja discutir com o pediatra.', author: 'Equipe Crescer', updatedAt: '05/10/2026' },
    { id: 'l5', title: 'Cuidados e dúvidas da consulta', category: 'Cuidados', summary: 'Organize perguntas para conversar com o consultório.', body: 'Conteúdo de demonstração para guardar dúvidas e levá-las à consulta. Não substitui atendimento clínico.', author: 'Dr. André', updatedAt: '03/10/2026' },
  ],
}