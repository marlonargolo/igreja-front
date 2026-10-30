// src/pages/admin-externa/Suporte.tsx
//
// Suporte operável dentro do próprio painel administrativo externo, sem
// precisar entrar na área interna de uma Igreja. Em modo global (nenhuma
// Igreja selecionada no seletor do topo), o backend já devolve os chamados
// de todas as Igrejas (SupportService.listTickets — "ROOT global → todos");
// com uma Igreja selecionada, filtra para a dela. Cada chamado identifica a
// Igreja solicitante (churchName).
import Chamados from '@/pages/admin/Chamados'

export default function AdminExternaSuporte() {
  return <Chamados isAdminExterna />
}
