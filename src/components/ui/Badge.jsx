import './ui.css'

/* Indicador de situação.

   Recebe a cor pronta em vez de conhecer a lista de status: é o que mantém
   este componente reaproveitável fora deste projeto. Quem traduz
   status → cor é a tela, com o mapa que vive em domain/constants.js.

   O rótulo em texto é obrigatório por acessibilidade: cor sozinha não
   comunica para quem não a distingue, nem em impressão em preto e branco. */

export function Badge({ rotulo, cor, icone, contorno = false }) {
  const estilo = contorno
    ? { color: cor, borderColor: cor, backgroundColor: 'transparent' }
    : {
        color: cor,
        borderColor: `color-mix(in srgb, ${cor} 28%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${cor} 12%, white)`,
      }

  return (
    <span className="ui-badge" style={estilo}>
      {icone && <i className={`bi ${icone}`} aria-hidden="true"></i>}
      {rotulo}
    </span>
  )
}
