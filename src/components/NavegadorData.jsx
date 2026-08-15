import { ehHoje, hojeISO, somarDias } from '../domain/format.js'

/* Navegação entre dias: anterior, hoje, próximo e escolha direta.

   Mora em components/ e não em components/ui/ porque depende dos utilitários
   de data do domínio — a regra é que ui/ fique livre desse acoplamento.

   Usado pelo painel e pela agenda: as duas telas mostram um dia por vez e
   precisam da mesma forma de trocar de dia. */

export function NavegadorData({ data, aoMudar, rotulo = 'Data', className = '' }) {
  return (
    <div className={`d-flex flex-wrap align-items-center gap-2 ${className}`}>
      <div className="btn-group" role="group" aria-label="Navegar entre os dias">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => aoMudar(somarDias(data, -1))}
          aria-label="Dia anterior"
        >
          <i className="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => aoMudar(hojeISO())}
          disabled={ehHoje(data)}
        >
          Hoje
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => aoMudar(somarDias(data, 1))}
          aria-label="Próximo dia"
        >
          <i className="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>

      <label className="visually-hidden" htmlFor="navegador-data">
        {rotulo}
      </label>
      <input
        id="navegador-data"
        type="date"
        className="form-control w-auto"
        value={data}
        onChange={(evento) => evento.target.value && aoMudar(evento.target.value)}
      />
    </div>
  )
}
