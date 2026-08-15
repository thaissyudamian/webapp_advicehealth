/* Cabeçalho de tela: título, descrição e área de ações.

   Existe para que as três telas tenham a mesma altura de título e o mesmo
   espaçamento até o conteúdo — alinhamento que se perde quando cada página
   monta o próprio cabeçalho com utilitários soltos. */

export function PageHeader({ titulo, descricao, children }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 className="h4 mb-1">{titulo}</h1>
        {descricao && <p className="text-secondary mb-0">{descricao}</p>}
      </div>
      {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
