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
  currentBalance?: number
  active: boolean
}

interface FinancialCategory {
  id: number
  name: string
  type: string
}

const ACCOUNT_TYPES = [
  { value: 'CHECKING', label: 'Conta Corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'CASH', label: 'Caixa' },
  { value: 'INVESTMENT', label: 'Investimento' },
]

export default function ContabilidadeConfiguracoes() {
  const showToast = useToast()
  const { church } = useApp()
  const { reloadBackend } = useConfig()
  const [tab, setTab] = useState('Contas Bancárias')

  // Contas bancárias
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [savingAccount, setSavingAccount] = useState(false)
  const [accountForm, setAccountForm] = useState({
    name: '', type: 'CHECKING', bankName: '', agency: '', accountNumber: '',
  })

  // Categorias financeiras
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [categoryType, setCategoryType] = useState('REVENUE')

  // Formas de pagamento (local)
  const { local, addLocal, removeLocal } = useConfig()
  const [newForma, setNewForma] = useState('')

  useEffect(() => {
    loadAccounts()
    loadCategories()
  }, [])

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

  async function loadCategories() {
    setLoadingCats(true)
    try {
      const res = await http.get<ApiSuccess<any>>('/finance/categories', { page: 0, size: 200 })
      const raw = (res.data as any)
      const list = raw?.data || raw?.content || raw || []
      setCategories(Array.isArray(list) ? list : [])
    } catch {
      showToast('Falha ao carregar categorias.')
    } finally {
      setLoadingCats(false)
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
      setAccountForm({ name: '', type: 'CHECKING', bankName: '', agency: '', accountNumber: '' })
      await loadAccounts()
      await reloadBackend() // Atualizar ConfigContext
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

  async function handleAddCategory() {
    if (!newCategory.trim()) return
    try {
      await http.post('/finance/categories', {
        name: newCategory.trim(),
        type: categoryType,
      })
      showToast('Categoria criada.')
      setNewCategory('')
      await loadCategories()
      await reloadBackend()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao criar categoria.')
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm('Excluir esta categoria?')) return
    try {
      await http.delete(`/finance/categories/${id}`)
      showToast('Categoria excluída.')
      await loadCategories()
      await reloadBackend()
    } catch {
      showToast('Falha ao excluir categoria.')
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Contabilidade' }, { label: 'Configurações' }]}
      title="Configurações Financeiras"
    >
      <Tabs
        tabs={['Contas Bancárias', 'Categorias Financeiras', 'Formas de Pagamento']}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {/* ── Contas Bancárias ── */}
      {tab === 'Contas Bancárias' && (
        <div className="space-y-6">
          {/* Formulário de nova conta */}
          <Card>
            <CardHeader><CardTitle>Nova Conta Bancária</CardTitle></CardHeader>
            <CardBody className="pt-2">
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Nome da Conta"
                    value={accountForm.name}
                    onChange={e => setAccountForm({ ...accountForm, name: e.target.value })}
                    placeholder="Ex: Caixa Geral, Conta Bradesco..."
                    required
                  />
                  <Select
                    label="Tipo"
                    value={accountForm.type}
                    onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}
                  >
                    {ACCOUNT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <Input
                    label="Banco (opcional)"
                    value={accountForm.bankName}
                    onChange={e => setAccountForm({ ...accountForm, bankName: e.target.value })}
                    placeholder="Ex: Bradesco, Itaú, Caixa..."
                  />
                  <Input
                    label="Agência (opcional)"
                    value={accountForm.agency}
                    onChange={e => setAccountForm({ ...accountForm, agency: e.target.value })}
                    placeholder="0001"
                  />
                  <Input
                    label="Número da Conta (opcional)"
                    value={accountForm.accountNumber}
                    onChange={e => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                    placeholder="00000-0"
                  />
                </div>
                <Button type="submit" disabled={savingAccount}>
                  <Plus className="h-4 w-4" />
                  {savingAccount ? 'Cadastrando...' : 'Cadastrar Conta'}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Lista de contas */}
          <Card>
            <CardHeader><CardTitle>Contas Cadastradas ({accounts.length})</CardTitle></CardHeader>
            <CardBody className="pt-2">
              {loadingAccounts ? (
                <div className="py-6 text-center text-brand-300">Carregando...</div>
              ) : accounts.length === 0 ? (
                <div className="py-6 text-center text-brand-300">
                  Nenhuma conta cadastrada. Adicione a primeira conta acima.
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/40">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-brand-400" />
                        <div>
                          <p className="font-semibold text-sm text-brand-900">{a.name}</p>
                          <p className="text-xs text-brand-400">
                            {ACCOUNT_TYPES.find(t => t.value === a.type)?.label || a.type}
                            {a.bankName && ` · ${a.bankName}`}
                            {a.agency && ` · Ag: ${a.agency}`}
                            {a.accountNumber && ` · CC: ${a.accountNumber}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={a.active ? 'green' : 'gray'}>{a.active ? 'Ativa' : 'Inativa'}</Badge>
                        <button
                          onClick={() => handleDeleteAccount(a.id)}
                          className="text-brand-200 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Categorias Financeiras ── */}
      {tab === 'Categorias Financeiras' && (
        <Card>
          <CardHeader><CardTitle>Categorias Financeiras</CardTitle></CardHeader>
          <CardBody className="pt-2">
            <p className="text-sm text-brand-400 mb-4">
              Categorias usadas para classificar receitas e despesas em toda a plataforma.
            </p>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Nome da categoria..."
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <Select
                label=""
                value={categoryType}
                onChange={e => setCategoryType(e.target.value)}
              >
                <option value="REVENUE">Receita</option>
                <option value="EXPENSE">Despesa</option>
                <option value="TRANSFER">Transferência</option>
              </Select>
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            {loadingCats ? (
              <div className="py-6 text-center text-brand-300">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/40">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-brand-900">{c.name}</span>
                      <Badge tone={c.type === 'REVENUE' ? 'green' : c.type === 'EXPENSE' ? 'red' : 'blue'}>
                        {c.type === 'REVENUE' ? 'Receita' : c.type === 'EXPENSE' ? 'Despesa' : 'Transferência'}
                      </Badge>
                    </div>
                    <button onClick={() => handleDeleteCategory(c.id)} className="text-brand-200 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ── Formas de Pagamento ── */}
      {tab === 'Formas de Pagamento' && (
        <Card>
          <CardHeader><CardTitle>Formas de Pagamento</CardTitle></CardHeader>
          <CardBody className="pt-2">
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Ex: PIX, Boleto, Cheque..."
                value={newForma}
                onChange={e => setNewForma(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newForma.trim()) { addLocal('formasPagamento', newForma.trim()); setNewForma('') } }}
              />
              <Button onClick={() => { if (newForma.trim()) { addLocal('formasPagamento', newForma.trim()); setNewForma('') } }}>
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {local.formasPagamento.map(item => (
                <div key={item} className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/40">
                  <span className="text-sm font-medium text-brand-900">{item}</span>
                  <button onClick={() => removeLocal('formasPagamento', item)} className="text-brand-200 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </Layout>
  )
}