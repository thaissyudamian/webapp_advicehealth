import { NavLink } from 'react-router-dom'

import { formatarDataExtenso, hojeISO, iniciais } from '../../domain/format.js'

/* Barra superior com marca, navegação principal e identificação do usuário. */

const ITENS = [
  { para: '/', rotulo: 'Painel', icone: 'bi-columns-gap', exato: true },
  { para: '/agenda', rotulo: 'Agenda', icone: 'bi-calendar3' },
  { para: '/agendamentos', rotulo: 'Agendamentos', icone: 'bi-clipboard2-pulse' },
]

const USUARIO = 'Camila Ribeiro'

export function Topbar() {
  return (
    <header className="app-topo">
      <div className="app-topo-interno">
        <div className="app-marca">
          <span className="app-marca-simbolo" aria-hidden="true">
            <i className="bi bi-heart-pulse"></i>
          </span>
          <span className="app-marca-nome">
            Consultório
            <small>Gestão de agenda</small>
          </span>
        </div>

        <nav className="app-nav" aria-label="Navegação principal">
          {ITENS.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.exato}
              className={({ isActive }) => `app-nav-link${isActive ? ' ativo' : ''}`}
            >
              <i className={`bi ${item.icone}`} aria-hidden="true"></i>
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        <div className="app-topo-direita">
          <p className="mb-0 text-secondary small d-none d-lg-block">
            {formatarDataExtenso(hojeISO())}
          </p>
          <span className="app-avatar" title={`${USUARIO} — Recepção`}>
            {iniciais(USUARIO)}
          </span>
        </div>
      </div>
    </header>
  )
}
