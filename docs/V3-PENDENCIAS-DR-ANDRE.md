# Crescer V3 — decisões pendentes com o Dr. André

Protótipo local. Nenhuma das respostas abaixo foi assumida como regra definitiva:
onde foi preciso mostrar algo, o comportamento está marcado na tela como **demonstração**.

## Decisões de negócio

1. **Acesso gratuito:** quais funcionalidades ficam disponíveis para famílias sem programa pago?
   *(Hoje no protótipo: a família entra e vê Meu filho, Crescimento, Vacinas, Agenda e conteúdos gerais. Só **não pode enviar mensagens**, que é a única regra confirmada.)*
2. **Formas de pagamento:** quais serão aceitas (PIX, cartão, parcelamento, outras)?
3. **Registrar ou processar:** o Crescer só **registra** pagamentos feitos fora dele, ou deverá **processar** a cobrança?
   *(Hoje: só registra. A forma de pagamento é um dado demonstrativo.)*
4. **Após o término do programa:** o que continua acessível (histórico, conteúdos já liberados, crescimento, vacinação, agenda, dados da criança)?
5. **Dois ou mais filhos:** um login para vários filhos? Como alternar entre eles? Um contrato/pagamento por criança? Existe condição para irmãos?
6. **Encontro do passo:** todo passo exige encontro?
7. **Atraso:** quando um encontro passa a ser considerado atrasado? Como funciona o reagendamento?
   *(Hoje: o protótipo apenas informa "passo sem encontro registrado". Nada é marcado como atraso.)*
8. **Alertas:** quais eventos geram alerta e com qual antecedência (próximo encontro, encontro sem registro, vencimento, renovação, vacina, pendência, mensagem aguardando resposta)? Lembrete: o documento orienta que qualquer sinal de alerta do checklist seja escalado ao médico.
   *(Hoje: o Dashboard mostra exemplos marcados como "exemplos para validação". A janela de 60 dias para vencimento é só demonstrativa.)*
9. **Gráfico de crescimento + eventos:** quais eventos ou informações devem aparecer junto da curva? Quem registra? Vêm do Crescer ou do Clínica Experts?
   *(Hoje: o gráfico mostra como marcadores apenas os encontros do programa, para ilustrar o conceito.)*
10. **Clínica Experts:** existe alguma informação do prontuário que precisa aparecer também no Crescer?

## Também a validar

- **Pendências de passos anteriores:** continuam visíveis para a família nos passos seguintes até serem concluídas?
- **Renovação Ano 1 → Ano 2:** qual a regra operacional? *(Hoje: a renovação é manual, por um botão "Renovar (Ano 2)" que abre uma nova venda. Não há automação.)*
- **Cancelamento antecipado:** o que acontece com o acesso, o histórico e os conteúdos?
- **Renovação após 24 meses:** o documento cita a "renovação para o próximo passo (3 a 4 anos)", com o valor vigente na época. Esse programa ainda não existe no Crescer.

- **Mapa do Passo — perguntas:** o documento define o formato ("avaliação objetiva sim/não por pilar") e os pilares (saúde física, neuropsicomotor, comportamento/emoção, relações e parentalidade). **Não traz as perguntas** de nenhum dos 16 passos. Quais são as perguntas de cada passo e de cada pilar?
- **Desafios por pilar:** o documento lista os "Principais desafios" de cada passo separados por ";". Em 15 passos são 4 grupos, aparentemente na ordem dos pilares; o passo 12 tem 3. Confirmar se cada grupo corresponde a um pilar (hoje os desafios aparecem sem rótulo de pilar).
- **Canal de dúvidas:** o documento cita "responder dúvidas simples e recorrentes pelo canal de **WhatsApp** do programa". No Crescer, esse canal é a Caixa de mensagens. Confirmar se as mensagens do Crescer substituem o WhatsApp.

## Fonte do conteúdo

- **Documento "Meus Primeiros Passos": recebido e aplicado.** Os 16 passos usam o texto do documento: tema central, principais desafios, meta, desafio para os pais e comemoração. Também vêm do documento as seções "Quando envolver outros profissionais" (gatilhos por fase e por passo) e "O que a técnica de enfermagem pode conduzir".
- Os **conteúdos/materiais** (vídeos e textos por passo) do protótipo continuam sendo **exemplos de demonstração**. Os materiais reais da clínica ainda precisam ser cadastrados.
- **Curvas de crescimento:** os percentis são **aproximados, para demonstração**. Devem ser substituídos pelas tabelas oficiais antes de uso clínico.
- **Técnica de enfermagem:** ainda não tem perfil próprio no protótipo. A triagem é registrada como "Triagem com a equipe".
