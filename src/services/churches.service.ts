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
    // Backend pode retornar Spring Page (content) ou PaginatedResponse (data)
    const raw = res.data
    const list = raw?.content || raw?.data || raw || []
    return Array.isArray(list) ? list : [] as Church[]
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
}