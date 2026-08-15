import { useEffect, useMemo, useState } from 'react'

import { useClinica } from '../../store/clinicContext.js'
import { useToast } from '../../hooks/toastContext.js'
import { horariosDoMedico } from '../../domain/selectors.js'
import { formatarData } from '../../domain/format.js'

import { Modal } from '../ui/Modal.jsx'
import { SeletorHorarios } from './SeletorHorarios.jsx'
import './agenda.css'

/* Transferência de agendamento: troca de médico, de data ou de horário.

   Operação própria, e não "editar e mudar o campo", por dois motivos: o
   destino precisa ser validado contra a agenda de quem recebe, e a troca fica
   registrada no histórico com o motivo — em cobrança de saúde, saber quem
   mudou o quê importa. */

export function TransferirModal({ aberto, agendamento, aoFechar }) {
  const clinica = useClinica()
  const toast = useToast()

  const [medicoId, setMedicoId] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!aberto || !agendamento) return
    setMedicoId(agendamento.medicoId)
    setData(agendamento.data)
    setHora('')
    setMotivo('')
  }, [aberto, agendamento])

  const horarios = useMemo(
    () => (medicoId && data ? horariosDoMedico(clinica, medicoId, data) : []),
    [clinica, medicoId, data]
  )

  if (!agendamento) return null

  const mesmoDestino =
    medicoId === agendamento.medicoId && data === agendamento.data && hora === agendamento.hora

  const confirmar = async () => {
    if (!hora) {
      toast.aviso('Selecione o novo horário.')
      return
    }
    setEnviando(true)
    try {
      const origem = clinica.medicos.find((m) => m.id === agendamento.medicoId)
      const destino = clinica.medicos.find((m) => m.id === medicoId)

      await clinica.salvarAgendamento(
        { ...agendamento, medicoId, data, hora },
        {
          acao: `Transferido de ${origem?.nome} em ${formatarData(agendamento.data)} ${agendamento.hora} para ${destino?.nome} em ${formatarData(data)} ${hora}${motivo ? ` — ${motivo}` : ''}`,
        }
      )
      toast.sucesso(`Transferido para ${formatarData(data)} às ${hora}.`)
      aoFechar()
    } catch {
      toast.erro('Não foi possível transferir o agendamento.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Transferir agendamento"
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
            disabled={enviando || !hora || mesmoDestino}
          >
            {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            Confirmar transferência
          </button>
        </>
      }
    >
      <div className="alert alert-light border" role="note">
        <p className="mb-1 fw-semibold">{agendamento.paciente?.nome}</p>
        <p className="mb-0 small text-secondary">
          Hoje em {agendamento.medico?.nome} · {formatarData(agendamento.data)} às {agendamento.hora}
        </p>
      </div>

      <div className="row g-3">
        <div className="col-12 col-sm-7">
          <label className="form-label obrigatorio" htmlFor="transferir-medico">
            Novo médico
          </label>
          <select
            id="transferir-medico"
            className="form-select"
            value={medicoId}
            onChange={(e) => {
              setMedicoId(e.target.value)
              setHora('')
            }}
          >
            {clinica.medicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} — {m.especialidade}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-sm-5">
          <label className="form-label obrigatorio" htmlFor="transferir-data">
            Nova data
          </label>
          <input
            id="transferir-data"
            type="date"
            className="form-control"
            value={data}
            onChange={(e) => {
              setData(e.target.value)
              setHora('')
            }}
          />
        </div>

        <div className="col-12">
          <span className="form-label obrigatorio d-block">Novo horário</span>
          <SeletorHorarios horarios={horarios} valor={hora} aoSelecionar={setHora} />
        </div>

        <div className="col-12">
          <label className="form-label" htmlFor="transferir-motivo">
            Motivo da transferência
          </label>
          <textarea
            id="transferir-motivo"
            className="form-control"
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Fica registrado no histórico do agendamento"
          />
        </div>
      </div>
    </Modal>
  )
}
