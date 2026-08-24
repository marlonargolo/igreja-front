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
}

export const FILES_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://2.24.80.229:3000'

export function resolveLogoUrl(logoUrl?: string): string | undefined {
  if (!logoUrl) return undefined
  if (logoUrl.startsWith('http')) return logoUrl
  return `${FILES_BASE}${logoUrl}`
}

export const churchesService = {
  async list(params: { page?: number; size?: number; search?: string } = {}) {
    const res = await http.get<ApiSuccess<any>>('/churches', {
      page: params.page ?? 0,
      size: params.size ?? 50,
      search: params.search,
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