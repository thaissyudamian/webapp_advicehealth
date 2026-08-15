import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useClinica } from '../store/clinicContext.js'
import { comRelacionados, filtrarAgendamentos, totaisDaConsulta, valorLiquido } from '../domain/selectors.js'
import {
  PAGAMENTO,
  PAGAMENTO_INFO,
  STATUS,
  STATUS_INFO,
  GRUPOS_CONSULTA,
  rotuloFormaPagamento,
  rotuloTipoConsulta,
} from '../domain/constants.js'
import { formatarCPF, formatarData, formatarMoeda, hojeISO, somarDias } from '../domain/format.js'

import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Badge } from '../components/ui/Badge.jsx'
import { EmptyState } from '../components/ui/EmptyState.jsx'
import { AgendamentoModal } from '../components/agenda/AgendamentoModal.jsx'
import { DetalheAgendamento } from '../components/agenda/DetalheAgendamento.jsx'
import { TransferirModal } from '../components/agenda/TransferirModal.jsx'

/* Consulta de pacientes agendados e atendidos.

   Os filtros ficam na URL para que os lembretes do painel possam apontar para
   a tela já filtrada — "5 pagamentos pendentes" leva para a lista desses
   cinco, em vez de deixar o usuário refazer o filtro na mão. */

const PERIODOS = [
  { rotulo: 'Hoje', de: () => hojeISO(), ate: () => hojeISO() },
  { rotulo: '7 dias', de: () => somarDias(hojeISO(), -7), ate: () => hojeISO() },
  { rotulo: '30 dias', de: () => somarDias(hojeISO(), -30), ate: () => hojeISO() },
  { rotulo: 'Tudo', de: () => '', ate: () => '' },
]

