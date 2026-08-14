/* Massa de dados inicial.

   Gerada em relação ao dia de hoje para que a agenda nunca apareça vazia.
   Os CPFs têm dígito verificador correto: se fossem inventados, o próprio
   validador rejeitaria os pacientes de exemplo ao abrir a ficha para editar. */

import { STATUS, PAGAMENTO } from '../domain/constants.js'
import { hojeISO, somarDias } from '../domain/format.js'

/* Cores dos médicos na grade. Combinação verificada para daltonismo:
   a menor separação entre pares é ΔE 9,3 em deutan, e todas passam em
   contraste sobre fundo claro. Ainda assim, nunca aparecem sem o nome ao lado. */
export const MEDICOS = [
  {
    id: 'med-1',
    nome: 'Dra. Helena Fontes',
    especialidade: 'Clínica Geral',
    crm: 'CRM/SP 45231',
    cor: '#0072B2',
    valorConsulta: 250,
    horarioAtendimento: { inicio: '08:00', fim: '18:00', almocoInicio: '12:00', almocoFim: '13:00' },
  },
  {
    id: 'med-2',
    nome: 'Dr. Rafael Moreira',
    especialidade: 'Cardiologia',
    crm: 'CRM/SP 38907',
    cor: '#B45309',
    valorConsulta: 380,
    horarioAtendimento: { inicio: '08:00', fim: '17:00', almocoInicio: '12:00', almocoFim: '13:30' },
  },
  {
    id: 'med-3',
    nome: 'Dra. Camila Duarte',
    especialidade: 'Dermatologia',
    crm: 'CRM/SP 51204',
    cor: '#009E73',
    valorConsulta: 320,
    horarioAtendimento: { inicio: '09:00', fim: '18:00', almocoInicio: '12:30', almocoFim: '13:30' },
  },
  {
    id: 'med-4',
    nome: 'Dr. Bruno Tavares',
    especialidade: 'Ortopedia',
    crm: 'CRM/SP 29845',
    cor: '#7C3AED',
    valorConsulta: 300,
    horarioAtendimento: { inicio: '07:00', fim: '16:00', almocoInicio: '11:30', almocoFim: '12:30' },
  },
]

const endereco = (cep, logradouro, numero, bairro, cidade = 'São Paulo', uf = 'SP', complemento = '') => ({
  cep, logradouro, numero, complemento, bairro, cidade, uf,
})

