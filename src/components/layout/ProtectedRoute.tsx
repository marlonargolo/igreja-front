// src/components/layout/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useApp } from '@/lib/AppContext'

export function ProtectedRoute({ children, requireChurch = false }: { children: ReactNode; requireChurch?: boolean }) {
  const { church, loading } = useApp()
  
  // Verificar se o usuário está logado via localStorage/token
  const isAuthenticated = !!localStorage.getItem('access_token') || !!localStorage.getItem('user')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-300 text-sm">
        Carregando...
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireChurch && !church) return <Navigate to="/selecionar-igreja" replace />

  return <>{children}</>
}