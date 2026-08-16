// src/services/congregations.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface Congregation {
  id: number
  churchId: number
  churchName: string
  name: string
  city: string
  state: string
  address: string
  pastorId: number | null
  pastorName?: string
  imageUrl: string | null
  status: 'ACTIVE' | 'INACTIVE'
  latitude: number | null
  longitude: number | null
  members?: number
  revenue?: number
  expenses?: number
}

export interface ServiceSchedule {
  id: string
  day: string
  time: string
  name: string
}

export interface CongregationLeader {
  id: string
  name: string
  role: string
  avatar_url: string | null
}

export interface CongregationDetail extends Congregation {
  history?: string
  services?: ServiceSchedule[]
  leaders?: CongregationLeader[]
}

export interface CongregationListParams {
  page?: number
  size?: number
  churchId?: number
  search?: string
}

export type CongregationPayload = Partial<Omit<Congregation, 'id' | 'churchName' | 'pastorName' | 'imageUrl'>>

export const congregationsService = {
  async list(params: CongregationListParams = {}) {
    const response = await http.get<ApiSuccess<Congregation[]>>('/congregations', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      ...params,
    })
    return response
  },

  async get(id: number) {
    const res = await http.get<ApiSuccess<CongregationDetail>>(`/congregations/${id}`)
    return res.data
  },

  async create(payload: CongregationPayload) {
    const res = await http.post<ApiSuccess<Congregation>>('/congregations', payload)
    return res.data
  },

  async update(id: number, payload: CongregationPayload) {
    const res = await http.put<ApiSuccess<Congregation>>(`/congregations/${id}`, payload)
    return res.data
  },

  async remove(id: number) {
    await http.delete(`/congregations/${id}`)
  },

  async addLeader(congregationId: number, payload: { member_id: number; role: string }) {
    const res = await http.post<ApiSuccess<CongregationLeader>>(
      `/congregations/${congregationId}/leaders`,
      payload
    )
    return res.data
  },

  async addServiceSchedule(congregationId: number, payload: Omit<ServiceSchedule, 'id'>) {
    const res = await http.post<ApiSuccess<ServiceSchedule>>(
      `/congregations/${congregationId}/service-schedules`,
      payload
    )
    return res.data
  },
}