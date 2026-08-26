// src/services/members.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface Member {
  id: number
  churchId: number
  churchName: string
  congregationId: number
  congregationName: string
  name: string
  email: string
  phone: string
  birthDate: string
  gender: string
  maritalStatus: string
  profession: string
  baptismDate: string
  memberSince: string
  address: string
  notes: string
  avatarUrl: string
  role: string
  status: string
}

export interface MemberListParams {
  page?: number
  size?: number
  churchId?: number      // ← adicionado
  congregationId?: number
  status?: string
  search?: string
}

export type CreateMemberPayload = {
  churchId: number
  congregationId?: number
  name: string
  email?: string
  phone?: string
  birthDate?: string
  gender?: string
  maritalStatus?: string
  profession?: string
  baptismDate?: string
  memberSince?: string
  address?: string
  notes?: string
  role?: string
}

export type UpdateMemberPayload = Partial<CreateMemberPayload> & { status?: string }

export const membersService = {
  async list(params: any = {}) {
    const churchId = localStorage.getItem('igrejahub_selected_church_id')
    const res = await http.get<ApiSuccess<any>>('/members', {
      ...params,
      churchId: params.churchId ?? (churchId ? Number(churchId) : undefined),
    })
    return res
  },

  async get(id: number) {
    const res = await http.get<ApiSuccess<Member>>(`/members/${id}`)
    return res.data
  },

  async create(payload: CreateMemberPayload) {
    const res = await http.post<ApiSuccess<Member>>('/members', payload)
    return res.data
  },

  async update(id: number, payload: UpdateMemberPayload) {
    const res = await http.put<ApiSuccess<Member>>(`/members/${id}`, payload)
    return res.data
  },

  async remove(id: number) {
    await http.delete(`/members/${id}`)
  },

  async uploadAvatar(memberId: number, file: File): Promise<string> {
    const res = await http.upload<ApiSuccess<{ avatarUrl: string }>>(
      `/members/${memberId}/avatar`,
      file,
      'file'
    )
    return res?.data?.avatarUrl || ''
  },
  
}