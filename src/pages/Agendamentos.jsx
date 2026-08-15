import { PageHeader } from '../components/ui/PageHeader.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'

export function Agendamentos() {
  return (
    <>
      <PageHeader
        titulo="Agendamentos"
        descricao="Consulta de pacientes agendados e atendidos, com os dados do agendamento, do médico e da cobrança."
      />

      <div className="card">
        <div className="card-body">
          <EmptyState
            icone="bi-clipboard2-pulse"
            titulo="Consulta em construção"
            descricao="Aqui ficarão os filtros por período, médico e situação, e a tabela de resultados."
          />
        </div>
      </div>
    </>
  )
}
