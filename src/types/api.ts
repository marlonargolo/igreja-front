// Contratos genéricos da API — ver seção 16 do documento de referência do backend.

export interface ApiMeta {
  page?: number
  page_size?: number
  total?: number
  total_pages?: number
  [key: string]: unknown
}

export interface ApiSuccess<T> {
  data: T
  meta?: ApiMeta
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export interface ApiListParams {
  q?: string
  page?: number
  page_size?: number
  sort?: string
  order?: 'asc' | 'desc'
  [key: string]: unknown
}

export class ApiError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}