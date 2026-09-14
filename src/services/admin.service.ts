// src/services/admin.service.ts
//
// Endpoints usados exclusivamente pela Administração Externa (ROOT).
// Reaproveita os mesmos endpoints já usados pelos módulos regulares sempre
// que possível — o backend aplica o filtro correto (global ou por Igreja)
// a partir dos headers X-Root-Mode / X-Church-Id enviados em cada request
// (ver src/lib/http.ts).
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface AdminStats {
  churches: number
  congregations: number
  users: number
  usersByRole?: Record<string, number>
  members: number
  transactions?: number
  balance?: number
  documents?: number
  supportTicketsOpen?: number
}

export interface AuditLogEntry {
  id: number
  action: string
  entity?: string
  entityId?: number | string
  userId?: number
  userName?: string
  churchId?: number
  churchName?: string
  description?: string
  createdAt: string
}

export interface AuditLogParams {
  page?: number
  size?: number
  dateFrom?: string
  dateTo?: string
  churchId?: number | string
  userId?: number | string
  action?: string
}

export interface SystemModule {
  id: number | string
  key: string
  name: string
  description?: string
  enabled?: boolean
}

export interface GlobalSettings {
  passwordMinLength?: number
  passwordRequireSpecialChar?: number | boolean
  passwordRequireNumber?: boolean
  sessionTimeoutMinutes?: number
  twoFactorRequired?: boolean
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpFrom?: string
  integrationWebhookUrl?: string
  integrationApiKey?: string
  [key: string]: unknown
}

function unwrapList<T>(raw: any): T[] {
  const list = raw?.data?.data ?? raw?.data?.content ?? raw?.data ?? raw?.content ?? raw
  return Array.isArray(list) ? list as T[] : []
}

export const adminService = {
  async stats(): Promise<AdminStats | null> {
    try {
      const res = await http.get<ApiSuccess<AdminStats>>('/admin/stats')
      return res?.data ?? null
    } catch {
      return null
    }
  },

  async churchCongregations(churchId: number | string) {
    const res = await http.get<any>(`/admin/churches/${churchId}/congregations`)
    return unwrapList<any>(res)
  },

  async churchUsers(churchId: number | string) {
    const res = await http.get<any>(`/admin/churches/${churchId}/users`)
    return unwrapList<any>(res)
  },

  async churchDocuments(churchId: number | string) {
    const res = await http.get<any>('/documents', { churchId, page: 0, size: 20 })
    return unwrapList<any>(res)
  },

  async churchAudit(churchId: number | string) {
    return adminService.auditLogs({ churchId, size: 20 })
  },

  async auditLogs(params: AuditLogParams = {}): Promise<{ data: AuditLogEntry[]; meta?: any }> {
    const res = await http.get<any>('/audit', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      churchId: params.churchId,
      userId: params.userId,
      action: params.action,
    })
    return { data: unwrapList<AuditLogEntry>(res), meta: res?.data?.meta ?? res?.meta }
  },

  async modules(): Promise<SystemModule[]> {
    const res = await http.get<any>('/modules')
    return unwrapList<SystemModule>(res)
  },

  async churchModules(churchId: number | string): Promise<SystemModule[]> {
    const res = await http.get<any>(`/churches/${churchId}/modules`)
    return unwrapList<SystemModule>(res)
  },

  async setChurchModule(churchId: number | string, moduleId: number | string, enabled: boolean) {
    await http.patch(`/churches/${churchId}/modules/${moduleId}`, { enabled })
  },

  async getGlobalSettings(): Promise<GlobalSettings | null> {
    try {
      const res = await http.get<ApiSuccess<GlobalSettings>>('/settings/global')
      return res?.data ?? null
    } catch {
      return null
    }
  },

  async updateGlobalSettings(payload: GlobalSettings): Promise<GlobalSettings> {
    const res = await http.put<ApiSuccess<GlobalSettings>>('/settings/global', payload)
    return res.data
  },
}
