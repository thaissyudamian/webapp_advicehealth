import { useCallback, useMemo, useRef, useState } from 'react'

/* Controle de formulário: valores, erros, campos tocados e envio.

   Genérico de propósito — não conhece paciente nem agendamento. A função
   `validar` vem de fora e devolve um objeto { campo: mensagem }, no formato
   que os validadores de domínio já produzem.

   Regra de exibição: o erro de um campo só aparece depois que o usuário saiu
   dele (blur) ou tentou enviar. Validar enquanto se digita acusa "CPF
   inválido" no primeiro dígito, o que é tecnicamente correto e péssimo de usar.

   useForm({ valoresIniciais, validar, aoEnviar }) */

export function useForm({ valoresIniciais, validar = () => ({}), aoEnviar }) {
  const [valores, setValores] = useState(valoresIniciais)
  const [tocados, setTocados] = useState({})
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState(null)

  const iniciais = useRef(valoresIniciais)

  // Derivado, não guardado em estado: erro é sempre função dos valores atuais.
  // Guardar em estado abriria a chance de ficar desatualizado.
  const erros = useMemo(() => validar(valores) ?? {}, [valores, validar])

  const valido = Object.keys(erros).length === 0
  const alterado = useMemo(
    () => JSON.stringify(valores) !== JSON.stringify(iniciais.current),
    [valores]
  )

  const mostrarErro = useCallback(
    (campo) => Boolean(erros[campo]) && (tocados[campo] || tentouEnviar),
    [erros, tocados, tentouEnviar]
  )

  const definir = useCallback((campo, valor) => {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }, [])

  /* Aceita tanto o evento do input quanto (campo, valor) direto, para campos
     que não são <input> — máscaras, seletores de data, componentes próprios. */
  const mudar = useCallback(
    (eventoOuCampo, talvezValor) => {
      if (typeof eventoOuCampo === 'string') {
        definir(eventoOuCampo, talvezValor)
        return
      }
      const alvo = eventoOuCampo.target
      definir(alvo.name, alvo.type === 'checkbox' ? alvo.checked : alvo.value)
    },
    [definir]
  )

  const aoSair = useCallback((eventoOuCampo) => {
    const campo = typeof eventoOuCampo === 'string' ? eventoOuCampo : eventoOuCampo.target.name
    setTocados((atuais) => ({ ...atuais, [campo]: true }))
  }, [])

  const redefinir = useCallback((novos = iniciais.current) => {
    iniciais.current = novos
    setValores(novos)
    setTocados({})
    setTentouEnviar(false)
    setErroEnvio(null)
  }, [])

  const enviar = useCallback(
    async (evento) => {
      evento?.preventDefault()
      setTentouEnviar(true)
      setErroEnvio(null)

      const encontrados = validar(valores) ?? {}
      const camposComErro = Object.keys(encontrados)

      if (camposComErro.length > 0) {
        // Leva o foco ao primeiro campo inválido: num formulário longo, o erro
        // pode estar fora da área visível e o usuário não saberia por que o
        // envio não aconteceu. Depende de o id do campo ser o nome do campo.
        document.getElementById(camposComErro[0])?.focus()
        return { ok: false, erros: encontrados }
      }

      setEnviando(true)
      try {
        await aoEnviar?.(valores)
        return { ok: true }
      } catch (erro) {
        setErroEnvio(erro.message ?? 'Não foi possível salvar. Tente novamente.')
        return { ok: false, erro }
      } finally {
        setEnviando(false)
      }
    },
    [valores, validar, aoEnviar]
  )

  return {
    valores,
    erros,
    tocados,
    valido,
    alterado,
    enviando,
    erroEnvio,
    mostrarErro,
    definir,
    mudar,
    aoSair,
    enviar,
    redefinir,
  }
}
