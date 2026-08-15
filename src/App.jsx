import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppLayout } from './components/layout/AppLayout.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Agenda } from './pages/Agenda.jsx'
import { Agendamentos } from './pages/Agendamentos.jsx'
import { NaoEncontrada } from './pages/NaoEncontrada.jsx'

/* As três telas são rotas filhas de <AppLayout />, que as recebe pelo <Outlet />.
   BrowserRouter em vez de HashRouter para manter endereços limpos e permitir
   link direto a uma data (/agenda?data=2026-08-14). Em troca, o servidor
   precisa devolver o index.html em qualquer caminho — configurado no
   vercel.json. */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/agendamentos" element={<Agendamentos />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
