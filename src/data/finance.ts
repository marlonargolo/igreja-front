import type { Transaction } from '@/types'

export const transactions: Transaction[] = [
  { id: 'TRX-001', date: '15/Mai/2026', description: 'Dízimo Culto de Domingo', category: 'Dízimo', congregation: 'Sede Curitiba Centro', amount: 4250, status: 'Confirmado', type: 'receita' },
  { id: 'TRX-002', date: '14/Mai/2026', description: 'Manutenção de Ar Condicionado', category: 'Manutenção', congregation: 'Congregação Água Verde', amount: -680, status: 'Confirmado', type: 'despesa' },
  { id: 'TRX-003', date: '12/Mai/2026', description: 'Oferta Missões Globais', category: 'Oferta', congregation: 'Sede Curitiba Centro', amount: 1500, status: 'Confirmado', type: 'receita' },
  { id: 'TRX-004', date: '10/Mai/2026', description: 'Fatura de Energia Elétrica', category: 'Utilidades', congregation: 'Congregação Batel', amount: -1240, status: 'Pendente', type: 'despesa' },
  { id: 'TRX-005', date: '08/Mai/2026', description: 'Compra de Novos Hinários', category: 'Equipamentos', congregation: 'Congregação Cabral', amount: -450, status: 'Confirmado', type: 'despesa' },
  { id: 'TRX-006', date: '05/Mai/2026', description: 'Contribuição Campanha de Inverno', category: 'Campanha', congregation: 'Sede Curitiba Centro', amount: 3800, status: 'Confirmado', type: 'receita' },
  { id: 'TRX-007', date: '03/Mai/2026', description: 'Dízimo Culto de Quarta', category: 'Dízimo', congregation: 'Congregação Central', amount: 2100, status: 'Confirmado', type: 'receita' },
  { id: 'TRX-008', date: '01/Mai/2026', description: 'Pagamento de Internet e Telefonia', category: 'Utilidades', congregation: 'Sede Curitiba Centro', amount: -320, status: 'Confirmado', type: 'despesa' },
]

export const revenueDistribution = [
  { name: 'Dízimos', value: 65, color: '#203B59' },
  { name: 'Ofertas', value: 20, color: '#4B739B' },
  { name: 'Campanhas', value: 10, color: '#F4A63A' },
  { name: 'Outros', value: 5, color: '#DCE7F1' },
]

export const semesterFlow = [
  { month: 'Dez', receitas: 32000, despesas: 21000 },
  { month: 'Jan', receitas: 38500, despesas: 24000 },
  { month: 'Fev', receitas: 34200, despesas: 22800 },
  { month: 'Mar', receitas: 41000, despesas: 25200 },
  { month: 'Abr', receitas: 37500, despesas: 23900 },
  { month: 'Mai', receitas: 45890, despesas: 23456 },
]
