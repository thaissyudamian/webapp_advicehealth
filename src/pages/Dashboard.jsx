/* Área de trabalho: visão do dia para quem opera a recepção. */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

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
import { NavegadorData } from '../components/NavegadorData.jsx'
import { AgendamentoModal } from '../components/agenda/AgendamentoModal.jsx'

export function Dashboard() {
  const clinica = useClinica()
  const toast = useToast()
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [agendando, setAgendando] = useState(false)

  const [parametros, setParametros] = useSearchParams()

  /* A data fica na URL, como na agenda: permite abrir o painel de um dia
     específico e é o que faz o botão voltar do navegador funcionar. */
  const data = parametros.get('data') ?? hojeISO()
  const irPara = (nova) => setParametros(nova === hojeISO() ? {} : { data: nova })

  const resumo = resumoDoDia(clinica, data)
  const agenda = agendamentosDaData(clinica, data)

  // Em dias futuros o expediente inteiro está disponível; só faz sentido
  // descartar horários já passados quando o dia mostrado é o de hoje.
  const proximoLivre = proximoHorarioLivre(clinica, data, {
    aPartirDe: ehHoje(data) ? horaAtual() : null,
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
      rotulo: 'Agendamentos do dia',
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
      detalhe: proximoLivre ? primeiroNome(proximoLivre.medico.nome.replace(/^Dra?\.\s*/, '')) : 'Sem vagas neste dia',
    },
  ]

  return (
    <>
      <PageHeader titulo="Painel do consultório" descricao={formatarDataExtenso(data)}>
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

      <div className="mb-4">
        <NavegadorData data={data} aoMudar={irPara} rotulo="Data do painel" />
      </div>

      <section className="row g-4 mb-4" aria-label="Indicadores do dia">
        {indicadores.map((item) => (
          <div className="col-6 col-lg-3" key={item.rotulo}>
            <StatCard {...item} plano />
          </div>
        ))}
      </section>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <section className="card h-100">
            <div className="card-body">
              <h2 className="h6 mb-3">Agenda do dia</h2>

              {agenda.length === 0 ? (
                <EmptyState
                  icone="bi-calendar3"
                  titulo="Nenhum agendamento neste dia"
                  descricao="Os agendamentos criados na agenda aparecem aqui."
                />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th scope="col">Hora</th>
                        <th scope="col">Paciente</th>
                        <th scope="col" className="d-none d-md-table-cell">Médico</th>
                        <th scope="col">Situação</th>
                        <th scope="col" className="d-none d-lg-table-cell">Pagamento</th>
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
                            <td>
                              {item.paciente?.nome}
                              {/* Em telas pequenas a coluna do médico sai da
                                  tabela; o dado reaparece aqui em vez de se
                                  perder. */}
                              <span className="d-block d-md-none small text-secondary">
                                {item.medico?.nome}
                              </span>
                            </td>
                            <td className="d-none d-md-table-cell">
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
                            <td className="d-none d-lg-table-cell">
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
          <PainelAvisos data={data} />
        </div>
      </div>

      {/* Mesmo formulário usado na agenda. Agendar é a ação mais frequente da
          recepção, e obrigar a trocar de tela antes só acrescenta um passo. */}
      <AgendamentoModal
        aberto={agendando}
        inicial={{ data }}
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
