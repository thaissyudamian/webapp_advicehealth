import './ui.css'

/* Indicador numérico, em duas apresentações.

   plano   — rótulo pequeno e número grande, sem moldura. Para a faixa de
             indicadores do topo, onde vários aparecem lado a lado e as bordas
             de cada um criariam mais ruído do que separação.
   cartão  — padrão, com moldura. Para quando o indicador aparece isolado.

   Com `aoClicar` vira <button> em vez de <div>: elemento que responde a clique
   precisa ser alcançável por teclado e anunciado como ação. Trocar a tag é
   mais barato do que remendar com tabIndex e onKeyDown. */

export function StatCard({ rotulo, valor, icone, cor, detalhe, aoClicar, plano = false }) {
  if (plano) {
    return (
      <div className="ui-stat-plano">
        <p className="ui-stat-plano-rotulo">
          {icone && <i className={`bi ${icone}`} style={cor ? { color: cor } : undefined} aria-hidden="true"></i>}
          {rotulo}
        </p>
        <p className="ui-stat-plano-valor">{valor}</p>
        {detalhe && <p className="ui-stat-detalhe mb-0">{detalhe}</p>}
      </div>
    )
  }

  const conteudo = (
    <>
      {icone && (
        <span
          className="ui-stat-icone"
          style={cor ? { color: cor, backgroundColor: `color-mix(in srgb, ${cor} 12%, white)` } : undefined}
          aria-hidden="true"
        >
          <i className={`bi ${icone}`}></i>
        </span>
      )}
      <span className="ui-stat-texto">
        <span className="ui-stat-rotulo">{rotulo}</span>
        <strong className="ui-stat-valor">{valor}</strong>
        {detalhe && <span className="ui-stat-detalhe">{detalhe}</span>}
      </span>
    </>
  )

  if (aoClicar) {
    return (
      <button type="button" className="card ui-stat ui-stat-acao" onClick={aoClicar}>
        {conteudo}
        <i className="bi bi-chevron-right ui-stat-seta" aria-hidden="true"></i>
      </button>
    )
  }

  return <div className="card ui-stat">{conteudo}</div>
}
