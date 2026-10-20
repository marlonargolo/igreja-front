import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Extras'
import { useConfig } from '@/lib/ConfigContext'

export default function TesourariaConfiguracoes() {
  const showToast = useToast()
  const { local, addLocal, removeLocal } = useConfig()

  // Fornecedores
  const [newFornecedor, setNewFornecedor] = useState('')

  return (
    <Layout
      crumbs={[{ label: 'Tesouraria' }, { label: 'Fornecedores' }]}
      title="Fornecedores"
    >
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
    </Layout>
  )
}