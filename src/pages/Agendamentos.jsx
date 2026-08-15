export function Agendamentos() {
  return (
    <>
      <div className="mb-4">
        <h1 className="h4 mb-1">Agendamentos</h1>
        <p className="text-secondary mb-0">
          Consulta de pacientes agendados e atendidos, com os dados do agendamento, do médico e da
          cobrança.
        </p>
      </div>

      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-clipboard2-pulse fs-1 text-secondary" aria-hidden="true"></i>
          <p className="text-secondary mt-3 mb-0">Consulta em construção.</p>
        </div>
      </div>
    </>
  )
}
