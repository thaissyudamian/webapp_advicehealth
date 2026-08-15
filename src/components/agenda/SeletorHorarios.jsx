import './agenda.css'

/* Escolha de horário em fichas, no lugar de uma lista suspensa.

   A lista suspensa esconde a disponibilidade: o usuário só descobre que o
   horário está ocupado depois de tentar salvar. Com as fichas visíveis, os
   horários indisponíveis aparecem esmaecidos e não são clicáveis — o conflito
   deixa de ser validação e passa a ser prevenção.

   horarios — saída de horariosDoMedico: { hora, tipo, agendamento?, bloqueio? }
   ignorar  — hora que deve continuar selecionável mesmo ocupada; usado na
              edição, para o agendamento não bloquear o próprio horário */

const INDISPONIVEIS = {
  ocupado: 'Ocupado',
  bloqueado: 'Médico indisponível',
  almoco: 'Intervalo',
}

export function SeletorHorarios({ id, horarios, valor, aoSelecionar, ignorar, erro }) {
  if (horarios.length === 0) {
    return <p className="text-secondary small mb-0">Selecione um médico e uma data.</p>
  }

  const temIndisponivel = horarios.some((h) => h.tipo !== 'livre')

  return (
    <div>
      {/* id e tabIndex existem para o useForm conseguir trazer o foco até aqui
          quando o envio falha por falta de horário: o alvo é o grupo, já que
          não há um <input> único a focar. */}
      <div
        id={id}
        tabIndex={-1}
        className="agenda-horarios"
        role="group"
        aria-label="Horários disponíveis"
      >
        {horarios.map((horario) => {
          const proprio = ignorar && horario.hora === ignorar
          const disponivel = horario.tipo === 'livre' || proprio
          const selecionado = horario.hora === valor

          return (
            <button
              key={horario.hora}
              type="button"
              className={`agenda-horario${selecionado ? ' selecionado' : ''}${disponivel ? '' : ' indisponivel'}`}
              disabled={!disponivel}
              aria-pressed={selecionado}
              title={disponivel ? undefined : INDISPONIVEIS[horario.tipo]}
              onClick={() => aoSelecionar(horario.hora)}
            >
              {horario.hora}
            </button>
          )
        })}
      </div>

      {temIndisponivel && (
        <p className="form-text mt-2 mb-0">
          <i className="bi bi-info-circle me-1" aria-hidden="true"></i>
          Horários esmaecidos já estão ocupados ou indisponíveis.
        </p>
      )}

      {erro && <div className="invalid-feedback d-block">{erro}</div>}
    </div>
  )
}
