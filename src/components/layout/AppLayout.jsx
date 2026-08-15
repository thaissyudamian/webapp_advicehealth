import { Outlet } from 'react-router-dom'

import { Topbar } from './Topbar.jsx'
import { useClinica } from '../../store/clinicContext.js'
import './layout.css'

/* Estrutura comum às três telas.

   As rotas são filhas deste componente e chegam pelo <Outlet />: a barra
   superior é montada uma única vez e só o conteúdo troca ao navegar.

   Carregamento e erro são tratados aqui, e não em cada tela: as três dependem
   dos mesmos dados, e resolver em um lugar evita três comportamentos
   ligeiramente diferentes. O indicador aparece dentro da estrutura já montada,
   com a navegação visível — a aplicação parece carregando, não quebrada. */

export function AppLayout() {
  const { carregando, erro } = useClinica()

  return (
    <>
      <a className="pular-para-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>

      <Topbar />

      <main className="app-principal" id="conteudo">
        {carregando && <CarregandoTela />}
        {!carregando && erro && <ErroTela mensagem={erro} />}
        {!carregando && !erro && <Outlet />}
      </main>
    </>
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
