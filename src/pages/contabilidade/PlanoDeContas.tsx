import { useState, useEffect } from 'react'
import { Plus, Upload, Trash2, ArrowRight } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Extras'
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

interface Account {
  id: number
  code: string
  name: string
  accountType: string
}

interface Mapeamento {
  id: number
  categoriaFinanceira: string
  contaContabil: string
  tipo: 'REVENUE' | 'EXPENSE'
}

const TIPO_LABEL: Record<string, string> = {
  ASSET: 'Ativo', LIABILITY: 'Passivo',
  EQUITY: 'Patrimônio', REVENUE: 'Receita', EXPENSE: 'Despesa',
}

const CATEGORIAS_FIN = [
  'Dízimo', 'Oferta', 'Oferta Alçada', 'Campanha', 'Doação',
  'Conta de Água', 'Conta de Luz', 'Material de Limpeza', 'Aluguel',
  'Manutenção', 'Equipamentos', 'Transferência', 'Repasse (Redízimo)', 'Outros',
]

export default function PlanoDeContas() {
  const showToast = useToast()
  const [tab, setTab] = useState('Plano de Contas')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [mapeamentos, setMapeamentos] = useState<Mapeamento[]>([
    { id: 1, categoriaFinanceira: 'Dízimo', contaContabil: '706 — Receitas Diversas', tipo: 'REVENUE' },
    { id: 2, categoriaFinanceira: 'Oferta', contaContabil: '706 — Receitas Diversas', tipo: 'REVENUE' },
    { id: 3, categoriaFinanceira: 'Aluguel', contaContabil: '478 — Contas a Pagar', tipo: 'EXPENSE' },
    { id: 4, categoriaFinanceira: 'Conta de Luz', contaContabil: '478 — Contas a Pagar', tipo: 'EXPENSE' },
  ])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [form, setForm] = useState({ code: '', name: '', accountType: 'ASSET' })
  const [mapForm, setMapForm] = useState({
    categoriaFinanceira: CATEGORIAS_FIN[0],
    contaContabil: '',
    tipo: 'REVENUE' as 'REVENUE' | 'EXPENSE',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await http.get<ApiSuccess<Account[]>>('/accounting/chart-of-accounts')
      setAccounts(Array.isArray(res.data) ? res.data : [])
    } catch {
      showToast('Falha ao carregar plano de contas.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.name) { showToast('Código e nome são obrigatórios.'); return }
    setSaving(true)
    try {
      await http.post('/accounting/chart-of-accounts', {
        code: form.code, name: form.name, accountType: form.accountType, analytical: true,
      })
      showToast('Conta criada.')
      setOpen(false)
      setForm({ code: '', name: '', accountType: 'ASSET' })
      load()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao criar conta.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta conta?')) return
    try {
      await http.delete(`/accounting/chart-of-accounts/${id}`)
      showToast('Conta excluída.')
      load()
    } catch { showToast('Falha ao excluir conta.') }
  }

  function handleImport() {
    if (!uploadFile) { showToast('Selecione um arquivo.'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(l => l.includes('=') && !l.startsWith('['))
      let imported = 0
      Promise.all(lines.map(async line => {
        const parts = line.split('=')
        if (parts.length < 2) return
        const values = parts[1].replace(/"/g, '').split(',')
        const code = values[1]?.trim()
        const name = values[2]?.trim()
        if (!code || !name) return
        try {
          await http.post('/accounting/chart-of-accounts', { code, name, accountType: 'EXPENSE', analytical: true })
          imported++
        } catch {}
      })).then(() => {
        showToast(`${imported} contas importadas.`)
        setUploadFile(null)
        load()
      })
    }
    reader.readAsText(uploadFile)
  }

  function addMapeamento() {
    if (!mapForm.contaContabil) { showToast('Informe a conta contábil.'); return }
    setMapeamentos(prev => [...prev, {
      id: Date.now(),
      categoriaFinanceira: mapForm.categoriaFinanceira,
      contaContabil: mapForm.contaContabil,
      tipo: mapForm.tipo,
    }])
    showToast('Mapeamento adicionado.')
    setMapOpen(false)
    setMapForm({ categoriaFinanceira: CATEGORIAS_FIN[0], contaContabil: '', tipo: 'REVENUE' })
  }

  function removeMapeamento(id: number) {
    setMapeamentos(prev => prev.filter(m => m.id !== id))
    showToast('Mapeamento removido.')
  }

  function exportarMapeamento() {
    const linhas = mapeamentos.map(m => `"${m.categoriaFinanceira}","${m.contaContabil}","${m.tipo}"`)
    const blob = new Blob([['Categoria Financeira,Conta Contábil,Tipo', ...linhas].join('\r\n')], { type: 'text/csv' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'mapeamento_contas.csv' })
    a.click()
  }

  return (
    <Layout
      crumbs={[{ label: 'Contabilidade' }, { label: 'Plano de Contas' }]}
      title="Plano de Contas"
      action={tab === 'Plano de Contas'
        ? { label: 'Nova Conta', icon: <Plus className="h-4 w-4" />, onClick: () => setOpen(true) }
        : { label: 'Novo Mapeamento', icon: <Plus className="h-4 w-4" />, onClick: () => setMapOpen(true) }
      }
    >
      <Tabs tabs={['Plano de Contas', 'Mapeamento']} active={tab} onChange={setTab} className="mb-6" />

      {/* ── Plano de Contas ── */}
      {tab === 'Plano de Contas' && (
        <>
          <Card className="mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Importar via TXT Alterdata
                </p>
                <input type="file" accept=".txt,.csv" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="text-sm text-brand-500" />
              </div>
              <Button onClick={handleImport} disabled={!uploadFile} variant="outline">
                <Upload className="h-4 w-4" /> Importar
              </Button>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Contas Cadastradas ({accounts.length})</CardTitle></CardHeader>
            <CardBody className="pt-2">
              {loading ? (
                <div className="py-8 text-center text-brand-300">Carregando...</div>
              ) : accounts.length === 0 ? (
                <div className="py-8 text-center text-brand-300">Nenhuma conta. Clique em Nova Conta ou importe um arquivo.</div>
              ) : (
                <Table>
                  <Thead><tr><Th>Código</Th><Th>Nome</Th><Th>Tipo</Th><Th>Ações</Th></tr></Thead>
                  <tbody>
                    {accounts.map(a => (
                      <Tr key={a.id}>
                        <Td className="font-mono text-brand-500">{a.code}</Td>
                        <Td className="font-semibold">{a.name}</Td>
                        <Td><Badge tone="blue">{TIPO_LABEL[a.accountType] || a.accountType}</Badge></Td>
                        <Td>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* ── Mapeamento — item 9 ── */}
      {tab === 'Mapeamento' && (
        <>
          <Card className="mb-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-brand-900 text-sm">Mapeamento de Categorias → Contas Contábeis</p>
                <p className="text-xs text-brand-300 mt-1">Define qual conta contábil cada categoria financeira representa na exportação Alterdata.</p>
              </div>
              <Button variant="outline" onClick={exportarMapeamento} size="sm">
                <Download className="h-3.5 w-3.5" /> Exportar CSV
              </Button>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Mapeamentos Configurados ({mapeamentos.length})</CardTitle></CardHeader>
            <CardBody className="pt-2">
              {mapeamentos.length === 0 ? (
                <div className="py-8 text-center text-brand-300">Nenhum mapeamento. Clique em Novo Mapeamento.</div>
              ) : (
                <Table>
                  <Thead>
                    <tr><Th>Categoria Financeira</Th><Th></Th><Th>Conta Contábil</Th><Th>Tipo</Th><Th>Ações</Th></tr>
                  </Thead>
                  <tbody>
                    {mapeamentos.map(m => (
                      <Tr key={m.id}>
                        <Td className="font-semibold text-brand-900">{m.categoriaFinanceira}</Td>
                        <Td><ArrowRight className="h-4 w-4 text-brand-300" /></Td>
                        <Td className="text-brand-700">{m.contaContabil}</Td>
                        <Td><Badge tone={m.tipo === 'REVENUE' ? 'green' : 'red'}>{m.tipo === 'REVENUE' ? 'Receita' : 'Despesa'}</Badge></Td>
                        <Td>
                          <button onClick={() => removeMapeamento(m.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* Modal nova conta */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nova Conta Contábil"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando...' : 'Criar'}</Button></>}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Código" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Ex: 1-1-01-01-01" required />
          <Input label="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Caixa Geral" required />
          <Select label="Tipo" value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })}>
            <option value="ASSET">Ativo</option>
            <option value="LIABILITY">Passivo</option>
            <option value="EQUITY">Patrimônio Líquido</option>
            <option value="REVENUE">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </Select>
        </form>
      </Modal>

      {/* Modal novo mapeamento */}
      <Modal open={mapOpen} onClose={() => setMapOpen(false)} title="Novo Mapeamento"
        footer={<><Button variant="outline" onClick={() => setMapOpen(false)}>Cancelar</Button><Button onClick={addMapeamento}>Adicionar</Button></>}
      >
        <div className="space-y-4">
          <Select label="Categoria Financeira" value={mapForm.categoriaFinanceira} onChange={e => setMapForm({ ...mapForm, categoriaFinanceira: e.target.value })}>
            {CATEGORIAS_FIN.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select label="Tipo" value={mapForm.tipo} onChange={e => setMapForm({ ...mapForm, tipo: e.target.value as any })}>
            <option value="REVENUE">Receita</option>
            <option value="EXPENSE">Despesa</option>
          </Select>
          <Select label="Conta Contábil de Destino" value={mapForm.contaContabil} onChange={e => setMapForm({ ...mapForm, contaContabil: e.target.value })}>
            <option value="">— Selecione —</option>
            {accounts.length > 0
              ? accounts.map(a => <option key={a.id} value={`${a.code} — ${a.name}`}>{a.code} — {a.name}</option>)
              : (
                <>
                  <option value="10 — Caixa Geral">10 — Caixa Geral</option>
                  <option value="706 — Receitas Diversas">706 — Receitas Diversas</option>
                  <option value="478 — Despesas Diversas">478 — Despesas Diversas</option>
                </>
              )
            }
          </Select>
        </div>
      </Modal>
    </Layout>
  )
}

// Download icon not imported — add to imports
function Download({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}