// src/App.tsx
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from '@/lib/AppContext'
import { ConfigProvider } from '@/lib/ConfigContext'  // <-- ADICIONE ESTA LINHA
import { ToastProvider } from '@/components/ui/Extras'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

import Login from '@/pages/Login'
import ChurchSelection from '@/pages/ChurchSelection'
import Dashboard from '@/pages/Dashboard'

// Secretaria
import Members from '@/pages/Members'
import MemberForm from '@/pages/MemberForm'
import MemberProfile from '@/pages/MemberProfile'
import SecretariaTransferencias from '@/pages/placeholders/SecretariaTransferencias'
import Credenciais from '@/pages/placeholders/Credenciais'
import RelatoriosSecretaria from '@/pages/placeholders/RelatoriosSecretaria'
import SecretariaConfiguracoes from '@/pages/placeholders/SecretariaConfiguracoes'

// Tesouraria
import Finance from '@/pages/Finance'
import Receitas from '@/pages/tesouraria/Receitas'
import Despesas from '@/pages/tesouraria/Despesas'
import RelatoriosTesouraria from '@/pages/placeholders/RelatoriosTesouraria'
import TesourariaConfiguracoes from '@/pages/placeholders/TesourariaConfiguracoes'

// Patrimônio
import Assets from '@/pages/Assets'
import AssetForm from '@/pages/AssetForm'
import PatrimonioPlaceholder from '@/pages/placeholders/PatrimonioPlaceholder'

// Contabilidade
import Accounting from '@/pages/Accounting'

// Configurações gerais
import UnidadesPage from '@/pages/configuracoes/UnidadesPage'
import UsersPage from '@/pages/UsersPage'
import PerfisPage from '@/pages/configuracoes/PerfisPage'
import Subscription from '@/pages/Subscription'

import CongregarcoesPage from '@/pages/configuracoes/CongregarcoesPage'
import AdminIgrejas from '@/pages/admin/AdminIgrejas'
import AdminAssinatura from '@/pages/admin/AdminAssinatura'
import AdminAparencia from '@/pages/admin/AdminAparencia'
import AdminIntegracoes from '@/pages/admin/AdminIntegracoes'
import AdminBackup from '@/pages/admin/AdminBackup'
import Demonstracoes from '@/pages/contabilidade/Demonstracoes'
import PlanoDeContas from '@/pages/contabilidade/PlanoDeContas'
import Chamados from '@/pages/admin/Chamados'
import ContabilidadeConfiguracoes from '@/pages/contabilidade/ContabilidadeConfiguracoes'


function withChurch(el: React.ReactNode) {
  return <ProtectedRoute requireChurch>{el}</ProtectedRoute>
}

export default function App() {
  return (
    <AppProvider>
      <ConfigProvider>  {/* <-- ADICIONE ESTA LINHA */}
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/selecionar-igreja" element={<ProtectedRoute><ChurchSelection /></ProtectedRoute>} />

            {/* Dashboard */}
            <Route path="/dashboard" element={withChurch(<Dashboard />)} />

            {/* Configurações gerais */}
            <Route path="/configuracoes/unidades" element={withChurch(<UnidadesPage />)} />
            <Route path="/configuracoes/perfis" element={withChurch(<PerfisPage />)} />
            <Route path="/configuracoes/assinatura" element={withChurch(<Subscription />)} />
            <Route path="/usuarios" element={withChurch(<UsersPage />)} />

            {/* Secretaria */}
            <Route path="/membros" element={withChurch(<Members />)} />
            <Route path="/membros/novo" element={withChurch(<MemberForm />)} />
            <Route path="/membros/:id/editar" element={withChurch(<MemberForm />)} />
            <Route path="/membros/:id" element={withChurch(<MemberProfile />)} />
            <Route path="/secretaria/transferencias" element={withChurch(<SecretariaTransferencias />)} />
            <Route path="/secretaria/credenciais" element={withChurch(<Credenciais />)} />
            <Route path="/secretaria/relatorios" element={withChurch(<RelatoriosSecretaria />)} />
            <Route path="/secretaria/configuracoes" element={withChurch(<SecretariaConfiguracoes />)} />

            {/* Tesouraria */}
            <Route path="/tesouraria/receitas" element={withChurch(<Receitas />)} />
            <Route path="/tesouraria/despesas" element={withChurch(<Despesas />)} />
            <Route path="/tesouraria/transferencias" element={withChurch(<Finance />)} />
            <Route path="/tesouraria/relatorios" element={withChurch(<RelatoriosTesouraria />)} />
            <Route path="/tesouraria/configuracoes" element={withChurch(<TesourariaConfiguracoes />)} />

            {/* Patrimônio */}
            <Route path="/patrimonio" element={withChurch(<Assets />)} />
            <Route path="/patrimonio/novo" element={withChurch(<AssetForm />)} />
            <Route path="/patrimonio/movimentacao" element={withChurch(<PatrimonioPlaceholder title="Movimentação de Patrimônio" />)} />
            <Route path="/patrimonio/baixa" element={withChurch(<PatrimonioPlaceholder title="Baixa de Patrimônio" />)} />
            <Route path="/patrimonio/relatorios" element={withChurch(<PatrimonioPlaceholder title="Relatórios — Patrimônio" />)} />
            <Route path="/patrimonio/configuracoes" element={withChurch(<PatrimonioPlaceholder title="Configurações — Patrimônio" />)} />

            {/* Contabilidade */}
            <Route path="/contabilidade/fechamento" element={withChurch(<Accounting />)} />
            <Route path="/contabilidade/exportacao" element={withChurch(<Accounting />)} />
            <Route path="/contabilidade/backup" element={withChurch(<Accounting />)} />
            <Route path="/contabilidade/configuracoes" element={withChurch(<ContabilidadeConfiguracoes />)} />

            <Route path="/configuracoes/congregacoes" element={withChurch(<CongregarcoesPage />)} />
            <Route path="/admin/igrejas" element={withChurch(<AdminIgrejas />)} />
            <Route path="/admin/assinatura" element={withChurch(<AdminAssinatura />)} />
            <Route path="/admin/aparencia" element={withChurch(<AdminAparencia />)} />
            <Route path="/admin/integracoes" element={withChurch(<AdminIntegracoes />)} />
            <Route path="/admin/backup" element={withChurch(<AdminBackup />)} />
            <Route path="/contabilidade/demonstracoes" element={withChurch(<Demonstracoes />)} />
            <Route path="/contabilidade/plano-de-contas" element={withChurch(<PlanoDeContas />)} />
            <Route path="/suporte/chamados" element={withChurch(<Chamados />)} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </ConfigProvider>  {/* <-- ADICIONE ESTA LINHA */}
    </AppProvider>
  )
}