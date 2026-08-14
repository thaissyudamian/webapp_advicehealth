/* Contexto e hook de acesso, separados do provider.

   Arquivo que exporta um componente não deve exportar mais nada, senão o
   Fast Refresh do Vite perde o estado a cada alteração. Por isso o contexto e
   o hook moram aqui, e o componente <ClinicProvider> mora ao lado. */

import { createContext, useContext } from 'react'

export const ClinicContext = createContext(null)

export function useClinica() {
  const contexto = useContext(ClinicContext)
  if (!contexto) {
    throw new Error('useClinica precisa estar dentro de <ClinicProvider>')
  }
  return contexto
}
