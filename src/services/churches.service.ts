import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'


export interface Church {
  id: number
  name: string
  city?: string
  state?: string
  address?: string
  zipCode?: string
  phone?: string
  email?: string
  cnpj?: string
  logoUrl?: string
  status: string
  pastorId?: number
  planId?: number
  createdAt?: string
  adminName?: string
  adminEmail?: string
  adminPassword?: string
}

export const FILES_BASE = 'http://2.24.80.229:3000'

export function resolveLogoUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('blob:')) return url
  // URLs do tipo /api/files/... — absolutas a partir da raiz do servidor
  if (url.startsWith('/api/')) return `${FILES_BASE}${url}`
  // URLs legadas /uploads/...
  return `${FILES_BASE}${url}`
}

export interface ChurchListParams {
  page?: number
  size?: number
  search?: string
  city?: string
  state?: string
  status?: string
  planId?: string | number
  dateFrom?: string
  dateTo?: string
}

export const churchesService = {
  async list(params: ChurchListParams = {}) {
    const res = await http.get<ApiSuccess<any>>('/churches', {
      page: params.page ?? 0,
      size: params.size ?? 50,
      search: params.search,
      city: params.city,
      state: params.state,
      status: params.status,
      planId: params.planId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    })
    const raw = res.data
    const list = raw?.data || raw?.content || raw || []
    return Array.isArray(list) ? list as Church[] : []
  },

  async get(id: number) {
    const res = await http.get<ApiSuccess<Church>>(`/churches/${id}`)
    return res.data
  },

  async create(payload: Partial<Church>) {
    const res = await http.post<ApiSuccess<Church>>('/churches', payload)
    return res.data
  },

  async update(id: number, payload: Partial<Church>) {
    const res = await http.put<ApiSuccess<Church>>(`/churches/${id}`, payload)
    return res.data
  },

  async remove(id: number) {
    await http.delete(`/churches/${id}`)
  },

  // Usa http.upload que já lê o token correto de igrejahub_access_token
  async uploadLogo(churchId: number, file: File): Promise<string> {
    const res = await http.upload<ApiSuccess<{ logoUrl: string }>>(
      `/churches/${churchId}/logo`,
      file,
      'file'
    )
    return res?.data?.logoUrl || ''
  },
}