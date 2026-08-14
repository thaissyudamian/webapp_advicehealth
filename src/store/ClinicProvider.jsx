/* Estado global da aplicação.

   useReducer em vez de vários useState porque as operações mexem em mais de
   uma coleção ao mesmo tempo (salvar um agendamento pode cadastrar o paciente
   junto) e porque cada transição fica nomeada em um lugar só. */

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import * as servico from '../services/clinicaService.js'
import { ClinicContext } from './clinicContext.js'

const ESTADO_INICIAL = {
  carregando: true,
  erro: null,
  medicos: [],
  pacientes: [],
  agendamentos: [],
  bloqueios: [],
  avisos: [],
}

const substituirOuIncluir = (lista, item) =>
  lista.some((atual) => atual.id === item.id)
    ? lista.map((atual) => (atual.id === item.id ? item : atual))
    : [...lista, item]

function reducer(estado, acao) {
  switch (acao.tipo) {
    case 'CARREGADO':
      return { ...estado, ...acao.dados, carregando: false, erro: null }

    case 'FALHOU':
      return { ...estado, carregando: false, erro: acao.erro }

    case 'PACIENTE_SALVO':
      return { ...estado, pacientes: substituirOuIncluir(estado.pacientes, acao.paciente) }

    case 'AGENDAMENTO_SALVO':
      return { ...estado, agendamentos: substituirOuIncluir(estado.agendamentos, acao.agendamento) }

    case 'BLOQUEIO_SALVO':
      return { ...estado, bloqueios: substituirOuIncluir(estado.bloqueios, acao.bloqueio) }

    case 'BLOQUEIO_REMOVIDO':
      return { ...estado, bloqueios: estado.bloqueios.filter((b) => b.id !== acao.id) }

    case 'AVISO_LIDO':
      return {
        ...estado,
        avisos: estado.avisos.map((a) => (a.id === acao.id ? { ...a, lido: true } : a)),
      }

    default:
      throw new Error(`Ação desconhecida: ${acao.tipo}`)
  }
}

export function ClinicProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, ESTADO_INICIAL)

  // Evita gravar de volta o mesmo conteúdo que acabou de ser lido.
  const jaCarregou = useRef(false)

  useEffect(() => {
    let ativo = true
    servico
      .carregar()
      .then((dados) => ativo && dispatch({ tipo: 'CARREGADO', dados }))
      .catch((erro) => ativo && dispatch({ tipo: 'FALHOU', erro: erro.message }))
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    if (estado.carregando || estado.erro) return
    if (!jaCarregou.current) {
      jaCarregou.current = true
      return
    }
    servico.persistir(estado)
  }, [estado])

  /* Ações. Todas assíncronas para que a interface possa mostrar "salvando"
     e para que a troca por uma API real não mude a assinatura. */

  const salvarPaciente = useCallback(async (dados) => {
    const paciente = { ...dados, id: dados.id ?? crypto.randomUUID() }
    await servico.confirmarEscrita()
    dispatch({ tipo: 'PACIENTE_SALVO', paciente })
    return paciente
  }, [])

  const salvarAgendamento = useCallback(async (dados, { acao = 'Agendamento alterado' } = {}) => {
    const novo = !dados.id
    const agendamento = {
      ...dados,
      id: dados.id ?? crypto.randomUUID(),
      criadoEm: dados.criadoEm ?? new Date().toISOString(),
      historico: [
        ...(dados.historico ?? []),
        { em: new Date().toISOString(), acao: novo ? 'Agendamento criado' : acao },
      ],
    }
    await servico.confirmarEscrita()
    dispatch({ tipo: 'AGENDAMENTO_SALVO', agendamento })
    return agendamento
  }, [])

  const alterarStatus = useCallback(
    async (id, status, detalhe) => {
      const atual = estado.agendamentos.find((a) => a.id === id)
      if (!atual) throw new Error('Agendamento não encontrado')

      const agendamento = {
        ...atual,
        status,
        historico: [
          ...atual.historico,
          { em: new Date().toISOString(), acao: `Situação alterada para ${status}`, detalhe },
        ],
      }
      await servico.confirmarEscrita()
      dispatch({ tipo: 'AGENDAMENTO_SALVO', agendamento })
      return agendamento
    },
    [estado.agendamentos]
  )

  const salvarBloqueio = useCallback(async (dados) => {
    const bloqueio = { ...dados, id: dados.id ?? crypto.randomUUID() }
    await servico.confirmarEscrita()
    dispatch({ tipo: 'BLOQUEIO_SALVO', bloqueio })
    return bloqueio
  }, [])

  const removerBloqueio = useCallback(async (id) => {
    await servico.confirmarEscrita()
    dispatch({ tipo: 'BLOQUEIO_REMOVIDO', id })
  }, [])

  const marcarAvisoLido = useCallback((id) => {
    dispatch({ tipo: 'AVISO_LIDO', id })
  }, [])

  const restaurarExemplo = useCallback(async () => {
    const dados = await servico.restaurarExemplo()
    dispatch({ tipo: 'CARREGADO', dados })
  }, [])

  const valor = useMemo(
    () => ({
      ...estado,
      salvarPaciente,
      salvarAgendamento,
      alterarStatus,
      salvarBloqueio,
      removerBloqueio,
      marcarAvisoLido,
      restaurarExemplo,
    }),
    [estado, salvarPaciente, salvarAgendamento, alterarStatus, salvarBloqueio, removerBloqueio, marcarAvisoLido, restaurarExemplo]
  )

  return <ClinicContext.Provider value={valor}>{children}</ClinicContext.Provider>
}
