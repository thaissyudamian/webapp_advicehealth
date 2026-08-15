/* Campo de formulário com rótulo, validação e texto de apoio.

   Concentra num lugar o que se repetiria em cada campo: associar o rótulo pelo
   id, marcar obrigatoriedade, aplicar .is-invalid e exibir a mensagem no
   .invalid-feedback do Bootstrap.

   nome       — vira o id do campo, e o useForm depende dessa igualdade para
                levar o foco ao primeiro campo inválido
   erro       — mensagem já pronta, ou null; quem decide se mostra é a tela
   formatar   — função de máscara aplicada a cada digitação (formatarCPF etc.);
                fica de fora deste componente para não trazer domínio para ui/
   opcoes     — presente, o campo vira <select>
   linhas     — presente, o campo vira <textarea> */

export function FormField({
  nome,
  rotulo,
  tipo = 'text',
  valor,
  aoMudar,
  aoSair,
  erro,
  obrigatorio = false,
  dica,
  formatar,
  opcoes,
  linhas,
  placeholder,
  desabilitado = false,
  autoFoco = false,
  className = '',
  ...resto
}) {
  const idDica = dica ? `${nome}-dica` : undefined
  const idErro = erro ? `${nome}-erro` : undefined

  const aoDigitar = (evento) => {
    if (formatar) {
      aoMudar(nome, formatar(evento.target.value))
      return
    }
    aoMudar(evento)
  }

  const comuns = {
    id: nome,
    name: nome,
    value: valor ?? '',
    onChange: aoDigitar,
    onBlur: aoSair,
    disabled: desabilitado,
    autoFocus: autoFoco,
    placeholder,
    /* O asterisco do rótulo vem de CSS (::after), que nem todo leitor de tela
       anuncia. aria-required comunica a obrigatoriedade pela árvore de
       acessibilidade, independente do visual. */
    'aria-required': obrigatorio || undefined,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': [idDica, idErro].filter(Boolean).join(' ') || undefined,
    ...resto,
  }

  const classeErro = erro ? ' is-invalid' : ''

  return (
    <div className={className}>
      <label htmlFor={nome} className={`form-label${obrigatorio ? ' obrigatorio' : ''}`}>
        {rotulo}
      </label>

      {opcoes ? (
        <select {...comuns} className={`form-select${classeErro}`}>
          <option value="">Selecione</option>
          {opcoes.map((opcao) => {
            const item = typeof opcao === 'string' ? { valor: opcao, rotulo: opcao } : opcao
            return (
              <option key={item.valor} value={item.valor}>
                {item.rotulo}
              </option>
            )
          })}
        </select>
      ) : linhas ? (
        <textarea {...comuns} rows={linhas} className={`form-control${classeErro}`} />
      ) : (
        <input {...comuns} type={tipo} className={`form-control${classeErro}`} />
      )}

      {dica && !erro && (
        <div id={idDica} className="form-text">
          {dica}
        </div>
      )}

      {/* .invalid-feedback só aparece quando o campo irmão tem .is-invalid */}
      {erro && (
        <div id={idErro} className="invalid-feedback d-block">
          {erro}
        </div>
      )}
    </div>
  )
}
