/* Consultas sobre o estado.

   Funções puras, fora do React: recebem o estado e devolvem o recorte pronto.
   Mantém as telas sem lógica de negócio e permite que Dashboard e Agenda
   derivem os mesmos números da mesma fonte, sem risco de divergirem. */

import { PAGAMENTO, STATUS, STATUS_OCUPAM_HORARIO } from './constants.js'
import { horaParaMinutos, somenteDigitos } from './format.js'

export const buscarMedico = (estado, id) => estado.medicos.find((m) => m.id === id) ?? null
export const buscarPaciente = (estado, id) => estado.pacientes.find((p) => p.id === id) ?? null

export function pacientePorCPF(estado, cpf) {
  const procurado = somenteDigitos(cpf)
  if (procurado.length !== 11) return null
  return estado.pacientes.find((p) => somenteDigitos(p.cpf) === procurado) ?? null
}

/* Junta paciente e médico ao agendamento. As telas recebem tudo pronto em vez
   de cada uma refazer o cruzamento por id. */
export function comRelacionados(estado, agendamento) {
  if (!agendamento) return null
  return {
    ...agendamento,
    paciente: buscarPaciente(estado, agendamento.pacienteId),
    medico: buscarMedico(estado, agendamento.medicoId),
  }
}

export function agendamentosDaData(estado, data, { medicoId = null } = {}) {
  return estado.agendamentos
    .filter((a) => a.data === data && (!medicoId || a.medicoId === medicoId))
    .sort((a, b) => horaParaMinutos(a.hora) - horaParaMinutos(b.hora))
    .map((a) => comRelacionados(estado, a))
}

export function bloqueiosDaData(estado, data, { medicoId = null } = {}) {
  return estado.bloqueios.filter((b) => b.data === data && (!medicoId || b.medicoId === medicoId))
}

export const valorLiquido = (pagamento) =>
  Math.max(0, (Number(pagamento?.valor) || 0) - (Number(pagamento?.desconto) || 0))

/* Números da área de trabalho. Todos derivados da mesma lista de agendamentos:
   contagem e faturamento nunca podem discordar da agenda exibida ao lado. */
export function resumoDoDia(estado, data) {
  const doDia = estado.agendamentos.filter((a) => a.data === data)
  const ocupam = doDia.filter((a) => STATUS_OCUPAM_HORARIO.includes(a.status))

  return {
    agendamentos: ocupam.length,
    atendidos: doDia.filter((a) => a.status === STATUS.ATENDIDO).length,
    faturamento: doDia
      .filter((a) => a.pagamento?.status === PAGAMENTO.PAGO)
      .reduce((total, a) => total + valorLiquido(a.pagamento), 0),
    aReceber: doDia
      .filter((a) => a.pagamento?.status === PAGAMENTO.PENDENTE && a.status !== STATUS.CANCELADO)
      .reduce((total, a) => total + valorLiquido(a.pagamento), 0),
    pendentes: doDia.filter(
      (a) => a.pagamento?.status === PAGAMENTO.PENDENTE && a.status !== STATUS.CANCELADO
    ).length,
    aguardando: doDia.filter((a) => a.status === STATUS.AGUARDANDO).length,
    naoConfirmados: doDia.filter((a) => a.status === STATUS.AGENDADO).length,
    cancelados: doDia.filter((a) => a.status === STATUS.CANCELADO).length,
    faltas: doDia.filter((a) => a.status === STATUS.FALTOU).length,
  }
}
