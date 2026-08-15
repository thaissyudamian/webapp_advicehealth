/* Área de trabalho: visão do dia para quem opera a recepção. */

import { useState } from 'react'

import { useClinica } from '../store/clinicContext.js'
import { useToast } from '../hooks/toastContext.js'
import { agendamentosDaData, proximoHorarioLivre, resumoDoDia } from '../domain/selectors.js'
import { PAGAMENTO_INFO, STATUS_INFO } from '../domain/constants.js'
import { ehHoje, formatarDataExtenso, formatarMoeda, horaAtual, hojeISO, primeiroNome } from '../domain/format.js'

import { PageHeader } from '../components/ui/PageHeader.jsx'
import { StatCard } from '../components/ui/StatCard.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { PainelAvisos } from '../components/PainelAvisos.jsx'
import { AgendamentoModal } from '../components/agenda/AgendamentoModal.jsx'

export function Dashboard() {
  const clinica = useClinica()
  const toast = useToast()
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [agendando, setAgendando] = useState(false)

  const hoje = hojeISO()
  const resumo = resumoDoDia(clinica, hoje)
  const agenda = agendamentosDaData(clinica, hoje)

  // Só faz sentido oferecer horário que ainda não passou.
  const proximoLivre = proximoHorarioLivre(clinica, hoje, {
    aPartirDe: ehHoje(hoje) ? horaAtual() : null,
  })

  const restaurar = async () => {
    setRestaurando(true)
    try {
      await clinica.restaurarExemplo()
      toast.sucesso('Dados de exemplo restaurados.')
      setConfirmandoRestauracao(false)
    } catch {
      toast.erro('Não foi possível restaurar os dados.')
    } finally {
      setRestaurando(false)
    }
  }

  const indicadores = [
    {
      rotulo: 'Agendamentos hoje',
      valor: resumo.agendamentos,
      icone: 'bi-calendar3',
      detalhe: resumo.cancelados > 0 ? `${resumo.cancelados} cancelado(s)` : null,
    },
    {
      rotulo: 'Pacientes atendidos',
      valor: resumo.atendidos,
      icone: 'bi-people',
      cor: 'var(--ah-status-atendido)',
      detalhe: resumo.aguardando > 0 ? `${resumo.aguardando} na recepção` : null,
    },
    {
      rotulo: 'Faturamento do dia',
      valor: formatarMoeda(resumo.faturamento),
      icone: 'bi-currency-dollar',
      cor: 'var(--ah-pagamento-pago)',
      detalhe: resumo.aReceber > 0 ? `${formatarMoeda(resumo.aReceber)} a receber` : null,
    },
    {
      rotulo: 'Próximo horário livre',
      valor: proximoLivre?.hora ?? '—',
      icone: 'bi-clock',
      cor: 'var(--ah-status-confirmado)',
      detalhe: proximoLivre ? primeiroNome(proximoLivre.medico.nome.replace(/^Dra?\.\s*/, '')) : 'Sem vagas hoje',
    },
  ]

  return (
    <>
      <PageHeader titulo="Painel do consultório" descricao={formatarDataExtenso(hoje)}>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setConfirmandoRestauracao(true)}
        >
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
          Restaurar exemplo
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setAgendando(true)}>
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
          Novo agendamento
        </button>
      </PageHeader>

      <section className="row g-4 mb-4" aria-label="Indicadores do dia">
        {indicadores.map((item) => (
          <div className="col-6 col-xl-3" key={item.rotulo}>
            <StatCard {...item} plano />
          </div>
        ))}
      </section>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <section className="card h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Agenda de hoje</h2>

              {agenda.length === 0 ? (
                <EmptyState
                  icone="bi-calendar3"
                  titulo="Nenhum agendamento para hoje"
                  descricao="Os agendamentos criados na agenda aparecem aqui."
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th scope="col">Hora</th>
                        <th scope="col">Paciente</th>
                        <th scope="col">Médico</th>
                        <th scope="col">Situação</th>
                        <th scope="col">Pagamento</th>
                        <th scope="col" className="text-end">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agenda.map((item) => {
                        const situacao = STATUS_INFO[item.status]
                        const pagamento = PAGAMENTO_INFO[item.pagamento.status]
                        return (
                          <tr key={item.id}>
                            <td className="font-monospace">{item.hora}</td>
                            <td>{item.paciente?.nome}</td>
                            <td>
                              <span
                                className="d-inline-block rounded-circle me-2 align-middle"
                                style={{ width: 10, height: 10, backgroundColor: item.medico?.cor }}
                                aria-hidden="true"
                              />
                              {item.medico?.nome}
                            </td>
                            <td>
                              <Badge rotulo={situacao.rotulo} cor={situacao.cor} icone={situacao.icone} />
                            </td>
                            <td>
                              <Badge rotulo={pagamento.rotulo} cor={pagamento.cor} />
                            </td>
                            <td className="text-end">
                              {formatarMoeda(item.pagamento.valor - item.pagamento.desconto)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-4">
          <PainelAvisos />
        </div>
      </div>

      {/* Mesmo formulário usado na agenda. Agendar é a ação mais frequente da
          recepção, e obrigar a trocar de tela antes só acrescenta um passo. */}
      <AgendamentoModal
        aberto={agendando}
        inicial={{ data: hoje }}
        aoFechar={() => setAgendando(false)}
      />

      <ConfirmDialog
        aberto={confirmandoRestauracao}
        titulo="Restaurar dados de exemplo"
        mensagem="Todos os agendamentos, pacientes e bloqueios criados serão substituídos pela massa de exemplo."
        detalhe="Esta ação não pode ser desfeita."
        textoConfirmar="Restaurar"
        processando={restaurando}
        aoConfirmar={restaurar}
        aoCancelar={() => setConfirmandoRestauracao(false)}
      />
    </>
  )
}
