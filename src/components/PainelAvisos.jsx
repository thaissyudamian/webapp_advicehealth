import { Link } from 'react-router-dom'

import { useClinica } from '../store/clinicContext.js'
import { avisosDaData, lembretesDoDia } from '../domain/selectors.js'
import { formatarData, hojeISO } from '../domain/format.js'
import { EmptyState } from './ui/EmptyState.jsx'
import './painelAvisos.css'

/* Avisos e lembretes da área de trabalho.

   Mora em components/ (e não em components/ui/) porque lê o estado da clínica
   e conhece o domínio — a regra é que ui/ fique livre disso.

   Duas origens, deliberadamente separadas no visual:
   - lembretes: calculados do movimento do dia, cada um com o caminho para
     resolver a pendência;
   - avisos: cadastrados por alguém, com marcação de lido. */

const CORES_AVISO = {
  alerta: { icone: 'bi-exclamation-triangle-fill', cor: 'var(--ah-status-aguardando)' },
  info: { icone: 'bi-info-circle-fill', cor: 'var(--ah-status-confirmado)' },
}

export function PainelAvisos({ data }) {
  const clinica = useClinica()
  const hoje = data ?? hojeISO()

  const lembretes = lembretesDoDia(clinica, hoje)
  const avisos = avisosDaData(clinica, hoje)
  const naoLidos = avisos.filter((aviso) => !aviso.lido).length

  return (
    <section className="card h-100">
      <div className="card-body d-flex flex-column">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="h6 mb-0">Avisos e lembretes</h2>
          {naoLidos > 0 && (
            <span className="badge rounded-pill text-bg-secondary">{naoLidos} não lido(s)</span>
          )}
        </div>

        {lembretes.length === 0 && avisos.length === 0 ? (
          <EmptyState
            icone="bi-bell"
            titulo="Nada pendente"
            descricao="Os lembretes aparecem sozinhos quando houver algo a resolver."
          />
        ) : (
          <>
            {lembretes.length > 0 && (
              <ul className="list-unstyled d-flex flex-column gap-2 mb-4">
                {lembretes.map((lembrete) => (
                  <li key={lembrete.id} className="painel-lembrete">
                    <i
                      className={`bi ${lembrete.icone}`}
                      style={{ color: lembrete.cor }}
                      aria-hidden="true"
                    ></i>
                    <span className="painel-lembrete-texto">{lembrete.texto}</span>
                    <Link className="btn btn-sm btn-outline-primary" to={lembrete.para}>
                      {lembrete.acao}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {avisos.length > 0 && (
              <>
                <p className="text-secondary text-uppercase small fw-semibold mb-2">
                  Avisos do consultório
                </p>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                  {avisos.map((aviso) => {
                    const visual = CORES_AVISO[aviso.tipo] ?? CORES_AVISO.info
                    return (
                      <li
                        key={aviso.id}
                        className={`painel-aviso${aviso.lido ? ' painel-aviso-lido' : ''}`}
                      >
                        <i
                          className={`bi ${visual.icone}`}
                          style={{ color: aviso.lido ? 'var(--ah-text-muted)' : visual.cor }}
                          aria-hidden="true"
                        ></i>
                        <div className="flex-grow-1">
                          <p className="fw-semibold mb-1">{aviso.titulo}</p>
                          <p className="mb-1 small">{aviso.texto}</p>
                          <p className="text-secondary mb-0" style={{ fontSize: 12 }}>
                            {formatarData(aviso.data)}
                          </p>
                        </div>
                        {!aviso.lido && (
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-decoration-none"
                            onClick={() => clinica.marcarAvisoLido(aviso.id)}
                          >
                            Marcar como lido
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}
