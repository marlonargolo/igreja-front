import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface SupportMessage {
  id: number
  autor: string
  texto: string
  tipo: 'cliente' | 'suporte'
  dataHora: string
}

export interface SupportTicket {
  id: number
  titulo: string
  category: string
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO'
  criadoEm: string
  mensagens: SupportMessage[]
}

export const supportService = {
  async list(): Promise<SupportTicket[]> {
    const res = await http.get<ApiSuccess<SupportTicket[]>>('/support/tickets')
    return Array.isArray(res.data) ? res.data : []
  },

  async get(id: number): Promise<SupportTicket> {
    const res = await http.get<ApiSuccess<SupportTicket>>(`/support/tickets/${id}`)
    return res.data
  },

  async create(payload: {
    title: string
    category: string
    priority: string
    descricao: string
  }): Promise<SupportTicket> {
    const res = await http.post<ApiSuccess<SupportTicket>>('/support/tickets', payload)
    return res.data
  },

  async sendMessage(ticketId: number, message: string): Promise<SupportMessage> {
    const res = await http.post<ApiSuccess<SupportMessage>>(
      `/support/tickets/${ticketId}/messages`,
      { message }
    )
    return res.data
  },

  async close(ticketId: number): Promise<SupportTicket> {
    const res = await http.patch<ApiSuccess<SupportTicket>>(
      `/support/tickets/${ticketId}/close`
    )
    return res.data
  },
}