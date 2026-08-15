import { useEffect, useMemo } from 'react'

import { useClinica } from '../../store/clinicContext.js'
import { useToast } from '../../hooks/toastContext.js'
import { useForm } from '../../hooks/useForm.js'
import { obrigatorio, valorMonetario, validarCampos } from '../../domain/validators.js'
import {
  FORMAS_PAGAMENTO,
  PAGAMENTO,
  PAGAMENTO_INFO,
  rotuloFormaPagamento,
} from '../../domain/constants.js'
import { formatarMoeda, paraNumero } from '../../domain/format.js'

import { Modal } from '../ui/Modal.jsx'
import { FormField } from '../ui/FormField.jsx'
import './agenda.css'

/* Edição da cobrança, separada do formulário de agendamento.

   O escopo trata a cobrança como assunto próprio — "edição dos dados
   relacionados ao agendamento e à cobrança" — e é a alteração mais repetida:
   um atendimento acontece uma vez, mas a cobrança dele muda de pendente para
   paga depois, muitas vezes no mesmo dia.

   Abrir o formulário completo para isso funcionava, só era longo. As regras de
   validação são as mesmas de lá, importadas do domínio, então não existem duas
   definições do que é uma cobrança válida. */

const ICONES_FORMA = {
  dinheiro: 'bi-cash',
  pix: 'bi-qr-code',
  debito: 'bi-credit-card-2-back',
  credito: 'bi-credit-card',
  convenio: 'bi-shield-plus',
}

function valoresIniciais(agendamento) {
  return {
    valor: agendamento?.pagamento?.valor ?? '',
    desconto: agendamento?.pagamento?.desconto ?? 0,
    forma: agendamento?.pagamento?.forma ?? '',
    situacao: agendamento?.pagamento?.status ?? PAGAMENTO.PENDENTE,
  }
}

export function CobrancaModal({ aberto, agendamento, aoFechar }) {
  const clinica = useClinica()
  const toast = useToast()

  const validar = useMemo(
    () => (v) =>
      validarCampos({
        valor: () => valorMonetario(v.valor),
        forma: () =>
          v.situacao === PAGAMENTO.PAGO
            ? obrigatorio(v.forma, 'Selecione a forma de pagamento')
            : null,
      }),
    []
  )

  const salvar = async (v) => {
    const pagamento = {
      valor: paraNumero(v.valor),
      desconto: paraNumero(v.desconto),
      forma: v.forma || null,
      status: v.situacao,
    }

    /* O histórico guarda o estado resultante, não só "cobrança alterada":
       em conferência de caixa, saber que virou "Pago · PIX · R$ 250,00" é o
       que resolve a dúvida sem precisar abrir outra tela. */
    const resumo = [
      PAGAMENTO_INFO[pagamento.status].rotulo,
      rotuloFormaPagamento(pagamento.forma),
      formatarMoeda(pagamento.valor - pagamento.desconto),
    ]
      .filter(Boolean)
      .join(' · ')

    await clinica.salvarAgendamento(
      { ...agendamento, pagamento },
      { acao: `Cobrança alterada para ${resumo}` }
    )

    toast.sucesso(`Cobrança atualizada: ${resumo}.`)
    aoFechar()
  }

  const form = useForm({
    valoresIniciais: valoresIniciais(agendamento),
    validar,
    aoEnviar: salvar,
  })

  const { valores, definir, redefinir } = form

  useEffect(() => {
    if (aberto) redefinir(valoresIniciais(agendamento))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, agendamento?.id])

  if (!agendamento) return null

  const liquido = paraNumero(valores.valor) - paraNumero(valores.desconto)

  return (
    <Modal
      aberto={aberto}
      titulo="Cobrança da consulta"
      aoFechar={aoFechar}
      fecharFora={false}
      rodape={
        <div className="d-flex flex-wrap align-items-center gap-3 w-100">
          {form.erroEnvio && (
            <span className="text-danger small" role="alert">
              {form.erroEnvio}
            </span>
          )}
          <div className="ms-auto d-flex gap-2">
            <button type="button" className="btn btn-light" onClick={aoFechar} disabled={form.enviando}>
              Cancelar
            </button>
            <button type="submit" form="form-cobranca" className="btn btn-primary" disabled={form.enviando}>
              {form.enviando && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              )}
              Salvar cobrança
            </button>
          </div>
        </div>
      }
    >
      <form id="form-cobranca" onSubmit={form.enviar} noValidate>
        <p className="text-secondary small mb-3">
          {agendamento.paciente?.nome} · {agendamento.medico?.nome}
        </p>

        <div className="row g-3 align-items-end">
          <div className="col-6 col-sm-4">
            <FormField
              nome="valor"
              rotulo="Valor"
              obrigatorio
              inputMode="decimal"
              valor={valores.valor}
              aoMudar={form.mudar}
              aoSair={form.aoSair}
              erro={form.mostrarErro('valor') ? form.erros.valor : null}
            />
          </div>

          <div className="col-6 col-sm-4">
            <FormField
              nome="desconto"
              rotulo="Desconto"
              inputMode="decimal"
              valor={valores.desconto}
              aoMudar={form.mudar}
              aoSair={form.aoSair}
            />
          </div>

          <div className="col-12 col-sm-4">
            <p className="text-secondary small mb-1">Total</p>
            <p className="h5 mb-0">{formatarMoeda(liquido)}</p>
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="situacao">
              Situação
            </label>
            <select
              id="situacao"
              name="situacao"
              className="form-select"
              value={valores.situacao}
              onChange={form.mudar}
            >
              <option value={PAGAMENTO.PENDENTE}>Pendente</option>
              <option value={PAGAMENTO.PAGO}>Pago</option>
              <option value={PAGAMENTO.CONVENIO}>Faturar no convênio</option>
              <option value={PAGAMENTO.ISENTO}>Isento</option>
            </select>
          </div>

          {valores.situacao === PAGAMENTO.PAGO && (
            <div className="col-12">
              <span className="form-label obrigatorio d-block">Forma de pagamento</span>
              <div className="agenda-formas">
                {FORMAS_PAGAMENTO.map((forma) => (
                  <button
                    key={forma.valor}
                    type="button"
                    className={`agenda-forma${valores.forma === forma.valor ? ' selecionada' : ''}`}
                    aria-pressed={valores.forma === forma.valor}
                    onClick={() => {
                      definir('forma', forma.valor)
                      form.aoSair('forma')
                    }}
                  >
                    <i className={`bi ${ICONES_FORMA[forma.valor]}`} aria-hidden="true"></i>
                    {forma.rotulo}
                  </button>
                ))}
              </div>
              {form.mostrarErro('forma') && (
                <div className="invalid-feedback d-block">{form.erros.forma}</div>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
