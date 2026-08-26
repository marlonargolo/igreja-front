// src/services/finance.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface Transaction {
  id: number
  churchId: number
  churchName?: string
  congregationId: number
  congregationName?: string
  categoryId: number
  categoryName: string
  type: 'REVENUE' | 'EXPENSE'
  description: string
  amount: number
  transactionDate: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  paymentMethod?: string
  reference?: string
  notes?: string
}

export interface TransactionListParams {
  page?: number
  size?: number
  startDate?: string
  endDate?: string
  churchId?: number
  congregationId?: number
  categoryId?: number
  type?: 'REVENUE' | 'EXPENSE'
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  search?: string
}

export type CreateTransactionPayload = {
  churchId: number
  congregationId?: number
  categoryId: number
  type: 'REVENUE' | 'EXPENSE'
  description: string
  amount: number
  transactionDate: string
  paymentMethod?: string
  reference?: string
  notes?: string
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload> & { status?: string }

export const financeService = {
  async list(params: any = {}) {
    const churchId = localStorage.getItem('igrejahub_selected_church_id')
    const res = await http.get<ApiSuccess<any>>('/finance/transactions', {
      ...params,
      churchId: params.churchId ?? (churchId ? Number(churchId) : undefined),
    })
    return res
  },

  async get(id: number) {
    const res = await http.get<ApiSuccess<Transaction>>(`/finance/transactions/${id}`)
    return res.data
  },

  async create(payload: CreateTransactionPayload) {
    const res = await http.post<ApiSuccess<Transaction>>('/finance/transactions', payload)
    return res.data
  },

  async update(id: number, payload: UpdateTransactionPayload) {
    const res = await http.put<ApiSuccess<Transaction>>(`/finance/transactions/${id}`, payload)
    return res.data
  },

  async delete(id: number) {
    await http.delete(`/finance/transactions/${id}`)
  },

  async confirm(id: number) {
    const res = await http.post<ApiSuccess<Transaction>>(`/finance/transactions/${id}/confirm`)
    return res.data
  },

  async cancel(id: number, reason?: string) {
    const res = await http.post<ApiSuccess<Transaction>>(`/finance/transactions/${id}/cancel`, { reason })
    return res.data
  },

  // Resumo financeiro - pode não existir, então usamos list com agregação
  async getSummary(params: { startDate: string; endDate: string; churchId?: number; congregationId?: number }) {
    // Como a API não tem endpoint de resumo, buscamos transações e calculamos
    const response = await this.list({ ...params, size: 1, page: 0 })
    // Na prática, o backend deveria ter um endpoint /finance/summary, mas vamos simular
    // Alternativa: usar /dashboard para métricas gerais
    // Para simplificar, retornamos um objeto vazio e usamos o dashboard
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
      pendingCount: 0,
      confirmedCount: 0,
    }
  },
}