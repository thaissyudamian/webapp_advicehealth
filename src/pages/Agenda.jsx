import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useClinica } from '../store/clinicContext.js'
import { useToast } from '../hooks/toastContext.js'
import { bloqueiosDaData, comRelacionados } from '../domain/selectors.js'
import { ehHoje, formatarDataExtenso, hojeISO, somarDias } from '../domain/format.js'

import { PageHeader } from '../components/ui/PageHeader.jsx'
import { GradeAgenda } from '../components/agenda/GradeAgenda.jsx'
import { AgendamentoModal } from '../components/agenda/AgendamentoModal.jsx'
import { TransferirModal } from '../components/agenda/TransferirModal.jsx'
import { BloqueioModal } from '../components/agenda/BloqueioModal.jsx'
import { DetalheAgendamento } from '../components/agenda/DetalheAgendamento.jsx'

/* Agenda do dia.

   A data fica na URL (?data=AAAA-MM-DD) em vez de só no estado do componente:
   permite recarregar sem perder o dia, mandar o link de um dia específico e
   voltar pelo botão do navegador. É o que justificou o BrowserRouter. */

export function Agenda() {
  const clinica = useClinica()
  const toast = useToast()
  const [parametros, setParametros] = useSearchParams()

  const data = parametros.get('data') ?? hojeISO()

  const [novo, setNovo] = useState(null) // { medicoId, hora } ao clicar numa faixa livre
  const [selecionado, setSelecionado] = useState(null)
  const [editando, setEditando] = useState(null)
  const [transferindo, setTransferindo] = useState(null)
  const [bloqueando, setBloqueando] = useState(false)

  const irPara = (novaData) => setParametros(novaData === hojeISO() ? {} : { data: novaData })

  const bloqueios = bloqueiosDaData(clinica, data)

  // O agendamento aberto é relido do estado a cada render: assim, mudar a
  // situação atualiza o que está na tela sem precisar fechar e reabrir.
  const agendamentoAberto = selecionado
    ? comRelacionados(clinica, clinica.agendamentos.find((a) => a.id === selecionado))
    : null

  const removerBloqueio = async (bloqueio) => {
    try {
      await clinica.removerBloqueio(bloqueio.id)
      toast.sucesso('Período liberado.')
    } catch {
      toast.erro('Não foi possível liberar o período.')
    }
  }

  return (
    <>
      <PageHeader titulo="Agenda" descricao={formatarDataExtenso(data)}>
        <button type="button" className="btn btn-outline-secondary" onClick={() => setBloqueando(true)}>
          <i className="bi bi-slash-circle me-1" aria-hidden="true"></i>
          Indisponibilizar período
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setNovo({})}>
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
          Novo agendamento
        </button>
      </PageHeader>

      <div className="card mb-3">
        <div className="card-body d-flex flex-wrap align-items-center gap-2">
          <div className="btn-group" role="group" aria-label="Navegar entre os dias">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => irPara(somarDias(data, -1))}
              aria-label="Dia anterior"
            >
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => irPara(hojeISO())}
              disabled={ehHoje(data)}
            >
              Hoje
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => irPara(somarDias(data, 1))}
              aria-label="Próximo dia"
            >
              <i className="bi bi-chevron-right" aria-hidden="true"></i>
            </button>
          </div>

          <label className="visually-hidden" htmlFor="agenda-data">
            Data da agenda
          </label>
          <input
            id="agenda-data"
            type="date"
            className="form-control w-auto"
            value={data}
            onChange={(evento) => irPara(evento.target.value)}
          />

          {bloqueios.length > 0 && (
            <div className="d-flex flex-wrap gap-2 ms-auto">
              {bloqueios.map((bloqueio) => {
                const medico = clinica.medicos.find((m) => m.id === bloqueio.medicoId)
                return (
                  <span key={bloqueio.id} className="badge text-bg-light border d-flex align-items-center gap-2">
                    <i className="bi bi-slash-circle" aria-hidden="true"></i>
                    {medico?.nome}: {bloqueio.horaInicio}–{bloqueio.horaFim} ({bloqueio.motivo})
                    <button
                      type="button"
                      className="btn-close btn-close-sm"
                      onClick={() => removerBloqueio(bloqueio)}
                      aria-label={`Liberar período de ${medico?.nome}`}
                    ></button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <GradeAgenda
        data={data}
        aoClicarLivre={({ medicoId, hora }) => setNovo({ medicoId, hora })}
        aoClicarAgendamento={(agendamento) => setSelecionado(agendamento.id)}
      />

      <AgendamentoModal
        aberto={Boolean(novo) || Boolean(editando)}
        agendamento={editando}
        inicial={novo ? { ...novo, data } : null}
        aoFechar={() => {
          setNovo(null)
          setEditando(null)
          setSelecionado(null)
        }}
      />

      <DetalheAgendamento
        aberto={Boolean(agendamentoAberto) && !editando && !transferindo}
        agendamento={agendamentoAberto}
        aoFechar={() => setSelecionado(null)}
        aoAlterar={() => setEditando(agendamentoAberto)}
        aoTransferir={() => setTransferindo(agendamentoAberto)}
      />

      <TransferirModal
        aberto={Boolean(transferindo)}
        agendamento={transferindo}
        aoFechar={() => {
          setTransferindo(null)
          setSelecionado(null)
        }}
      />

      <BloqueioModal
        aberto={bloqueando}
        dataInicial={data}
        aoFechar={() => setBloqueando(false)}
      />
    </>
  )
}
