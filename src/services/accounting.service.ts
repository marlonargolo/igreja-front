// src/services/accounting.service.ts
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

export interface JournalEntry {
  id: number
  entryNumber: string
  entryDate: string
  description: string
  status: 'DRAFT' | 'POSTED' | 'CANCELLED'
  totalDebit: number
  totalCredit: number
  reference?: string
  lines: JournalEntryLine[]
}

export interface JournalEntryLine {
  accountId: number
  accountCode?: string
  accountName?: string
  debitCents: number
  creditCents: number
  description?: string
}

export interface JournalEntryListParams {
  page?: number
  size?: number
  startDate?: string
  endDate?: string
}

export type CreateJournalEntryPayload = {
  entryDate: string
  description: string
  reference?: string
  lines: {
    accountId: number
    debitCents: number
    creditCents: number
    description?: string
  }[]
}

export interface TrialBalanceEntry {
  accountId: number
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  balanceCents: number
}

export interface IncomeStatement {
  revenue_cents: number
  expense_cents: number
  result_cents: number
}

export interface BalanceSheet {
  assets_cents: number
  liabilities_cents: number
  equity_cents: number
}

export const accountingService = {
  async listJournalEntries(params: JournalEntryListParams = {}) {
    const response = await http.get<ApiSuccess<{ data: JournalEntry[]; meta: any }>>('/accounting/journal-entries', {
      page: params.page ?? 0,
      size: params.size ?? 20,
      startDate: params.startDate,
      endDate: params.endDate,
    })
    return response.data
  },

  async getJournalEntry(id: number) {
    const res = await http.get<ApiSuccess<JournalEntry>>(`/accounting/journal-entries/${id}`)
    return res.data
  },

  async createJournalEntry(payload: CreateJournalEntryPayload) {
    const totalDebit = payload.lines.reduce((s, l) => s + l.debitCents, 0)
    const totalCredit = payload.lines.reduce((s, l) => s + l.creditCents, 0)
    if (totalDebit !== totalCredit) {
      throw new Error('O total de débitos deve ser igual ao total de créditos.')
    }
    const res = await http.post<ApiSuccess<JournalEntry>>('/accounting/journal-entries', payload)
    return res.data
  },

  async cancelJournalEntry(id: number, reason: string) {
    const res = await http.post<ApiSuccess<JournalEntry>>(`/accounting/journal-entries/${id}/cancel`, { reason })
    return res.data
  },

  async getTrialBalance(params: { date?: string }) {
    const res = await http.get<ApiSuccess<TrialBalanceEntry[]>>('/accounting/trial-balance', params)
    return res.data
  },

  async getIncomeStatement(params: { date_from: string; date_to: string }) {
    const res = await http.get<ApiSuccess<IncomeStatement>>('/accounting/income-statement', params)
    return res.data
  },

  async getBalanceSheet(params: { date?: string }) {
    const res = await http.get<ApiSuccess<BalanceSheet>>('/accounting/balance-sheet', params)
    return res.data
  },
}