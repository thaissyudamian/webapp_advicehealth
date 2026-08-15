# Consultório — Gestão de Agenda

WebApp para a rotina administrativa de um consultório médico: a recepção agenda
e cobra, o gestor acompanha o dia.

Três módulos: **Painel do consultório**, **Agenda** e **Consulta de
agendamentos**.

---

## Como executar

```bash
npm install
npm run dev      # servidor de desenvolvimento em http://localhost:5173
```

Outros comandos:

```bash
npm run build    # gera a versão de produção em dist/
npm run preview  # serve o conteúdo de dist/ localmente
npm run lint     # ESLint
```

Não há backend: os dados ficam no `localStorage` do navegador. A aplicação
carrega uma massa de exemplo na primeira execução — médicos, pacientes e uma
agenda montada em torno do dia corrente. O botão **Restaurar exemplo**, no
painel, devolve tudo ao estado inicial.

---

## Stack

| | |
|---|---|
| React 18 | componentes de função e hooks |
| Vite | build e servidor de desenvolvimento |
| Bootstrap 5.3 | CSS (grid, utilitários e componentes) |
| Bootstrap Icons | ícones |
| React Router | três rotas, com estado na URL |

Dependências de produção: `react`, `react-dom`, `react-router-dom`,
`bootstrap`, `bootstrap-icons`. Nenhuma biblioteca de componentes, de tabela,
de calendário, de máscara ou de datas — essas partes são justamente o que o
escopo pede que seja construído com HTML, CSS, Bootstrap e React.

---

## Estrutura

```
src/
├── domain/             regras, formatação e consultas — sem React
│   ├── constants.js    máquina de estados e listas fixas
│   ├── format.js       datas, moeda, CPF, telefone, CEP
│   ├── validators.js   validação de campo
│   └── selectors.js    consultas puras sobre o estado
├── data/seed.js        massa de exemplo, relativa ao dia corrente
├── services/           persistência (localStorage)
├── store/              estado global (Context + useReducer)
├── hooks/              useForm, contexto de notificações
├── components/
│   ├── ui/             genéricos, sem regra de negócio
│   ├── layout/         barra superior e estrutura
│   ├── agenda/         grade, formulário, transferência, bloqueio
│   └── *.jsx           componentes que conhecem o domínio
├── pages/              as três telas
└── styles/theme.css    tokens de design e ajustes do Bootstrap
```

**A regra que sustenta o reaproveitamento:** nenhum componente de
`components/ui/` importa de `store/`, `domain/` ou `data/`. É isso que permite
copiar `Modal`, `FormField`, `Badge`, `StatCard`, `EmptyState`,
`ConfirmDialog`, `PageHeader` e `ToastProvider` para outro projeto sem levar
junto o conceito de agendamento.

Componentes que precisam conhecer o domínio ficam um nível acima, em
`components/`.

---

## Modelo de domínio

```
Medico       { id, nome, especialidade, crm, cor, valorConsulta, horarioAtendimento }
Paciente     { id, nome, cpf, nascimento, sexo, telefone, email, convenio, endereco }
Agendamento  { id, pacienteId, medicoId, data, hora, duracao, tipo, status,
               observacoes, pagamento, historico[] }
Bloqueio     { id, medicoId, data, horaInicio, horaFim, motivo }
Aviso        { id, titulo, texto, tipo, data, lido }
```

**A situação do agendamento é uma máquina de estados**, declarada em
`constants.js` junto com as transições permitidas:

```
agendado → confirmado → aguardando → em atendimento → atendido
                    ↘ cancelado / faltou
```

A interface consulta `proximosStatus()` para saber o que oferecer. Um
agendamento cancelado não exibe "registrar chegada" porque a regra diz que essa
transição não existe.

Duas consequências práticas:

- "agendamentos do dia" e "pacientes atendidos" são o **mesmo dado em estados
  diferentes**, derivados por filtro da mesma lista. Não podem divergir.
- `STATUS_OCUPAM_HORARIO` declara que cancelado e falta **liberam a vaga** na
  grade, em um lugar só.

**O pagamento tem situação própria** (`pendente`, `pago`, `isento`,
`convenio`), independente da situação da consulta. Sem isso, "atendido mas não
pago" — o caso que o financeiro precisa ver — não seria representável, nem o
convênio, que fatura depois do atendimento.

---

## Decisões de arquitetura

### CSS do Bootstrap sim, JavaScript do Bootstrap não

O Bootstrap distribui dois artefatos independentes: o framework CSS e doze
scripts de comportamento. O CSS é usado integralmente, com as classes oficiais
no markup (`.modal`, `.modal-dialog`, `.modal-backdrop`, `.offcanvas`). Apenas
o `bootstrap.bundle.js` fica de fora.

