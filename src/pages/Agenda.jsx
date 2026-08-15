import { PageHeader } from '../components/ui/PageHeader.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'

export function Agenda() {
  return (
    <>
      <PageHeader
        titulo="Agenda"
        descricao="Grade de horários dos médicos, com inclusão, alteração, transferência e bloqueio de períodos."
      />

      <div className="card">
        <div className="card-body">
          <EmptyState
            icone="bi-calendar3"
            titulo="Grade em construção"
            descricao="Aqui ficará a agenda do dia, com uma coluna por médico."
          />
        </div>
      </div>
    </>
  )
}
