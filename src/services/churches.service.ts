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

export interface ChurchListParams {
  page?: number
  size?: number
  search?: string
}

export const churchesService = {
  async list(params: ChurchListParams = {}) {
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

  /**
   * Faz upload da logo para o backend via multipart/form-data.
   * O backend salva o arquivo em /app/uploads/logos/ e retorna a URL.
   */
  async uploadLogo(churchId: number, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const token = localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token') || ''

    // http.ts não suporta FormData nativamente — chamada direta via fetch
    const BASE = import.meta.env.VITE_API_BASE_URL || 'http://2.24.80.229:3000/api'
    const res = await fetch(`${BASE}/churches/${churchId}/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })

    if (!res.ok) throw new Error('Falha ao fazer upload da logo.')
    const json = await res.json()
    return json?.data?.logoUrl || ''
  },
}