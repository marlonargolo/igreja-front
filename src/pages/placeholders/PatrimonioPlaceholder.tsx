import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowDown, Plus, Printer, Wrench } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Extras'
import { useState } from 'react'
import { assetsService } from '@/services'
import { formatCurrency } from '@/lib/format'

export default function PatrimonioPlaceholder({ title }: { title: string }) {
  const location = useLocation()
  const navigate = useNavigate()
  const showToast = useToast()
  const path = location.pathname

  if (path.includes('movimentacao')) return <Movimentacao showToast={showToast} navigate={navigate} />
  if (path.includes('baixa')) return <BaixaPatrimonio showToast={showToast} navigate={navigate} />
  if (path.includes('relatorios')) return <RelatoriosPatrimonio showToast={showToast} />
  if (path.includes('configuracoes')) return <ConfiguracoesPatrimonio showToast={showToast} />

  return null
}

// ─── Movimentação ─────────────────────────────────────────────────────────────
function Movimentacao({ showToast, navigate }: any) {
  const [form, setForm] = useState({
    assetCode: '',
    origem: '',
    destino: '',
    data: new Date().toISOString().split('T')[0],
    responsavel: '',
    observacao: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.assetCode || !form.destino) {
      showToast('Preencha o código do bem e o destino.')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    showToast('Movimentação registrada com sucesso.')
    setSaving(false)
    navigate('/patrimonio')
  }

  return (
    <Layout
      crumbs={[{ label: 'Patrimônio' }, { label: 'Movimentação' }]}
      title="Movimentação de Patrimônio"
    >
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Transferência de Bem</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Input
              label="Código Patrimonial"
              value={form.assetCode}
              onChange={e => setForm({ ...form, assetCode: e.target.value })}
              placeholder="Ex: PAT-001"
              required
            />
            <Input
              label="Data da Movimentação"
              type="date"
              value={form.data}
              onChange={e => setForm({ ...form, data: e.target.value })}
            />
            <Input
              label="Localização / Congregação Origem"
              value={form.origem}
              onChange={e => setForm({ ...form, origem: e.target.value })}
              placeholder="Ex: Sala de Mídia — Sede"
            />
            <Input
              label="Localização / Congregação Destino"
              value={form.destino}
              onChange={e => setForm({ ...form, destino: e.target.value })}
              placeholder="Ex: Sala de Culto — Congregação Norte"
              required
            />
            <Input
              label="Responsável pela Movimentação"
              value={form.responsavel}
              onChange={e => setForm({ ...form, responsavel: e.target.value })}
              placeholder="Nome do responsável"
              className="sm:col-span-2"
            />
            <Textarea
              label="Observações"
              value={form.observacao}
              onChange={e => setForm({ ...form, observacao: e.target.value })}
              rows={3}
              className="sm:col-span-2"
              placeholder="Motivo da transferência, estado do bem, etc."
            />
          </CardBody>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/patrimonio')}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            <ArrowRight className="h-4 w-4" />
            {saving ? 'Registrando...' : 'Registrar Movimentação'}
          </Button>
        </div>
      </form>
    </Layout>
  )
}

// ─── Baixa ────────────────────────────────────────────────────────────────────
function BaixaPatrimonio({ showToast, navigate }: any) {
  const [form, setForm] = useState({
    assetCode: '',
    motivo: 'DESCARTE',
    data: new Date().toISOString().split('T')[0],
    valorResidual: '',
    observacao: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.assetCode) { showToast('Informe o código do bem.'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    showToast('Baixa de patrimônio registrada.')
    setSaving(false)
    navigate('/patrimonio')
  }

  return (
    <Layout
      crumbs={[{ label: 'Patrimônio' }, { label: 'Baixa de Patrimônio' }]}
      title="Baixa de Patrimônio"
    >
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Registrar Baixa</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Input
              label="Código Patrimonial"
              value={form.assetCode}
              onChange={e => setForm({ ...form, assetCode: e.target.value })}
              placeholder="Ex: PAT-001"
              required
            />
            <Input
              label="Data da Baixa"
              type="date"
              value={form.data}
              onChange={e => setForm({ ...form, data: e.target.value })}
            />
            <Select
              label="Motivo da Baixa"
              value={form.motivo}
              onChange={e => setForm({ ...form, motivo: e.target.value })}
            >
              <option value="DESCARTE">Descarte / Inutilização</option>
              <option value="VENDA">Venda</option>
              <option value="DOACAO">Doação</option>
              <option value="FURTO">Furto / Roubo</option>
              <option value="SINISTRO">Sinistro / Perda Total</option>
              <option value="DEVOLUCAO">Devolução ao Fornecedor</option>
            </Select>
            <Input
              label="Valor Residual (R$)"
              type="number"
              step="0.01"
              value={form.valorResidual}
              onChange={e => setForm({ ...form, valorResidual: e.target.value })}
              placeholder="0,00"
            />
            <Textarea
              label="Observações / Justificativa"
              value={form.observacao}
              onChange={e => setForm({ ...form, observacao: e.target.value })}
              rows={4}
              className="sm:col-span-2"
              placeholder="Descreva o motivo detalhado da baixa..."
              required
            />
          </CardBody>
        </Card>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Atenção: a baixa é irreversível. O bem será marcado como BAIXADO e não aparecerá mais nos relatórios ativos.
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/patrimonio')}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            <ArrowDown className="h-4 w-4" />
            {saving ? 'Registrando...' : 'Confirmar Baixa'}
          </Button>
        </div>
      </form>
    </Layout>
  )
}

// ─── Relatórios ───────────────────────────────────────────────────────────────
function RelatoriosPatrimonio({ showToast }: any) {
  const [tipo, setTipo] = useState('geral')
  const [generating, setGenerating] = useState(false)

  const TIPOS = [
    { key: 'geral', label: 'Inventário Geral' },
    { key: 'ativos', label: 'Bens Ativos' },
    { key: 'manutencao', label: 'Em Manutenção' },
    { key: 'baixados', label: 'Bens Baixados' },
  ]

  async function generate() {
    setGenerating(true)
    try {
      const res = await assetsService.list({ size: 500 }) as any
      const all = res?.data?.data || res?.data || res?.content || []
      let data = all
      if (tipo === 'ativos') data = all.filter((a: any) => a.status === 'ACTIVE')
      else if (tipo === 'manutencao') data = all.filter((a: any) => a.status === 'MAINTENANCE')
      else if (tipo === 'baixados') data = all.filter((a: any) => a.status === 'WRITTEN_OFF')

      const win = window.open('', '_blank')
      if (!win) return
      const titulo = TIPOS.find(t => t.key === tipo)?.label || 'Inventário'
      const total = data.reduce((s: number, a: any) => {
        const v = a.currentValueCents ? a.currentValueCents / 100 : (a.currentValue || 0)
        return s + v
      }, 0)
      const rows = data.map((a: any) => {
        const orig = a.originalValueCents ? a.originalValueCents / 100 : (a.originalValue || 0)
        const curr = a.currentValueCents ? a.currentValueCents / 100 : (a.currentValue || 0)
        return `<tr>
          <td>${a.code || '—'}</td>
          <td>${a.description}</td>
          <td>${a.categoryName || '—'}</td>
          <td>${a.location || '—'}</td>
          <td style="text-align:right">${formatCurrency(orig)}</td>
          <td style="text-align:right;font-weight:bold">${formatCurrency(curr)}</td>
          <td>${a.status === 'ACTIVE' ? 'Ativo' : a.status === 'MAINTENANCE' ? 'Manutenção' : 'Baixado'}</td>
        </tr>`
      }).join('')

      win.document.write(`
        <html><head><title>${titulo}</title>
        <style>
          body { font-family: Arial; font-size: 12px; padding: 20px; }
          h1 { font-size: 16px; color: #1E3A5F; margin-bottom: 4px; }
          p { color: #666; font-size: 11px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1E3A5F; color: white; padding: 8px; text-align: left; font-size: 11px; }
          td { padding: 7px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
          tr:nth-child(even) td { background: #f9f9f9; }
          .total { text-align: right; font-weight: bold; font-size: 13px; margin-top: 12px; }
        </style></head>
        <body>
          <h1>Patrimônio — ${titulo}</h1>
          <p>Gerado em ${new Date().toLocaleString('pt-BR')} — Total: ${data.length} bens</p>
          <table>
            <thead><tr><th>Código</th><th>Descrição</th><th>Categoria</th><th>Localização</th><th style="text-align:right">Valor Original</th><th style="text-align:right">Valor Atual</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="total">Total do Inventário: ${formatCurrency(total)}</p>
        </body></html>
      `)
      win.document.close()
      setTimeout(() => win.print(), 400)
    } catch {
      showToast('Falha ao gerar relatório.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Layout crumbs={[{ label: 'Patrimônio' }, { label: 'Relatórios' }]} title="Relatórios — Patrimônio">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {TIPOS.map(t => (
          <button key={t.key} onClick={() => setTipo(t.key)}
            className={`text-left p-5 rounded-2xl border-2 transition-all ${
              tipo === t.key ? 'border-brand-800 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-300'
            }`}
          >
            <span className={`font-semibold text-sm ${tipo === t.key ? 'text-brand-900' : 'text-brand-500'}`}>{t.label}</span>
          </button>
        ))}
      </div>
      <Card>
        <CardBody className="pt-6">
          <Button onClick={generate} disabled={generating}>
            <Printer className="h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar e Imprimir'}
          </Button>
        </CardBody>
      </Card>
    </Layout>
  )
}

// ─── Configurações ────────────────────────────────────────────────────────────
function ConfiguracoesPatrimonio({ showToast }: any) {
  const [categorias, setCategorias] = useState([
    'Imóveis', 'Veículos', 'Equipamentos', 'Instrumentos Musicais', 'Mobiliário', 'Eletrônicos', 'Outros'
  ])
  const [localizacoes, setLocalizacoes] = useState([
    'Sala de Culto', 'Sala de Mídia', 'Escritório', 'Salão de Eventos', 'Estacionamento'
  ])
  const [estados, setEstados] = useState(['Ótimo', 'Bom', 'Regular', 'Ruim', 'Inutilizável'])
  const [tab, setTab] = useState('Categorias')
  const [newItem, setNewItem] = useState('')

  const MAP: Record<string, { list: string[], set: (v: string[]) => void }> = {
    'Categorias': { list: categorias, set: setCategorias },
    'Localizações': { list: localizacoes, set: setLocalizacoes },
    'Estados de Conservação': { list: estados, set: setEstados },
  }

  function add() {
    if (!newItem.trim()) return
    MAP[tab].set([...MAP[tab].list, newItem.trim()])
    setNewItem('')
  }

  function remove(item: string) {
    MAP[tab].set(MAP[tab].list.filter(i => i !== item))
  }

  return (
    <Layout crumbs={[{ label: 'Patrimônio' }, { label: 'Configurações' }]} title="Configurações — Patrimônio">
      <div className="flex gap-2 mb-6">
        {Object.keys(MAP).map(t => (
          <button key={t} onClick={() => { setTab(t); setNewItem('') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              tab === t ? 'bg-brand-800 text-white border-brand-800' : 'bg-white text-brand-700 border-brand-200 hover:border-brand-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{tab}</CardTitle></CardHeader>
        <CardBody className="pt-2">
          <div className="flex gap-2 mb-6">
            <Input
              placeholder={`Nova entrada em ${tab}...`}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
            />
            <Button onClick={add}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {MAP[tab].list.map(item => (
              <div key={item} className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/40">
                <span className="text-sm font-medium text-brand-900">{item}</span>
                <button onClick={() => remove(item)} className="text-brand-200 hover:text-red-500">
                  <Wrench className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </Layout>
  )
}