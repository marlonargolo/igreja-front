// src/services/billing.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface Plan {
  id: string
  name: string
  priceCents: number
  maxMembers: number
  maxCongregations: number
  maxUsers: number
  features: { key: string; label: string }[]
}

export interface Subscription {
  id: string
  plan: Plan
  status: 'ACTIVE' | 'CANCELLED' | 'OVERDUE' | 'TRIAL'
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface Usage {
  members: { used: number; total: number }
  congregations: { used: number; total: number }
  adminUsers: { used: number; total: number }
}

export const billingService = {
  async listPlans() {
    const res = await http.get<ApiSuccess<Plan[]>>('/billing/plans')
    return res.data
  },

  async getSubscription() {
    const res = await http.get<ApiSuccess<Subscription>>('/billing/subscription')
    return res.data
  },

  async subscribe(planId: string, paymentMethodToken?: string) {
    const res = await http.post<ApiSuccess<Subscription>>('/billing/subscribe', { planId, paymentMethodToken })
    return res.data
  },

  async changePlan(planId: string) {
    const res = await http.post<ApiSuccess<Subscription>>('/billing/change-plan', { planId })
    return res.data
  },

  async cancel(atPeriodEnd = true) {
    const res = await http.post<ApiSuccess<Subscription>>('/billing/cancel', { atPeriodEnd })
    return res.data
  },

  async getUsage() {
    const res = await http.get<ApiSuccess<Usage>>('/billing/usage')
    return res.data
  },
}