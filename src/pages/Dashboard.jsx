/* Versão inicial da área de trabalho.
   Os números já saem dos selectors; a etapa do Dashboard troca os cartões e a
   lista pelos componentes reaproveitáveis e acrescenta avisos e lembretes. */

import { useClinica } from '../store/clinicContext.js'
import { agendamentosDaData, resumoDoDia } from '../domain/selectors.js'
import { PAGAMENTO_INFO, STATUS_INFO } from '../domain/constants.js'
import { formatarMoeda, hojeISO } from '../domain/format.js'

export function Dashboard() {
  const clinica = useClinica()
  const hoje = hojeISO()
  const resumo = resumoDoDia(clinica, hoje)
  const agenda = agendamentosDaData(clinica, hoje)

  const indicadores = [
    { rotulo: 'Agendamentos do dia', valor: resumo.agendamentos, icone: 'bi-calendar3' },
    { rotulo: 'Pacientes atendidos', valor: resumo.atendidos, icone: 'bi-check2-circle' },
    { rotulo: 'Faturamento do dia', valor: formatarMoeda(resumo.faturamento), icone: 'bi-cash-coin' },
    { rotulo: 'A receber', valor: formatarMoeda(resumo.aReceber), icone: 'bi-hourglass-split' },
  ]

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <h1 className="h4 mb-1">Área de trabalho</h1>
          <p className="text-secondary mb-0">Visão geral do consultório hoje.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={clinica.restaurarExemplo}
        >
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
          Restaurar dados de exemplo
        </button>
      </div>

      <section className="row g-3 mb-4" aria-label="Indicadores do dia">
        {indicadores.map((item) => (
          <div className="col-6 col-xl-3" key={item.rotulo}>
            <div className="card h-100">
              <div className="card-body d-flex align-items-start gap-3">
                <span className="app-avatar" aria-hidden="true">
                  <i className={`bi ${item.icone}`}></i>
                </span>
                <div>
                  <p className="text-secondary small mb-1">{item.rotulo}</p>
                  <p className="h4 mb-0">{item.valor}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-body">
          <h2 className="h6 mb-3">Agenda do dia</h2>
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
                {agenda.map((item) => (
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
                    <td style={{ color: STATUS_INFO[item.status].cor }}>
                      {STATUS_INFO[item.status].rotulo}
                    </td>
                    <td style={{ color: PAGAMENTO_INFO[item.pagamento.status].cor }}>
                      {PAGAMENTO_INFO[item.pagamento.status].rotulo}
                    </td>
                    <td className="text-end">
                      {formatarMoeda(item.pagamento.valor - item.pagamento.desconto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  )
}
