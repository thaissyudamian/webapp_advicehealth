import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* A ordem destes três imports é significativa. Quando duas regras de CSS têm a
   mesma especificidade, prevalece a declarada por último — então o tema só
   consegue sobrescrever o Bootstrap se vier depois dele. */
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/theme.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
