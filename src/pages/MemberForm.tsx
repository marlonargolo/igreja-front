import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Extras'
import { membersService } from '@/services'

const CARGOS = ['', 'Pastor(a)', 'Presbítero', 'Missionário(a)', 'Diácono', 'Diaconisa', 'Obreiro', 'Membro']
const FUNCOES = ['Músico', 'Professor EBD', 'Tesoureiro(a)', 'Secretário(a)', 'Líder de Jovens', 'Líder de Louvor', 'Auxiliar']

export default function MemberForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', rg: '', cpf: '',
    birthDate: '', gender: 'MASCULINO', maritalStatus: 'SOLTEIRO',
    profession: '', address: '', cargo: '', funcoesSelecionadas: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'VISITOR',
    baptismDate: '', memberSince: new Date().toISOString().split('T')[0], notes: '',
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('https://i.pravatar.cc/150?u=novo-membro')

  useEffect(() => {
    if (isEdit && id) {
      membersService.get(Number(id))
        .then(member => {
          const m = member as any
          setFormData({
            name: m.name || '',
            email: m.email || '',
            phone: m.phone || '',
            rg: m.rg || '',
            cpf: m.cpf || '',
            birthDate: m.birthDate || '',
            gender: m.gender || 'MASCULINO',
            maritalStatus: m.maritalStatus || 'SOLTEIRO',
            profession: m.profession || '',
            address: m.address || '',
            cargo: m.cargo || '',
            funcoesSelecionadas: m.funcoes ? m.funcoes.split(',').map((f: string) => f.trim()) : [],
            status: m.status || 'ACTIVE',
            baptismDate: m.baptismDate || '',
            memberSince: m.memberSince || new Date().toISOString().split('T')[0],
            notes: m.notes || '',
          })
          if (m.avatarUrl) setAvatarUrl(m.avatarUrl)
        })
        .catch(() => showToast('Falha ao carregar membro.'))
        .finally(() => setLoading(false))
    }
  }, [isEdit, id])

  function toggleFuncao(f: string) {
    setFormData(prev => ({
      ...prev,
      funcoesSelecionadas: prev.funcoesSelecionadas.includes(f)
        ? prev.funcoesSelecionadas.filter(x => x !== f)
        : [...prev.funcoesSelecionadas, f],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      showToast('Preencha nome e e-mail.')
      return
    }
    setSaving(true)
    const payload = {
      churchId: 2,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      rg: formData.rg || undefined,
      cpf: formData.cpf || undefined,
      birthDate: formData.birthDate || undefined,
      gender: formData.gender,
      maritalStatus: formData.maritalStatus,
      profession: formData.profession || undefined,
      address: formData.address || undefined,
      cargo: formData.cargo || undefined,
      funcoes: formData.funcoesSelecionadas.join(', ') || undefined,
      role: formData.cargo || undefined,
      status: formData.status,
      baptismDate: formData.baptismDate || undefined,
      memberSince: formData.memberSince || undefined,
      notes: formData.notes || undefined,
    }

    try {
      if (isEdit && id) {
        await membersService.update(Number(id), payload)
        showToast('Membro atualizado com sucesso.')
      } else {
        await membersService.create(payload)
        showToast('Membro cadastrado com sucesso.')
      }
      navigate('/membros')
    } catch (err: any) {
      showToast(err.message || 'Falha ao salvar membro.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <Layout crumbs={[{ label: 'Secretaria' }, { label: 'Membros', to: '/membros' }]} title="Carregando...">
      <div className="flex items-center justify-center h-64">Carregando...</div>
    </Layout>
  )

  return (
    <Layout
      crumbs={[{ label: 'Secretaria' }, { label: 'Membros', to: '/membros' }, { label: isEdit ? 'Editar' : 'Novo Membro' }]}
      title={isEdit ? 'Editar Membro' : 'Cadastro de Membro'}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">

        {/* Foto */}
        <Card>
          <CardHeader><CardTitle>Foto</CardTitle></CardHeader>
          <CardBody className="flex items-center gap-5 pt-2">
            <img src={avatarUrl} className="h-20 w-20 rounded-full object-cover" alt="" />
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => showToast('Salve o membro primeiro para adicionar foto.')}>
                Alterar Foto
              </Button>
              <p className="text-xs text-brand-300 mt-2">PNG ou JPG. Máx. 2MB.</p>
            </div>
          </CardBody>
        </Card>

        {/* Dados Pessoais */}
        <Card>
          <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Input label="Nome Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="E-mail" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Telefone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(41) 90000-0000" />
            <Input label="Data de Nascimento" type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
            <Input label="RG" value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} placeholder="00.000.000-0" />
            <Input label="CPF" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" />
            <Select label="Sexo" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
            </Select>
            <Select label="Estado Civil" value={formData.maritalStatus} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}>
              <option value="SOLTEIRO">Solteiro(a)</option>
              <option value="CASADO">Casado(a)</option>
              <option value="DIVORCIADO">Divorciado(a)</option>
              <option value="VIUVO">Viúvo(a)</option>
            </Select>
            <Input label="Profissão" value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} />
            <Input label="Endereço" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="sm:col-span-2" />
          </CardBody>
        </Card>

        {/* Vínculo Eclesiástico */}
        <Card>
          <CardHeader><CardTitle>Vínculo Eclesiástico</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Select label="Cargo (único)" value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value })}>
              {CARGOS.map(c => <option key={c} value={c}>{c || '— Selecione —'}</option>)}
            </Select>
            <Select label="Status" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="VISITOR">Visitante</option>
            </Select>
            <Input label="Data de Batismo" type="date" value={formData.baptismDate} onChange={e => setFormData({ ...formData, baptismDate: e.target.value })} />
            <Input label="Membro desde" type="date" value={formData.memberSince} onChange={e => setFormData({ ...formData, memberSince: e.target.value })} />

            {/* Funções — múltipla seleção */}
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-brand-900 mb-2">Funções (pode ter várias)</p>
              <div className="flex flex-wrap gap-2">
                {FUNCOES.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFuncao(f)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      formData.funcoesSelecionadas.includes(f)
                        ? 'bg-brand-800 text-white border-brand-800'
                        : 'bg-white text-brand-700 border-brand-200 hover:border-brand-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {formData.funcoesSelecionadas.length > 0 && (
                <p className="text-xs text-brand-300 mt-2">Selecionadas: {formData.funcoesSelecionadas.join(', ')}</p>
              )}
            </div>

            <Textarea label="Observações" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={4} className="sm:col-span-2" placeholder="Anotações pastorais, ministérios, etc." />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/membros')}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Membro'}
          </Button>
        </div>
      </form>
    </Layout>
  )
}