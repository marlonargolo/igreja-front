// src/components/admin-externa/AdminExternaLayout.tsx
//
// Layout próprio da Administração Externa: identidade visual distinta
// (fundo escuro + acento âmbar) para diferenciar claramente da operação
// dentro de uma Igreja específica.
import { ReactNode, useState } from 'react'
import { AdminExternaSidebar } from './AdminExternaSidebar'
import { AdminExternaHeader } from './AdminExternaHeader'

interface Props {
  crumbs: { label: string; to?: string }[]
  title: string
  action?: ReactNode
  children: ReactNode
}

export function AdminExternaLayout({ crumbs, title, action, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminExternaSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminExternaHeader
          crumbs={crumbs}
          title={title}
          action={action}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
