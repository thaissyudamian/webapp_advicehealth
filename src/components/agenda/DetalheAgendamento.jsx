import { useState } from 'react'

import { useClinica } from '../../store/clinicContext.js'
import { useToast } from '../../hooks/toastContext.js'
import { PAGAMENTO_INFO, STATUS, STATUS_INFO, proximosStatus } from '../../domain/constants.js'
import { formatarCPF, formatarData, formatarMoeda, formatarTelefone } from '../../domain/format.js'

import { Modal } from '../ui/Modal.jsx'
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx'
import { Badge } from '../ui/Badge.jsx'

/* Detalhe do agendamento e as ações possíveis sobre ele.

   As ações oferecidas vêm de proximosStatus(): a máquina de estados do domínio
   decide o que pode acontecer, e a tela apenas desenha o que ela permite. Um
   agendamento cancelado não mostra "registrar chegada" porque a regra diz que
   essa transição não existe — não porque alguém lembrou de escrever um if. */

const ACOES = {
  [STATUS.CONFIRMADO]: { rotulo: 'Confirmar presença', icone: 'bi-check-circle' },
  [STATUS.AGUARDANDO]: { rotulo: 'Registrar chegada', icone: 'bi-person-check' },
  [STATUS.EM_ATENDIMENTO]: { rotulo: 'Iniciar atendimento', icone: 'bi-play-circle' },
  [STATUS.ATENDIDO]: { rotulo: 'Concluir atendimento', icone: 'bi-check2-all' },
  [STATUS.FALTOU]: { rotulo: 'Registrar falta', icone: 'bi-exclamation-triangle' },
}