export function Agendamentos() {
  const clinica = useClinica()
  const [parametros, setParametros] = useSearchParams()

  const [selecionado, setSelecionado] = useState(null)
  const [editando, setEditando] = useState(null)
  const [transferindo, setTransferindo] = useState(null)

  const filtros = {
    busca: parametros.get('busca') ?? '',
    medicoId: parametros.get('medico') ?? '',
    status: parametros.get('status') ?? '',
    pagamento: parametros.get('pagamento') ?? '',
    de: parametros.get('de') ?? '',
    ate: parametros.get('ate') ?? '',
    grupo: parametros.get('grupo') ?? '',
    semCancelados: parametros.get('semCancelados') === '1',
  }

  const definirFiltro = (chave, valor) => {
    const novos = new URLSearchParams(parametros)
    if (valor) novos.set(chave, valor)
    else novos.delete(chave)
    setParametros(novos, { replace: true })
  }

  /* Grupo e situação são dois recortes do mesmo campo: escolher um limpa o
     outro, senão dá para montar uma combinação vazia por engano — "Atendidos"
     somado a "Cancelado" nunca retorna nada. */
  const definirGrupo = (grupo) => {
    const novos = new URLSearchParams(parametros)
    grupo ? novos.set('grupo', grupo) : novos.delete('grupo')
    novos.delete('status')
    setParametros(novos, { replace: true })
  }

  const aplicarPeriodo = (periodo) => {
    const novos = new URLSearchParams(parametros)
    const de = periodo.de()
    const ate = periodo.ate()
    de ? novos.set('de', de) : novos.delete('de')
    ate ? novos.set('ate', ate) : novos.delete('ate')
    setParametros(novos, { replace: true })
  }

  const resultados = useMemo(() => filtrarAgendamentos(clinica, filtros), [clinica, parametros]) // eslint-disable-line react-hooks/exhaustive-deps
  const totais = useMemo(() => totaisDaConsulta(resultados), [resultados])

  const temFiltro = Object.values(filtros).some(Boolean)

  const agendamentoAberto = selecionado
    ? comRelacionados(clinica, clinica.agendamentos.find((a) => a.id === selecionado))
    : null

  return (
    <>
      <PageHeader
        titulo="Agendamentos"
        descricao="Pacientes agendados e atendidos, com os dados do atendimento e da cobrança."
      />

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-12">
              {/* O escopo divide a consulta em dois grupos — agendados e
                  atendidos. Sem este controle, ver "todos os agendados" exigiria
                  quatro consultas separadas pelo filtro de situação, porque ele
                  expõe os sete estados do modelo em vez desses dois grupos. */}
              <div className="btn-group" role="group" aria-label="Exibir">
                <button
                  type="button"
                  className={`btn btn-outline-secondary${!filtros.grupo ? ' active' : ''}`}
                  aria-pressed={!filtros.grupo}
                  onClick={() => definirGrupo('')}
                >
                  Todos
                </button>
                {Object.entries(GRUPOS_CONSULTA).map(([chave, valor]) => (
                  <button
                    key={chave}
                    type="button"
                    className={`btn btn-outline-secondary${filtros.grupo === chave ? ' active' : ''}`}
                    aria-pressed={filtros.grupo === chave}
                    onClick={() => definirGrupo(chave)}
                  >
                    {valor.rotulo}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <label className="form-label" htmlFor="busca">
                Buscar
              </label>
              <div className="input-group">
                <span className="input-group-text" aria-hidden="true">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  id="busca"
                  type="search"
                  className="form-control"
                  placeholder="Nome do paciente ou CPF"
                  value={filtros.busca}
                  onChange={(e) => definirFiltro('busca', e.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <label className="form-label" htmlFor="filtro-medico">
                Médico
              </label>
              <select
                id="filtro-medico"
                className="form-select"
                value={filtros.medicoId}
                onChange={(e) => definirFiltro('medico', e.target.value)}
              >
                <option value="">Todos os médicos</option>
                {clinica.medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg-2">
              <label className="form-label" htmlFor="filtro-status">
                Situação
              </label>
              <select
                id="filtro-status"
                className="form-select"
                value={filtros.status}
                onChange={(e) => {
                  const novos = new URLSearchParams(parametros)
                  e.target.value ? novos.set('status', e.target.value) : novos.delete('status')
                  novos.delete('grupo')
                  setParametros(novos, { replace: true })
                }}
              >
                <option value="">Todas</option>
                {Object.values(STATUS).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_INFO[s].rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg-3">
              <label className="form-label" htmlFor="filtro-pagamento">
                Pagamento
              </label>
              <select
                id="filtro-pagamento"
                className="form-select"
                value={filtros.pagamento}
                onChange={(e) => definirFiltro('pagamento', e.target.value)}
              >
                <option value="">Todos</option>
                {Object.values(PAGAMENTO).map((p) => (
                  <option key={p} value={p}>
                    {PAGAMENTO_INFO[p].rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-lg-auto">
              <label className="form-label" htmlFor="filtro-de">
                Período
              </label>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <input
                  id="filtro-de"
                  name="filtro-de"
                  type="date"
                  className="form-control w-auto"
                  value={filtros.de}
                  onChange={(e) => definirFiltro('de', e.target.value)}
                  aria-label="Data inicial"
                />
                <span className="text-secondary">até</span>
                <input
                  id="filtro-ate"
                  name="filtro-ate"
                  type="date"
                  className="form-control w-auto"
                  value={filtros.ate}
                  onChange={(e) => definirFiltro('ate', e.target.value)}
                  aria-label="Data final"
                />
                <div className="btn-group btn-group-sm" role="group" aria-label="Períodos rápidos">
                  {PERIODOS.map((periodo) => (
                    <button
                      key={periodo.rotulo}
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => aplicarPeriodo(periodo)}
                    >
                      {periodo.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-auto">
              <div className="form-check mt-2">
                <input
                  id="filtro-cancelados"
                  type="checkbox"
                  className="form-check-input"
                  checked={filtros.semCancelados}
                  onChange={(e) => definirFiltro('semCancelados', e.target.checked ? '1' : '')}
                />
                <label className="form-check-label" htmlFor="filtro-cancelados">
                  Ocultar cancelados
                </label>
              </div>
            </div>

            {temFiltro && (
              <div className="col-12">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  onClick={() => setParametros({}, { replace: true })}
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h2 className="h6 mb-0">
              {resultados.length} {resultados.length === 1 ? 'registro' : 'registros'}
            </h2>
            <div className="d-flex flex-wrap gap-3 small">
              <span>
                Recebido <strong>{formatarMoeda(totais.recebido)}</strong>
              </span>
              <span className="text-secondary">
                A receber <strong>{formatarMoeda(totais.aReceber)}</strong>
              </span>
              <span className="text-secondary">
                Convênio <strong>{formatarMoeda(totais.convenio)}</strong>
              </span>
            </div>
          </div>

          {resultados.length === 0 ? (
            <EmptyState
              icone="bi-search"
              titulo="Nenhum agendamento encontrado"
              descricao={
                temFiltro
                  ? 'Nenhum registro corresponde aos filtros aplicados.'
                  : 'Os agendamentos criados na agenda aparecem aqui.'
              }
            >
              {temFiltro && (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setParametros({}, { replace: true })}
                >
                  Limpar filtros
                </button>
              )}
            </EmptyState>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Paciente</th>
                    <th scope="col">Data e hora</th>
                    <th scope="col">Médico</th>
                    <th scope="col">Situação</th>
                    <th scope="col">Pagamento</th>
                    <th scope="col" className="text-end">Valor</th>
                    <th scope="col" className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((item) => {
                    const situacao = STATUS_INFO[item.status]
                    const pagamento = PAGAMENTO_INFO[item.pagamento.status]
                    const cancelado = item.status === STATUS.CANCELADO

                    return (
                      <tr key={item.id} className={cancelado ? 'text-secondary' : undefined}>
                        <td>
                          <span className="d-block fw-semibold">{item.paciente?.nome}</span>
                          <span className="small text-secondary font-monospace">
                            {formatarCPF(item.paciente?.cpf)}
                          </span>
                        </td>
                        <td>
                          <span className="d-block font-monospace">
                            {formatarData(item.data)}{' '}
                            <span className="text-secondary">{item.hora}</span>
                          </span>
                          {/* O tipo explica por que dois registros do mesmo médico têm
                              valores diferentes — sem ele, um retorno isento parece
                              erro de cobrança. */}
                          <span className="small text-secondary">
                            {rotuloTipoConsulta(item.tipo)} · {item.duracao} min
                          </span>
                        </td>
                        <td>
                          <span
                            className="d-inline-block rounded-circle me-2 align-middle"
                            style={{ width: 10, height: 10, backgroundColor: item.medico?.cor }}
                            aria-hidden="true"
                          />
                          {item.medico?.nome}
                        </td>
                        <td>
                          <Badge rotulo={situacao.rotulo} cor={situacao.cor} icone={situacao.icone} />
                        </td>
                        <td>
                          <Badge rotulo={pagamento.rotulo} cor={pagamento.cor} />
                          {/* Como o valor entrou faz parte da informação de
                              cobrança — é o que o fechamento de caixa precisa. */}
                          {rotuloFormaPagamento(item.pagamento.forma) && (
                            <span className="d-block small text-secondary mt-1">
                              {rotuloFormaPagamento(item.pagamento.forma)}
                            </span>
                          )}
                        </td>
                        <td className="text-end font-monospace">
                          {formatarMoeda(valorLiquido(item.pagamento))}
                          {item.pagamento.desconto > 0 && (
                            <span className="d-block small text-secondary">
                              desc. {formatarMoeda(item.pagamento.desconto)}
                            </span>
                          )}
                        </td>
                        <td className="text-end text-nowrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            onClick={() => setSelecionado(item.id)}
                            aria-label={`Ver agendamento de ${item.paciente?.nome}`}
                          >
                            <i className="bi bi-eye" aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light ms-1"
                            onClick={() => setEditando(item)}
                            aria-label={`Editar agendamento de ${item.paciente?.nome}`}
                          >
                            <i className="bi bi-pencil" aria-hidden="true"></i>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Mesmo formulário da agenda: alterar o agendamento e alterar a cobrança
          são a mesma tela, e não duas implementações de validação. */}
      <AgendamentoModal
        aberto={Boolean(editando)}
        agendamento={editando}
        aoFechar={() => {
          setEditando(null)
          setSelecionado(null)
        }}
      />

      <DetalheAgendamento
        aberto={Boolean(agendamentoAberto) && !editando && !transferindo}
        agendamento={agendamentoAberto}
        aoFechar={() => setSelecionado(null)}
        aoAlterar={() => setEditando(agendamentoAberto)}
        aoTransferir={() => setTransferindo(agendamentoAberto)}
      />

      <TransferirModal
        aberto={Boolean(transferindo)}
        agendamento={transferindo}
        aoFechar={() => {
          setTransferindo(null)
          setSelecionado(null)
        }}
      />
    </>
  )
}
