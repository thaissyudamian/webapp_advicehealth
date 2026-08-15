/* Consultas sobre o estado.

   Funções puras, fora do React: recebem o estado e devolvem o recorte pronto.
   Mantém as telas sem lógica de negócio e permite que Dashboard e Agenda
   derivem os mesmos números da mesma fonte, sem risco de divergirem. */

import { GRADE_INTERVALO, PAGAMENTO, STATUS, STATUS_OCUPAM_HORARIO } from './constants.js'
import { horaParaMinutos, minutosParaHora, somenteDigitos } from './format.js'

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

/* Grade de horários de um médico num dia.

   Devolve todos os intervalos do expediente, cada um classificado em:
   livre | ocupado | bloqueado | almoco

   É a base tanto da agenda quanto da escolha de horário no agendamento: com a
   grade pronta, oferecer só os horários livres deixa de ser validação (avisar
   depois do erro) e passa a ser prevenção (não deixar o erro acontecer).

   A sobreposição considera a duração do agendamento, não só a hora de início:
   um exame de 40 minutos às 15:00 ocupa também a faixa das 15:30. */
export function horariosDoMedico(estado, medicoId, data) {
  const medico = buscarMedico(estado, medicoId)
  if (!medico) return []

  const { inicio, fim, almocoInicio, almocoFim } = medico.horarioAtendimento
  const bloqueios = bloqueiosDaData(estado, data, { medicoId })
  const ocupados = estado.agendamentos.filter(
    (a) => a.medicoId === medicoId && a.data === data && STATUS_OCUPAM_HORARIO.includes(a.status)
  )

  const horarios = []

  for (let minuto = horaParaMinutos(inicio); minuto < horaParaMinutos(fim); minuto += GRADE_INTERVALO) {
    const hora = minutosParaHora(minuto)
    const fimIntervalo = minuto + GRADE_INTERVALO

    if (almocoInicio && minuto >= horaParaMinutos(almocoInicio) && minuto < horaParaMinutos(almocoFim)) {
      horarios.push({ hora, tipo: 'almoco' })
      continue
    }

    const bloqueio = bloqueios.find(
      (b) => minuto < horaParaMinutos(b.horaFim) && fimIntervalo > horaParaMinutos(b.horaInicio)
    )
    if (bloqueio) {
      horarios.push({ hora, tipo: 'bloqueado', bloqueio })
      continue
    }

    const agendamento = ocupados.find((a) => {
      const inicioAg = horaParaMinutos(a.hora)
      return minuto < inicioAg + (a.duracao ?? GRADE_INTERVALO) && fimIntervalo > inicioAg
    })
    if (agendamento) {
      horarios.push({ hora, tipo: 'ocupado', agendamento: comRelacionados(estado, agendamento) })
      continue
    }

    horarios.push({ hora, tipo: 'livre' })
  }

  return horarios
}

/* Primeiro horário livre do dia, considerando todos os médicos.
   `aPartirDe` evita oferecer um horário que já passou. */
export function proximoHorarioLivre(estado, data, { aPartirDe = null } = {}) {
  const limite = aPartirDe ? horaParaMinutos(aPartirDe) : -1
  let melhor = null

  for (const medico of estado.medicos) {
    for (const horario of horariosDoMedico(estado, medico.id, data)) {
      if (horario.tipo !== 'livre') continue
      const minutos = horaParaMinutos(horario.hora)
      if (minutos < limite) continue
      if (!melhor || minutos < melhor.minutos) melhor = { hora: horario.hora, minutos, medico }
    }
  }

  return melhor
}

/* Lembretes calculados a partir do próprio movimento do dia.

   Diferem dos avisos cadastrados: ninguém os escreve, eles aparecem porque
   existe algo pendente. Cada um aponta para a tela que resolve — um número
   parado no painel não ajuda quem precisa agir. */
export function lembretesDoDia(estado, data) {
  const resumo = resumoDoDia(estado, data)
  const lembretes = []

  if (resumo.aguardando > 0) {
    lembretes.push({
      id: 'aguardando',
      icone: 'bi-person-check',
      cor: 'var(--ah-status-aguardando)',
      texto: `${resumo.aguardando} paciente(s) na recepção aguardando atendimento`,
      para: '/agenda',
      acao: 'Ver na agenda',
    })
  }

  if (resumo.naoConfirmados > 0) {
    lembretes.push({
      id: 'confirmar',
      icone: 'bi-telephone',
      cor: 'var(--ah-status-agendado)',
      texto: `${resumo.naoConfirmados} consulta(s) de hoje ainda sem confirmação`,
      para: '/agenda',
      acao: 'Confirmar',
    })
  }

  if (resumo.pendentes > 0) {
    lembretes.push({
      id: 'pagamentos',
      icone: 'bi-cash-stack',
      cor: 'var(--ah-pagamento-pendente)',
      texto: `${resumo.pendentes} pagamento(s) pendente(s) hoje`,
      para: '/agendamentos',
      acao: 'Ver cobranças',
    })
  }

  const bloqueios = bloqueiosDaData(estado, data)
  for (const bloqueio of bloqueios) {
    const medico = buscarMedico(estado, bloqueio.medicoId)
    lembretes.push({
      id: `bloqueio-${bloqueio.id}`,
      icone: 'bi-slash-circle',
      cor: 'var(--ah-status-cancelado)',
      texto: `${medico?.nome ?? 'Médico'} indisponível das ${bloqueio.horaInicio} às ${bloqueio.horaFim} — ${bloqueio.motivo}`,
      para: '/agenda',
      acao: 'Ver período',
    })
  }

  if (resumo.faltas > 0) {
    lembretes.push({
      id: 'faltas',
      icone: 'bi-exclamation-triangle',
      cor: 'var(--ah-status-faltou)',
      texto: `${resumo.faltas} falta(s) registrada(s) hoje`,
      para: '/agendamentos',
      acao: 'Ver registros',
    })
  }

  return lembretes
}

export function avisosDaData(estado, data) {
  return estado.avisos
    .filter((aviso) => aviso.data <= data)
    .sort((a, b) => (a.lido === b.lido ? b.data.localeCompare(a.data) : a.lido ? 1 : -1))
}

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
