// src/pages/MemberForm.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Extras'
import { membersService, congregationsService, type Congregation } from '@/services'

export default function MemberForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const isEdit = Boolean(id)

  // Estado do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: 'MASCULINO',
    maritalStatus: 'SOLTEIRO',
    profession: '',
    address: '',
    congregationId: 0,
    role: 'MEMBRO',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'VISITOR',
    baptismDate: '',
    memberSince: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('https://i.pravatar.cc/150?u=novo-membro')

  // Carregar lista de congregações para o select
  useEffect(() => {
    congregationsService.list({ page: 0, size: 100 })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || [])
        setCongregations(list)
        if (list.length > 0 && formData.congregationId === 0) {
          setFormData(prev => ({ ...prev, congregationId: list[0].id }))
        }
        // Se houver pelo menos uma, seleciona a primeira como padrão
        if (res.data.length > 0 && formData.congregationId === 0) {
          setFormData(prev => ({ ...prev, congregationId: res.data[0].id }))
        }
      })
      .catch(() => showToast('mensagem'))
      .finally(() => setLoading(false))
  }, [])

  // Se for edição, carregar dados do membro
  useEffect(() => {
    if (isEdit && id) {
      membersService.get(Number(id))
        .then(member => {
          setFormData({
            name: member.name,
            email: member.email,
            phone: member.phone || '',
            birthDate: member.birthDate || '',
            gender: member.gender || 'MASCULINO',
            maritalStatus: member.maritalStatus || 'SOLTEIRO',
            profession: member.profession || '',
            address: member.address || '',
            congregationId: member.congregationId,
            role: member.role || 'MEMBRO',
            status: member.status,
            baptismDate: member.baptismDate || '',
            memberSince: member.memberSince || new Date().toISOString().split('T')[0],
            notes: member.notes || '',
          })
          if (member.avatarUrl) setAvatarUrl(member.avatarUrl)
        })
        .catch(() => showToast('mensagem'))
    }
  }, [isEdit, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Validar campos obrigatórios
    if (!formData.name || !formData.email || !formData.congregationId) {
      showToast('mensagem')
      setSaving(false)
      return
    }

    // Montar payload com os campos esperados pela API
    const payload = {
      churchId: 1, // Substitua pelo ID da igreja atual (pode vir do contexto)
      congregationId: formData.congregationId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      birthDate: formData.birthDate || undefined,
      gender: formData.gender,
      maritalStatus: formData.maritalStatus,
      profession: formData.profession || undefined,
      address: formData.address || undefined,
      role: formData.role,
      status: formData.status,
      baptismDate: formData.baptismDate || undefined,
      memberSince: formData.memberSince || undefined,
      notes: formData.notes || undefined,
    }

    try {
      if (isEdit && id) {
        await membersService.update(Number(id), payload)
        showToast('mensagem')
      } else {
        await membersService.create(payload)
        showToast('mensagem')
      }
      navigate('/membros')
    } catch (err: any) {
      console.error('Erro ao salvar membro:', err)
      const message = err.message || 'Falha ao salvar membro. Tente novamente.'
      showToast('mensagem')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout crumbs={[{ label: 'Igreja Sede' }, { label: 'Membros', to: '/membros' }, { label: isEdit ? 'Editar' : 'Novo Membro' }]} title={isEdit ? 'Editar Membro' : 'Cadastro de Membro'}>
        <div className="flex items-center justify-center h-64">Carregando...</div>
      </Layout>
    )
  }

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Membros', to: '/membros' }, { label: isEdit ? 'Editar' : 'Novo Membro' }]}
      title={isEdit ? 'Editar Membro' : 'Cadastro de Membro'}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <Card className="mb-6">
          <CardHeader><CardTitle>Foto e Identificação</CardTitle></CardHeader>
          <CardBody className="flex items-center gap-5 pt-2">
            <img src={avatarUrl} className="h-20 w-20 rounded-full object-cover" alt="" />
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/png,image/jpeg'
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file && id) {
                    try {
                      const result = await membersService.uploadAvatar(Number(id), file)
                      setAvatarUrl(result.avatarUrl)
                      showToast('mensagem')
                    } catch (err) {
                      showToast('mensagem')
                    }
                  } else {
                    showToast('mensagem')
                  }
                }
                input.click()
              }}>
                Alterar Foto
              </Button>
              <p className="text-xs text-brand-300 mt-2">Formatos PNG ou JPG. Máximo de 2MB.</p>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Input
              label="Nome Completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome completo"
              required
            />
            <Input
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="exemplo@email.com"
              required
            />
            <Input
              label="Telefone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(41) 90000-0000"
            />
            <Input
              label="Data de Nascimento"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
            <Select
              label="Sexo"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
            </Select>
            <Select
              label="Estado Civil"
              value={formData.maritalStatus}
              onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
            >
              <option value="SOLTEIRO">Solteiro</option>
              <option value="CASADO">Casado</option>
              <option value="DIVORCIADO">Divorciado</option>
              <option value="VIUVO">Viúvo</option>
            </Select>
            <Input
              label="Profissão"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              placeholder="Ex: Engenheiro Civil"
            />
            <Input
              label="Endereço"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, cidade/UF"
              className="sm:col-span-2"
            />
          </CardBody>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Vínculo Eclesiástico</CardTitle></CardHeader>
          <CardBody className="grid sm:grid-cols-2 gap-5 pt-2">
            <Select
              label="Congregação"
              value={String(formData.congregationId)}
              onChange={(e) => setFormData({ ...formData, congregationId: Number(e.target.value) })}
            >
              {congregations.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select
              label="Função / Cargo"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="MEMBRO">Membro</option>
              <option value="DIAcono">Diácono</option>
              <option value="LIDER">Líder de Jovens</option>
              <option value="SECRETARIO">Secretário</option>
              <option value="TESOUREIRO">Tesoureiro</option>
              <option value="PASTOR_CONG">Pastor de Congregação</option>
              <option value="PASTOR_PRINCIPAL">Pastor Principal</option>
              <option value="VISITANTE">Visitante</option>
            </Select>
            <Input
              label="Data de Batismo"
              type="date"
              value={formData.baptismDate}
              onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })}
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="VISITOR">Visitante</option>
            </Select>
            <Textarea
              label="Observações Gerais"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="sm:col-span-2"
              placeholder="Anotações pastorais, participação em ministérios, etc."
            />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/membros')}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Cadastrar Membro')}
          </Button>
        </div>
      </form>
    </Layout>
  )
}