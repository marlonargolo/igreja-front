import type { AppUser } from '@/types'

export const appUsers: AppUser[] = [
  { id: 'USR-001', name: 'Carlos Santos', email: 'carlos@igrejahub.com', role: 'Pastor Principal', congregation: 'Sede Central Curitiba', lastAccess: 'Hoje, 10:45', avatar: 'https://i.pravatar.cc/150?u=carlos-eduardo', status: 'Ativo' },
  { id: 'USR-002', name: 'Sarah Reis', email: 'sarah@igrejahub.com', role: 'Secretário', congregation: 'Sede Central Curitiba', lastAccess: 'Ontem, 16:22', avatar: 'https://i.pravatar.cc/150?u=sarah-reis', status: 'Ativo' },
  { id: 'USR-003', name: 'Marcos Vinícius', email: 'marcos@igrejahub.com', role: 'Tesoureiro', congregation: 'Sede Central Curitiba', lastAccess: 'Hoje, 08:30', avatar: 'https://i.pravatar.cc/150?u=marcos-vinicius', status: 'Ativo' },
  { id: 'USR-004', name: 'Alexandre Souza', email: 'alexandre@igrejahub.com', role: 'Pastor de Congregação', congregation: 'Congregação Água Verde', lastAccess: '14/Mai/2026', avatar: 'https://i.pravatar.cc/150?u=alexandre-souza', status: 'Ativo' },
  { id: 'USR-005', name: 'Lucas Silva', email: 'lucas@igrejahub.com', role: 'Administrador', congregation: 'Todas as Congregações', lastAccess: 'Hoje, 11:15', avatar: 'https://i.pravatar.cc/150?u=lucas-silva', status: 'Ativo' },
  { id: 'USR-006', name: 'Fernando Dias', email: 'fernando@igrejahub.com', role: 'Usuário', congregation: 'Congregação Batel', lastAccess: '02/Abr/2026', avatar: 'https://i.pravatar.cc/150?u=fernando-dias', status: 'Inativo' },
]

export const accessProfiles = [
  { name: 'Administrador', used: 2, total: 5 },
  { name: 'Pastor Principal', used: 1, total: 1 },
  { name: 'Pastor de Congregação', used: 8, total: 15 },
  { name: 'Tesoureiro', used: 4, total: 5 },
  { name: 'Secretário', used: 3, total: 5 },
]

export const reportCards = [
  { title: 'Relatório de Membros', category: 'DEMOGRÁFICO', description: 'Estatísticas detalhadas de membros, taxa de crescimento anual, faixas etárias e novos batismos por período.', color: 'bg-brand-100 text-brand-800' },
  { title: 'Relatório Financeiro', category: 'DÍZIMOS & OFERTAS', description: 'Detalhamento de entradas, dízimos, ofertas, despesas fixas, balancete mensal e tendências de arrecadação.', color: 'bg-green-100 text-green-700' },
  { title: 'Relatório de Congregações', category: 'CONGREGAÇÕES', description: 'Comparativo geral entre as congregações ativas. Monitore o progresso, número de membros e crescimento local.', color: 'bg-purple-100 text-purple-700' },
  { title: 'Relatório de Patrimônio', category: 'PATRIMÔNIO', description: 'Inventário completo de ativos e bens físicos da igreja sede e filiais, depreciação de bens e novas aquisições.', color: 'bg-orange-100 text-orange-700' },
  { title: 'Relatório Contábil', category: 'CONTÁBIL', description: 'Balanço patrimonial, demonstrativo de resultados, notas explicativas e documentações prontas para envio à contabilidade externa.', color: 'bg-sky-100 text-sky-700' },
  { title: 'Relatório de Atividades', category: 'ATIVIDADES', description: 'Presença em cultos, escolas bíblicas e participação em eventos ministeriais internos. Engajamento e crescimento de fé.', color: 'bg-teal-100 text-teal-700' },
]

export const generatedReports = [
  { file: 'Relatorio_Anual_Dizimos_2025.pdf', type: 'Financeiro', date: 'Hoje, 14:32', by: 'Pr. Carlos Santos' },
  { file: 'Crescimento_Membros_Q1_2026.xlsx', type: 'Membros', date: 'Ontem, 09:15', by: 'Secretária Sarah Reis' },
  { file: 'Balancete_Consolidado_Batel_Marco.pdf', type: 'Contábil', date: '12/Mai/2026', by: 'Tesoureiro Marcos' },
  { file: 'Inventario_Geral_Curitiba_2026.xlsx', type: 'Patrimônio', date: '08/Mai/2026', by: 'Adm. Lucas Silva' },
]

export const chartOfAccounts = [
  { code: '1.0', name: 'Ativo', type: 'Sintética', balance: 1245890, level: 0 },
  { code: '1.1', name: 'Ativo Circulante', type: 'Sintética', balance: 353550, level: 1 },
  { code: '1.1.1', name: 'Caixa Geral Sede', type: 'Analítica', balance: 45890, level: 2 },
  { code: '1.1.2', name: 'Bancos Conta Corrente', type: 'Analítica', balance: 307660, level: 2 },
  { code: '1.2', name: 'Ativo Não Circulante', type: 'Sintética', balance: 892340, level: 1 },
  { code: '1.2.1', name: 'Bens Imóveis', type: 'Analítica', balance: 650000, level: 2 },
  { code: '1.2.2', name: 'Bens Móveis e Equipamentos', type: 'Analítica', balance: 242340, level: 2 },
  { code: '2.0', name: 'Passivo', type: 'Sintética', balance: 353550, level: 0 },
  { code: '2.1', name: 'Passivo Circulante', type: 'Sintética', balance: 53550, level: 1 },
  { code: '2.1.1', name: 'Fornecedores e Contas a Pagar', type: 'Analítica', balance: 23450, level: 2 },
  { code: '3.0', name: 'Receitas', type: 'Sintética', balance: 312670, level: 0 },
  { code: '4.0', name: 'Despesas', type: 'Sintética', balance: 156780, level: 0 },
]

export const plans = [
  { name: 'Plano Básico', price: 97, features: ['Até 500 membros', 'Até 3 congregações', '10 usuários autorizados', 'Relatórios básicos'] },
  { name: 'Plano Profissional', price: 197, features: ['Até 1.000 membros', 'Até 8 congregações', '25 usuários autorizados', 'Relatórios gerenciais e exportação'] },
  { name: 'Plano Premium Multi', price: 297, features: ['Até 2.000 membros', 'Até 15 congregações', '50 usuários autorizados', 'Todas as integrações liberadas'] },
]
