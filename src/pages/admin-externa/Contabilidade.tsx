// src/pages/admin-externa/Contabilidade.tsx
//
// Contabilidade operável dentro do próprio painel administrativo externo —
// mesmo padrão de Assinatura: sem navegar para a área interna da Igreja, sem
// trocar o menu administrativo. A Igreja em escopo vem do seletor do topo da
// Administração Externa (AdminExternaContext), que já reflete automaticamente
// nas chamadas HTTP (X-Root-Mode / X-Church-Id) — Accounting só precisa saber
// para qual layout renderizar e qual nome de Igreja exibir.
import Accounting from '@/pages/Accounting'
import { useAdminExterna } from '@/lib/AdminExternaContext'

export default function AdminExternaContabilidade() {
  const { scopeChurch } = useAdminExterna()
  return <Accounting isAdminExterna scopeChurch={scopeChurch} />
}
