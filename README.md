# Crescer — protótipo V3

Plataforma de acompanhamento pediátrico do Dr. André (React + TypeScript + Vite, Recharts, Lucide).
Protótipo front-end: os dados ficam no `localStorage` do navegador e podem ser restaurados pelo menu lateral ("Restaurar demonstração").

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Deploy

Publicado no GitHub Pages: https://juniorloppes.github.io/andre-pediatra/

```bash
npm run deploy   # build + publica a pasta dist na branch gh-pages
```

## O que é o Crescer

Plataforma de **acompanhamento de programas pediátricos**. Não é prontuário: o prontuário clínico continua no **Clínica Experts**.

Família (conta) → criança → **produto/programa** → venda → pagamento → **programa ativo** → passos, conteúdos e benefícios → vigência → renovação ou encerramento.

## Perfis de demonstração (tela de login)

| Perfil | Usuário | Acesso |
| --- | --- | --- |
| Médico | Dr. André (médico e proprietário) | **Total**: clínico, comercial, financeiro e usuários |
| Secretaria | Marina Costa | Operação: famílias, agenda, vendas, pagamentos, programas, vacinação, mensagens e relatórios. Sem decisões clínicas |
| Administrador | Rafael Torres | Total |
| Responsável | Ana (programa ativo) | Meu filho, Meu programa, Crescimento, Vacinas, Mensagens, Materiais, Agenda |

Outras famílias: Paulo (sem programa), Juliana (pagamento pendente), Lucas (programa encerrado), Carolina (Ano 2).

## Regras (V3)

- **Meus Primeiros Passos:** 0 a 24 meses, **16 passos de 45 dias**, organizados em dois contratos anuais: **Ano 1** (passos 1–8) e **Ano 2** (passos 9–16). Títulos conforme o documento do Dr. André.
- **Programa = produto.** Pode haver vários, cada um com contratos, valores, duração, passos, conteúdos e benefícios configuráveis.
- **Programa ativo** = venda **paga** e **dentro da vigência**. Situações: Pagamento pendente · Programa ativo · Aguardando início · Programa encerrado · Cancelado.
- **Conta ≠ programa:** toda família acessa o Crescer. **Somente famílias com programa pago e ativo podem enviar mensagens.**
- **Mensagens:** uma caixa por família. O Dr. André e a secretaria respondem, e cada resposta mostra "Respondido por". Assuntos clínicos são sinalizados ao Dr. André.
- **Encontro do passo:** consulta com o Dr. André **ou** triagem com a equipe. Cada encontro tem um **Mapa do Passo** (checklist SIM/NÃO).
- **Sinalizadores de triagem** (fono, nutrição, psicologia, TO) aparecem como "Requer avaliação do Dr. André". Nunca como diagnóstico ou encaminhamento automático.
- **Vacinas:** Calendário SBP 2025/2026 (Documento Científico nº 12), de 0 a 24 meses.
- **Curvas de crescimento:** valores **aproximados de demonstração**. Substituir pelas tabelas oficiais antes de uso clínico.

Decisões ainda em aberto: [docs/V3-PENDENCIAS-DR-ANDRE.md](docs/V3-PENDENCIAS-DR-ANDRE.md).

## Estrutura

```
src/app/
  types.ts       modelo de dados
  reference.ts   programa (16 passos), sinalizadores, calendário SBP, curvas
  seed.ts        dados de demonstração
  store.tsx      estado, sessão, permissões por perfil
  domain.ts      regras (vacinas, mensagens, conteúdos)
  utils.ts       datas, idade, etapas, situação do acompanhamento
  ui.tsx         componentes base
  panels/        Acompanhamento, Crescimento, Vacinação (reutilizados)
  pages/         telas
```

Próximos passos para produção: backend com autenticação real, banco de dados, upload de mídia, LGPD (consentimento e trilha de auditoria) e integração de pagamento.
