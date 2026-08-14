/* Tela provisória de verificação do tema.
   Reúne os componentes do Bootstrap que trazem a cor primária fixa no CSS
   compilado, para conferir de uma vez se as correções do theme.css pegaram.
   Será substituída pelas rotas na etapa de layout. */
function App() {
  return (
    <main className="container py-5">
      <h1 className="h3 mb-4">Verificação do tema</h1>

      <div className="card">
        <div className="card-body d-flex flex-column gap-4">
          <section>
            <h2 className="h6 text-uppercase text-secondary">Botões</h2>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary">
                Novo agendamento
              </button>
              <button type="button" className="btn btn-outline-primary">
                Transferir
              </button>
              <button type="button" className="btn btn-link">
                Cancelar
              </button>
            </div>
          </section>

          <section>
            <h2 className="h6 text-uppercase text-secondary">Formulário</h2>
            <div className="row g-3">
              <div className="col-sm-6">
                <label htmlFor="paciente" className="form-label obrigatorio">
                  Nome do paciente
                </label>
                <input
                  type="text"
                  id="paciente"
                  className="form-control"
                  placeholder="Clique para ver o foco"
                />
              </div>
              <div className="col-sm-6">
                <label htmlFor="medico" className="form-label">
                  Médico
                </label>
                <select id="medico" className="form-select">
                  <option>Selecione</option>
                </select>
              </div>
            </div>
            <div className="form-check mt-3">
              <input
                type="checkbox"
                id="confirmado"
                className="form-check-input"
                defaultChecked
              />
              <label htmlFor="confirmado" className="form-check-label">
                Paciente confirmou presença
              </label>
            </div>
          </section>

          <section>
            <h2 className="h6 text-uppercase text-secondary">
              Navegação e progresso
            </h2>
            <ul className="nav nav-pills mb-3">
              <li className="nav-item">
                <a className="nav-link active" href="#agendados">
                  Agendados
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#atendidos">
                  Atendidos
                </a>
              </li>
            </ul>
            <div className="progress" role="progressbar" aria-label="Ocupação da agenda" aria-valuenow={68} aria-valuemin={0} aria-valuemax={100}>
              <div className="progress-bar" style={{ width: '68%' }}>
                68%
              </div>
            </div>
          </section>

          <section>
            <h2 className="h6 text-uppercase text-secondary">Ícones e links</h2>
            <p className="mb-0">
              <i className="bi bi-calendar-check me-2" aria-hidden="true"></i>
              <a href="#agenda">Ir para a agenda do dia</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
