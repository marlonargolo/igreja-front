import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { useConfig } from '@/lib/ConfigContext'

const TABS: { label: string; field: string }[] = [ // <-- ALTERADO
  { label: 'Fornecedores',          field: 'fornecedores' },
  { label: 'Categorias Financeiras', field: 'categoriasFinanceiras' },
  { label: 'Contas e Caixas',       field: 'contasECaixas' },
  { label: 'Formas de Pagamento',   field: 'formasPagamento' },
]

export default function TesourariaConfiguracoes() {
  const { local, addLocal, removeLocal } = useConfig() // <-- ALTERADO
  const [tab, setTab] = useState(TABS[0].label)
  const [newItem, setNewItem] = useState('')

  const current = TABS.find(t => t.label === tab)!

  function handleAdd() { // <-- ALTERADO
    if (!newItem.trim()) return
    addLocal(current.field, newItem.trim()) // <-- ALTERADO
    setNewItem('')
  }

  return (
    <Layout
      crumbs={[{ label: 'Tesouraria' }, { label: 'Configurações' }]}
      title="Configurações da Tesouraria"
    >
      <Tabs
        tabs={TABS.map(t => t.label)}
        active={tab}
        onChange={t => { setTab(t); setNewItem('') }}
        className="mb-6"
      />
      <Card>
        <CardHeader><CardTitle>{tab}</CardTitle></CardHeader>
        <CardBody className="pt-2">
          <div className="flex gap-2 mb-6">
            <Input
              placeholder={`Novo item em ${tab}...`}
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {local[current.field]?.map((item: string) => ( // <-- ALTERADO
              <div 
                key={item} 
                className="flex items-center justify-between px-4 py-3 rounded-lg border border-brand-100 bg-brand-50/40"
              >
                <span className="text-sm font-medium text-brand-900">{item}</span>
                <button 
                  onClick={() => removeLocal(current.field, item)} // <-- ALTERADO
                  className="text-brand-200 hover:text-red-500"
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