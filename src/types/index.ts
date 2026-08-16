export type Role =
  | 'Administrador'
  | 'Pastor Principal'
  | 'Pastor de Congregação'
  | 'Tesoureiro'
  | 'Secretário'
  | 'Usuário'

export type MemberStatus = 'Ativo' | 'Inativo' | 'Visitante'

export interface Member {
  id: string
  name: string
  email: string
  phone: string
  congregation: string
  role: string
  status: MemberStatus
  avatar: string
  birthDate: string
  gender: string
  maritalStatus: string
  profession: string
  baptismDate: string
  memberSince: string
  address: string
  notes: string
}

export interface Congregation {
  id: string
  name: string
  city: string
  state: string
  members: number
  subCongregations: number | null
  tag: string
  pastor: string
  image: string
  income: number
  expense: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  category: string
  congregation: string
  amount: number
  status: 'Confirmado' | 'Pendente'
  type: 'receita' | 'despesa'
}

export interface Asset {
  code: string
  description: string
  category: 'Imóveis' | 'Veículos' | 'Equipamentos'
  congregation: string
  originalValue: number
  currentValue: number
  status: 'Ativo' | 'Em Manutenção' | 'Baixado'
  location: string
  responsible: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  congregation: string
  lastAccess: string
  avatar: string
  status: 'Ativo' | 'Inativo'
}

export interface ReportItem {
  title: string
  category: string
  description: string
  icon: string
  color: string
}
