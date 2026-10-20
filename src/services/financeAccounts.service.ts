// src/services/financeAccounts.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface FinancialAccount {
  id: number
  name: string
  type: string
  bankName?: string
  agency?: string
  accountNumber?: string
  currentBalance?: number
  active: boolean
  churchId?: number
  churchName?: string
}

export interface FinancialTransfer {
  id: number
  fromAccountId: number
  fromAccountName?: string
  fromChurchId?: number
  fromChurchName?: string
  toAccountId: number
  toAccountName?: string
  toChurchId?: number
  toChurchName?: string
  amount: number
  transferDate: string
  description?: string
  status: string
}

export const financeAccountsService = {
  async listActive() {
    const res = await http.get<ApiSuccess<FinancialAccount[]>>('/finance/accounts/active')
    return res.data || []
  },

  async listTransfers(params: { page?: number; size?: number } = {}) {
    const res = await http.get<ApiSuccess<{ data: FinancialTransfer[]; meta: any }>>('/finance/transfers', {
      page: params.page ?? 0,
      size: params.size ?? 20,
    })
    const raw = res.data as any
    return (raw?.data || raw?.content || raw || []) as FinancialTransfer[]
  },

  // Transferência entre contas — mesma Igreja ou, para ROOT, entre Igrejas
  // diferentes (o backend valida isolamento conforme o perfil de quem chama).
  async createTransfer(payload: {
    fromAccountId: number
    toAccountId: number
    amount: number
    transferDate?: string
    description?: string
  }) {
    const res = await http.post<ApiSuccess<FinancialTransfer>>('/finance/transfers', payload)
    return res.data
  },
}
