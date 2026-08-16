// src/services/assets.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface Asset {
  id: number
  churchId: number
  churchName?: string
  congregationId: number
  congregationName?: string
  code: string
  description: string
  categoryId: number
  categoryName: string
  originalValue: number
  currentValue: number
  acquisitionDate: string
  location: string
  responsibleMemberId?: number
  responsibleMemberName?: string
  status: 'ACTIVE' | 'MAINTENANCE' | 'WRITTEN_OFF'
  notes?: string
}

export interface AssetListParams {
  page?: number
  size?: number
  categoryId?: number
  status?: 'ACTIVE' | 'MAINTENANCE' | 'WRITTEN_OFF'
  search?: string
  congregationId?: number
}

export type CreateAssetPayload = {
  churchId: number
  congregationId?: number
  code: string
  description: string
  categoryId: number
  originalValue: number
  acquisitionDate: string
  location: string
  responsibleMemberId?: number
  notes?: string
}

export type UpdateAssetPayload = Partial<CreateAssetPayload> & { status?: string }

export const assetsService = {
  async list(params: AssetListParams = {}) {
    const response = await http.get<ApiSuccess<{ data: Asset[]; meta: any }>>('/assets', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      categoryId: params.categoryId,
      status: params.status,
      search: params.search,
      congregationId: params.congregationId,
    })
    return response.data
  },

  async get(id: number) {
    const res = await http.get<ApiSuccess<Asset>>(`/assets/${id}`)
    return res.data
  },

  async create(payload: CreateAssetPayload) {
    const res = await http.post<ApiSuccess<Asset>>('/assets', payload)
    return res.data
  },

  async update(id: number, payload: UpdateAssetPayload) {
    const res = await http.put<ApiSuccess<Asset>>(`/assets/${id}`, payload)
    return res.data
  },

  async delete(id: number) {
    await http.delete(`/assets/${id}`)
  },

  async writeOff(id: number, reason: string) {
    const res = await http.post<ApiSuccess<Asset>>(`/assets/${id}/write-off`, { reason })
    return res.data
  },
}