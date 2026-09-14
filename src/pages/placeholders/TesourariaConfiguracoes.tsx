import { useState, useEffect } from 'react'
import { Plus, Trash2, Building2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Extras'
import { useConfig } from '@/lib/ConfigContext'
import { useApp } from '@/lib/AppContext'
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

interface FinancialAccount {
  id: number
  name: string
  type: string
  bankName?: string
  agency?: string
  accountNumber?: string
  active: boolean
}

const ACCOUNT_TYPES = [
  { value: 'CASH',       label: 'Caixa' },
  { value: 'CHECKING',   label: 'Conta Corrente' },
  { value: 'SAVINGS',    label: 'Poupança' },
  { value: 'INVESTMENT', label: 'Investimento' },
]

export default function TesourariaConfiguracoes() {
  const showToast = useToast()
  const { church } = useApp()
  const { local, addLocal, removeLocal, reloadBackend } = useConfig()
  const [tab, setTab] = useState('Fornecedores')

  // Fornecedores
  const [newFornecedor, setNewFornecedor] = useState('')

  async function loadAccounts() {
    setLoadingAccounts(true)
    try {
      const res = await http.get<ApiSuccess<any>>('/finance/accounts/active')
      const raw = (res.data as any)
      const list = Array.isArray(raw) ? raw : (raw?.data || raw?.content || [])
      setAccounts(Array.isArray(list) ? list : [])
    } catch {
      showToast('Falha ao carregar contas.')
    } finally {
      setLoadingAccounts(false)
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!accountForm.name) { showToast('Nome é obrigatório.'); return }
    setSavingAccount(true)
    try {
      await http.post('/finance/accounts', {
        name: accountForm.name,
        type: accountForm.type,
        bankName: accountForm.bankName || undefined,
        agency: accountForm.agency || undefined,
        accountNumber: accountForm.accountNumber || undefined,
        initialBalance: 0,
        active: true,
        churchId: church?.id ? Number(church.id) : undefined,
      })
      showToast('Conta cadastrada com sucesso.')
      setAccountForm({ name: '', type: 'CASH', bankName: '', agency: '', accountNumber: '' })
      await loadAccounts()
      await reloadBackend()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao cadastrar conta.')
    } finally {
      setSavingAccount(false)
    }
  }

  async function handleDeleteAccount(id: number) {
    if (!confirm('Excluir esta conta?')) return
    try {
      await http.delete(`/finance/accounts/${id}`)
      showToast('Conta excluída.')
      await loadAccounts()
      await reloadBackend()
    } catch {
      showToast('Falha ao excluir conta.')
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Tesouraria' }, { label: 'Configurações' }]}
      title="Configurações da Tesouraria"
    >
      

      {/* ── Fornecedores ── */}
      {tab === 'Fornecedores' && (
        <Card>
          <CardHeader><CardTitle>Fornecedores</CardTitle></CardHeader>
          <CardBody className="pt-2">
            <p className="text-sm text-brand-400 mb-4">
              Cadastre fornecedores para usar no lançamento de despesas.
            </p>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Nome do fornecedor..."
                value={newFornecedor}
                onChange={e => setNewFornecedor(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newFornecedor.trim()) {
                    addLocal('fornecedores', newFornecedor.trim())
                    setNewFornecedor('')
                  }
                }}
              />
              <Button onClick={() => {
                if (!newFornecedor.trim()) return
                addLocal('fornecedores', newFornecedor.trim())
                setNewFornecedor('')
              }}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {local.fornecedores.map(item => (
                <div key={item} className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/40">
                  <span className="text-sm font-medium text-brand-900">{item}</span>
                  <button onClick={() => removeLocal('fornecedores', item)} className="text-brand-200 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {local.fornecedores.length === 0 && (
                <p className="text-sm text-brand-300 py-4 text-center">Nenhum fornecedor cadastrado.</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

    </Layout>
  )
}