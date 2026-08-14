/* Persistência da aplicação.

   Toda a leitura e escrita passa por aqui. Se um dia existir uma API de
   verdade, é este arquivo que muda — o restante da aplicação não sabe que
   os dados vêm do navegador. */

import { gerarDadosIniciais } from '../data/seed.js'

const CHAVE = 'consultorio:dados:v1'

/* Latência artificial: sem ela os estados de carregamento e os botões
   "salvando..." nunca apareceriam em desenvolvimento, e a interface pareceria
   correta até ser ligada a um servidor real. */
const LATENCIA_LEITURA = 400
const LATENCIA_ESCRITA = 350

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function gravar(dados) {
  const { medicos, pacientes, agendamentos, bloqueios, avisos } = dados
  localStorage.setItem(CHAVE, JSON.stringify({ medicos, pacientes, agendamentos, bloqueios, avisos }))
}

export async function carregar() {
  await esperar(LATENCIA_LEITURA)

  const bruto = localStorage.getItem(CHAVE)
  if (bruto) {
    try {
      return JSON.parse(bruto)
    } catch {
      // Conteúdo corrompido ou de uma versão anterior: recomeça do exemplo
      // em vez de deixar a aplicação sem dados.
      localStorage.removeItem(CHAVE)
    }
  }

  const iniciais = gerarDadosIniciais()
  gravar(iniciais)
  return iniciais
}

export function persistir(dados) {
  gravar(dados)
}

export async function restaurarExemplo() {
  await esperar(LATENCIA_LEITURA)
  const iniciais = gerarDadosIniciais()
  gravar(iniciais)
  return iniciais
}

/* Simula o tempo de ida e volta de uma gravação no servidor. */
export async function confirmarEscrita() {
  await esperar(LATENCIA_ESCRITA)
}