O JavaScript do Bootstrap manipula o DOM diretamente — injeta nós no `<body>` e
altera `body.style` — enquanto o React assume ser o dono do DOM. Os dois juntos
produzem os defeitos conhecidos: modal que não fecha, backdrop preso na tela.
Aqui, quem controla abrir e fechar é o estado do React.

### Tema em três camadas

`styles/theme.css` tem tokens próprios (`--ah-*`), o remapeamento das variáveis
`--bs-*` e a reescrita das regras que trazem a cor primária fixa em
hexadecimal no CSS compilado — botões, campos em foco, abas, paginação. Sem
essa terceira camada, a interface ficaria com botões na cor da marca e
checkbox, aba ativa e anel de foco em azul.

Nenhum override usa `!important`: têm a mesma especificidade das regras
originais e vencem por ordem de declaração. Por isso o tema é importado
**depois** do Bootstrap em `main.jsx`.

### Datas como texto, nunca como `Date`

Datas circulam como `'AAAA-MM-DD'` e horários como `'HH:MM'`.
`new Date('2026-08-14')` é interpretado como meia-noite UTC e, no Brasil,
retorna 13 de agosto às 21h — um agendamento marcado para hoje apareceria
ontem. Onde um objeto `Date` é inevitável, ele é montado por
`new Date(ano, mes - 1, dia)`, que usa o fuso local.

### Estado global com `Context` + `useReducer`

Redux seria peso morto para três telas; estado local não sobrevive ao painel
precisar dos dados que a agenda produz. O reducer importa porque uma operação
mexe em mais de uma coleção — salvar um agendamento pode cadastrar o paciente
junto — e com estados separados haveria uma janela de inconsistência.

### Persistência atrás de uma camada de serviço

Toda leitura e escrita passa por `services/clinicaService.js`, com latência
simulada de 350–400 ms. Sem a espera, os estados de carregamento e os botões
"salvando…" nunca apareceriam em desenvolvimento, e a interface só quebraria ao
ser ligada a um servidor real. Como as funções já são assíncronas, trocar por
`fetch()` não muda nenhuma assinatura.

### Estado de tela na URL

Data da agenda, data do painel e filtros da consulta ficam em *query string*.
Isso preserva o contexto ao recarregar, permite compartilhar um link e faz o
botão voltar do navegador funcionar. É também o que permite um lembrete do
painel apontar para a consulta **já filtrada**.

Como consequência, `BrowserRouter` exige que o servidor devolva o `index.html`
em qualquer caminho — configurado em `vercel.json`.

---

## Melhorias propostas sobre o wireframe

1. **Busca por CPF antes do cadastro.** Coletar os dados do paciente do zero a
   cada agendamento produz fichas duplicadas — a falha mais comum desse tipo de
   sistema. O formulário começa pelo CPF: paciente existente traz os dados
   preenchidos, paciente novo abre o cadastro completo.

2. **Horários em fichas, não em lista suspensa.** A lista esconde a
   disponibilidade e o conflito só aparece ao salvar. Com as fichas, o horário
   ocupado fica esmaecido e não é clicável — a validação de conflito vira
   prevenção.

3. **Estado "aguardando" (check-in na recepção).** Sem ele não há como
   responder "quem já chegou?", que é a pergunta mais frequente do balcão.

4. **Cobrança desacoplada do atendimento**, para representar convênio e
   pendências.

5. **Histórico no agendamento.** Transferência, cancelamento e alteração de
   valor registram o que mudou e quando.

6. **Lembretes calculados no painel.** Além dos avisos cadastrados, o painel
   deriva pendências reais do movimento do dia — "5 pagamentos pendentes",
   "2 consultas sem confirmação" — e cada uma leva à tela já filtrada.

7. **Indicador "próximo horário livre"**, que responde a pergunta mais feita ao
   telefone sem precisar abrir a agenda.

8. **Bloqueio de período recusado quando há agendamentos na faixa**, com os
   conflitos listados. Apagar a agenda de alguém por engano é pior do que
   exigir um passo a mais.

---

## Acessibilidade

- HTML semântico: `main`, `nav`, `section`, `table` com `thead`/`tbody`,
  `form` com `onSubmit`, `label` associado a cada campo
- atalho "pular para o conteúdo" para navegação por teclado
- foco devolvido ao elemento de origem ao fechar um modal
- foco levado ao primeiro campo inválido quando o envio falha
- situação nunca comunicada só por cor — sempre com rótulo em texto; períodos
  indisponíveis também se distinguem por textura
- cores dos médicos verificadas para daltonismo (separação mínima ΔE 9,3 em
  deutan) e contraste de texto conforme WCAG AA

---

## Publicação

O projeto gera um site estático:

```bash
npm run build
```

O `vercel.json` já contém o *rewrite* necessário para que rotas como `/agenda`
funcionem ao serem abertas diretamente.

Os dados vivem no navegador de cada visitante — cada pessoa que abrir o
endereço recebe a massa de exemplo e pode alterá-la sem afetar as demais.
