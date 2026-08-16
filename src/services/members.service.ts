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
  async list(params: MemberListParams = {}) {
    // Buscar churchId do localStorage (do usuário logado)
    const userStr = localStorage.getItem('user')
    let churchId = params.churchId
    if (!churchId && userStr) {
      try {
        const user = JSON.parse(userStr)
        churchId = user.organization_id || user.organizationId
      } catch {}
    }
    // Se ainda não tiver, usar fallback 1
    if (!churchId) churchId = 1

    const response = await http.get<ApiSuccess<{ data: Member[]; meta: any }>>('/members', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      churchId: churchId,                    // ← agora enviando
      congregationId: params.congregationId,
      status: params.status,
      search: params.search,
    })
    return response.data
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

  async uploadAvatar(id: number, file: File) {
    const res = await http.upload<ApiSuccess<{ avatarUrl: string }>>(
      `/members/${id}/avatar`,
      file,
      'avatar'
    )
    return res.data
  },
}