export function DetalheAgendamento({ aberto, agendamento, aoFechar, aoAlterar, aoTransferir }) {
  const clinica = useClinica()
  const toast = useToast()
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [processando, setProcessando] = useState(false)

  if (!agendamento) return null

  const situacao = STATUS_INFO[agendamento.status]
  const pagamento = PAGAMENTO_INFO[agendamento.pagamento.status]
  const liquido = agendamento.pagamento.valor - agendamento.pagamento.desconto

  const transicoes = proximosStatus(agendamento.status).filter((s) => s !== STATUS.CANCELADO)
  const podeCancelar = proximosStatus(agendamento.status).includes(STATUS.CANCELADO)

  const mudarStatus = async (status) => {
    setProcessando(true)
    try {
      await clinica.alterarStatus(agendamento.id, status)
      toast.sucesso(`Situação alterada para ${STATUS_INFO[status].rotulo.toLowerCase()}.`)
      aoFechar()
    } catch {
      toast.erro('Não foi possível alterar a situação.')
    } finally {
      setProcessando(false)
    }
  }

  const cancelar = async () => {
    setProcessando(true)
    try {
      await clinica.alterarStatus(agendamento.id, STATUS.CANCELADO, motivoCancelamento || 'Sem motivo informado')
      toast.sucesso('Agendamento cancelado.')
      setConfirmandoCancelamento(false)
      aoFechar()
    } catch {
      toast.erro('Não foi possível cancelar o agendamento.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <>
      <Modal
        aberto={aberto && !confirmandoCancelamento}
        titulo={agendamento.paciente?.nome ?? 'Agendamento'}
        aoFechar={aoFechar}
        rodape={
          <div className="d-flex flex-wrap gap-2 w-100">
            {podeCancelar && (
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => setConfirmandoCancelamento(true)}
                disabled={processando}
              >
                <i className="bi bi-x-circle me-1" aria-hidden="true"></i>
                Cancelar agendamento
              </button>
            )}
            <div className="ms-auto d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-light" onClick={aoTransferir} disabled={processando}>
                <i className="bi bi-arrow-left-right me-1" aria-hidden="true"></i>
                Transferir
              </button>
              <button type="button" className="btn btn-outline-primary" onClick={aoAlterar} disabled={processando}>
                <i className="bi bi-pencil me-1" aria-hidden="true"></i>
                Alterar
              </button>
            </div>
          </div>
        }
      >
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Badge rotulo={situacao.rotulo} cor={situacao.cor} icone={situacao.icone} />
          <Badge rotulo={pagamento.rotulo} cor={pagamento.cor} />
        </div>

        <dl className="row g-2 mb-3 small">
          <dt className="col-4 col-sm-3 text-secondary fw-normal">Data e hora</dt>
          <dd className="col-8 col-sm-9 mb-0">
            {formatarData(agendamento.data)} às {agendamento.hora} · {agendamento.duracao} min
          </dd>

          <dt className="col-4 col-sm-3 text-secondary fw-normal">Médico</dt>
          <dd className="col-8 col-sm-9 mb-0">
            {agendamento.medico?.nome} — {agendamento.medico?.especialidade}
          </dd>

          <dt className="col-4 col-sm-3 text-secondary fw-normal">CPF</dt>
          <dd className="col-8 col-sm-9 mb-0">{formatarCPF(agendamento.paciente?.cpf)}</dd>

          <dt className="col-4 col-sm-3 text-secondary fw-normal">Telefone</dt>
          <dd className="col-8 col-sm-9 mb-0">{formatarTelefone(agendamento.paciente?.telefone)}</dd>

          <dt className="col-4 col-sm-3 text-secondary fw-normal">Convênio</dt>
          <dd className="col-8 col-sm-9 mb-0">{agendamento.paciente?.convenio}</dd>

          <dt className="col-4 col-sm-3 text-secondary fw-normal">Valor</dt>
          <dd className="col-8 col-sm-9 mb-0">
            {formatarMoeda(liquido)}
            {agendamento.pagamento.desconto > 0 && (
              <span className="text-secondary">
                {' '}
                (desconto de {formatarMoeda(agendamento.pagamento.desconto)})
              </span>
            )}
          </dd>

          {agendamento.observacoes && (
            <>
              <dt className="col-4 col-sm-3 text-secondary fw-normal">Observações</dt>
              <dd className="col-8 col-sm-9 mb-0">{agendamento.observacoes}</dd>
            </>
          )}
        </dl>

        {transicoes.length > 0 && (
          <>
            <p className="text-secondary small text-uppercase fw-semibold mb-2">Próximo passo</p>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {transicoes.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => mudarStatus(status)}
                  disabled={processando}
                >
                  <i className={`bi ${ACOES[status]?.icone} me-1`} aria-hidden="true"></i>
                  {ACOES[status]?.rotulo ?? STATUS_INFO[status].rotulo}
                </button>
              ))}
            </div>
          </>
        )}

        {agendamento.historico?.length > 0 && (
          <details>
            <summary className="text-secondary small">
              Histórico ({agendamento.historico.length})
            </summary>
            <ul className="list-unstyled small mt-2 mb-0 d-flex flex-column gap-1">
              {agendamento.historico.map((item, indice) => (
                <li key={indice} className="text-secondary">
                  <i className="bi bi-dot" aria-hidden="true"></i>
                  {item.acao}
                  {item.detalhe ? ` — ${item.detalhe}` : ''}
                </li>
              ))}
            </ul>
          </details>
        )}
      </Modal>

      <ConfirmDialog
        aberto={confirmandoCancelamento}
        titulo="Cancelar agendamento"
        mensagem={`O agendamento de ${agendamento.paciente?.nome} em ${formatarData(agendamento.data)} às ${agendamento.hora} será cancelado.`}
        detalhe="O registro continua consultável e o horário volta a ficar disponível."
        textoConfirmar="Cancelar agendamento"
        textoCancelar="Voltar"
        processando={processando}
        aoConfirmar={cancelar}
        aoCancelar={() => setConfirmandoCancelamento(false)}
      >
        <div className="mt-3">
          <label className="form-label" htmlFor="motivo-cancelamento">
            Motivo do cancelamento
          </label>
          <input
            id="motivo-cancelamento"
            className="form-control"
            value={motivoCancelamento}
            onChange={(e) => setMotivoCancelamento(e.target.value)}
            placeholder="Fica registrado no histórico"
          />
        </div>
      </ConfirmDialog>
    </>
  )
}