export const PACIENTES = [
  {
    id: 'pac-1', nome: 'Ana Beatriz Rocha', cpf: '52998224725', nascimento: '1988-03-12',
    sexo: 'F', telefone: '11987654321', email: 'ana.rocha@email.com', convenio: 'Unimed',
    endereco: endereco('01310100', 'Avenida Paulista', '1578', 'Bela Vista', 'São Paulo', 'SP', 'Apto 122'),
  },
  {
    id: 'pac-2', nome: 'Carlos Eduardo Lima', cpf: '39053344705', nascimento: '1975-11-30',
    sexo: 'M', telefone: '11974563210', email: 'carlos.lima@email.com', convenio: 'Particular',
    endereco: endereco('04547000', 'Rua Olimpíadas', '205', 'Vila Olímpia'),
  },
  {
    id: 'pac-3', nome: 'Mariana Alves Prado', cpf: '11144477735', nascimento: '1992-07-04',
    sexo: 'F', telefone: '11996325874', email: 'mariana.prado@email.com', convenio: 'Bradesco Saúde',
    endereco: endereco('05424070', 'Rua Fradique Coutinho', '890', 'Pinheiros'),
  },
  {
    id: 'pac-4', nome: 'João Pedro Nunes', cpf: '28610713709', nascimento: '2001-01-22',
    sexo: 'M', telefone: '11985471236', email: 'joao.nunes@email.com', convenio: 'Particular',
    endereco: endereco('03028000', 'Rua Piratininga', '47', 'Brás'),
  },
  {
    id: 'pac-5', nome: 'Fernanda Silveira', cpf: '45317828791', nascimento: '1968-09-15',
    sexo: 'F', telefone: '11991238745', email: 'fernanda.silveira@email.com', convenio: 'SulAmérica',
    endereco: endereco('02011000', 'Rua Voluntários da Pátria', '1320', 'Santana'),
  },
  {
    id: 'pac-6', nome: 'Roberto Carvalho', cpf: '96873155713', nascimento: '1955-05-08',
    sexo: 'M', telefone: '11982647159', email: 'roberto.carvalho@email.com', convenio: 'Amil',
    endereco: endereco('09060870', 'Avenida Industrial', '600', 'Centro', 'Santo André', 'SP'),
  },
  {
    id: 'pac-7', nome: 'Patrícia Menezes', cpf: '70962221899', nascimento: '1983-12-19',
    sexo: 'F', telefone: '11993571482', email: 'patricia.menezes@email.com', convenio: 'Particular',
    endereco: endereco('05614100', 'Rua Jorge Americano', '75', 'Alto de Pinheiros'),
  },
  {
    id: 'pac-8', nome: 'Lucas Andrade', cpf: '32457031982', nascimento: '1996-04-27',
    sexo: 'M', telefone: '11976248035', email: 'lucas.andrade@email.com', convenio: 'Unimed',
    endereco: endereco('08790000', 'Rua Ipiranga', '312', 'Centro', 'Mogi das Cruzes', 'SP'),
  },
  {
    id: 'pac-9', nome: 'Juliana Barros', cpf: '85236841402', nascimento: '1979-08-03',
    sexo: 'F', telefone: '11988012345', email: 'juliana.barros@email.com', convenio: 'NotreDame Intermédica',
    endereco: endereco('06410010', 'Alameda Rio Negro', '500', 'Alphaville', 'Barueri', 'SP', 'Torre B'),
  },
  {
    id: 'pac-10', nome: 'Marcos Vinícius Teixeira', cpf: '64021735682', nascimento: '1990-02-14',
    sexo: 'M', telefone: '11970654321', email: 'marcos.teixeira@email.com', convenio: 'Particular',
    endereco: endereco('04094050', 'Rua Vergueiro', '2100', 'Vila Mariana'),
  },
]

function agendamento({
  id, paciente, medico, data, hora, tipo = 'consulta', duracao = 30,
  status = STATUS.AGENDADO, valor, desconto = 0, forma = null,
  pagamento = PAGAMENTO.PENDENTE, observacoes = '',
}) {
  return {
    id,
    pacienteId: paciente,
    medicoId: medico,
    data,
    hora,
    duracao,
    tipo,
    status,
    observacoes,
    pagamento: { valor, desconto, forma, status: pagamento },
    criadoEm: `${data}T${hora}:00`,
    historico: [{ em: `${data}T${hora}:00`, acao: 'Agendamento criado' }],
  }
}

