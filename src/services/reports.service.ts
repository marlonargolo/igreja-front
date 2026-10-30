// src/services/reports.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export type ReportType = 'MEMBERS' | 'FINANCIAL' | 'CONGREGATIONS' | 'ASSETS' | 'ACCOUNTING' | 'ACTIVITIES'
export type ReportFormat = 'PDF' | 'XLSX' | 'CSV'
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'ERROR'

export interface ReportJob {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  status: ReportStatus
  fileUrl: string | null
  errorMessage: string | null
  requestedBy: string
  createdAt: string
  completedAt: string | null
}

export const reportsService = {
  async list(params: { type?: ReportType; page?: number; size?: number } = {}) {
    const response = await http.get<ApiSuccess<{ data: ReportJob[]; meta: any }>>('/reports', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      type: params.type,
    })
    return response.data
  },

  async create(payload: { name: string; type: ReportType; format: ReportFormat; filters?: Record<string, unknown> }) {
    const res = await http.post<ApiSuccess<ReportJob>>('/reports', payload)
    return res.data
  },

  async get(id: string) {
    const res = await http.get<ApiSuccess<ReportJob>>(`/reports/${id}`)
    return res.data
  },

  async pollUntilComplete(id: string, maxAttempts = 60, intervalMs = 2000): Promise<ReportJob> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const job = await reportsService.get(id)
      if (job.status === 'COMPLETED') return job
      if (job.status === 'FAILED' || job.status === 'ERROR' || job.status === 'EXPIRED') {
        throw new Error(job.errorMessage || 'Falha ao gerar relatório.')
      }
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs))
      }
    }
    throw new Error('Tempo limite ao aguardar relatório.')
  },

  async downloadUrl(id: string) {
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://2.24.80.229:3000/api'
    const res = await http.get<ApiSuccess<ReportJob>>(`/reports/${id}/download`)
    if (!res.data.fileUrl) throw new Error('Relatório sem arquivo disponível.')
    return new URL(res.data.fileUrl, base).href
  },
}