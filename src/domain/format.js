/* Formatação e manipulação de datas, valores e documentos.

   Datas circulam pela aplicação como texto 'AAAA-MM-DD' e horários como
   'HH:MM'. Motivo: new Date('2026-08-14') é interpretado como meia-noite UTC,
   que no Brasil (UTC-3) volta como dia 13. Guardar texto elimina a classe
   inteira desse bug; onde um objeto Date é necessário, ele é montado pelo
   construtor de partes, que usa o fuso local. */

const LOCALE = 'pt-BR'

const moeda = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'BRL' })
const dataExtensa = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
const diaSemanaCurto = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' })

export function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

/* ---------- Datas ---------- */

export function hojeISO() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/* Converte 'AAAA-MM-DD' em Date no fuso local, sem passar pelo parser de
   string do JavaScript. */
export function paraData(iso) {
  const [ano, mes, dia] = String(iso).split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

export function paraISO(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

export function formatarData(iso) {
  if (!iso) return ''
  const [ano, mes, dia] = String(iso).split('-')
  return `${dia}/${mes}/${ano}`
}

/* O Intl devolve o dia da semana em minúsculas ("sábado, 15 de agosto de
   2026"). A capitalização é feita aqui, e não com a classe text-capitalize do
   Bootstrap, porque aquela capitaliza todas as palavras e produziria
   "Sábado, 15 De Agosto De 2026". */
export function formatarDataExtenso(iso) {
  if (!iso) return ''
  const texto = dataExtensa.format(paraData(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function formatarDiaSemana(iso) {
  if (!iso) return ''
  return diaSemanaCurto.format(paraData(iso)).replace('.', '')
}

export function somarDias(iso, dias) {
  const data = paraData(iso)
  data.setDate(data.getDate() + dias)
  return paraISO(data)
}

export function ehHoje(iso) {
  return iso === hojeISO()
}

export function horaAtual() {
  const agora = new Date()
  return `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
}

export function calcularIdade(nascimentoISO) {
  if (!nascimentoISO) return null
  const nascimento = paraData(nascimentoISO)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const mes = hoje.getMonth() - nascimento.getMonth()
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--
  return idade
}

/* ---------- Horários ---------- */

export function horaParaMinutos(hora) {
  const [h, m] = String(hora).split(':').map(Number)
  return h * 60 + m
}

export function minutosParaHora(minutos) {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0')
  const m = String(minutos % 60).padStart(2, '0')
  return `${h}:${m}`
}

export function somarMinutos(hora, minutos) {
  return minutosParaHora(horaParaMinutos(hora) + minutos)
}

/* ---------- Valores ---------- */

export function formatarMoeda(valor) {
  return moeda.format(Number(valor) || 0)
}

/* Aceita '1.234,56' ou '1234.56' e devolve número. */
export function paraNumero(valor) {
  if (typeof valor === 'number') return valor
  const limpo = String(valor ?? '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const numero = Number(limpo)
  return Number.isFinite(numero) ? numero : 0
}

/* ---------- Documentos e contato ---------- */

export function formatarCPF(valor) {
  const d = somenteDigitos(valor).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

export function formatarTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function formatarCEP(valor) {
  return somenteDigitos(valor).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
}

export function primeiroNome(nome) {
  return String(nome ?? '').trim().split(' ')[0]
}

export function iniciais(nome) {
  const partes = String(nome ?? '').trim().split(/\s+/)
  if (partes.length === 0) return ''
  const primeira = partes[0][0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}
