// src/pages/admin-externa/Assinatura.tsx
//
// Gestão de planos de assinatura, movida para a Administração Externa: o
// catálogo de planos (/plans) sempre foi exclusivo de ROOT no backend, então
// não fazia sentido ficar dentro do menu "Administração" de uma Igreja
// específica — nenhum admin de Igreja conseguia usá-la. Aqui ela segue o
// mesmo padrão de "Módulos": sem Igreja selecionada no seletor do topo,
// opera o catálogo de planos; com uma selecionada, também permite ver e
// trocar o plano daquela Igreja.
import Subscription from '@/pages/Subscription'
import { useAdminExterna } from '@/lib/AdminExternaContext'

export default function AdminExternaAssinatura() {
  const { scopeChurch } = useAdminExterna()
  return <Subscription isAdminExterna scopeChurch={scopeChurch} />
}
