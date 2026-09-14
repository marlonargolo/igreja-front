// src/components/layout/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useApp } from '@/lib/AppContext'

export function ProtectedRoute({
  children,
  requireChurch = false,
  requireRoot = false,
}: {
  children: ReactNode
  requireChurch?: boolean
  requireRoot?: boolean
}) {
  const { user, church, loading, isRoot } = useApp()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-300 text-sm">
        Carregando...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  // Administração externa: exclusiva do ROOT. Qualquer outro usuário é
  // redirecionado para a seleção de igreja, mesmo que acesse a rota diretamente.
  if (requireRoot && !isRoot) {
    return <Navigate to="/selecionar-igreja" replace />
  }

  if (requireChurch && !church) {
    // Redirecionar para seleção de igreja
    return <Navigate to="/selecionar-igreja" replace />
  }

  return <>{children}</>
}