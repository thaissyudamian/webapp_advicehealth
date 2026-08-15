import { createContext, useContext } from 'react'

/* Separado do provider pelo mesmo motivo do contexto da clínica: arquivo que
   exporta componente não deve exportar mais nada, senão o Fast Refresh do Vite
   perde o estado a cada alteração. */

export const ToastContext = createContext(null)

export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) {
    throw new Error('useToast precisa estar dentro de <ToastProvider>')
  }
  return contexto
}
