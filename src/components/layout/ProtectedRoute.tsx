import { Navigate } from 'react-router-dom'
import { ReactNode } from 'react'
import { useApp } from '@/lib/AppContext'

// Bloqueia acesso às telas internas sem sessão ativa. A validação de
// verdade (organization/church/congregation scope) é sempre feita pelo
// backend — isso aqui só evita telas em branco/erros de fetch no cliente.
export function ProtectedRoute({ children, requireChurch = false }: { children: ReactNode; requireChurch?: boolean }) {
  const { user, church, loading } = useApp()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-brand-300 text-sm">
        Carregando...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (requireChurch && !church) return <Navigate to="/selecionar-igreja" replace />

  return <>{children}</>
}