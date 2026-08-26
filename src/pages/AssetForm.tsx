import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Extras'
import { assetsService } from '@/services'
import { useApp } from '@/lib/AppContext'

const CATEGORIAS = ['Imóveis', 'Veículos', 'Equipamentos', 'Instrumentos Musicais', 'Mobiliário', 'Eletrônicos', 'Outros']

export default function AssetForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const showToast = useToast()
  const isEdit = Boolean(id)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', category: 'Equipamentos', location: '',
    originalValue: '', currentValue: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    serialNumber: '', manufacturer: '', model: '', status: 'ACTIVE', notes: '',
  })
  const { church } = useApp()

  useEffect(() => {
    if (isEdit && id) {
      assetsService.get(Number(id)).then((a: any) => {
        setForm({
          code: a.code || '',
          description: a.description || '',
          category: a.categoryName || 'Equipamentos',
          location: a.location || '',
          originalValue: a.originalValueCents ? String(a.originalValueCents / 100) : String(a.originalValue || ''),
          currentValue: a.currentValueCents ? String(a.currentValueCents / 100) : String(a.currentValue || ''),
          acquisitionDate: a.acquisitionDate || new Date().toISOString().split('T')[0],
          serialNumber: a.serialNumber || '',
          manufacturer: a.manufacturer || '',
          model: a.model || '',
          status: a.status || 'ACTIVE',
          notes: a.notes || '',
        })
      }).catch(() => showToast('Falha ao carregar bem.'))
    }
  }, [isEdit, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description) { showToast('Descrição é obrigatória.'); return }
    setSaving(true)
    try {
      const payload = {
        churchId: church?.id ? Number(church.id) : undefined,
        code: form.code || undefined,
        description: form.description,
        categoryId: CATEGORIAS.indexOf(form.category) + 1,
        location: form.location || undefined,
        originalValue: form.originalValue ? parseFloat(form.originalValue) : undefined,
        acquisitionDate: form.acquisitionDate || undefined,
        serialNumber: form.serialNumber || undefined,
        manufacturer: form.manufacturer || undefined,
        model: form.model || undefined,
        notes: form.notes || undefined,
      }
      if (isEdit && id) {
        await assetsService.update(Number(id), payload as any)
        showToast('Bem atualizado com sucesso.')
      } else {
        await assetsService.create(payload as any)
        showToast('Bem cadastrado com sucesso.')
      }
      navigate('/patrimonio')
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar bem.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Patrimônio' }, { label: 'Cadastro de Bens', to: '/patrimonio' }, { label: isEdit ? 'Editar Bem' : 'Novo Bem' }]}
      title={isEdit ? 'Editar Bem' : 'Cadastro de Patrimônio'}
    >
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Input label="Código Patrimonial" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Ex: PAT-001" />
            <Select label="Categoria" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Projetor Epson 5000L" className="sm:col-span-2" required />
            <Input label="Localização" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ex: Sala de Mídia" />
            <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Ativo</option>
              <option value="MAINTENANCE">Em Manutenção</option>
              <option value="WRITTEN_OFF">Baixado</option>
            </Select>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Valores e Aquisição</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Input label="Valor Original (R$)" type="number" step="0.01" value={form.originalValue} onChange={e => setForm({ ...form, originalValue: e.target.value })} placeholder="0,00" />
            <Input label="Valor Atual (R$)" type="number" step="0.01" value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })} placeholder="0,00" />
            <Input label="Data de Aquisição" type="date" value={form.acquisitionDate} onChange={e => setForm({ ...form, acquisitionDate: e.target.value })} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Detalhes Técnicos</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Input label="Número de Série" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} placeholder="Ex: SN123456" />
            <Input label="Fabricante" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} placeholder="Ex: Epson" />
            <Input label="Modelo" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="Ex: PowerLite 5000" />
            <Textarea label="Observações" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="sm:col-span-2" placeholder="Notas sobre manutenção, garantia, etc." />
          </CardBody>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/patrimonio')}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Bem'}
          </Button>
        </div>
      </form>
    </Layout>
  )
}