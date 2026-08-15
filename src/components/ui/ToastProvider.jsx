import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from '../../hooks/toastContext.js'
import './ui.css'

/* Notificações temporárias.

   Usa o visual .toast do Bootstrap, com o empilhamento e o tempo de vida
   controlados por estado do React. Cada aviso some sozinho, mas fica se o
   ponteiro estiver sobre ele — quem está lendo não perde a mensagem no meio. */

const DURACAO_PADRAO = 4000

const VARIANTES = {
  sucesso: { icone: 'bi-check-circle-fill', cor: 'var(--ah-status-atendido)' },
  erro: { icone: 'bi-exclamation-octagon-fill', cor: 'var(--ah-status-cancelado)' },
  aviso: { icone: 'bi-exclamation-triangle-fill', cor: 'var(--ah-status-aguardando)' },
  info: { icone: 'bi-info-circle-fill', cor: 'var(--ah-status-confirmado)' },
}

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const temporizadores = useRef(new Map())

  const remover = useCallback((id) => {
    clearTimeout(temporizadores.current.get(id))
    temporizadores.current.delete(id)
    setAvisos((atuais) => atuais.filter((aviso) => aviso.id !== id))
  }, [])

  const programarSaida = useCallback(
    (id, duracao) => {
      clearTimeout(temporizadores.current.get(id))
      temporizadores.current.set(id, setTimeout(() => remover(id), duracao))
    },
    [remover]
  )

  const notificar = useCallback(
    (mensagem, { variante = 'sucesso', titulo, duracao = DURACAO_PADRAO } = {}) => {
      const id = crypto.randomUUID()
      setAvisos((atuais) => [...atuais, { id, mensagem, variante, titulo, duracao }])
      programarSaida(id, duracao)
      return id
    },
    [programarSaida]
  )

  const valor = useMemo(
    () => ({
      notificar,
      sucesso: (mensagem, opcoes) => notificar(mensagem, { ...opcoes, variante: 'sucesso' }),
      erro: (mensagem, opcoes) => notificar(mensagem, { ...opcoes, variante: 'erro', duracao: 6000 }),
      aviso: (mensagem, opcoes) => notificar(mensagem, { ...opcoes, variante: 'aviso' }),
      info: (mensagem, opcoes) => notificar(mensagem, { ...opcoes, variante: 'info' }),
      remover,
    }),
    [notificar, remover]
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}

      {/* aria-live faz o leitor de tela anunciar a mensagem sem tirar o foco
          de onde o usuário está. */}
      <div className="ui-toasts" aria-live="polite" aria-atomic="false">
        {avisos.map((aviso) => {
          const { icone, cor } = VARIANTES[aviso.variante] ?? VARIANTES.info
          return (
            <div
              key={aviso.id}
              className="toast show ui-toast"
              role="status"
              onMouseEnter={() => clearTimeout(temporizadores.current.get(aviso.id))}
              onMouseLeave={() => programarSaida(aviso.id, 1500)}
            >
              <div className="toast-body d-flex align-items-start gap-2">
                <i className={`bi ${icone} flex-shrink-0`} style={{ color: cor }} aria-hidden="true"></i>
                <div className="flex-grow-1">
                  {aviso.titulo && <p className="fw-semibold mb-1">{aviso.titulo}</p>}
                  <p className="mb-0">{aviso.mensagem}</p>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-sm"
                  onClick={() => remover(aviso.id)}
                  aria-label="Fechar aviso"
                ></button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
