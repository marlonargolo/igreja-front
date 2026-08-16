// src/services/users.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  organizationId: number
  organizationName?: string
  active: boolean
  verified: boolean
  lastLoginAt?: string
  roles: string[]
  permissions: string[]
}

export interface UserListParams {
  page?: number
  size?: number
  search?: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  phone?: string
  roleIds?: number[]
  active?: boolean
}

export interface UpdateUserPayload {
  name?: string
  phone?: string
  roleIds?: number[]
  active?: boolean
}

export const usersService = {
  async list(params: UserListParams = {}) {
    const response = await http.get<ApiSuccess<{ data: User[]; meta: any }>>('/users', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      search: params.search,
    })
    return response.data
  },

  async get(id: number) {
    const res = await http.get<ApiSuccess<User>>(`/users/${id}`)
    return res.data
  },

  async create(payload: CreateUserPayload) {
    const res = await http.post<ApiSuccess<User>>('/users', payload)
    return res.data
  },

  async update(id: number, payload: UpdateUserPayload) {
    const res = await http.put<ApiSuccess<User>>(`/users/${id}`, payload)
    return res.data
  },

  async disable(id: number) {
    await http.patch(`/users/${id}/disable`)
  },

  async enable(id: number) {
    await http.patch(`/users/${id}/enable`)
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await http.post('/users/change-password', { currentPassword, newPassword })
  },

  async getRoles() {
    const res = await http.get<ApiSuccess<{ data: any[]; meta: any }>>('/roles', { page: 0, size: 100 })
    return res.data
  },

  async getPermissions() {
    const res = await http.get<ApiSuccess<any[]>>('/permissions')
    return res.data
  },

  async getAuditLogs(params: { page?: number; size?: number; action?: string; userId?: number }) {
    const response = await http.get<ApiSuccess<{ data: any[]; meta: any }>>('/audit', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      action: params.action,
      userId: params.userId,
    })
    return response.data
  },
}