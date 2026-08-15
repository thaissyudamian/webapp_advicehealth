import { useEffect, useId, useRef } from 'react'

/* Janela sobreposta.

   Markup e visual são os do Bootstrap (.modal, .modal-dialog, .modal-backdrop);
   quem decide se aparece é o React. O bundle JavaScript do Bootstrap faria isso
   mexendo no DOM por fora da árvore do React, que é a origem do backdrop preso
   e do modal que não fecha.

   aberto      — controla a exibição
   aoFechar    — chamado por Esc, botão fechar e clique fora
   tamanho     — sufixo do Bootstrap: 'modal-lg', 'modal-xl'
   fecharFora  — desligue em formulários longos, onde um clique acidental
                 descartaria o preenchimento */

export function Modal({
  aberto,
  titulo,
  aoFechar,
  children,
  rodape,
  tamanho = '',
  fecharFora = true,
}) {
  const idTitulo = useId()
  const conteudoRef = useRef(null)
  const focoAnterior = useRef(null)

  useEffect(() => {
    if (!aberto) return

    // Guarda quem tinha o foco para devolvê-lo ao fechar: sem isso o foco volta
    // para o começo da página e quem navega por teclado se perde.
    focoAnterior.current = document.activeElement
    conteudoRef.current?.focus()

    const rolagemAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') aoFechar?.()
    }
    document.addEventListener('keydown', aoTeclar)

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = rolagemAnterior
      focoAnterior.current?.focus?.()
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  /* mousedown em vez de click: com click, arrastar de dentro do modal para
     fora (ao selecionar texto, por exemplo) fecharia a janela. */
  const aoPressionarFundo = (evento) => {
    if (fecharFora && evento.target === evento.currentTarget) aoFechar?.()
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onMouseDown={aoPressionarFundo}
      >
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${tamanho}`}>
          <div className="modal-content" ref={conteudoRef} tabIndex={-1}>
            <div className="modal-header">
              <h2 className="modal-title h5" id={idTitulo}>
                {titulo}
              </h2>
              <button type="button" className="btn-close" onClick={aoFechar} aria-label="Fechar"></button>
            </div>

            <div className="modal-body">{children}</div>

            {rodape && <div className="modal-footer">{rodape}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}
