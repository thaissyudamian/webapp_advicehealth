import { useMemo } from 'react'

import { useClinica } from '../../store/clinicContext.js'
import { horariosDoMedico } from '../../domain/selectors.js'
import { GRADE_INTERVALO, STATUS_INFO } from '../../domain/constants.js'
import { horaParaMinutos, minutosParaHora, primeiroNome } from '../../domain/format.js'
import './agenda.css'

/* Grade do dia: uma coluna por médico, uma linha por intervalo.

   Montada com CSS Grid. O Bootstrap não tem componente de calendário, e o grid
   nativo resolve o caso melhor do que uma tabela: a coluna de horas fica fixa,
   as colunas de médicos dividem o espaço restante por igual e cada célula
   ocupa exatamente uma faixa.

   O eixo de horas é a união dos expedientes: médicos começam e terminam em
   horários diferentes, e as linhas precisam permanecer alinhadas entre as
   colunas. Fora do expediente de um médico, a célula dele fica neutra. */

export function GradeAgenda({ data, aoClicarLivre, aoClicarAgendamento }) {
  const clinica = useClinica()
  const { medicos } = clinica

  const horas = useMemo(() => {
    if (medicos.length === 0) return []
    const inicio = Math.min(...medicos.map((m) => horaParaMinutos(m.horarioAtendimento.inicio)))
    const fim = Math.max(...medicos.map((m) => horaParaMinutos(m.horarioAtendimento.fim)))
    const lista = []
    for (let minuto = inicio; minuto < fim; minuto += GRADE_INTERVALO) {
      lista.push(minutosParaHora(minuto))
    }
    return lista
  }, [medicos])

  const colunas = useMemo(
    () =>
      medicos.map((medico) => ({
        medico,
        porHora: new Map(horariosDoMedico(clinica, medico.id, data).map((h) => [h.hora, h])),
      })),
    [clinica, medicos, data]
  )

  return (
    <div className="agenda-rolagem">
      <div
        className="agenda-grade"
        style={{ gridTemplateColumns: `72px repeat(${medicos.length}, minmax(168px, 1fr))` }}
      >
        <div className="agenda-cabecalho"></div>
        {colunas.map(({ medico }) => (
          <div className="agenda-cabecalho" key={medico.id}>
            <span className="agenda-medico">
              <span className="agenda-medico-cor" style={{ backgroundColor: medico.cor }} aria-hidden="true" />
              <span>
                {medico.nome}
                <small>{medico.especialidade}</small>
              </span>
            </span>
          </div>
        ))}

        {horas.map((hora) => (
          <Linha
            key={hora}
            hora={hora}
            colunas={colunas}
            aoClicarLivre={aoClicarLivre}
            aoClicarAgendamento={aoClicarAgendamento}
          />
        ))}
      </div>
    </div>
  )
}

function Linha({ hora, colunas, aoClicarLivre, aoClicarAgendamento }) {
  return (
    <>
      <div className="agenda-hora">{hora}</div>

      {colunas.map(({ medico, porHora }) => {
        const horario = porHora.get(hora)

        if (!horario) {
          return <div className="agenda-celula agenda-celula-fora" key={medico.id} />
        }

        return (
          <div className="agenda-celula" key={medico.id}>
            {horario.tipo === 'livre' && (
              <button
                type="button"
                className="agenda-livre"
                onClick={() => aoClicarLivre({ medicoId: medico.id, hora })}
                aria-label={`Agendar às ${hora} com ${medico.nome}`}
              >
                <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
                Agendar
              </button>
            )}

            {horario.tipo === 'almoco' && <div className="agenda-indisponivel">Intervalo</div>}

            {horario.tipo === 'bloqueado' && (
              <div className="agenda-indisponivel" title={horario.bloqueio.motivo}>
                <i className="bi bi-slash-circle" aria-hidden="true"></i>
                {horario.bloqueio.motivo}
              </div>
            )}

            {horario.tipo === 'ocupado' &&
              (horario.agendamento.hora === hora ? (
                <CartaoAgendamento
                  agendamento={horario.agendamento}
                  aoClicar={() => aoClicarAgendamento(horario.agendamento)}
                />
              ) : (
                /* Faixa seguinte de um atendimento longo: mantém a coluna
                   ocupada visualmente sem repetir o nome do paciente. */
                <div className="agenda-continuacao" aria-hidden="true" />
              ))}
          </div>
        )
      })}
    </>
  )
}

function CartaoAgendamento({ agendamento, aoClicar }) {
  const situacao = STATUS_INFO[agendamento.status]
  const cancelado = agendamento.status === 'cancelado' || agendamento.status === 'faltou'

  return (
    <button
      type="button"
      className={`agenda-cartao${cancelado ? ' cancelado' : ''}`}
      style={{ '--cor-situacao': situacao.cor }}
      onClick={aoClicar}
    >
      <span className="agenda-cartao-nome">{agendamento.paciente?.nome}</span>
      <span className="agenda-cartao-info">
        {primeiroNome(situacao.rotulo)} · {agendamento.duracao} min
      </span>
    </button>
  )
}
