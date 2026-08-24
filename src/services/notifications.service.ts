import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface Notification {
  id: number
  title: string
  body?: string
  type: string
  read: boolean
  link?: string
  createdAt: string
}

export const notificationsService = {
  async list(): Promise<Notification[]> {
    const res = await http.get<ApiSuccess<Notification[]>>('/notifications')
    return Array.isArray(res.data) ? res.data : []
  },

  async unreadCount(): Promise<number> {
    const res = await http.get<ApiSuccess<{ unread: number }>>('/notifications/unread-count')
    return res.data?.unread || 0
  },

  async markAllRead(): Promise<void> {
    await http.post('/notifications/mark-all-read')
  },
}