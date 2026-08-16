import type { Member } from '@/types'

const AV = (seed: string) => `https://i.pravatar.cc/150?u=${seed}`

export const members: Member[] = [
  {
    id: 'MEM-001', name: 'João Carlos da Silva', email: 'joao.silva@igrejahub.com', phone: '(41) 99874-5512',
    congregation: 'Congregação Central', role: 'Diácono', status: 'Ativo', avatar: AV('joao-carlos'),
    birthDate: '14/08/1988', gender: 'Masculino', maritalStatus: 'Casado', profession: 'Engenheiro Civil',
    baptismDate: '10/10/2024', memberSince: '22/09/2024', address: 'Rua das Flores, 120 - Curitiba/PR',
    notes: 'João atua de forma ativa na coordenação dos cultos dominicais e apoia o departamento de patrimônio. Sempre presente nos mutirões voluntários da Sede de Curitiba.',
  },
  {
    id: 'MEM-002', name: 'Ana Maria Souza', email: 'ana.maria@gmail.com', phone: '(41) 98822-1144',
    congregation: 'Congregação Central', role: 'Membro', status: 'Ativo', avatar: AV('ana-maria'),
    birthDate: '02/03/1990', gender: 'Feminino', maritalStatus: 'Solteira', profession: 'Professora',
    baptismDate: '05/06/2019', memberSince: '05/06/2019', address: 'Av. Batel, 890 - Curitiba/PR',
    notes: 'Participa do ministério de louvor e da escola bíblica dominical.',
  },
  {
    id: 'MEM-003', name: 'Mateus Oliveira Prado', email: 'mateus.oliveira@outlook.com', phone: '(41) 99115-6677',
    congregation: 'Congregação Água Verde', role: 'Líder de Jovens', status: 'Ativo', avatar: AV('mateus-oliveira'),
    birthDate: '19/11/1996', gender: 'Masculino', maritalStatus: 'Solteiro', profession: 'Designer',
    baptismDate: '12/12/2015', memberSince: '12/12/2015', address: 'Rua Água Verde, 452 - Curitiba/PR',
    notes: 'Coordena o ministério jovem e os encontros de discipulado.',
  },
  {
    id: 'MEM-004', name: 'Beatriz Santos Ribeiro', email: 'beatriz.santos@yahoo.com', phone: '(41) 99554-3322',
    congregation: 'Congregação Cabral', role: 'Membro', status: 'Inativo', avatar: AV('beatriz-santos'),
    birthDate: '30/01/1985', gender: 'Feminino', maritalStatus: 'Casada', profession: 'Enfermeira',
    baptismDate: '20/04/2010', memberSince: '20/04/2010', address: 'Rua Cabral, 77 - Curitiba/PR',
    notes: 'Mudou-se de cidade recentemente, acompanhamento pastoral em andamento.',
  },
  {
    id: 'MEM-005', name: 'Pr. Carlos Eduardo', email: 'carlos.eduardo@igrejahub.com', phone: '(41) 99911-8833',
    congregation: 'Congregação Central', role: 'Pastor Principal', status: 'Ativo', avatar: AV('carlos-eduardo'),
    birthDate: '08/05/1975', gender: 'Masculino', maritalStatus: 'Casado', profession: 'Pastor',
    baptismDate: '01/01/1995', memberSince: '01/01/1995', address: 'Av. Sete de Setembro, 4520 - Curitiba/PR',
    notes: 'Pastor titular da Sede Central de Curitiba desde 2005.',
  },
  {
    id: 'MEM-006', name: 'Mariana Costa Lima', email: 'mari.lima@gmail.com', phone: '(41) 98445-9922',
    congregation: 'Ponto Sítio Cercado', role: 'Visitante', status: 'Visitante', avatar: AV('mariana-costa'),
    birthDate: '25/07/2000', gender: 'Feminino', maritalStatus: 'Solteira', profession: 'Estudante',
    baptismDate: '—', memberSince: '02/06/2026', address: 'Rua Sítio Cercado, 300 - Curitiba/PR',
    notes: 'Primeira visita registrada em junho de 2026.',
  },
  {
    id: 'MEM-007', name: 'Ricardo Dias Gomes', email: 'ricardo.dias@hotmail.com', phone: '(41) 98771-4455',
    congregation: 'Congregação Batel', role: 'Membro', status: 'Ativo', avatar: AV('ricardo-dias'),
    birthDate: '11/09/1982', gender: 'Masculino', maritalStatus: 'Casado', profession: 'Contador',
    baptismDate: '15/03/2008', memberSince: '15/03/2008', address: 'Rua Comendador Araújo, 210 - Curitiba/PR',
    notes: 'Auxilia a tesouraria da congregação do Batel.',
  },
  {
    id: 'MEM-008', name: 'Fernanda Alves Melo', email: 'nanda.alves@gmail.com', phone: '(41) 99655-7788',
    congregation: 'Congregação Cabral', role: 'Membro', status: 'Inativo', avatar: AV('fernanda-alves'),
    birthDate: '03/12/1993', gender: 'Feminino', maritalStatus: 'Solteira', profession: 'Nutricionista',
    baptismDate: '20/08/2012', memberSince: '20/08/2012', address: 'Rua Cabral, 500 - Curitiba/PR',
    notes: 'Ausência prolongada, aguardando visita pastoral.',
  },
  {
    id: 'MEM-009', name: 'Lucas Pereira Rocha', email: 'lucas.rocha@gmail.com', phone: '(41) 99001-2233',
    congregation: 'Sede Curitiba Centro', role: 'Membro', status: 'Ativo', avatar: AV('lucas-pereira'),
    birthDate: '17/02/1998', gender: 'Masculino', maritalStatus: 'Solteiro', profession: 'Analista de TI',
    baptismDate: '10/10/2016', memberSince: '10/10/2016', address: 'Rua XV de Novembro, 1200 - Curitiba/PR',
    notes: 'Membro da equipe de mídia e transmissão dos cultos.',
  },
  {
    id: 'MEM-010', name: 'Camila Ferreira Souza', email: 'camila.ferreira@gmail.com', phone: '(41) 98333-5566',
    congregation: 'Congregação Água Verde', role: 'Secretária', status: 'Ativo', avatar: AV('camila-ferreira'),
    birthDate: '22/06/1991', gender: 'Feminino', maritalStatus: 'Casada', profession: 'Administradora',
    baptismDate: '05/05/2011', memberSince: '05/05/2011', address: 'Rua Água Verde, 88 - Curitiba/PR',
    notes: 'Responsável pela secretaria e agenda da congregação.',
  },
]

export const congregationOptions = [
  'Todas', 'Sede Curitiba Centro', 'Congregação Central', 'Congregação Água Verde',
  'Congregação Batel', 'Congregação Cabral', 'Ponto Sítio Cercado',
]

export const roleOptions = [
  'Todas', 'Pastor Principal', 'Diácono', 'Líder de Jovens', 'Secretária', 'Membro', 'Visitante',
]
