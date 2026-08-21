import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'

const defaults = {
  Fornecedores: ['Fornecedor Exemplo'],
  'Categorias Financeiras': ['Dízimo', 'Oferta', 'Oferta Alçada', 'Campanha', 'Conta de Água', 'Conta de Luz', 'Material de Limpeza', 'Aluguel', 'Transferência', 'Repasse (Redízimo)'],
  'Contas e Caixas': ['Caixa Geral', 'Caixa de Jovens', 'Banco Bradesco', 'Banco Itaú'],
  'Formas de Pagamento': ['Dinheiro', 'PIX', 'Cartão de Débito', 'Cartão de Crédito', 'Cheque', 'Transferência Bancária'],
}

type TabKey = keyof typeof defaults

export default function TesourariaConfiguracoes() {
  const [tab, setTab] = useState<TabKey>('Categorias Financeiras')
  const [data, setData] = useState(defaults)
  const [newItem, setNewItem] = useState('')

  function add() {
    if (!newItem.trim()) return
    setData(prev => ({ ...prev, [tab]: [...prev[tab], newItem.trim()] }))
    setNewItem('')
  }

  function remove(item: string) {
    setData(prev => ({ ...prev, [tab]: prev[tab].filter(i => i !== item) }))
  }

  return (
    <Layout
      crumbs={[{ label: 'Tesouraria' }, { label: 'Configurações' }]}
      title="Configurações da Tesouraria"
    >
      <Tabs
        tabs={Object.keys(defaults)}
        active={tab}
        onChange={(t) => { setTab(t as TabKey); setNewItem('') }}
        className="mb-6"
      />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{tab}</CardTitle>
        </CardHeader>
        <CardBody className="pt-2">
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Novo item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <Button onClick={add}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {data[tab].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/40"
              >
                <span className="text-sm font-medium text-brand-900">{item}</span>
                <button
                  onClick={() => remove(item)}
                  className="text-brand-200 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </Layout>
  )
}