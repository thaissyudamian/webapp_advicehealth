import { useEffect, useMemo, useState } from 'react'

import { useClinica } from '../../store/clinicContext.js'
import { useToast } from '../../hooks/toastContext.js'
import { useForm } from '../../hooks/useForm.js'
import * as regras from '../../domain/validators.js'
import { validarCampos } from '../../domain/validators.js'
import { horariosDoMedico, pacientePorCPF } from '../../domain/selectors.js'
import {
  CONVENIOS,
  FORMAS_PAGAMENTO,
  PAGAMENTO,
  SEXOS,
  STATUS,
  TIPOS_CONSULTA,
  UFS,
} from '../../domain/constants.js'
import {
  formatarCEP,
  formatarCPF,
  formatarMoeda,
  formatarTelefone,
  hojeISO,
  paraNumero,
  somenteDigitos,
} from '../../domain/format.js'

import { Modal } from '../ui/Modal.jsx'
import { FormField } from '../ui/FormField.jsx'
import { SeletorHorarios } from './SeletorHorarios.jsx'
import './agenda.css'

/* Inclusão e alteração de agendamento.

   Mesmo componente para os dois casos, e também usado pela consulta de
   agendamentos: é o que evita duas implementações de validação para o mesmo
   formulário.

   agendamento — quando presente, o formulário abre em modo alteração
   inicial     — { medicoId, data, hora } vindos do clique numa célula livre */

const ICONES_FORMA = {
  dinheiro: 'bi-cash',
  pix: 'bi-qr-code',
  debito: 'bi-credit-card-2-back',
  credito: 'bi-credit-card',
  convenio: 'bi-shield-plus',
}

function valoresIniciais(agendamento, paciente, inicial) {
  return {
    medicoId: agendamento?.medicoId ?? inicial?.medicoId ?? '',
    data: agendamento?.data ?? inicial?.data ?? hojeISO(),
    hora: agendamento?.hora ?? inicial?.hora ?? '',
    tipo: agendamento?.tipo ?? 'consulta',
    observacoes: agendamento?.observacoes ?? '',

    pacienteId: paciente?.id ?? '',
    cpf: paciente?.cpf ? formatarCPF(paciente.cpf) : '',
    nome: paciente?.nome ?? '',
    nascimento: paciente?.nascimento ?? '',
    sexo: paciente?.sexo ?? '',
    telefone: paciente?.telefone ? formatarTelefone(paciente.telefone) : '',
    email: paciente?.email ?? '',
    convenio: paciente?.convenio ?? 'Particular',

    cep: paciente?.endereco?.cep ? formatarCEP(paciente.endereco.cep) : '',
    logradouro: paciente?.endereco?.logradouro ?? '',
    numero: paciente?.endereco?.numero ?? '',
    complemento: paciente?.endereco?.complemento ?? '',
    bairro: paciente?.endereco?.bairro ?? '',
    cidade: paciente?.endereco?.cidade ?? '',
    uf: paciente?.endereco?.uf ?? '',

    valor: agendamento?.pagamento?.valor ?? '',
    desconto: agendamento?.pagamento?.desconto ?? 0,
    forma: agendamento?.pagamento?.forma ?? '',
    pagamentoStatus: agendamento?.pagamento?.status ?? PAGAMENTO.PENDENTE,
  }
}

