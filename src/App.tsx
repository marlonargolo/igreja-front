import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from '@/lib/AppContext'
import { ToastProvider } from '@/components/ui/Extras'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

import Login from '@/pages/Login'
import ChurchSelection from '@/pages/ChurchSelection'
import Dashboard from '@/pages/Dashboard'
import Members from '@/pages/Members'
import MemberForm from '@/pages/MemberForm'
import MemberProfile from '@/pages/MemberProfile'
import Congregations from '@/pages/Congregations'
import CongregationDetail from '@/pages/CongregationDetail'
import Finance from '@/pages/Finance'
import Assets from '@/pages/Assets'
import AssetForm from '@/pages/AssetForm'
import Accounting from '@/pages/Accounting'
import Reports from '@/pages/Reports'
import UsersPage from '@/pages/UsersPage'
import Settings from '@/pages/Settings'
import Subscription from '@/pages/Subscription'

function withChurch(el: React.ReactNode) {
  return <ProtectedRoute requireChurch>{el}</ProtectedRoute>
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/selecionar-igreja" element={<ProtectedRoute><ChurchSelection /></ProtectedRoute>} />

          <Route path="/dashboard" element={withChurch(<Dashboard />)} />
          <Route path="/membros" element={withChurch(<Members />)} />
          <Route path="/membros/novo" element={withChurch(<MemberForm />)} />
          <Route path="/membros/:id" element={withChurch(<MemberProfile />)} />
          <Route path="/membros/:id/editar" element={withChurch(<MemberForm />)} />
          <Route path="/congregacoes" element={withChurch(<Congregations />)} />
          <Route path="/congregacoes/:id" element={withChurch(<CongregationDetail />)} />
          <Route path="/financeiro" element={withChurch(<Finance />)} />
          <Route path="/patrimonio" element={withChurch(<Assets />)} />
          <Route path="/patrimonio/novo" element={withChurch(<AssetForm />)} />
          <Route path="/contabilidade" element={withChurch(<Accounting />)} />
          <Route path="/relatorios" element={withChurch(<Reports />)} />
          <Route path="/usuarios" element={withChurch(<UsersPage />)} />
          <Route path="/configuracoes" element={withChurch(<Settings />)} />
          <Route path="/configuracoes/assinatura" element={withChurch(<Subscription />)} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AppProvider>
  )
}