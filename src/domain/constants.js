/* Listas fixas e regras de transição do domínio. */

export const STATUS = {
  AGENDADO: 'agendado',
  CONFIRMADO: 'confirmado',
  AGUARDANDO: 'aguardando',
  EM_ATENDIMENTO: 'em_atendimento',
  ATENDIDO: 'atendido',
  CANCELADO: 'cancelado',
  FALTOU: 'faltou',
}

export const STATUS_INFO = {
  [STATUS.AGENDADO]: { rotulo: 'Agendado', cor: 'var(--ah-status-agendado)', icone: 'bi-calendar-plus' },
  [STATUS.CONFIRMADO]: { rotulo: 'Confirmado', cor: 'var(--ah-status-confirmado)', icone: 'bi-check-circle' },
  [STATUS.AGUARDANDO]: { rotulo: 'Aguardando', cor: 'var(--ah-status-aguardando)', icone: 'bi-person-check' },
  [STATUS.EM_ATENDIMENTO]: { rotulo: 'Em atendimento', cor: 'var(--ah-status-atendimento)', icone: 'bi-hourglass-split' },
  [STATUS.ATENDIDO]: { rotulo: 'Atendido', cor: 'var(--ah-status-atendido)', icone: 'bi-check2-all' },
  [STATUS.CANCELADO]: { rotulo: 'Cancelado', cor: 'var(--ah-status-cancelado)', icone: 'bi-x-circle' },
  [STATUS.FALTOU]: { rotulo: 'Faltou', cor: 'var(--ah-status-faltou)', icone: 'bi-exclamation-triangle' },
}

/* Transições permitidas. Impede que a interface ofereça, por exemplo,
   "confirmar" um agendamento já cancelado. */
const TRANSICOES = {
  [STATUS.AGENDADO]: [STATUS.CONFIRMADO, STATUS.AGUARDANDO, STATUS.CANCELADO, STATUS.FALTOU],
  [STATUS.CONFIRMADO]: [STATUS.AGUARDANDO, STATUS.CANCELADO, STATUS.FALTOU],
  [STATUS.AGUARDANDO]: [STATUS.EM_ATENDIMENTO, STATUS.CANCELADO, STATUS.FALTOU],
  [STATUS.EM_ATENDIMENTO]: [STATUS.ATENDIDO],
  [STATUS.ATENDIDO]: [],
  [STATUS.CANCELADO]: [],
  [STATUS.FALTOU]: [],
}

export function proximosStatus(atual) {
  return TRANSICOES[atual] ?? []
}

export function podeTransitar(de, para) {
  return proximosStatus(de).includes(para)
}

/* Um horário só é considerado ocupado por agendamentos nestes estados:
   cancelado e faltou liberam a vaga na grade. */
export const STATUS_OCUPAM_HORARIO = [
  STATUS.AGENDADO,
  STATUS.CONFIRMADO,
  STATUS.AGUARDANDO,
  STATUS.EM_ATENDIMENTO,
  STATUS.ATENDIDO,
]

export const PAGAMENTO = {
  PENDENTE: 'pendente',
  PAGO: 'pago',
  ISENTO: 'isento',
  CONVENIO: 'convenio',
}

export const PAGAMENTO_INFO = {
  [PAGAMENTO.PENDENTE]: { rotulo: 'Pendente', cor: 'var(--ah-pagamento-pendente)' },
  [PAGAMENTO.PAGO]: { rotulo: 'Pago', cor: 'var(--ah-pagamento-pago)' },
  [PAGAMENTO.ISENTO]: { rotulo: 'Isento', cor: 'var(--ah-pagamento-isento)' },
  [PAGAMENTO.CONVENIO]: { rotulo: 'Convênio', cor: 'var(--ah-pagamento-convenio)' },
}

export const FORMAS_PAGAMENTO = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'pix', rotulo: 'PIX' },
  { valor: 'debito', rotulo: 'Cartão de débito' },
  { valor: 'credito', rotulo: 'Cartão de crédito' },
  { valor: 'convenio', rotulo: 'Convênio' },
]

export const TIPOS_CONSULTA = [
  { valor: 'consulta', rotulo: 'Consulta', duracao: 30 },
  { valor: 'retorno', rotulo: 'Retorno', duracao: 20 },
  { valor: 'exame', rotulo: 'Exame', duracao: 40 },
  { valor: 'procedimento', rotulo: 'Procedimento', duracao: 60 },
]

export const CONVENIOS = [
  'Particular',
  'Unimed',
  'Bradesco Saúde',
  'SulAmérica',
  'Amil',
  'NotreDame Intermédica',
]

export const SEXOS = [
  { valor: 'F', rotulo: 'Feminino' },
  { valor: 'M', rotulo: 'Masculino' },
  { valor: 'O', rotulo: 'Outro' },
]

export const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

export const MOTIVOS_BLOQUEIO = [
  'Férias',
  'Congresso',
  'Cirurgia',
  'Consulta externa',
  'Compromisso pessoal',
  'Outro',
]

/* Limites da grade da agenda e granularidade dos horários, em minutos. */
export const GRADE_INICIO = '07:00'
export const GRADE_FIM = '19:00'
export const GRADE_INTERVALO = 30
