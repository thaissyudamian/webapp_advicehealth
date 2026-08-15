/* Estado vazio.

   Um vazio sem explicação parece defeito. O componente força três informações:
   o que deveria estar aqui, por que não está, e o que fazer a respeito. */

export function EmptyState({ icone = 'bi-inbox', titulo, descricao, children }) {
  return (
    <div className="text-center py-5 px-3">
      <i className={`bi ${icone} fs-1 text-secondary`} aria-hidden="true"></i>
      <p className="fw-semibold mt-3 mb-1">{titulo}</p>
      {descricao && <p className="text-secondary mb-0">{descricao}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
