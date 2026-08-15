import { formatarDataExtenso, hojeISO, iniciais } from '../../domain/format.js'

/* Barra superior.
   aoAbrirMenu — abre a gaveta de navegação abaixo de 992px
   menuAberto  — informado ao leitor de tela por aria-expanded */

const USUARIO = 'Camila Ribeiro'

export function Topbar({ aoAbrirMenu, menuAberto }) {
  return (
    <header className="app-topo">
      <button
        type="button"
        className="btn btn-link text-body p-0 d-lg-none"
        onClick={aoAbrirMenu}
        aria-label="Abrir menu"
        aria-controls="menu-lateral"
        aria-expanded={menuAberto}
      >
        <i className="bi bi-list fs-3" aria-hidden="true"></i>
      </button>

      <p className="mb-0 text-secondary small text-capitalize d-none d-sm-block">
        <i className="bi bi-calendar-event me-2" aria-hidden="true"></i>
        {formatarDataExtenso(hojeISO())}
      </p>

      <div className="ms-auto d-flex align-items-center gap-3">
        <span className="d-none d-md-inline small text-secondary">Recepção</span>
        <span className="app-avatar" title={USUARIO}>
          {iniciais(USUARIO)}
        </span>
      </div>
    </header>
  )
}
