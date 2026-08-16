// src/services/settings.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface OrganizationSettings {
  id: number
  name: string
  legalName: string
  cnpj: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  logoUrl: string
  plan: string
  active: boolean
  trialEndDate?: string
  subscriptionEndDate?: string
}

export interface AppearanceSettings {
  primaryColor: string
  logoUrl: string
}

export interface NotificationSettings {
  emailEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean
}

export const settingsService = {
  async getOrganization() {
    const res = await http.get<ApiSuccess<OrganizationSettings>>('/organizations/current')
    return res.data
  },

  async updateOrganization(payload: Partial<OrganizationSettings>) {
    const res = await http.put<ApiSuccess<OrganizationSettings>>(`/organizations/${payload.id}`, payload)
    return res.data
  },

  async getAppearance() {
    // Pode não existir, retornamos mock ou usamos dados da organização
    const org = await this.getOrganization()
    return {
      primaryColor: '#203B59',
      logoUrl: org.logoUrl,
    }
  },

  async updateAppearance(payload: Partial<AppearanceSettings>) {
    // Se não houver endpoint, atualizamos a organização
    const org = await this.getOrganization()
    const updated = await this.updateOrganization({
      ...org,
      logoUrl: payload.logoUrl || org.logoUrl,
    })
    return {
      primaryColor: '#203B59',
      logoUrl: updated.logoUrl,
    }
  },

  async getNotifications() {
    // Se não houver endpoint, retornamos valores padrão
    return {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
    }
  },

  async updateNotifications(payload: NotificationSettings) {
    // Implementar se houver endpoint
    return payload
  },
}