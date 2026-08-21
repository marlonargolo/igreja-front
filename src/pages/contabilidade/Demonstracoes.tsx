import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Extras'
import { formatCurrency } from '@/lib/format'
import { financeService, type Transaction } from '@/services'

export default function Demonstracoes() {
  const showToast = useToast()
  const [tab, setTab] = useState('DRE')
  const [dataIni, setDataIni] = useState(`${new Date().getFullYear() - 1}-01-01`)
  const [dataFim, setDataFim] = useState(`${new Date().getFullYear()}-12-31`)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await financeService.list({ size: 1000 }) as any
      const list = res?.content || res?.data || res || []
      setTransactions(Array.isArray(list) ? list : [])
      setLoaded(true)
    } catch {
      showToast('Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = transactions.filter(t =>
    t.transactionDate >= dataIni && t.transactionDate <= dataFim
  )

  const receitas = filtered.filter(t => t.type === 'REVENUE')
  const despesas = filtered.filter(t => t.type === 'EXPENSE')
  const totalReceitas = receitas.reduce((s, t) => s + Number(t.amount), 0)
  const totalDespesas = despesas.reduce((s, t) => s + Number(t.amount), 0)
  const resultado = totalReceitas - totalDespesas

  function printDRE() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>DRE</title>
    <style>body{font-family:Arial;font-size:12px;padding:30px;max-width:700px;margin:0 auto}
    h1{color:#1E3A5F;font-size:18px;border-bottom:2px solid #1E3A5F;padding-bottom:8px}
    h2{color:#1E3A5F;font-size:13px;margin-top:20px}
    .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
    .total{font-weight:bold;font-size:14px;margin-top:8px}
    .positive{color:green}.negative{color:red}</style></head>
    <body>
    <h1>Demonstração do Resultado do Exercício (DRE)</h1>
    <p style="color:#666;font-size:11px">Período: ${new Date(dataIni).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}</p>
    <h2>Receitas</h2>
    ${receitas.map(t => `<div class="row"><span>${t.description}</span><span class="positive">${formatCurrency(t.amount)}</span></div>`).join('')}
    <div class="row total"><span>Total Receitas</span><span class="positive">${formatCurrency(totalReceitas)}</span></div>
    <h2>Despesas</h2>
    ${despesas.map(t => `<div class="row"><span>${t.description}</span><span class="negative">(${formatCurrency(t.amount)})</span></div>`).join('')}
    <div class="row total"><span>Total Despesas</span><span class="negative">(${formatCurrency(totalDespesas)})</span></div>
    <div class="row total" style="margin-top:16px;font-size:16px">
      <span>Resultado do Período</span>
      <span class="${resultado >= 0 ? 'positive' : 'negative'}">${formatCurrency(resultado)}</span>
    </div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function printBalanco() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Balanço Patrimonial</title>
    <style>body{font-family:Arial;font-size:12px;padding:30px;max-width:800px;margin:0 auto}
    h1{color:#1E3A5F;font-size:18px;border-bottom:2px solid #1E3A5F;padding-bottom:8px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:16px}
    h2{color:#1E3A5F;font-size:13px;background:#f5f7fa;padding:8px;margin:0 0 8px}
    .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:11px}
    .total{font-weight:bold;font-size:13px;padding:8px 0;border-top:2px solid #1E3A5F;margin-top:4px}
    </style></head>
    <body>
    <h1>Balanço Patrimonial</h1>
    <p style="color:#666;font-size:11px">Data base: ${new Date(dataFim).toLocaleDateString('pt-BR')}</p>
    <div class="grid">
      <div>
        <h2>ATIVO</h2>
        <div class="row"><span>Caixa e Equivalentes</span><span>${formatCurrency(totalReceitas)}</span></div>
        <div class="row total"><span>Total Ativo</span><span>${formatCurrency(totalReceitas)}</span></div>
      </div>
      <div>
        <h2>PASSIVO E PATRIMÔNIO LÍQUIDO</h2>
        <div class="row"><span>Obrigações a Pagar</span><span>${formatCurrency(totalDespesas)}</span></div>
        <div class="row"><span>Patrimônio Líquido</span><span>${formatCurrency(resultado)}</span></div>
        <div class="row total"><span>Total Passivo + PL</span><span>${formatCurrency(totalReceitas)}</span></div>
      </div>
    </div>
    <p style="margin-top:40px;font-size:10px;color:#999;text-align:center">
      Balanço gerado automaticamente a partir das movimentações financeiras registradas no IgrejaHub.
      Para fins contábeis formais, consulte o contador responsável.
    </p>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function printDFC() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>DFC</title>
    <style>body{font-family:Arial;font-size:12px;padding:30px;max-width:700px;margin:0 auto}
    h1{color:#1E3A5F;font-size:18px;border-bottom:2px solid #1E3A5F;padding-bottom:8px}
    .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
    .total{font-weight:bold;font-size:14px;margin-top:8px}
    .positive{color:green}.negative{color:red}</style></head>
    <body>
    <h1>Demonstração do Fluxo de Caixa (DFC)</h1>
    <p style="color:#666;font-size:11px">Período: ${new Date(dataIni).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}</p>
    <h2 style="color:#1E3A5F;font-size:13px;margin-top:20px">Atividades Operacionais — Entradas</h2>
    ${receitas.map(t => `<div class="row"><span>${new Date(t.transactionDate).toLocaleDateString('pt-BR')} — ${t.description}</span><span class="positive">+${formatCurrency(t.amount)}</span></div>`).join('')}
    <h2 style="color:#1E3A5F;font-size:13px;margin-top:20px">Atividades Operacionais — Saídas</h2>
    ${despesas.map(t => `<div class="row"><span>${new Date(t.transactionDate).toLocaleDateString('pt-BR')} — ${t.description}</span><span class="negative">-${formatCurrency(t.amount)}</span></div>`).join('')}
    <div class="row total" style="margin-top:16px">
      <span>Variação Líquida de Caixa</span>
      <span class="${resultado >= 0 ? 'positive' : 'negative'}">${resultado >= 0 ? '+' : ''}${formatCurrency(resultado)}</span>
    </div>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function printDMPL() {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>DMPL</title>
    <style>body{font-family:Arial;font-size:12px;padding:30px;max-width:800px;margin:0 auto}
    h1{color:#1E3A5F;font-size:18px;border-bottom:2px solid #1E3A5F;padding-bottom:8px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#1E3A5F;color:white;padding:8px;font-size:11px;text-align:center}
    td{padding:7px 8px;border-bottom:1px solid #eee;font-size:11px;text-align:center}
    .left{text-align:left}</style></head>
    <body>
    <h1>Demonstração das Mutações do Patrimônio Líquido (DMPL)</h1>
    <p style="color:#666;font-size:11px">Período: ${new Date(dataIni).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}</p>
    <table>
      <thead><tr><th class="left">Descrição</th><th>Capital</th><th>Reservas</th><th>Resultado</th><th>Total PL</th></tr></thead>
      <tbody>
        <tr><td class="left">Saldo Inicial</td><td>—</td><td>—</td><td>—</td><td>${formatCurrency(0)}</td></tr>
        <tr><td class="left">Receitas do Período</td><td>—</td><td>—</td><td>${formatCurrency(totalReceitas)}</td><td>${formatCurrency(totalReceitas)}</td></tr>
        <tr><td class="left">Despesas do Período</td><td>—</td><td>—</td><td>(${formatCurrency(totalDespesas)})</td><td>(${formatCurrency(totalDespesas)})</td></tr>
        <tr style="font-weight:bold"><td class="left">Saldo Final</td><td>—</td><td>—</td><td>${formatCurrency(resultado)}</td><td>${formatCurrency(resultado)}</td></tr>
      </tbody>
    </table>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  const PRINT_FNS: Record<string, () => void> = {
    'DRE': printDRE,
    'Balanço': printBalanco,
    'DFC': printDFC,
    'DMPL': printDMPL,
  }

  return (
    <Layout
      crumbs={[{ label: 'Contabilidade' }, { label: 'Demonstrações' }]}
      title="Demonstrações Contábeis"
    >
      <Tabs
        tabs={['DRE', 'Balanço', 'DFC', 'DMPL']}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />

      {/* Filtro de período */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <Input label="Data Inicial" type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} />
          <Input label="Data Final" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          <Button onClick={load} disabled={loading} variant="outline">
            {loading ? 'Carregando...' : 'Carregar Dados'}
          </Button>
          {loaded && (
            <Button onClick={PRINT_FNS[tab]}>
              <Download className="h-4 w-4" /> Imprimir {tab}
            </Button>
          )}
        </div>
      </Card>

      {/* Prévia */}
      {!loaded ? (
        <Card><CardBody className="py-12 text-center text-brand-300">
          Selecione o período e clique em Carregar Dados para visualizar a demonstração.
        </CardBody></Card>
      ) : (
        <>
          {tab === 'DRE' && (
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <p className="text-xs text-green-600 mb-1">Total Receitas</p>
                <p className="text-2xl font-extrabold text-green-700">{formatCurrency(totalReceitas)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <p className="text-xs text-red-600 mb-1">Total Despesas</p>
                <p className="text-2xl font-extrabold text-red-600">{formatCurrency(totalDespesas)}</p>
              </div>
              <div className={`${resultado >= 0 ? 'bg-brand-50 border-brand-200' : 'bg-red-50 border-red-200'} border rounded-2xl p-5`}>
                <p className="text-xs text-brand-500 mb-1">Resultado</p>
                <p className={`text-2xl font-extrabold ${resultado >= 0 ? 'text-brand-900' : 'text-red-600'}`}>{formatCurrency(resultado)}</p>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {tab === 'DRE' ? 'Demonstração do Resultado'
                  : tab === 'Balanço' ? 'Balanço Patrimonial'
                  : tab === 'DFC' ? 'Fluxo de Caixa'
                  : 'Mutações do Patrimônio Líquido'}
              </CardTitle>
            </CardHeader>
            <CardBody className="pt-2">
              <p className="text-sm text-brand-300 mb-4">
                Período: {new Date(dataIni).toLocaleDateString('pt-BR')} a {new Date(dataFim).toLocaleDateString('pt-BR')} — {filtered.length} lançamentos
              </p>
              {tab === 'DRE' && (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-brand-900 mb-2">Receitas ({receitas.length})</p>
                  {receitas.map(t => (
                    <div key={t.id} className="flex justify-between text-sm py-1 border-b border-brand-100">
                      <span className="text-brand-700">{t.description}</span>
                      <span className="text-green-600 font-semibold">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                  <p className="text-sm font-bold text-brand-900 mt-4 mb-2">Despesas ({despesas.length})</p>
                  {despesas.map(t => (
                    <div key={t.id} className="flex justify-between text-sm py-1 border-b border-brand-100">
                      <span className="text-brand-700">{t.description}</span>
                      <span className="text-red-500 font-semibold">({formatCurrency(t.amount)})</span>
                    </div>
                  ))}
                </div>
              )}
              {tab !== 'DRE' && (
                <p className="text-sm text-brand-300 py-4 text-center">
                  Clique em "Imprimir {tab}" para visualizar a demonstração completa formatada.
                </p>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </Layout>
  )
}