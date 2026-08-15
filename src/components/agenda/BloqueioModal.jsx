import { useEffect, useMemo, useState } from 'react'

import { useClinica } from '../../store/clinicContext.js'
import { useToast } from '../../hooks/toastContext.js'
import { agendamentosDaData } from '../../domain/selectors.js'
import { MOTIVOS_BLOQUEIO, STATUS_OCUPAM_HORARIO } from '../../domain/constants.js'
import { formatarData, horaParaMinutos, somarDias } from '../../domain/format.js'

import { Modal } from '../ui/Modal.jsx'

/* Indisponibilização de período — férias, congresso, compromisso.

   Antes de gravar, verifica se já existem agendamentos dentro da faixa. Se
   houver, o bloqueio é recusado e os conflitos são listados: apagar a agenda
   de alguém por engano é pior do que exigir um passo a mais. */

export function BloqueioModal({ aberto, medicoIdInicial, dataInicial, aoFechar }) {
  const clinica = useClinica()
  const toast = useToast()

  const [medicoId, setMedicoId] = useState('')
  const [data, setData] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [horaInicio, setHoraInicio] = useState('08:00')
  const [horaFim, setHoraFim] = useState('12:00')
  const [motivo, setMotivo] = useState(MOTIVOS_BLOQUEIO[0])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto) return
    setMedicoId(medicoIdInicial ?? clinica.medicos[0]?.id ?? '')
    setData(dataInicial ?? '')
    setDataFim(dataInicial ?? '')
  }, [aberto, medicoIdInicial, dataInicial, clinica.medicos])

  const intervaloInvalido = horaFim <= horaInicio
  const datasInvalidas = Boolean(dataFim) && dataFim < data
  const variosDias = Boolean(dataFim) && dataFim > data

  /* Percorre todos os dias do intervalo: com um bloqueio de férias, olhar só a
     data inicial deixaria passar os agendamentos do segundo dia em diante —
     justamente os que seriam apagados sem aviso. */
  const conflitos = useMemo(() => {
    if (!medicoId || !data || intervaloInvalido || datasInvalidas) return []

    const encontrados = []
    const ultimo = dataFim || data
    for (let dia = data; dia <= ultimo; dia = somarDias(dia, 1)) {
      const doDia = agendamentosDaData(clinica, dia, { medicoId }).filter((a) => {
        if (!STATUS_OCUPAM_HORARIO.includes(a.status)) return false
        const inicio = horaParaMinutos(a.hora)
        return inicio < horaParaMinutos(horaFim) && inicio + (a.duracao ?? 30) > horaParaMinutos(horaInicio)
      })
      encontrados.push(...doDia)
    }
    return encontrados
  }, [clinica, medicoId, data, dataFim, horaInicio, horaFim, intervaloInvalido, datasInvalidas])

  const confirmar = async () => {
    setEnviando(true)
    try {
      await clinica.salvarBloqueio({ medicoId, data, dataFim: dataFim || data, horaInicio, horaFim, motivo })
      toast.sucesso(
        variosDias
          ? `Período indisponível de ${formatarData(data)} a ${formatarData(dataFim)}.`
          : `Período indisponível registrado das ${horaInicio} às ${horaFim}.`
      )
      aoFechar()
    } catch {
      toast.erro('Não foi possível registrar o bloqueio.')
    } finally {
      setEnviando(false)
    }
  }

  const impedido = !medicoId || !data || intervaloInvalido || datasInvalidas || conflitos.length > 0

  return (
    <Modal
      aberto={aberto}
      titulo="Indisponibilizar período"
      aoFechar={enviando ? undefined : aoFechar}
      fecharFora={false}
      rodape={
        <>
          <button type="button" className="btn btn-light" onClick={aoFechar} disabled={enviando}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={confirmar}
            disabled={impedido || enviando}
          >
            {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            Registrar indisponibilidade
          </button>
        </>
      }
    >
      <div className="row g-3">
        <div className="col-12">
          <label className="form-label obrigatorio" htmlFor="bloqueio-medico">
            Médico
          </label>
          <select
            id="bloqueio-medico"
            className="form-select"
            value={medicoId}
            onChange={(e) => setMedicoId(e.target.value)}
          >
            {clinica.medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} — {m.especialidade}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-sm-4">
          <label className="form-label obrigatorio" htmlFor="bloqueio-data">
            De
          </label>
          <input
            id="bloqueio-data"
            name="bloqueio-data"
            type="date"
            className="form-control"
            value={data}
            onChange={(e) => {
              setData(e.target.value)
              if (!dataFim || dataFim < e.target.value) setDataFim(e.target.value)
            }}
          />
        </div>

        <div className="col-6 col-sm-4">
          <label className="form-label obrigatorio" htmlFor="bloqueio-data-fim">
            Até
          </label>
          <input
            id="bloqueio-data-fim"
            name="bloqueio-data-fim"
            type="date"
            className={`form-control${datasInvalidas ? ' is-invalid' : ''}`}
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
          {datasInvalidas && (
            <div className="invalid-feedback d-block">A data final não pode ser anterior.</div>
          )}
        </div>

        <div className="col-6 col-sm-6">
          <label className="form-label obrigatorio" htmlFor="bloqueio-inicio">
            Início
          </label>
          <input
            id="bloqueio-inicio"
            type="time"
            className="form-control"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
          />
        </div>

        <div className="col-6 col-sm-6">
          <label className="form-label obrigatorio" htmlFor="bloqueio-fim">
            Fim
          </label>
          <input
            id="bloqueio-fim"
            type="time"
            className={`form-control${intervaloInvalido ? ' is-invalid' : ''}`}
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
          />
          {intervaloInvalido && (
            <div className="invalid-feedback d-block">O fim deve ser maior que o início.</div>
          )}
        </div>

        <div className="col-12">
          <label className="form-label obrigatorio" htmlFor="bloqueio-motivo">
            Motivo
          </label>
          <select
            id="bloqueio-motivo"
            className="form-select"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          >
            {MOTIVOS_BLOQUEIO.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {conflitos.length > 0 && (
          <div className="col-12">
            <div className="alert alert-warning mb-0" role="alert">
              <p className="fw-semibold mb-2">
                <i className="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>
                Existem {conflitos.length} agendamento(s) neste período
              </p>
              <ul className="mb-2 ps-3 small">
                {conflitos.map((c) => (
                  <li key={c.id}>
                    {formatarData(c.data)} às {c.hora} — {c.paciente?.nome}
                  </li>
                ))}
              </ul>
              <p className="mb-0 small">
                Transfira ou cancele esses atendimentos antes de indisponibilizar o período.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