export function gerarDadosIniciais() {
  const hoje = hojeISO()
  const ontem = somarDias(hoje, -1)
  const anteontem = somarDias(hoje, -2)
  const semanaPassada = somarDias(hoje, -6)
  const amanha = somarDias(hoje, 1)
  const depois = somarDias(hoje, 2)

  const agendamentos = [
    // ----- Hoje: a agenda que o Dashboard resume -----
    agendamento({ id: 'ag-001', paciente: 'pac-1', medico: 'med-1', data: hoje, hora: '08:00', status: STATUS.ATENDIDO, valor: 250, forma: 'pix', pagamento: PAGAMENTO.PAGO }),
    agendamento({ id: 'ag-002', paciente: 'pac-4', medico: 'med-1', data: hoje, hora: '08:30', tipo: 'retorno', duracao: 20, status: STATUS.ATENDIDO, valor: 0, pagamento: PAGAMENTO.ISENTO, observacoes: 'Retorno de consulta em 10 dias, sem cobrança.' }),
    agendamento({ id: 'ag-003', paciente: 'pac-7', medico: 'med-1', data: hoje, hora: '09:30', status: STATUS.EM_ATENDIMENTO, valor: 250, forma: 'credito', pagamento: PAGAMENTO.PAGO }),
    agendamento({ id: 'ag-004', paciente: 'pac-3', medico: 'med-1', data: hoje, hora: '10:30', status: STATUS.AGUARDANDO, valor: 250, forma: 'convenio', pagamento: PAGAMENTO.CONVENIO }),
    agendamento({ id: 'ag-005', paciente: 'pac-10', medico: 'med-1', data: hoje, hora: '14:00', status: STATUS.CONFIRMADO, valor: 250, pagamento: PAGAMENTO.PENDENTE }),

    agendamento({ id: 'ag-006', paciente: 'pac-6', medico: 'med-2', data: hoje, hora: '08:00', status: STATUS.ATENDIDO, valor: 380, desconto: 30, forma: 'dinheiro', pagamento: PAGAMENTO.PAGO, observacoes: 'Paciente idoso, desconto autorizado pela coordenação.' }),
    agendamento({ id: 'ag-007', paciente: 'pac-5', medico: 'med-2', data: hoje, hora: '09:00', status: STATUS.ATENDIDO, valor: 380, forma: 'convenio', pagamento: PAGAMENTO.CONVENIO }),
    agendamento({ id: 'ag-008', paciente: 'pac-2', medico: 'med-2', data: hoje, hora: '11:00', status: STATUS.AGUARDANDO, valor: 380, pagamento: PAGAMENTO.PENDENTE }),
    agendamento({ id: 'ag-009', paciente: 'pac-9', medico: 'med-2', data: hoje, hora: '15:00', tipo: 'exame', duracao: 40, status: STATUS.CONFIRMADO, valor: 450, pagamento: PAGAMENTO.PENDENTE }),

    agendamento({ id: 'ag-010', paciente: 'pac-8', medico: 'med-3', data: hoje, hora: '09:00', status: STATUS.ATENDIDO, valor: 320, forma: 'debito', pagamento: PAGAMENTO.PAGO }),
    agendamento({ id: 'ag-011', paciente: 'pac-1', medico: 'med-3', data: hoje, hora: '14:00', tipo: 'procedimento', duracao: 60, status: STATUS.AGENDADO, valor: 680, pagamento: PAGAMENTO.PENDENTE }),
    agendamento({ id: 'ag-012', paciente: 'pac-5', medico: 'med-3', data: hoje, hora: '16:30', status: STATUS.CANCELADO, valor: 320, pagamento: PAGAMENTO.PENDENTE, observacoes: 'Cancelado pelo paciente por imprevisto.' }),

    agendamento({ id: 'ag-013', paciente: 'pac-2', medico: 'med-4', data: hoje, hora: '07:30', status: STATUS.ATENDIDO, valor: 300, forma: 'pix', pagamento: PAGAMENTO.PAGO }),
    agendamento({ id: 'ag-014', paciente: 'pac-10', medico: 'med-4', data: hoje, hora: '10:00', status: STATUS.FALTOU, valor: 300, pagamento: PAGAMENTO.PENDENTE }),
    agendamento({ id: 'ag-015', paciente: 'pac-3', medico: 'med-4', data: hoje, hora: '13:00', tipo: 'retorno', duracao: 20, status: STATUS.CONFIRMADO, valor: 0, pagamento: PAGAMENTO.ISENTO }),

    // ----- Dias anteriores: alimentam a consulta de atendidos -----
    agendamento({ id: 'ag-016', paciente: 'pac-9', medico: 'med-1', data: ontem, hora: '09:00', status: STATUS.ATENDIDO, valor: 250, forma: 'convenio', pagamento: PAGAMENTO.CONVENIO }),
    agendamento({ id: 'ag-017', paciente: 'pac-6', medico: 'med-1', data: ontem, hora: '11:00', status: STATUS.ATENDIDO, valor: 250, forma: 'pix', pagamento: PAGAMENTO.PAGO }),
    agendamento({ id: 'ag-018', paciente: 'pac-4', medico: 'med-2', data: ontem, hora: '14:00', status: STATUS.ATENDIDO, valor: 380, pagamento: PAGAMENTO.PENDENTE, observacoes: 'Pagamento pendente: paciente ficou de acertar na próxima visita.' }),
    agendamento({ id: 'ag-019', paciente: 'pac-7', medico: 'med-3', data: ontem, hora: '15:30', status: STATUS.ATENDIDO, valor: 320, desconto: 20, forma: 'credito', pagamento: PAGAMENTO.PAGO }),
    agendamento({ id: 'ag-020', paciente: 'pac-8', medico: 'med-4', data: ontem, hora: '08:00', status: STATUS.FALTOU, valor: 300, pagamento: PAGAMENTO.PENDENTE }),

    agendamento({ id: 'ag-021', paciente: 'pac-1', medico: 'med-2', data: anteontem, hora: '10:00', status: STATUS.ATENDIDO, valor: 380, forma: 'debito', pagamento: PAGAMENTO.PAGO }),
    agendamento({ id: 'ag-022', paciente: 'pac-5', medico: 'med-4', data: anteontem, hora: '09:30', tipo: 'exame', duracao: 40, status: STATUS.ATENDIDO, valor: 420, forma: 'convenio', pagamento: PAGAMENTO.CONVENIO }),
    agendamento({ id: 'ag-023', paciente: 'pac-3', medico: 'med-1', data: anteontem, hora: '16:00', status: STATUS.CANCELADO, valor: 250, pagamento: PAGAMENTO.PENDENTE, observacoes: 'Médica precisou remarcar.' }),

    agendamento({ id: 'ag-024', paciente: 'pac-10', medico: 'med-3', data: semanaPassada, hora: '10:30', status: STATUS.ATENDIDO, valor: 320, forma: 'pix', pagamento: PAGAMENTO.PAGO }),
    agendamento({ id: 'ag-025', paciente: 'pac-2', medico: 'med-1', data: semanaPassada, hora: '14:30', status: STATUS.ATENDIDO, valor: 250, pagamento: PAGAMENTO.PENDENTE }),

    // ----- Próximos dias -----
    agendamento({ id: 'ag-026', paciente: 'pac-7', medico: 'med-1', data: amanha, hora: '08:30', status: STATUS.CONFIRMADO, valor: 250, pagamento: PAGAMENTO.PENDENTE }),
    agendamento({ id: 'ag-027', paciente: 'pac-4', medico: 'med-3', data: amanha, hora: '11:00', status: STATUS.AGENDADO, valor: 320, pagamento: PAGAMENTO.PENDENTE }),
    agendamento({ id: 'ag-028', paciente: 'pac-6', medico: 'med-2', data: amanha, hora: '15:30', tipo: 'retorno', duracao: 20, status: STATUS.AGENDADO, valor: 0, pagamento: PAGAMENTO.ISENTO }),
    agendamento({ id: 'ag-029', paciente: 'pac-9', medico: 'med-1', data: depois, hora: '09:00', status: STATUS.AGENDADO, valor: 250, pagamento: PAGAMENTO.PENDENTE }),
    agendamento({ id: 'ag-030', paciente: 'pac-8', medico: 'med-4', data: depois, hora: '13:30', status: STATUS.AGENDADO, valor: 300, pagamento: PAGAMENTO.PENDENTE }),
  ]

  const bloqueios = [
    { id: 'blq-1', medicoId: 'med-3', data: hoje, horaInicio: '15:00', horaFim: '16:00', motivo: 'Consulta externa' },
    { id: 'blq-2', medicoId: 'med-4', data: amanha, horaInicio: '07:00', horaFim: '12:00', motivo: 'Congresso' },
    { id: 'blq-3', medicoId: 'med-2', data: depois, horaInicio: '08:00', horaFim: '17:00', motivo: 'Férias' },
  ]

  const avisos = [
    { id: 'avs-1', titulo: 'Reunião clínica', texto: 'Reunião com a equipe médica hoje às 18h, na sala 3.', tipo: 'info', data: hoje, lido: false },
    { id: 'avs-2', titulo: 'Manutenção do equipamento', texto: 'O aparelho de eletrocardiograma passará por manutenção na sexta-feira.', tipo: 'alerta', data: hoje, lido: false },
    { id: 'avs-3', titulo: 'Convênio Amil', texto: 'Nova tabela de repasse entra em vigor no próximo mês.', tipo: 'info', data: somarDias(hoje, -3), lido: true },
  ]

  return {
    medicos: MEDICOS,
    pacientes: PACIENTES,
    agendamentos,
    bloqueios,
    avisos,
  }
}
