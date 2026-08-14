/* Tela provisória de verificação do domínio e do estado global.
   Será substituída pelas rotas na etapa de layout. */

import { useClinica } from './store/clinicContext.js'
import { agendamentosDaData, resumoDoDia } from './domain/selectors.js'
import { STATUS_INFO, PAGAMENTO_INFO } from './domain/constants.js'
import {
  formatarCPF,
  formatarDataExtenso,
  formatarMoeda,
  hojeISO,
} from './domain/format.js'

function App() {
  const clinica = useClinica()
  const hoje = hojeISO()

  if (clinica.carregando) {
    return (
      <main className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando dados do consultório…</span>
        </div>
      </main>
    )
  }

  if (clinica.erro) {
    return (
      <main className="container py-5">
        <div className="alert alert-danger" role="alert">
          Não foi possível carregar os dados: {clinica.erro}
        </div>
      </main>
    )
  }

  const resumo = resumoDoDia(clinica, hoje)
  const agenda = agendamentosDaData(clinica, hoje)

  return (
    <main className="container py-4">
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 mb-0">Verificação do domínio</h1>
          <p className="text-secondary mb-0 text-capitalize">{formatarDataExtenso(hoje)}</p>
        </div>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={clinica.restaurarExemplo}>
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
          Restaurar dados de exemplo
        </button>
      </header>

      <section className="row g-3 mb-4" aria-label="Resumo do dia">
        {[
          { rotulo: 'Agendamentos do dia', valor: resumo.agendamentos },
          { rotulo: 'Atendidos', valor: resumo.atendidos },
          { rotulo: 'Faturamento', valor: formatarMoeda(resumo.faturamento) },
          { rotulo: 'A receber', valor: formatarMoeda(resumo.aReceber) },
        ].map((item) => (
          <div className="col-6 col-lg-3" key={item.rotulo}>
            <div className="card h-100">
              <div className="card-body">
                <p className="text-secondary small mb-1">{item.rotulo}</p>
                <p className="h4 mb-0">{item.valor}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-body">
          <h2 className="h6 mb-3">Agenda de hoje ({agenda.length})</h2>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Hora</th>
                  <th scope="col">Paciente</th>
                  <th scope="col">CPF</th>
                  <th scope="col">Médico</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Pagamento</th>
                  <th scope="col" className="text-end">Valor</th>
                </tr>
              </thead>
              <tbody>
                {agenda.map((item) => (
                  <tr key={item.id}>
                    <td>{item.hora}</td>
                    <td>{item.paciente?.nome}</td>
                    <td>{formatarCPF(item.paciente?.cpf)}</td>
                    <td>
                      <span
                        className="d-inline-block rounded-circle me-2"
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
                    <td className="text-end">{formatarMoeda(item.pagamento.valor - item.pagamento.desconto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
