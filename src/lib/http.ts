// src/lib/http.ts
import { ApiError, type ApiListParams, type ApiSuccess } from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://2.24.80.229:3000/api'

const ACCESS_TOKEN_KEY = 'igrejahub_access_token'
const REFRESH_TOKEN_KEY = 'igrejahub_refresh_token'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: ApiListParams | Record<string, unknown>
  body?: unknown
  skipAuthRetry?: boolean
}

function buildUrl(path: string, params?: Record<string, unknown>) {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

let refreshPromise: Promise<void> | null = null

async function refreshAccessToken(): Promise<void> {
  const refresh = tokenStore.getRefresh()
  if (!refresh) throw new ApiError(401, 'NO_REFRESH_TOKEN', 'Sessão expirada.')

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  })

  if (!res.ok) {
    tokenStore.clear()
    throw new ApiError(401, 'REFRESH_FAILED', 'Não foi possível renovar a sessão.')
  }

  const json = await res.json() as ApiSuccess<{ accessToken: string; refreshToken: string }>
  tokenStore.set(json.data.accessToken, json.data.refreshToken)
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, skipAuthRetry, headers, ...rest } = options
  const access = tokenStore.getAccess()

  const res = await fetch(buildUrl(path, params as Record<string, unknown>), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && !skipAuthRetry) {
    try {
      refreshPromise = refreshPromise ?? refreshAccessToken()
      await refreshPromise
      refreshPromise = null
      return request<T>(path, { ...options, skipAuthRetry: true })
    } catch (err) {
      refreshPromise = null
      tokenStore.clear()
      window.location.href = '/login'
      throw err
    }
  }

  if (res.status === 204) return undefined as T

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const message = json?.error?.message ?? json?.message ?? 'Erro inesperado ao comunicar com o servidor.'
    const code = json?.error?.code ?? 'UNKNOWN_ERROR'
    throw new ApiError(res.status, code, message, json?.error?.details)
  }

  return json as T
}

export const http = {
  get: <T>(path: string, params?: Record<string, unknown>) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown, params?: Record<string, unknown>) =>
    request<T>(path, { method: 'POST', body, params }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: async <T>(path: string, file: File, fieldName = 'file'): Promise<T> => {
    const access = tokenStore.getAccess()
    const formData = new FormData()
    formData.append(fieldName, file)

    const res = await fetch(buildUrl(path), {
      method: 'POST',
      headers: access ? { Authorization: `Bearer ${access}` } : undefined,
      body: formData,
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      throw new ApiError(res.status, json?.error?.code ?? 'UPLOAD_ERROR', json?.error?.message ?? 'Falha no upload.')
    }
    return json as T
  },
}