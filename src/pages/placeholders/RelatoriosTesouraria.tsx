import { useState } from 'react'
import { Download, TrendingUp, TrendingDown, ArrowLeftRight, Wallet } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Extras'
import { financeService, type Transaction } from '@/services'
import { formatCurrency } from '@/lib/format'

const TIPOS = [
  { key: 'geral', label: 'Fluxo de Caixa Geral', icon: Wallet },
  { key: 'receitas', label: 'Relatório de Receitas', icon: TrendingUp },
  { key: 'despesas', label: 'Relatório de Despesas', icon: TrendingDown },
  { key: 'transferencias', label: 'Transferências', icon: ArrowLeftRight },
]

export default function RelatoriosTesouraria() {
  const showToast = useToast()
  const [tipo, setTipo] = useState('geral')
  const [dataIni, setDataIni] = useState(`${new Date().getFullYear()}-01-01`)
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0])
  const [generating, setGenerating] = useState(false)

  function isTransfer(t: Transaction) {
    const cat = (t.categoryName || '').toLowerCase()
    return cat.includes('transfer') || cat.includes('repasse') || cat.includes('redízimo')
  }

  async function generate() {
    setGenerating(true)
    try {
      const typeFilter = tipo === 'receitas' ? 'REVENUE' : tipo === 'despesas' ? 'EXPENSE' : undefined
      const res = await financeService.list({ size: 500, type: typeFilter }) as any
      const all: Transaction[] = res?.content || res?.data || res || []

      let data = all
      if (tipo === 'transferencias') data = all.filter(isTransfer)
      else if (tipo === 'despesas') data = all.filter(t => t.type === 'EXPENSE' && !isTransfer(t))

      printReport(data, tipo, dataIni, dataFim)
    } catch {
      showToast('Falha ao gerar relatório.')
    } finally {
      setGenerating(false)
    }
  }

  function printReport(data: Transaction[], tipo: string, ini: string, fim: string) {
    const win = window.open('', '_blank')
    if (!win) return
    const titulo = TIPOS.find(t => t.key === tipo)?.label || 'Relatório Financeiro'
    const totalR = data.filter(t => t.type === 'REVENUE').reduce((s, t) => s + Number(t.amount), 0)
    const totalE = data.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
    const rows = data.map(t => `
      <tr>
        <td>${new Date(t.transactionDate).toLocaleDateString('pt-BR')}</td>
        <td>${t.description}</td>
        <td>${t.categoryName || '—'}</td>
        <td style="color:${t.type==='REVENUE'?'green':'red'}">${t.type === 'REVENUE' ? 'Receita' : 'Despesa'}</td>
        <td style="text-align:right;font-weight:bold;color:${t.type==='REVENUE'?'green':'red'}">${formatCurrency(t.amount)}</td>
        <td>${t.status}</td>
      </tr>
    `).join('')

    win.document.write(`
      <html><head><title>${titulo}</title>
      <style>
        body { font-family: Arial; font-size: 12px; padding: 20px; }
        h1 { font-size: 16px; color: #1E3A5F; }
        .period { color: #666; font-size: 11px; margin-bottom: 8px; }
        .summary { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px; background: #f5f7fa; border-radius: 8px; }
        .summary div { font-size: 12px; }
        .summary strong { display: block; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1E3A5F; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 7px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
        tr:nth-child(even) td { background: #f9f9f9; }
      </style></head>
      <body>
        <h1>${titulo}</h1>
        <p class="period">Período: ${new Date(ini).toLocaleDateString('pt-BR')} a ${new Date(fim).toLocaleDateString('pt-BR')} — ${data.length} lançamentos</p>
        <div class="summary">
          <div><span>Total Receitas</span><strong style="color:green">${formatCurrency(totalR)}</strong></div>
          <div><span>Total Despesas</span><strong style="color:red">${formatCurrency(totalE)}</strong></div>
          <div><span>Saldo</span><strong style="color:${totalR-totalE>=0?'green':'red'}">${formatCurrency(totalR-totalE)}</strong></div>
        </div>
        <table>
          <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th style="text-align:right">Valor</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <Layout crumbs={[{ label: 'Tesouraria' }, { label: 'Relatórios' }]} title="Relatórios — Tesouraria">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {TIPOS.map(t => (
          <button key={t.key} onClick={() => setTipo(t.key)}
            className={`text-left p-5 rounded-2xl border-2 transition-all ${
              tipo === t.key ? 'border-brand-800 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <t.icon className={`h-5 w-5 ${tipo === t.key ? 'text-brand-800' : 'text-brand-300'}`} />
              <span className={`font-semibold text-sm ${tipo === t.key ? 'text-brand-900' : 'text-brand-500'}`}>{t.label}</span>
            </div>
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="pt-6">
          <h3 className="font-bold text-brand-900 mb-4">Período e Filtros</h3>
          <div className="grid grid-cols-2 gap-4 max-w-md mb-4">
            <Input label="Data Inicial" type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} />
            <Input label="Data Final" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          </div>
          <Button onClick={generate} disabled={generating}>
            <Download className="h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar e Imprimir'}
          </Button>
        </CardBody>
      </Card>
    </Layout>
  )
}