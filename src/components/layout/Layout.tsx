import { ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  crumbs: { label: string; to?: string }[]
  title: string
  searchPlaceholder?: string
  action?: { label: string; icon?: ReactNode; onClick?: () => void }
  children: ReactNode
}

export function Layout({ crumbs, title, searchPlaceholder, action, children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-brand-50">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          crumbs={crumbs}
          title={title}
          searchPlaceholder={searchPlaceholder}
          action={action}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
