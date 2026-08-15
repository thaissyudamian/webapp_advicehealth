import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { useClinica } from '../../store/clinicContext.js'
import './layout.css'

/* Estrutura comum às três telas. Como as rotas são aninhadas dentro deste
   componente, a lateral e o topo são montados uma única vez: ao navegar, só o
   <Outlet /> troca de conteúdo. Isso preserva a posição de rolagem da lateral
   e evita remontar a navegação a cada clique. */

export function AppLayout() {
  const { carregando, erro } = useClinica()
  const [menuAberto, setMenuAberto] = useState(false)
  const localizacao = useLocation()

  const fecharMenu = () => setMenuAberto(false)

  // Trocar de tela fecha a gaveta: no celular, ela cobre o conteúdo recém-aberto.
  useEffect(() => {
    setMenuAberto(false)
  }, [localizacao.pathname])

  // Esc fecha a gaveta, como em qualquer camada sobreposta.
  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') setMenuAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  return (
    <div className="app-shell">
      <a className="pular-para-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>

      <Sidebar aberta={menuAberto} aoFechar={fecharMenu} />

      {menuAberto && (
        <div
          className="offcanvas-backdrop fade show d-lg-none"
          onClick={fecharMenu}
          aria-hidden="true"
        />
      )}

      <div className="app-coluna">
        <Topbar aoAbrirMenu={() => setMenuAberto(true)} menuAberto={menuAberto} />

        <main className="app-principal" id="conteudo">
          {carregando && <CarregandoTela />}
          {!carregando && erro && <ErroTela mensagem={erro} />}
          {!carregando && !erro && <Outlet />}
        </main>
      </div>
    </div>
  )
}

function CarregandoTela() {
  return (
    <div className="text-center py-5" role="status">
      <div className="spinner-border text-primary" aria-hidden="true"></div>
      <p className="text-secondary mt-3 mb-0">Carregando dados do consultório…</p>
    </div>
  )
}

function ErroTela({ mensagem }) {
  return (
    <div className="alert alert-danger" role="alert">
      <h2 className="h6 alert-heading">Não foi possível carregar os dados</h2>
      <p className="mb-0">{mensagem}</p>
    </div>
  )
}
