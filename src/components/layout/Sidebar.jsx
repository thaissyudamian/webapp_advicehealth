import { NavLink } from 'react-router-dom'

/* Navegação principal.
   aberta  — só tem efeito abaixo de 992px, onde a lateral vira gaveta
   aoFechar — chamado pelo botão de fechar da gaveta */

const ITENS = [
  { para: '/', rotulo: 'Área de trabalho', icone: 'bi-columns-gap', exato: true },
  { para: '/agenda', rotulo: 'Agenda', icone: 'bi-calendar3' },
  { para: '/agendamentos', rotulo: 'Agendamentos', icone: 'bi-clipboard2-pulse' },
]

export function Sidebar({ aberta, aoFechar }) {
  return (
    <aside
      id="menu-lateral"
      className={`app-lateral offcanvas-lg offcanvas-start${aberta ? ' show' : ''}`}
      tabIndex={-1}
      aria-label="Menu principal"
    >
      <div className="app-lateral-interna">
        <div className="app-marca">
          <span className="app-marca-simbolo" aria-hidden="true">
            <i className="bi bi-heart-pulse"></i>
          </span>
          <span className="app-marca-nome">
            Consultório
            <small>Gestão de agenda</small>
          </span>
          <button
            type="button"
            className="btn-close ms-auto d-lg-none"
            onClick={aoFechar}
            aria-label="Fechar menu"
          ></button>
        </div>

        <nav className="app-lateral-nav">
          <ul className="nav nav-pills flex-column gap-1">
            {ITENS.map((item) => (
              <li className="nav-item" key={item.para}>
                <NavLink
                  to={item.para}
                  end={item.exato}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <i className={`bi ${item.icone}`} aria-hidden="true"></i>
                  {item.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="app-lateral-rodape">
          <p className="small text-secondary mb-0">
            <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
            Unidade Paulista
          </p>
        </div>
      </div>
    </aside>
  )
}
