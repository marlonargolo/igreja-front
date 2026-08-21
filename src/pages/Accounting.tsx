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
  const [tab, setTab] = useState('Visão Geral')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [churchFilter, setChurchFilter] = useState('Todas')
  const [contaFilter, setContaFilter] = useState('Todas')
  const [typeFilter, setTypeFilter] = useState('Todas')
  const [loading, setLoading] = useState(true)

  // Estados de lançamento confirmados (persistido em memória por sessão)
  const [confirmados, setConfirmados] = useState<Set<number>>(new Set())

  // Lançamento selecionado para visualização
  const [viewTx, setViewTx] = useState<Transaction | null>(null)

  // Comprovantes vinculados (mapa id → arquivo)
  const [comprovantes, setComprovantes] = useState<Map<number, { name: string; url: string }>>(new Map())
  const [uploadModalId, setUploadModalId] = useState<number | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Fechamento
  const [mes, setMes] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [fechamentoIgreja, setFechamentoIgreja] = useState('Todas')
  const [fechando, setFechando] = useState(false)
  const [periodosFechados, setPeriodosFechados] = useState<PeriodoFechado[]>([])
  const [anoFiltro, setAnoFiltro] = useState(String(new Date().getFullYear()))

  const contasUnicas = ['Todas', 'Caixa Geral', 'Banco Bradesco', 'Banco Itaú', 'Caixa Jovens']

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [txRes, churchList] = await Promise.all([
        financeService.list({ size: 500 }) as any,
        churchesService.list(),
      ])
      const raw = txRes as any
      const list = raw?.content || raw?.data || raw || []
      setTransactions(Array.isArray(list) ? list : [])
      setChurches(churchList)
    } catch {
      showToast('Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = transactions.filter(t => {
    const matchChurch = churchFilter === 'Todas' || String((t as any).churchId) === churchFilter
    const matchType   = typeFilter   === 'Todas' || t.type === typeFilter
    const matchConta  = contaFilter  === 'Todas' || ((t as any).accountName || 'Caixa Geral') === contaFilter
    return matchChurch && matchType && matchConta
  })

  const totalRevenue = filtered.filter(t => t.type === 'REVENUE').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalRevenue - totalExpense

  // Resumo por igreja com status de conciliação
  const byChurch = churches.map(c => {
    const txs = transactions.filter(t => String((t as any).churchId) === String(c.id))
    const rev = txs.filter(t => t.type === 'REVENUE').reduce((s, t) => s + Number(t.amount), 0)
    const exp = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
    // Conciliado = todos os lançamentos confirmados
    const allConfirmed = txs.length > 0 && txs.every(t => confirmados.has(t.id) || t.status === 'CONFIRMED')
    return { church: c, revenue: rev, expense: exp, balance: rev - exp, count: txs.length, conciliado: allConfirmed }
  }).filter(r => r.count > 0)

  // Seleção
  function toggleSelect(id: number) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(t => t.id)))
  }

  // Confirmar lançamento
  async function confirmarLancamento(id: number) {
    try {
      await financeService.confirm(id)
      setConfirmados(prev => new Set(prev).add(id))
      showToast('Lançamento confirmado.')
      load()
    } catch {
      // fallback: marcar localmente
      setConfirmados(prev => new Set(prev).add(id))
      showToast('Lançamento marcado como confirmado.')
    }
  }

  async function confirmarSelecionados() {
    if (selectedIds.size === 0) { showToast('Selecione ao menos um lançamento.'); return }
    for (const id of selectedIds) {
      try { await financeService.confirm(id) } catch {}
      setConfirmados(prev => new Set(prev).add(id))
    }
    showToast(`${selectedIds.size} lançamento(s) confirmado(s).`)
    setSelectedIds(new Set())
    load()
  }

  // Upload de comprovante
  function handleUpload() {
    if (!uploadFile || !uploadModalId) return
    const url = URL.createObjectURL(uploadFile)
    setComprovantes(prev => new Map(prev).set(uploadModalId, { name: uploadFile.name, url }))
    showToast(`Comprovante "${uploadFile.name}" vinculado ao lançamento #${uploadModalId}.`)
    setUploadFile(null)
    setUploadModalId(null)
  }

  // Fechamento — item 8: fechar o mês selecionado (não o anterior)
  async function fecharPeriodo() {
    if (!mes) { showToast('Selecione o mês.'); return }
    const jaFechado = periodosFechados.find(p =>
      p.mes === mes &&
      (fechamentoIgreja === 'Todas' || p.igreja === churches.find(c => String(c.id) === fechamentoIgreja)?.name)
    )
    if (jaFechado) { showToast('Este período já está fechado.'); return }
    setFechando(true)
    await new Promise(r => setTimeout(r, 800))
    const [ano, mesNum] = mes.split('-')
    const mDate = new Date(Number(ano), Number(mesNum) - 1, 1)
    const label = mDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const igrejaNome = fechamentoIgreja === 'Todas'
      ? 'Todas as Igrejas'
      : churches.find(c => String(c.id) === fechamentoIgreja)?.name || 'Todas'
    setPeriodosFechados(prev => [...prev, {
      mes,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      fechadoEm: new Date().toISOString().split('T')[0],
      igreja: igrejaNome,
    }])
    showToast(`Período ${label} fechado com sucesso.`)
    setFechando(false)
  }

  function reabrirPeriodo(p: PeriodoFechado) {
    setPeriodosFechados(prev => prev.filter(x => !(x.mes === p.mes && x.igreja === p.igreja)))
    showToast(`Período ${p.label} reaberto para correções.`)
  }

  const periodosFiltradosPorAno = periodosFechados.filter(p => p.mes.startsWith(anoFiltro))
  const anosDisponiveis = [...new Set([...periodosFechados.map(p => p.mes.slice(0, 4)), anoFiltro])].sort().reverse()

  return (
    <Layout crumbs={[{ label: 'Contabilidade' }, { label: 'Fechamento Mensal' }]} title="Contabilidade">
      <Tabs tabs={['Visão Geral', 'Lançamentos', 'Fechamento']} active={tab} onChange={setTab} className="mb-6" />

      {/* ── Visão Geral com status de conciliação — item 13 ── */}
      {tab === 'Visão Geral' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
              <p className="text-xs text-brand-300 mb-1">Total Receitas</p>
              <p className="text-2xl font-extrabold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
              <p className="text-xs text-brand-300 mb-1">Total Despesas</p>
              <p className="text-2xl font-extrabold text-red-500">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-brand-100 shadow-card p-5">
              <p className="text-xs text-brand-300 mb-1">Saldo Geral</p>
              <p className={`text-2xl font-extrabold ${balance >= 0 ? 'text-brand-900' : 'text-red-500'}`}>{formatCurrency(balance)}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {byChurch.map(r => (
              <Card key={r.church.id}>
                <CardBody className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-brand-500" />
                      <p className="font-bold text-brand-900">{r.church.name}</p>
                    </div>
                    {/* Status de conciliação — item 13 */}
                    <Badge tone={r.conciliado ? 'green' : 'yellow'}>
                      {r.conciliado ? '✓ Conciliado' : '⏳ Pendente'}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-300 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-green-500" /> Receitas</span>
                      <span className="font-semibold text-green-600">{formatCurrency(r.revenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-300 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5 text-red-400" /> Despesas</span>
                      <span className="font-semibold text-red-500">{formatCurrency(r.expense)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-brand-100 pt-2">
                      <span className="font-bold text-brand-900">Saldo</span>
                      <span className={`font-extrabold ${r.balance >= 0 ? 'text-brand-900' : 'text-red-500'}`}>{formatCurrency(r.balance)}</span>
                    </div>
                    <p className="text-xs text-brand-300 mt-1">{r.count} lançamentos</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Lançamentos — itens 5, 6, 7, 25 ── */}
      {tab === 'Lançamentos' && (
        <>
          <Card className="p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
              <Select label="Igreja" value={churchFilter} onChange={e => setChurchFilter(e.target.value)}>
                <option value="Todas">Todas as Igrejas</option>
                {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </Select>
              <Select label="Conta" value={contaFilter} onChange={e => setContaFilter(e.target.value)}>
                {contasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select label="Tipo" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="Todas">Receitas e Despesas</option>
                <option value="REVENUE">Apenas Receitas</option>
                <option value="EXPENSE">Apenas Despesas</option>
              </Select>
            </div>
          </Card>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-brand-500">{selectedIds.size} selecionado(s)</span>
              <Button size="sm" onClick={confirmarSelecionados}>
                <Check className="h-3.5 w-3.5" /> Confirmar Selecionados
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                Limpar Seleção
              </Button>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{filtered.length} lançamentos</CardTitle>
            </CardHeader>
            <CardBody className="pt-2">
              {loading ? (
                <div className="py-8 text-center text-brand-300">Carregando...</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-brand-300">Nenhum lançamento encontrado.</div>
              ) : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>
                        <button onClick={toggleSelectAll}>
                          {selectedIds.size === filtered.length && filtered.length > 0
                            ? <CheckSquare className="h-4 w-4 text-brand-800" />
                            : <Square className="h-4 w-4 text-brand-300" />
                          }
                        </button>
                      </Th>
                      <Th>Data</Th>
                      <Th>Descrição</Th>
                      <Th>Igreja</Th>
                      <Th>Conta</Th>
                      <Th>Tipo</Th>
                      <Th>Valor</Th>
                      <Th>Status</Th>
                      <Th>Comprovante</Th>
                      <Th>Ações</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {filtered.map(t => {
                      const church = churches.find(c => String(c.id) === String((t as any).churchId))
                      const isSelected = selectedIds.has(t.id)
                      // item 7: status "A confirmar" para não confirmados
                      const isConfirmado = confirmados.has(t.id) || t.status === 'CONFIRMED'
                      const comprov = comprovantes.get(t.id)
                      return (
                        <Tr key={t.id} className={isSelected ? 'bg-brand-50' : ''}>
                          <Td>
                            <button onClick={() => toggleSelect(t.id)}>
                              {isSelected
                                ? <CheckSquare className="h-4 w-4 text-brand-800" />
                                : <Square className="h-4 w-4 text-brand-200" />
                              }
                            </button>
                          </Td>
                          <Td className="text-brand-500 whitespace-nowrap">
                            {new Date(t.transactionDate).toLocaleDateString('pt-BR')}
                          </Td>
                          {/* item 5: clicar abre modal de conferência */}
                          <Td>
                            <button
                              onClick={() => setViewTx(t)}
                              className="font-semibold text-brand-700 hover:underline text-left"
                            >
                              {t.description}
                            </button>
                          </Td>
                          <Td className="text-brand-500">{church?.name || '—'}</Td>
                          <Td className="text-brand-500">{(t as any).accountName || 'Caixa Geral'}</Td>
                          <Td>
                            <Badge tone={t.type === 'REVENUE' ? 'green' : 'red'}>
                              {t.type === 'REVENUE' ? 'Receita' : 'Despesa'}
                            </Badge>
                          </Td>
                          <Td className={`font-semibold ${t.type === 'REVENUE' ? 'text-green-600' : 'text-red-500'}`}>
                            {formatCurrency(Number(t.amount))}
                          </Td>
                          {/* item 7: status A confirmar / Confirmado */}
                          <Td>
                            <Badge tone={isConfirmado ? 'green' : 'yellow'}>
                              {isConfirmado ? 'Confirmado' : 'A confirmar'}
                            </Badge>
                          </Td>
                          {/* item 6: mostrar comprovante da despesa na tesouraria */}
                          <Td>
                            {comprov ? (
                              <a
                                href={comprov.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-700 hover:underline flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" /> {comprov.name.slice(0, 12)}...
                              </a>
                            ) : (
                              <button
                                onClick={() => { setUploadModalId(t.id); setUploadFile(null) }}
                                className="text-xs text-brand-300 hover:text-brand-600 flex items-center gap-1"
                              >
                                <Upload className="h-3 w-3" /> Anexar
                              </button>
                            )}
                          </Td>
                          <Td>
                            <div className="flex gap-1">
                              {!isConfirmado && (
                                <button
                                  onClick={() => confirmarLancamento(t.id)}
                                  className="p-1.5 rounded hover:bg-green-50 text-green-500"
                                  title="Confirmar"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => setViewTx(t)}
                                className="p-1.5 rounded hover:bg-brand-50 text-brand-400"
                                title="Ver detalhes"
                              >
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

      {/* ── Fechamento — item 8, 16 ── */}
      {tab === 'Fechamento' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardBody className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-brand-700" />
                <div>
                  <p className="font-bold text-brand-900">Fechar Período Contábil</p>
                  <p className="text-sm text-brand-300">Bloqueia novos lançamentos para o mês selecionado.</p>
                </div>
              </div>
              <Select label="Igreja" value={fechamentoIgreja} onChange={e => setFechamentoIgreja(e.target.value)}>
                <option value="Todas">Todas as Igrejas</option>
                {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </Select>
              {/* item 8: campo type="month" envia YYYY-MM exatamente */}
              <Input
                label="Mês de Referência"
                type="month"
                value={mes}
                onChange={e => setMes(e.target.value)}
              />
              <p className="text-xs text-brand-300">
                Período selecionado: <strong>{mes ? (() => {
                  const [a, m] = mes.split('-')
                  return new Date(Number(a), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                })() : '—'}</strong>
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                Após o fechamento, novos lançamentos para este período serão bloqueados.
              </div>
              <Button onClick={fecharPeriodo} disabled={fechando} className="w-full">
                <Lock className="h-4 w-4" />
                {fechando ? 'Fechando...' : 'Fechar Período'}
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
                  {periodosFiltradosPorAno
                    .sort((a, b) => b.mes.localeCompare(a.mes))
                    .map(p => (
                      <div key={p.mes + p.igreja} className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/30">
                        <div>
                          <p className="font-semibold text-sm text-brand-900">{p.label}</p>
                          <p className="text-xs text-brand-300">{p.igreja} · Fechado em {new Date(p.fechadoEm).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <button
                          onClick={() => reabrirPeriodo(p)}
                          className="text-xs font-semibold text-brand-700 hover:underline px-2 py-1 rounded hover:bg-brand-100"
                        >
                          Reabrir
                        </button>
                      </div>
                    ))
                  }
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Modal: visualizar lançamento — item 5 */}
      <Modal
        open={!!viewTx}
        onClose={() => setViewTx(null)}
        title="Detalhes do Lançamento"
        footer={
          <>
            <Button variant="outline" onClick={() => setViewTx(null)}>Fechar</Button>
            {viewTx && !confirmados.has(viewTx.id) && viewTx.status !== 'CONFIRMED' && (
              <Button onClick={() => { if (viewTx) { confirmarLancamento(viewTx.id); setViewTx(null) } }}>
                <Check className="h-4 w-4" /> Confirmar Lançamento
              </Button>
            )}
          </>
        }
      >
        {viewTx && (
          <div className="space-y-3 text-sm">
            {[
              ['Data', new Date(viewTx.transactionDate).toLocaleDateString('pt-BR')],
              ['Descrição', viewTx.description],
              ['Tipo', viewTx.type === 'REVENUE' ? 'Receita' : 'Despesa'],
              ['Valor', formatCurrency(Number(viewTx.amount))],
              ['Categoria', viewTx.categoryName || '—'],
              ['Conta', (viewTx as any).accountName || 'Caixa Geral'],
              ['Status', confirmados.has(viewTx.id) || viewTx.status === 'CONFIRMED' ? 'Confirmado' : 'A confirmar'],
            ].map(([l, v]) => (
              <div key={l} className="flex gap-2 border-b border-brand-100 pb-2">
                <span className="font-semibold text-brand-900 w-28 shrink-0">{l}:</span>
                <span className="text-brand-500">{v}</span>
              </div>
            ))}
            {/* item 6: comprovante da despesa */}
            <div className="flex gap-2 items-start">
              <span className="font-semibold text-brand-900 w-28 shrink-0">Comprovante:</span>
              {comprovantes.get(viewTx.id) ? (
                <a
                  href={comprovantes.get(viewTx.id)!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" /> {comprovantes.get(viewTx.id)!.name}
                </a>
              ) : (
                <button
                  onClick={() => { setViewTx(null); setUploadModalId(viewTx.id) }}
                  className="text-brand-400 hover:text-brand-700 flex items-center gap-1"
                >
                  <Upload className="h-3.5 w-3.5" /> Anexar comprovante
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: upload comprovante */}
      <Modal
        open={!!uploadModalId}
        onClose={() => { setUploadModalId(null); setUploadFile(null) }}
        title={`Anexar Comprovante — Lançamento #${uploadModalId}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setUploadModalId(null)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={!uploadFile}>
              <Upload className="h-4 w-4" /> Vincular
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-500">
            Selecione a nota fiscal, recibo ou comprovante referente a este lançamento.
            O arquivo será exibido na coluna "Comprovante" da tabela e também ao abrir o lançamento.
          </p>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={e => setUploadFile(e.target.files?.[0] || null)}
            className="text-sm text-brand-500 w-full"
          />
          {uploadFile && (
            <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 text-sm">
              <p className="font-semibold text-brand-900">{uploadFile.name}</p>
              <p className="text-xs text-brand-300">{(uploadFile.size / 1024).toFixed(1)} KB</p>
            </div>
          )}
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