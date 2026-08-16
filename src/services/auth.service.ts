// Seção 11 do documento — Autenticação.
import { http, tokenStore } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'
import type { Role } from '@/types'

export interface AuthChurch {
  id: string
  name: string
  city: string
  state: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  organization_id: string
  organizationName?: string  // Adicionado para compatibilidade
  roles: string[]  // Nossa API retorna array de strings
  permissions: string[]  // Nossa API retorna permissions
  churches: AuthChurch[]
  two_factor_enabled: boolean
}

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

// Interface da resposta da nossa API
export interface LoginResponse {
  accessToken: string  // camelCase
  refreshToken: string // camelCase
  tokenType: string
  expiresIn: number
  user: {
    id: string | number
    name: string
    email: string
    organizationId: string | number
    organizationName?: string
    roles: string[]
    permissions: string[]
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthUser> {
    // Nossa API espera email e password, não usa remember (será tratado no frontend)
    const res = await http.post<ApiSuccess<LoginResponse>>('/auth/login', {
      email: payload.email,
      password: payload.password
    })
    
    // Nossa API retorna accessToken e refreshToken em camelCase
    tokenStore.set(res.data.accessToken, res.data.refreshToken)
    
    // Mapear a resposta para o formato esperado pelo frontend
    const userData = res.data.user
    return {
      id: String(userData.id),
      name: userData.name,
      email: userData.email,
      avatar_url: null,
      organization_id: String(userData.organizationId),
      organizationName: userData.organizationName,
      roles: userData.roles || [],
      permissions: userData.permissions || [],
      churches: [],
      two_factor_enabled: false
    }
  },

  async logout(): Promise<void> {
    try {
      await http.post('/auth/logout')
    } finally {
      tokenStore.clear()
    }
  },

  async me(): Promise<AuthUser> {
    const res = await http.get<ApiSuccess<any>>('/auth/me')
    const userData = res.data
    
    return {
      id: String(userData.id),
      name: userData.name || userData.username,
      email: userData.email,
      avatar_url: null,
      organization_id: String(userData.organizationId || userData.organization_id),
      organizationName: userData.organizationName,
      roles: userData.roles || [],
      permissions: userData.permissions || [],
      churches: [],
      two_factor_enabled: false
    }
  },

  async forgotPassword(email: string): Promise<void> {
    // Nossa API espera email no corpo da requisição
    await http.post('/auth/forgot-password', { email })
  },

  async resetPassword(token: string, password: string): Promise<void> {
    // Nossa API espera token e newPassword
    await http.post('/auth/reset-password', { 
      token, 
      newPassword: password 
    })
  },

  async verifyEmail(token: string): Promise<void> {
    await http.post('/auth/verify-email', { token })
  },

  async enable2FA(): Promise<{ qr_code_url: string; secret: string }> {
    // Endpoint de 2FA - será implementado futuramente
    const res = await http.post<ApiSuccess<{ qr_code_url: string; secret: string }>>('/auth/2fa/enable')
    return res.data
  },

  async verify2FA(code: string): Promise<void> {
    await http.post('/auth/2fa/verify', { code })
  },

  // Redireciona para o fluxo OAuth/OIDC do Google Workspace (seção 11).
  loginWithGoogleWorkspace(): void {
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1'
    window.location.href = `${base}/auth/google/redirect`
  },

  isAuthenticated(): boolean {
    return Boolean(tokenStore.getAccess())
  },

  // Método para refresh token
  async refreshToken(): Promise<string | null> {
    const refreshToken = tokenStore.getRefresh()
    if (!refreshToken) return null
    
    try {
      const res = await http.post<ApiSuccess<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
        refreshToken
      })
      
      tokenStore.set(res.data.accessToken, res.data.refreshToken)
      return res.data.accessToken
    } catch {
      tokenStore.clear()
      return null
    }
  }
}