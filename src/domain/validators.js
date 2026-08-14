/* Validadores de campo.

   Convenção: devolvem null quando o valor é válido e a mensagem de erro
   quando não é. Isso permite compor validações e alimentar direto o
   invalid-feedback do Bootstrap, sem cada campo inventar o próprio formato. */

import { somenteDigitos, paraData, hojeISO, paraNumero } from './format.js'

export function obrigatorio(valor, mensagem = 'Campo obrigatório') {
  if (valor === null || valor === undefined) return mensagem
  if (typeof valor === 'string' && valor.trim() === '') return mensagem
  return null
}

export function nomeCompleto(valor) {
  const faltando = obrigatorio(valor, 'Informe o nome do paciente')
  if (faltando) return faltando
  const partes = valor.trim().split(/\s+/)
  if (partes.length < 2 || partes.some((p) => p.length < 2)) {
    return 'Informe nome e sobrenome'
  }
  return null
}

/* Algoritmo oficial do dígito verificador: cada um dos nove primeiros dígitos
   é multiplicado por um peso decrescente, e o resto da divisão por 11 define
   o dígito. O segundo dígito repete o cálculo já incluindo o primeiro. */
export function cpf(valor) {
  const faltando = obrigatorio(valor, 'Informe o CPF')
  if (faltando) return faltando

  const digitos = somenteDigitos(valor)
  if (digitos.length !== 11) return 'O CPF deve ter 11 dígitos'

  // Sequências repetidas passam no cálculo, mas não são CPFs válidos.
  if (/^(\d)\1{10}$/.test(digitos)) return 'CPF inválido'

  const calcularDigito = (base) => {
    let peso = base.length + 1
    let soma = 0
    for (const digito of base) soma += Number(digito) * peso--
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  const primeiro = calcularDigito(digitos.slice(0, 9))
  const segundo = calcularDigito(digitos.slice(0, 9) + primeiro)

  if (primeiro !== Number(digitos[9]) || segundo !== Number(digitos[10])) {
    return 'CPF inválido'
  }
  return null
}

export function email(valor, { exigido = false } = {}) {
  if (!valor?.trim()) return exigido ? 'Informe o e-mail' : null
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim()) ? null : 'E-mail inválido'
}

export function telefone(valor, { exigido = true } = {}) {
  if (!valor?.trim()) return exigido ? 'Informe o telefone' : null
  const digitos = somenteDigitos(valor)
  if (digitos.length < 10 || digitos.length > 11) return 'Telefone inválido'
  return null
}

export function cep(valor, { exigido = true } = {}) {
  if (!valor?.trim()) return exigido ? 'Informe o CEP' : null
  return somenteDigitos(valor).length === 8 ? null : 'CEP inválido'
}

export function dataNascimento(valor) {
  const faltando = obrigatorio(valor, 'Informe a data de nascimento')
  if (faltando) return faltando
  if (valor > hojeISO()) return 'A data não pode ser futura'

  const idade = new Date().getFullYear() - paraData(valor).getFullYear()
  if (idade > 120) return 'Verifique a data informada'
  return null
}

export function dataAgendamento(valor, { permitirPassado = true } = {}) {
  const faltando = obrigatorio(valor, 'Informe a data')
  if (faltando) return faltando
  if (!permitirPassado && valor < hojeISO()) return 'A data não pode ser anterior a hoje'
  return null
}

export function valorMonetario(valor, { minimo = 0, exigido = true } = {}) {
  if (valor === '' || valor === null || valor === undefined) {
    return exigido ? 'Informe o valor' : null
  }
  const numero = paraNumero(valor)
  if (numero < minimo) return `O valor não pode ser menor que ${minimo}`
  return null
}

export function intervaloHorario(inicio, fim) {
  if (obrigatorio(inicio) || obrigatorio(fim)) return 'Informe o período completo'
  if (fim <= inicio) return 'O horário final deve ser maior que o inicial'
  return null
}

/* Roda um mapa { campo: () => mensagem|null } e devolve só os campos com erro. */
export function validarCampos(regras) {
  const erros = {}
  for (const [campo, regra] of Object.entries(regras)) {
    const mensagem = regra()
    if (mensagem) erros[campo] = mensagem
  }
  return erros
}
