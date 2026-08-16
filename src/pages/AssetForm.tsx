import { useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { congregationOptions } from '@/data/members'
import { useToast } from '@/components/ui/Extras'

export default function AssetForm() {
  const navigate = useNavigate()
  const toast = useToast()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    toast('Bem patrimonial cadastrado com sucesso.')
    navigate('/patrimonio')
  }

  return (
    <Layout crumbs={[{ label: 'Igreja Sede' }, { label: 'Patrimônio', to: '/patrimonio' }, { label: 'Novo Bem' }]} title="Cadastro de Patrimônio">
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card className="mb-6">
          <CardHeader><CardTitle>Informações do Bem</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Input label="Código Patrimonial" placeholder="Ex: PAT-099" />
            <Select label="Categoria">
              <option>Imóveis</option>
              <option>Veículos</option>
              <option>Equipamentos</option>
            </Select>
            <Input label="Descrição" placeholder="Ex: Projetor Epson 5000L" className="sm:col-span-2" />
            <Select label="Congregação">
              {congregationOptions.filter((c) => c !== 'Todas').map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input label="Localização" placeholder="Ex: Sala de Mídia" />
            <Input label="Valor Original (R$)" type="number" placeholder="0,00" />
            <Input label="Valor Atual (R$)" type="number" placeholder="0,00" />
            <Input label="Responsável" placeholder="Nome do responsável" />
            <Select label="Status">
              <option>Ativo</option>
              <option>Em Manutenção</option>
              <option>Baixado</option>
            </Select>
            <Textarea label="Observações" rows={3} className="sm:col-span-2" placeholder="Notas sobre manutenção, garantia, etc." />
          </CardBody>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/patrimonio')}>Cancelar</Button>
          <Button type="submit"><Save className="h-4 w-4" /> Cadastrar Bem</Button>
        </div>
      </form>
    </Layout>
  )
}