export function AgendamentoModal({ aberto, agendamento, inicial, aoFechar }) {
  const clinica = useClinica()
  const toast = useToast()
  const [reconhecido, setReconhecido] = useState(null)

  const edicao = Boolean(agendamento)
  const pacienteAtual = agendamento
    ? clinica.pacientes.find((p) => p.id === agendamento.pacienteId)
    : null

  const validar = useMemo(
    () => (v) =>
      validarCampos({
        medicoId: () => regras.obrigatorio(v.medicoId, 'Selecione o médico'),
        data: () => regras.dataAgendamento(v.data),
        hora: () => regras.obrigatorio(v.hora, 'Selecione um horário'),
        cpf: () => regras.cpf(v.cpf),
        nome: () => regras.nomeCompleto(v.nome),
        nascimento: () => regras.dataNascimento(v.nascimento),
        telefone: () => regras.telefone(v.telefone),
        email: () => regras.email(v.email),
        cep: () => regras.cep(v.cep),
        logradouro: () => regras.obrigatorio(v.logradouro, 'Informe o logradouro'),
        numero: () => regras.obrigatorio(v.numero, 'Informe o número'),
        bairro: () => regras.obrigatorio(v.bairro, 'Informe o bairro'),
        cidade: () => regras.obrigatorio(v.cidade, 'Informe a cidade'),
        uf: () => regras.obrigatorio(v.uf, 'Selecione a UF'),
        valor: () => regras.valorMonetario(v.valor),
        // Forma de pagamento só é obrigatória quando a cobrança foi efetivada.
        forma: () =>
          v.pagamentoStatus === PAGAMENTO.PAGO
            ? regras.obrigatorio(v.forma, 'Selecione a forma de pagamento')
            : null,
      }),
    []
  )

  const salvar = async (v) => {
    const paciente = await clinica.salvarPaciente({
      id: v.pacienteId || undefined,
      nome: v.nome.trim(),
      cpf: somenteDigitos(v.cpf),
      nascimento: v.nascimento,
      sexo: v.sexo,
      telefone: somenteDigitos(v.telefone),
      email: v.email.trim(),
      convenio: v.convenio,
      endereco: {
        cep: somenteDigitos(v.cep),
        logradouro: v.logradouro.trim(),
        numero: v.numero.trim(),
        complemento: v.complemento.trim(),
        bairro: v.bairro.trim(),
        cidade: v.cidade.trim(),
        uf: v.uf,
      },
    })

    const duracao = TIPOS_CONSULTA.find((t) => t.valor === v.tipo)?.duracao ?? 30

    await clinica.salvarAgendamento({
      ...(agendamento ?? {}),
      pacienteId: paciente.id,
      medicoId: v.medicoId,
      data: v.data,
      hora: v.hora,
      duracao,
      tipo: v.tipo,
      status: agendamento?.status ?? STATUS.AGENDADO,
      observacoes: v.observacoes.trim(),
      pagamento: {
        valor: paraNumero(v.valor),
        desconto: paraNumero(v.desconto),
        forma: v.forma || null,
        status: v.pagamentoStatus,
      },
    })

    toast.sucesso(
      edicao ? 'Agendamento atualizado.' : `Agendamento confirmado para ${v.hora}.`,
      { titulo: paciente.nome }
    )
    aoFechar()
  }

  const form = useForm({
    valoresIniciais: valoresIniciais(agendamento, pacienteAtual, inicial),
    validar,
    aoEnviar: salvar,
  })

  const { valores, definir, redefinir } = form

  // Reabrir o modal com outro contexto precisa recarregar os valores: o
  // useState de dentro do useForm só usa o valor inicial na primeira montagem.
  useEffect(() => {
    if (aberto) {
      redefinir(valoresIniciais(agendamento, pacienteAtual, inicial))
      setReconhecido(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, agendamento?.id, inicial?.medicoId, inicial?.data, inicial?.hora])

  /* Busca por CPF: com 11 dígitos válidos, reaproveita o cadastro existente em
     vez de criar uma ficha duplicada para o mesmo paciente.

     O vínculo é refeito a cada mudança do CPF, e não só na primeira busca.
     Sem isso, corrigir um CPF digitado errado manteria o formulário preso ao
     paciente carregado antes — e salvar gravaria os dados de um paciente por
     cima da ficha de outro. */
  useEffect(() => {
    const digitos = somenteDigitos(valores.cpf)
    const encontrado = digitos.length === 11 && !regras.cpf(digitos) ? pacientePorCPF(clinica, digitos) : null

    if (encontrado) {
      if (encontrado.id === valores.pacienteId) return
      redefinir({
        ...valores,
        ...valoresIniciais(agendamento, encontrado, inicial),
        medicoId: valores.medicoId,
        data: valores.data,
        hora: valores.hora,
        tipo: valores.tipo,
        valor: valores.valor,
        observacoes: valores.observacoes,
      })
      setReconhecido(encontrado)
      return
    }

    // CPF deixou de corresponder ao cadastro carregado: desfaz o vínculo para
    // que o registro seja criado como paciente novo.
    if (valores.pacienteId) {
      definir('pacienteId', '')
      setReconhecido(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valores.cpf])

  // O valor sugerido acompanha o médico escolhido, mas continua editável.
  useEffect(() => {
    if (edicao || !valores.medicoId) return
    const medico = clinica.medicos.find((m) => m.id === valores.medicoId)
    if (medico) definir('valor', medico.valorConsulta)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valores.medicoId])

  const horarios = useMemo(
    () =>
      valores.medicoId && valores.data
        ? horariosDoMedico(clinica, valores.medicoId, valores.data)
        : [],
    [clinica, valores.medicoId, valores.data]
  )

  /* Na alteração, o próprio horário do agendamento aparece como ocupado — por
     ele mesmo. Continua selecionável, mas só enquanto médico e data não mudam:
     ao trocar de agenda, aquele horário volta a valer as regras do destino. */
  const horaPropria =
    edicao && valores.medicoId === agendamento.medicoId && valores.data === agendamento.data
      ? agendamento.hora
      : null

  /* Trocar de médico ou de data invalida o horário já escolhido: o mesmo
     14:30 pode estar livre numa agenda e ocupado na outra. Sem limpar, o
     formulário guardaria um horário que a grade não oferece mais, e salvar
     criaria a sobreposição que as fichas existem para evitar. */
  useEffect(() => {
    if (!valores.hora || horarios.length === 0) return
    const disponivel = horarios.some(
      (h) => h.hora === valores.hora && (h.tipo === 'livre' || h.hora === horaPropria)
    )
    if (!disponivel) definir('hora', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horarios, horaPropria])

  const medicoSelecionado = clinica.medicos.find((m) => m.id === valores.medicoId)
  const liquido = paraNumero(valores.valor) - paraNumero(valores.desconto)
  const totalErros = Object.keys(form.erros).length

  const campo = (nome, rotulo, extras = {}) => (
    <FormField
      nome={nome}
      rotulo={rotulo}
      valor={valores[nome]}
      aoMudar={form.mudar}
      aoSair={form.aoSair}
      erro={form.mostrarErro(nome) ? form.erros[nome] : null}
      {...extras}
    />
  )

  return (
    <Modal
      aberto={aberto}
      titulo={edicao ? 'Alterar agendamento' : 'Novo agendamento'}
      tamanho="modal-xl"
      fecharFora={false}
      aoFechar={aoFechar}
      rodape={
        <div className="d-flex flex-wrap align-items-center gap-3 w-100">
          {form.erroEnvio && (
            <span className="text-danger small">
              <i className="bi bi-exclamation-octagon me-1" aria-hidden="true"></i>
              {form.erroEnvio}
            </span>
          )}
          {totalErros > 0 && form.tocados && (
            <span className="text-secondary small">
              Corrija os campos destacados para continuar.
            </span>
          )}
          <div className="ms-auto d-flex gap-2">
            <button type="button" className="btn btn-light" onClick={aoFechar} disabled={form.enviando}>
              Cancelar
            </button>
            <button
              type="submit"
              form="form-agendamento"
              className="btn btn-primary"
              disabled={form.enviando}
            >
              {form.enviando && (
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
              )}
              {edicao ? 'Salvar alterações' : 'Confirmar agendamento e cobrar'}
            </button>
          </div>
        </div>
      }
    >
      <form id="form-agendamento" onSubmit={form.enviar} noValidate>
        <div className="row g-4">
          {/* ---------- Médico e horário ---------- */}
          <div className="col-12 col-lg-5">
            <div className="agenda-coluna-lateral">
              <h3 className="h6 mb-3">Médico e horário</h3>

              <div className="d-flex flex-column gap-3">
                {campo('medicoId', 'Médico', {
                  obrigatorio: true,
                  opcoes: clinica.medicos.map((m) => ({
                    valor: m.id,
                    rotulo: `${m.nome} — ${m.especialidade}`,
                  })),
                })}

                {campo('data', 'Data', { tipo: 'date', obrigatorio: true })}

                {campo('tipo', 'Tipo de atendimento', {
                  opcoes: TIPOS_CONSULTA.map((t) => ({
                    valor: t.valor,
                    rotulo: `${t.rotulo} (${t.duracao} min)`,
                  })),
                })}

                <div>
                  <label className="form-label obrigatorio" htmlFor="hora">
                    Horários disponíveis
                  </label>
                  <SeletorHorarios
                    id="hora"
                    horarios={horarios}
                    valor={valores.hora}
                    ignorar={horaPropria}
                    aoSelecionar={(hora) => {
                      definir('hora', hora)
                      form.aoSair('hora')
                    }}
                    erro={form.mostrarErro('hora') ? form.erros.hora : null}
                  />
                </div>

                {campo('observacoes', 'Observações', {
                  linhas: 3,
                  placeholder: 'Preparo, queixa principal, retorno…',
                })}
              </div>
            </div>
          </div>

          {/* ---------- Paciente e pagamento ---------- */}
          <div className="col-12 col-lg-7">
            <h3 className="h6 mb-3">Dados do paciente</h3>

            {reconhecido && (
              <div className="alert alert-info py-2 px-3 d-flex align-items-center gap-2" role="status">
                <i className="bi bi-person-check" aria-hidden="true"></i>
                <span className="small">
                  Paciente já cadastrado. Os dados foram preenchidos — confira antes de salvar.
                </span>
              </div>
            )}

            <div className="row g-3">
              <div className="col-12 col-sm-5">
                {campo('cpf', 'CPF', {
                  obrigatorio: true,
                  formatar: formatarCPF,
                  autoFoco: !edicao,
                  inputMode: 'numeric',
                  placeholder: '000.000.000-00',
                  dica: edicao ? null : 'Buscamos o cadastro antes de criar um novo.',
                })}
              </div>
              <div className="col-12 col-sm-7">
                {campo('nome', 'Nome completo', { obrigatorio: true, placeholder: 'Nome e sobrenome' })}
              </div>

              <div className="col-6 col-sm-4">
                {campo('nascimento', 'Data de nascimento', { tipo: 'date', obrigatorio: true })}
              </div>
              <div className="col-6 col-sm-3">{campo('sexo', 'Sexo', { opcoes: SEXOS })}</div>
              <div className="col-12 col-sm-5">
                {campo('telefone', 'Telefone', {
                  obrigatorio: true,
                  formatar: formatarTelefone,
                  inputMode: 'tel',
                  placeholder: '(00) 00000-0000',
                })}
              </div>

              <div className="col-12 col-sm-7">
                {campo('email', 'E-mail', { tipo: 'email', placeholder: 'opcional' })}
              </div>
              <div className="col-12 col-sm-5">{campo('convenio', 'Convênio', { opcoes: CONVENIOS })}</div>

              <div className="col-12">
                <hr className="my-1" />
                <p className="text-secondary small mb-0">Endereço</p>
              </div>

              <div className="col-6 col-sm-3">
                {campo('cep', 'CEP', {
                  obrigatorio: true,
                  formatar: formatarCEP,
                  inputMode: 'numeric',
                  placeholder: '00000-000',
                })}
              </div>
              <div className="col-12 col-sm-6">
                {campo('logradouro', 'Logradouro', { obrigatorio: true })}
              </div>
              <div className="col-6 col-sm-3">{campo('numero', 'Número', { obrigatorio: true })}</div>

              <div className="col-12 col-sm-4">{campo('complemento', 'Complemento')}</div>
              <div className="col-12 col-sm-4">{campo('bairro', 'Bairro', { obrigatorio: true })}</div>
              <div className="col-8 col-sm-2">{campo('cidade', 'Cidade', { obrigatorio: true })}</div>
              <div className="col-4 col-sm-2">{campo('uf', 'UF', { obrigatorio: true, opcoes: UFS })}</div>
            </div>

            {/* ---------- Pagamento ---------- */}
            <h3 className="h6 mt-4 mb-3">Pagamento da consulta</h3>

            <div className="row g-3 align-items-end">
              <div className="col-6 col-sm-4">
                {campo('valor', 'Valor da consulta', {
                  obrigatorio: true,
                  inputMode: 'decimal',
                  dica: medicoSelecionado ? `Sugerido: ${formatarMoeda(medicoSelecionado.valorConsulta)}` : null,
                })}
              </div>
              <div className="col-6 col-sm-4">{campo('desconto', 'Desconto', { inputMode: 'decimal' })}</div>
              <div className="col-12 col-sm-4">
                <p className="text-secondary small mb-1">Total</p>
                <p className="h5 mb-0">{formatarMoeda(liquido)}</p>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="pagamentoStatus">
                  Situação da cobrança
                </label>
                <select
                  id="pagamentoStatus"
                  name="pagamentoStatus"
                  className="form-select"
                  value={valores.pagamentoStatus}
                  onChange={form.mudar}
                >
                  <option value={PAGAMENTO.PENDENTE}>Pendente</option>
                  <option value={PAGAMENTO.PAGO}>Pago</option>
                  <option value={PAGAMENTO.CONVENIO}>Faturar no convênio</option>
                  <option value={PAGAMENTO.ISENTO}>Isento</option>
                </select>
              </div>

              {valores.pagamentoStatus === PAGAMENTO.PAGO && (
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
          </div>
        </div>
      </form>
    </Modal>
  )
}
