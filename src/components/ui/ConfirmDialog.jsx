import { Modal } from './Modal.jsx'

/* Confirmação de ação sem volta — cancelar, excluir, transferir.

   Construído sobre o Modal em vez de repetir a estrutura: qualquer correção
   de foco ou de rolagem feita lá vale aqui também. */

export function ConfirmDialog({
  aberto,
  titulo = 'Confirmar ação',
  mensagem,
  detalhe,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Voltar',
  variante = 'danger',
  processando = false,
  aoConfirmar,
  aoCancelar,
  children,
}) {
  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      aoFechar={processando ? undefined : aoCancelar}
      fecharFora={false}
      rodape={
        <>
          <button
            type="button"
            className="btn btn-light"
            onClick={aoCancelar}
            disabled={processando}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`btn btn-${variante}`}
            onClick={aoConfirmar}
            disabled={processando}
          >
            {processando && (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            )}
            {textoConfirmar}
          </button>
        </>
      }
    >
      <p className="mb-0">{mensagem}</p>
      {detalhe && <p className="text-secondary small mt-2 mb-0">{detalhe}</p>}
      {children}
    </Modal>
  )
}
