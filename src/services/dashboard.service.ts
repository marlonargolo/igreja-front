// src/services/dashboard.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface DashboardMetrics {
  totalMembers: number
  totalChurches: number
  totalCongregations: number
  monthlyRevenue: number
  monthlyExpenses: number
  balance: number
  totalAssets: number
  activeUsers: number
  pendingTransactions: number
}

export interface DashboardParams {
  startDate?: string
  endDate?: string
  churchId?: number
  congregationId?: number
}

export const dashboardService = {
  async getMetrics(params: DashboardParams = {}) {
    const cleanParams: Record<string, any> = {}
    if (params.startDate) cleanParams.startDate = params.startDate
    if (params.endDate) cleanParams.endDate = params.endDate
    if (params.churchId) cleanParams.churchId = params.churchId
    if (params.congregationId) cleanParams.congregationId = params.congregationId

    const res = await http.get<ApiSuccess<DashboardMetrics>>('/dashboard', cleanParams)
    return res.data
  },
}