# Crescer — protótipo V2

Plataforma de acompanhamento pediátrico do Dr. André (React + TypeScript + Vite, Recharts, Lucide).
Protótipo front-end: os dados ficam no `localStorage` do navegador e podem ser restaurados pelo menu lateral ("Restaurar demonstração").

```bash
npm install
npm run dev      # http://localhost:5173  (V0 antiga em ?v0)
npm run build
```

## Deploy

Publicado no GitHub Pages: https://juniorloppes.github.io/andre-pediatra/

```bash
npm run deploy   # build + publica a pasta dist na branch gh-pages
```

## Perfis de demonstração (tela de login)

| Perfil | Usuário | Acesso |
| --- | --- | --- |
| Médico | Dr. André | Início, Pacientes, Agenda, Programas, Acompanhamento, Conteúdos, Crescimento, Vacinação, Mensagens, Relatórios |
| Secretaria | Marina Costa | Início, Pacientes, Agenda, **Vendas**, Programas, Vacinação, Mensagens (exceto canal privado do Dr. André), Relatórios |
| Administrador | Rafael Torres | Tudo + **Usuários** |
| Responsável | Ana (Laura, 0–1 ano) | Início, Meu filho, Meu programa, Crescimento, Vacinas, Mensagens, Materiais, Agenda |

Famílias extras: Paulo (sem programa), Juliana (pagamento pendente), Carolina (programa 1–2 anos).

## Regras de negócio

- **Programa ativo = venda com status Pago.** Pendente/Cancelado não liberam passos, materiais nem mensagens.
- **Mensagens** só para famílias com programa ativo (a equipe também só enxerga essas famílias).
- **Etapas** calculadas pela idade da criança em dias (0–1 ano: 8 passos de 45 dias; 1–2 anos: 6 passos de ~60 dias).
  Situação do acompanhamento: Em dia · Encontro próximo (≤15 dias do fim do passo) · Atrasado (passo encerrado sem registro).
- **Vacinas**: calendário SBP 2025/2026 (0–2 anos), editável em Vacinação → Vacinas cadastradas.
  Status: Realizada · Atrasada (>30 dias) · Pendente · Próxima (≤30 dias) · Futura.
- **Curvas de crescimento**: referência OMS 0–2 anos com percentis P3–P97 **aproximados** — substituir pelas tabelas LMS oficiais antes de uso clínico.
- Data de referência da demonstração fixada em `TODAY` (`src/v2/utils.ts`).

## Estrutura

```
src/v2/
  types.ts       modelo de dados
  reference.ts   programas, calendário vacinal, curvas
  seed.ts        dados de demonstração
  store.tsx      estado, sessão, permissões por perfil
  domain.ts      regras (vacinas, mensagens, conteúdos)
  utils.ts       datas, idade, etapas, situação do acompanhamento
  ui.tsx         componentes base
  panels/        Acompanhamento, Crescimento, Vacinação (reutilizados)
  pages/         telas
```

Próximos passos para produção: backend com autenticação real, banco de dados, upload de mídia, LGPD (consentimento e trilha de auditoria) e integração de pagamento.
