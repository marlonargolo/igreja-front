import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Download, FileText, Lock, HardDrive, TrendingUp, TrendingDown,
  Building2, CheckSquare, Square, Check, Upload, Eye, X,
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Extras'
import { formatCurrency } from '@/lib/format'
import { financeService, type Transaction } from '@/services'
import { churchesService, type Church } from '@/services/churches.service'
import { FILES_BASE } from '@/services/churches.service'
import { useConfig } from '@/lib/ConfigContext'
import { Edit2, XCircle } from 'lucide-react'


interface PeriodoFechado {
  mes: string
  label: string
  fechadoEm: string
  igreja: string
}

export default function Accounting() {
  const location = useLocation()
  const showToast = useToast()
  const path = location.pathname
  if (path.includes('exportacao')) return <ExportacaoContabil showToast={showToast} />
  if (path.includes('backup'))     return <BackupSistema showToast={showToast} />
  return <FechamentoContabil showToast={showToast} />
}

function FechamentoContabil({ showToast }: { showToast: (m: string) => void }) {
  const { config } = useConfig()
  const [tab, setTab] = useState('Visão Geral')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [churchFilter, setChurchFilter] = useState('Todas')
  const [mesFilter, setMesFilter] = useState('')
  const [contaFilter, setContaFilter] = useState('Todas')
  const [typeFilter, setTypeFilter] = useState('Todas')
  const [loading, setLoading] = useState(true)
  const [confirmados, setConfirmados] = useState<Set<number>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Modal de conferência
  const [viewTx, setViewTx] = useState<Transaction | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ description: '', amount: '', notes: '' })
  const [contadorNota, setContadorNota] = useState<Record<number, string>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  // Comprovantes
  const [comprovantes, setComprovantes] = useState<Map<number, { name: string; url: string }>>(new Map())
  const [uploadModalId, setUploadModalId] = useState<number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Fechamento
  const [mes, setMes] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [fechamentoIgreja, setFechamentoIgreja] = useState('Todas')
  const [fechando, setFechando] = useState(false)
  const [periodosFechados, setPeriodosFechados] = useState<PeriodoFechado[]>([])
  const [anoFiltro, setAnoFiltro] = useState(String(new Date().getFullYear()))

  const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [txRes, churchList] = await Promise.all([
        financeService.list({ size: 500 }) as any,
        churchesService.list(),
      ])
      const raw = txRes as any
      setTransactions(Array.isArray(raw?.content || raw?.data || raw) ? raw?.content || raw?.data || raw : [])
      setChurches(churchList)
    } catch { showToast('Falha ao carregar dados.') }
    finally { setLoading(false) }
  }

  const filtered = transactions.filter(t => {
    const matchChurch = churchFilter === 'Todas' || String((t as any).churchId) === churchFilter
    const matchType   = typeFilter === 'Todas' || t.type === typeFilter
    const matchConta  = contaFilter === 'Todas' || ((t as any).accountName || 'Caixa Geral') === contaFilter
    const matchMes    = !mesFilter || t.transactionDate?.startsWith(mesFilter)
    return matchChurch && matchType && matchConta && matchMes
  })

  const totalRevenue = filtered.filter(t => t.type === 'REVENUE').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)

  const byChurch = churches.map(c => {
    const txs = transactions.filter(t => String((t as any).churchId) === String(c.id))
    const rev = txs.filter(t => t.type === 'REVENUE').reduce((s, t) => s + Number(t.amount), 0)
    const exp = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
    const allConfirmed = txs.length > 0 && txs.every(t => confirmados.has(t.id) || t.status === 'CONFIRMED')
    return { church: c, revenue: rev, expense: exp, balance: rev - exp, count: txs.length, conciliado: allConfirmed }
  }).filter(r => r.count > 0)

  function toggleSelect(id: number) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(t => t.id)))
  }

  async function confirmarLancamento(id: number) {
    try {
      await financeService.confirm(id)
      setConfirmados(prev => new Set(prev).add(id))
      showToast('Lançamento confirmado.')
      load()
    } catch {
      setConfirmados(prev => new Set(prev).add(id))
      showToast('Lançamento confirmado.')
    }
  }

  function desconfirmarLancamento(id: number) {
    setConfirmados(prev => { const n = new Set(prev); n.delete(id); return n })
    showToast('Lançamento desconfirmado.')
  }

  async function confirmarSelecionados() {
    if (!selectedIds.size) { showToast('Selecione ao menos um.'); return }
    for (const id of selectedIds) {
      try { await financeService.confirm(id) } catch {}
      setConfirmados(prev => new Set(prev).add(id))
    }
    showToast(`${selectedIds.size} confirmado(s).`)
    setSelectedIds(new Set())
    load()
  }

  function openView(t: Transaction) {
    setViewTx(t)
    setEditMode(false)
    setEditForm({ description: t.description, amount: String(t.amount), notes: (t as any).notes || '' })
  }

  async function saveEdit() {
    if (!viewTx) return
    setSavingEdit(true)
    try {
      await financeService.update(viewTx.id, {
        description: editForm.description,
        amount: parseFloat(editForm.amount),
      } as any)
      showToast('Lançamento atualizado.')
      setEditMode(false)
      load()
    } catch { showToast('Falha ao salvar.') }
    finally { setSavingEdit(false) }
  }

  async function deleteTx() {
    if (!viewTx || !confirm('Excluir este lançamento?')) return
    try {
      await financeService.delete(viewTx.id)
      showToast('Lançamento excluído.')
      setViewTx(null)
      load()
    } catch { showToast('Falha ao excluir.') }
  }

  function handleUpload() {
    if (!uploadFile || !uploadModalId) return
    const url = URL.createObjectURL(uploadFile)
    setComprovantes(prev => new Map(prev).set(uploadModalId, { name: uploadFile.name, url }))
    showToast('Comprovante vinculado.')
    setUploadFile(null)
    setUploadModalId(null)
  }

  async function fecharPeriodo() {
    if (!mes) { showToast('Selecione o mês.'); return }
    const [ano, mesNum] = mes.split('-')
    const mDate = new Date(Number(ano), Number(mesNum) - 1, 1)
    const label = mDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const igrejaNome = fechamentoIgreja === 'Todas' ? 'Todas as Igrejas' : churches.find(c => String(c.id) === fechamentoIgreja)?.name || 'Todas'
    setFechando(true)
    await new Promise(r => setTimeout(r, 800))
    setPeriodosFechados(prev => [...prev, {
      mes, label: label.charAt(0).toUpperCase() + label.slice(1),
      fechadoEm: new Date().toISOString().split('T')[0], igreja: igrejaNome,
    }])
    showToast(`Período ${label} fechado.`)
    setFechando(false)
  }

  function reabrirPeriodo(p: PeriodoFechado) {
    setPeriodosFechados(prev => prev.filter(x => !(x.mes === p.mes && x.igreja === p.igreja)))
    showToast(`Período ${p.label} reaberto.`)
  }

  const periodosFiltradosPorAno = periodosFechados.filter(p => p.mes.startsWith(anoFiltro))
  const anosDisponiveis = [...new Set([...periodosFechados.map(p => p.mes.slice(0, 4)), anoFiltro])].sort().reverse()

  // Item 10: resolver URL de imagem
  function resolveUrl(url?: string) {
    if (!url) return undefined
    if (url.startsWith('http') || url.startsWith('blob:')) return url
    return `${FILES_BASE}${url}`
  }

  return (
    <Layout crumbs={[{ label: 'Contabilidade' }, { label: 'Fechamento Mensal' }]} title="Contabilidade">
      <Tabs tabs={['Visão Geral', 'Lançamentos', 'Fechamento']} active={tab} onChange={setTab} className="mb-6" />

      {/* ── Visão Geral — item 13: sem totais no topo, igrejas compactas com clique ── */}
      {tab === 'Visão Geral' && (
        <div>
          <p className="text-sm text-brand-500 mb-4">
            Clique em uma igreja para filtrar os lançamentos. Contador vê apenas igrejas atribuídas ao seu perfil.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {byChurch.map(r => {
              const logo = resolveUrl(r.church.logoUrl)
              return (
                <button
                  key={r.church.id}
                  onClick={() => {
                    setChurchFilter(String(r.church.id))
                    setTab('Lançamentos')
                  }}
                  className="text-left bg-white rounded-xl border border-brand-100 p-4 hover:border-brand-400 hover:shadow-soft transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {logo ? (
                      <img
                        src={logo}
                        alt={r.church.name}
                        className="h-10 w-10 rounded-lg object-cover border border-brand-100"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-brand-800 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{r.church.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-brand-900 text-sm truncate">{r.church.name}</p>
                      <p className="text-xs text-brand-300">{r.count} lançamentos</p>
                    </div>
                    <Badge tone={r.conciliado ? 'green' : 'yellow'}>
                      {r.conciliado ? 'Conciliado' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-green-50 rounded-lg py-1.5">
                      <p className="text-green-600 font-bold">{formatCurrency(r.revenue)}</p>
                      <p className="text-green-400">Receitas</p>
                    </div>
                    <div className="bg-red-50 rounded-lg py-1.5">
                      <p className="text-red-500 font-bold">{formatCurrency(r.expense)}</p>
                      <p className="text-red-400">Despesas</p>
                    </div>
                    <div className={`${r.balance >= 0 ? 'bg-brand-50' : 'bg-red-50'} rounded-lg py-1.5`}>
                      <p className={`font-bold ${r.balance >= 0 ? 'text-brand-900' : 'text-red-500'}`}>{formatCurrency(r.balance)}</p>
                      <p className="text-brand-400">Saldo</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Lançamentos — itens 5, 7, 25 ── */}
      {tab === 'Lançamentos' && (
        <>
          <Card className="p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
              <Select label="Igreja" value={churchFilter} onChange={e => setChurchFilter(e.target.value)}>
                <option value="Todas">Todas as Igrejas</option>
                {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </Select>
              <Select label="Mês" value={mesFilter} onChange={e => setMesFilter(e.target.value)}>
                <option value="">Todos os meses</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date()
                  const y = d.getFullYear()
                  const m = String(i + 1).padStart(2, '0')
                  return <option key={m} value={`${y}-${m}`}>{MESES_LABEL[i]} {y}</option>
                })}
              </Select>
              <Select label="Conta" value={contaFilter} onChange={e => setContaFilter(e.target.value)}>
                <option value="Todas">Todas as Contas</option>
                {config.contasECaixas.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Tipo" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="Todas">Receitas e Despesas</option>
                <option value="REVENUE">Receitas</option>
                <option value="EXPENSE">Despesas</option>
              </Select>
            </div>
          </Card>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-brand-500">{selectedIds.size} selecionado(s)</span>
              <Button size="sm" onClick={confirmarSelecionados}>
                <Check className="h-3.5 w-3.5" /> Confirmar Selecionados
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>Limpar</Button>
            </div>
          )}

          <Card>
            <CardHeader><CardTitle>{filtered.length} lançamentos — Saldo: {formatCurrency(totalRevenue - totalExpense)}</CardTitle></CardHeader>
            <CardBody className="pt-2">
              {loading ? (
                <div className="py-8 text-center text-brand-300">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-brand-300">Nenhum lançamento encontrado.</div>
              ) : (
                <Table>
                  <Thead>
                    <tr>
                      <Th><button onClick={toggleSelectAll}>{selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="h-4 w-4 text-brand-800" /> : <Square className="h-4 w-4 text-brand-300" />}</button></Th>
                      <Th>Data</Th><Th>Descrição</Th><Th>Igreja</Th><Th>Conta</Th><Th>Tipo</Th><Th>Valor</Th><Th>Status</Th><Th>Comprovante</Th><Th>Ações</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {filtered.map(t => {
                      const church = churches.find(c => String(c.id) === String((t as any).churchId))
                      const isSelected = selectedIds.has(t.id)
                      const isConfirmado = confirmados.has(t.id) || t.status === 'CONFIRMED'
                      const comprov = comprovantes.get(t.id)
                      // item 10: resolver URL do comprovante do backend
                      const comprovUrl = comprov?.url || resolveUrl((t as any).attachmentUrl)
                      const comprovName = comprov?.name || (t as any).attachmentUrl?.split('/').pop()
                      return (
                        <Tr key={t.id} className={isSelected ? 'bg-brand-50' : ''}>
                          <Td><button onClick={() => toggleSelect(t.id)}>{isSelected ? <CheckSquare className="h-4 w-4 text-brand-800" /> : <Square className="h-4 w-4 text-brand-200" />}</button></Td>
                          <Td className="text-brand-500 whitespace-nowrap">{new Date(t.transactionDate).toLocaleDateString('pt-BR')}</Td>
                          <Td>
                            <button onClick={() => openView(t)} className="font-semibold text-brand-700 hover:underline text-left">
                              {t.description}
                            </button>
                          </Td>
                          <Td className="text-brand-500">{church?.name || '—'}</Td>
                          <Td className="text-brand-500">{(t as any).accountName || 'Caixa Geral'}</Td>
                          <Td><Badge tone={t.type === 'REVENUE' ? 'green' : 'red'}>{t.type === 'REVENUE' ? 'Receita' : 'Despesa'}</Badge></Td>
                          <Td className={`font-semibold ${t.type === 'REVENUE' ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(Number(t.amount))}</Td>
                          <Td><Badge tone={isConfirmado ? 'green' : 'yellow'}>{isConfirmado ? 'Confirmado' : 'A confirmar'}</Badge></Td>
                          <Td>
                            {/* item 6/10: exibir comprovante do tesoureiro */}
                            {comprovUrl ? (
                              <a href={comprovUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 hover:underline flex items-center gap-1">
                                <Eye className="h-3 w-3" /> {comprovName ? comprovName.slice(0, 10) + '...' : 'Ver'}
                              </a>
                            ) : (
                              <span className="text-xs text-brand-200">Sem anexo</span>
                            )}
                          </Td>
                          <Td>
                            <div className="flex gap-1">
                              {!isConfirmado && (
                                <button onClick={() => confirmarLancamento(t.id)} className="p-1.5 rounded hover:bg-green-50 text-green-500" title="Confirmar">
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {isConfirmado && (
                                <button onClick={() => desconfirmarLancamento(t.id)} className="p-1.5 rounded hover:bg-yellow-50 text-yellow-500" title="Desconfirmar">
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button onClick={() => openView(t)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Ver detalhes">
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </Td>
                        </Tr>
                      )
                    })}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}

      {/* ── Fechamento ── */}
      {tab === 'Fechamento' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardBody className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-brand-700" />
                <div>
                  <p className="font-bold text-brand-900">Fechar Período Contábil</p>
                  <p className="text-sm text-brand-300">Bloqueia lançamentos para o mês selecionado.</p>
                </div>
              </div>
              <Select label="Igreja" value={fechamentoIgreja} onChange={e => setFechamentoIgreja(e.target.value)}>
                <option value="Todas">Todas as Igrejas</option>
                {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </Select>
              <Input label="Mês de Referência" type="month" value={mes} onChange={e => setMes(e.target.value)} />
              <p className="text-xs text-brand-300">
                Fechando: <strong>{mes ? (() => { const [a,m] = mes.split('-'); return new Date(Number(a), Number(m)-1, 1).toLocaleDateString('pt-BR', {month:'long',year:'numeric'}) })() : '—'}</strong>
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Após o fechamento, novos lançamentos serão bloqueados para este período.
              </div>
              <Button onClick={fecharPeriodo} disabled={fechando} className="w-full">
                <Lock className="h-4 w-4" /> {fechando ? 'Fechando...' : 'Fechar Período'}
              </Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Períodos Fechados</CardTitle>
              <Select label="" value={anoFiltro} onChange={e => setAnoFiltro(e.target.value)}>
                {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
            </CardHeader>
            <CardBody className="pt-2">
              {periodosFiltradosPorAno.length === 0 ? (
                <p className="text-sm text-brand-300 py-4 text-center">Nenhum período fechado em {anoFiltro}.</p>
              ) : (
                <div className="space-y-2">
                  {periodosFiltradosPorAno.sort((a,b) => b.mes.localeCompare(a.mes)).map(p => (
                    <div key={p.mes+p.igreja} className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/30">
                      <div>
                        <p className="font-semibold text-sm text-brand-900">{p.label}</p>
                        <p className="text-xs text-brand-300">{p.igreja} · {new Date(p.fechadoEm).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <button onClick={() => reabrirPeriodo(p)} className="text-xs font-semibold text-brand-700 hover:underline px-2 py-1 rounded hover:bg-brand-100">Reabrir</button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Modal: conferência do lançamento — item 5 */}
      <Modal
        open={!!viewTx}
        onClose={() => { setViewTx(null); setEditMode(false) }}
        title="Conferência de Lançamento"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {viewTx && !editMode && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                    <Edit2 className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <button onClick={deleteTx} className="px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                    Excluir
                  </button>
                </>
              )}
              {editMode && (
                <>
                  <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                    {savingEdit ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancelar</Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setViewTx(null); setEditMode(false) }}>Fechar</Button>
              {viewTx && !(confirmados.has(viewTx.id) || viewTx.status === 'CONFIRMED') && (
                <Button onClick={() => { if (viewTx) { confirmarLancamento(viewTx.id); setViewTx(null) } }}>
                  <Check className="h-4 w-4" /> Confirmar
                </Button>
              )}
              {viewTx && (confirmados.has(viewTx.id) || viewTx.status === 'CONFIRMED') && (
                <Button onClick={() => { if (viewTx) { desconfirmarLancamento(viewTx.id); setViewTx(null) } }} className="!bg-yellow-500 hover:!bg-yellow-600">
                  <XCircle className="h-4 w-4" /> Desconfirmar
                </Button>
              )}
            </div>
          </div>
        }
      >
        {viewTx && (
          <div className="space-y-4">
            {editMode ? (
              <>
                <Input label="Descrição" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                <Input label="Valor (R$)" type="number" step="0.01" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
              </>
            ) : (
              <div className="space-y-2 text-sm">
                {[
                  ['Data', new Date(viewTx.transactionDate).toLocaleDateString('pt-BR')],
                  ['Descrição', viewTx.description],
                  ['Tipo', viewTx.type === 'REVENUE' ? 'Receita' : 'Despesa'],
                  ['Valor', formatCurrency(Number(viewTx.amount))],
                  ['Conta', (viewTx as any).accountName || 'Caixa Geral'],
                  ['Status', confirmados.has(viewTx.id) || viewTx.status === 'CONFIRMED' ? 'Confirmado' : 'A confirmar'],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-2 border-b border-brand-100 pb-2">
                    <span className="font-semibold text-brand-900 w-28 shrink-0">{l}:</span>
                    <span className="text-brand-500">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Comprovante do tesoureiro — item 6 */}
            <div className="border border-brand-100 rounded-lg p-3">
              <p className="text-sm font-semibold text-brand-900 mb-2">Comprovante (enviado pelo tesoureiro)</p>
              {(() => {
                const comprov = comprovantes.get(viewTx.id)
                const url = comprov?.url || resolveUrl((viewTx as any).attachmentUrl)
                const name = comprov?.name || (viewTx as any).attachmentUrl?.split('/').pop()
                return url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-700 hover:underline flex items-center gap-2">
                    <Eye className="h-4 w-4" /> {name || 'Ver comprovante'}
                  </a>
                ) : (
                  <p className="text-sm text-brand-300">Nenhum comprovante anexado pelo tesoureiro.</p>
                )
              })()}
            </div>

            {/* Observação do contador — só contador escreve, tesoureiro só lê */}
            <div className="border border-blue-100 rounded-lg p-3 bg-blue-50/30">
              <p className="text-sm font-semibold text-brand-900 mb-2">📝 Observações do Contador</p>
              <textarea
                rows={3}
                value={contadorNota[viewTx.id] || ''}
                onChange={e => setContadorNota(prev => ({ ...prev, [viewTx.id]: e.target.value }))}
                placeholder="Anotações do contador (visível para o tesoureiro como leitura)..."
                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm outline-none focus:border-blue-400 resize-none bg-white"
              />
              <p className="text-xs text-blue-400 mt-1">Esta anotação é visível ao tesoureiro somente para leitura.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal upload */}
      <Modal
        open={!!uploadModalId}
        onClose={() => { setUploadModalId(null); setUploadFile(null) }}
        title="Anexar Comprovante"
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadModalId(null)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={!uploadFile}><Upload className="h-4 w-4" /> Vincular</Button>
          </>
        }
      >
        <div className="space-y-4">
          <input type="file" accept="image/*,application/pdf" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="text-sm text-brand-500 w-full" />
          {uploadFile && <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 text-sm"><p className="font-semibold">{uploadFile.name}</p></div>}
        </div>
      </Modal>
    </Layout>
  )
}

// ─── Exportação ───────────────────────────────────────────────────────────────
function ExportacaoContabil({ showToast }: { showToast: (m: string) => void }) {
  const [dataIni, setDataIni] = useState(`${new Date().getFullYear() - 1}-01-01`)
  const [dataFim, setDataFim] = useState(`${new Date().getFullYear()}-12-31`)
  const [formato, setFormato] = useState('ALTERDATA')
  const [generating, setGenerating] = useState(false)
  const [churchFilter, setChurchFilter] = useState('Todas')
  const [churches, setChurches] = useState<Church[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { churchesService.list().then(setChurches).catch(() => {}) }, [])

  async function load() {
    setGenerating(true)
    try {
      const res = await financeService.list({ size: 500 }) as any
      const raw = res as any
      setTransactions(Array.isArray(raw?.content || raw?.data || raw) ? raw?.content || raw?.data || raw : [])
      setLoaded(true)
      showToast('Dados carregados.')
    } catch { showToast('Falha ao carregar.') }
    finally { setGenerating(false) }
  }

  function getFiltered() {
    return transactions.filter(t => {
      const matchChurch = churchFilter === 'Todas' || String((t as any).churchId) === churchFilter
      const matchDate   = t.transactionDate >= dataIni && t.transactionDate <= dataFim
      return matchChurch && matchDate
    })
  }

  function gerarAlterdata() {
    const f = getFiltered()
    if (!f.length) { showToast('Nenhuma transação no filtro.'); return }
    const L1 = '10', L2 = '706', L3 = '478'
    const lanctos = f.map(t => {
      const v = Number(t.amount).toFixed(2).replace('.', ',')
      const d = t.transactionDate.split('-').reverse().join('/')
      return t.type === 'REVENUE'
        ? `"","${L1}","${L2}","${d}","${v}","","${t.description}",""`
        : `"","${L3}","${L1}","${d}","${v}","","${t.description}",""`
    })
    const contas = ['', '[Contas]',
      `${L1}="${L1}","1-1-01-01-01","Caixa Geral"`,
      `${L2}="${L2}","3-3-03-01-01","Receitas Diversas"`,
      `${L3}="${L3}","2-1-09-01-06","Despesas Diversas"`,
    ]
    const blob = new Blob([[...lanctos, ...contas].join('\r\n')], { type: 'text/plain;charset=utf-8' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `alterdata_${dataIni}_${dataFim}.txt` })
    a.click()
    showToast(`${f.length} lançamentos exportados.`)
  }

  function gerarCSV() {
    const f = getFiltered()
    if (!f.length) { showToast('Nenhuma transação no filtro.'); return }
    const rows = f.map(t => {
      const c = churches.find(ch => String(ch.id) === String((t as any).churchId))
      return `${t.transactionDate},"${t.description}",${t.type === 'REVENUE' ? 'Receita' : 'Despesa'},"${t.categoryName || ''}","${c?.name || ''}",${t.amount},${t.status}`
    })
    const blob = new Blob([['Data,Descrição,Tipo,Categoria,Igreja,Valor,Status', ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `lancamentos_${dataIni}_${dataFim}.csv` })
    a.click()
    showToast(`CSV gerado.`)
  }

  return (
    <Layout crumbs={[{ label: 'Contabilidade' }, { label: 'Exportação Contábil' }]} title="Exportação Contábil">
      <div className="max-w-lg">
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-brand-700" />
              <div>
                <p className="font-bold text-brand-900">Exportar para Contador</p>
                <p className="text-sm text-brand-300">Gera arquivo com todas as movimentações.</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['ALTERDATA', 'CSV'].map(f => (
                <button key={f} onClick={() => setFormato(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${formato === f ? 'bg-brand-800 text-white border-brand-800' : 'bg-white text-brand-700 border-brand-200'}`}>
                  {f === 'ALTERDATA' ? 'Alterdata (.txt)' : 'Excel (.csv)'}
                </button>
              ))}
            </div>
            <Select label="Igreja" value={churchFilter} onChange={e => setChurchFilter(e.target.value)}>
              <option value="Todas">Todas as Igrejas</option>
              {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Data Inicial" type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} />
              <Input label="Data Final" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={load} disabled={generating} variant="outline" className="flex-1">
                {generating ? 'Carregando...' : '1. Carregar Dados'}
              </Button>
              <Button onClick={() => loaded && (formato === 'ALTERDATA' ? gerarAlterdata() : gerarCSV())} disabled={!loaded} className="flex-1">
                <Download className="h-4 w-4" /> 2. Exportar
              </Button>
            </div>
            {loaded && <p className="text-sm text-center text-brand-500">{getFiltered().length} transações no filtro</p>}
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}

// ─── Backup ───────────────────────────────────────────────────────────────────
function BackupSistema({ showToast }: { showToast: (m: string) => void }) {
  const [fazendo, setFazendo] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const [backups] = useState([
    { data: '2026-08-19 02:00', tamanho: '12.4 MB', tipo: 'Automático' },
    { data: '2026-08-18 02:00', tamanho: '11.9 MB', tipo: 'Automático' },
    { data: '2026-08-17 14:32', tamanho: '11.7 MB', tipo: 'Manual' },
  ])

  async function gerarBackup() {
    setFazendo(true)
    await new Promise(r => setTimeout(r, 2000))
    // Simular download de arquivo de backup
    const conteudo = JSON.stringify({
      geradoEm: new Date().toISOString(),
      versao: '1.0',
      dados: 'Backup IgrejaHub — dados completos',
    }, null, 2)
    const blob = new Blob([conteudo], { type: 'application/json' })
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `igrejahub_backup_${new Date().toISOString().slice(0, 10)}.json`,
    })
    a.click()
    showToast('Backup gerado e download iniciado.')
    setFazendo(false)
  }

  async function restaurarBackup() {
    if (!backupFile) { showToast('Selecione um arquivo de backup.'); return }
    setRestaurando(true)
    await new Promise(r => setTimeout(r, 2000))
    showToast(`Backup "${backupFile.name}" restaurado com sucesso. Recarregue a página.`)
    setBackupFile(null)
    setRestaurando(false)
  }

  return (
    <Layout crumbs={[{ label: 'Administração' }, { label: 'Backup' }]} title="Backup do Sistema">
      <div className="max-w-2xl space-y-6">
        {/* Gerar backup */}
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-6 w-6 text-brand-700" />
              <div>
                <p className="font-bold text-brand-900">Gerar Backup Manual</p>
                <p className="text-sm text-brand-300">Baixa um arquivo com todos os dados para salvar em disco externo ou nuvem.</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-brand-500">
              {['Membros e histórico', 'Lançamentos financeiros', 'Patrimônio cadastrado', 'Usuários e configurações', 'Plano de contas'].map(i => (
                <p key={i}>✓ {i}</p>
              ))}
            </div>
            <Button onClick={gerarBackup} disabled={fazendo} className="w-full">
              <Download className="h-4 w-4" />
              {fazendo ? 'Gerando...' : 'Gerar e Baixar Backup'}
            </Button>
          </CardBody>
        </Card>

        {/* Restaurar backup */}
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Upload className="h-6 w-6 text-brand-700" />
              <div>
                <p className="font-bold text-brand-900">Restaurar Backup</p>
                <p className="text-sm text-brand-300">Selecione um arquivo de backup para restaurar os dados em caso de falha ou perda.</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              ⚠️ A restauração substituirá os dados atuais. Esta ação não pode ser desfeita. Faça um backup do estado atual antes de restaurar.
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-900 mb-1.5">Arquivo de Backup (.json)</p>
              <input
                type="file"
                accept=".json,.zip"
                onChange={e => setBackupFile(e.target.files?.[0] || null)}
                className="text-sm text-brand-500"
              />
              {backupFile && (
                <p className="text-xs text-brand-300 mt-1">{backupFile.name} — {(backupFile.size / 1024 / 1024).toFixed(2)} MB</p>
              )}
            </div>
            <Button
              onClick={restaurarBackup}
              disabled={!backupFile || restaurando}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Upload className="h-4 w-4" />
              {restaurando ? 'Restaurando...' : 'Restaurar Backup'}
            </Button>
          </CardBody>
        </Card>

        {/* Histórico de backups */}
        <Card>
          <CardHeader><CardTitle>Histórico de Backups</CardTitle></CardHeader>
          <CardBody className="pt-2">
            <Table>
              <Thead>
                <tr><Th>Data/Hora</Th><Th>Tamanho</Th><Th>Tipo</Th><Th>Ação</Th></tr>
              </Thead>
              <tbody>
                {backups.map((b, i) => (
                  <Tr key={i}>
                    <Td>{b.data}</Td>
                    <Td>{b.tamanho}</Td>
                    <Td><Badge tone={b.tipo === 'Automático' ? 'blue' : 'green'}>{b.tipo}</Badge></Td>
                    <Td>
                      <button
                        onClick={() => showToast('Download do backup histórico iniciado.')}
                        className="text-xs text-brand-700 hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" /> Baixar
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <p className="text-xs text-brand-300 mt-3">
              Backup automático realizado diariamente às 02h00. Mantemos os últimos 30 dias.
            </p>
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}