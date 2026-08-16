// src/pages/MemberProfile.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Save } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Extras'
import { membersService, type Member } from '@/services'
import { EmptyState } from '@/components/ui/Misc'

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const [tab, setTab] = useState('Informações Pessoais')
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      membersService.get(Number(id))
        .then(data => setMember(data))
        .catch(() => showToast({ title: 'Erro', description: 'Membro não encontrado.', variant: 'destructive' }))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <Layout crumbs={[{ label: 'Igreja Sede' }, { label: 'Membros', to: '/membros' }]} title="Carregando...">
        <div className="flex items-center justify-center h-64">Carregando...</div>
      </Layout>
    )
  }

  if (!member) {
    return (
      <Layout crumbs={[{ label: 'Igreja Sede' }, { label: 'Membros', to: '/membros' }]} title="Membro não encontrado">
        <EmptyState title="Membro não encontrado" description="O perfil solicitado não existe ou foi removido." />
      </Layout>
    )
  }

  const statusTone: Record<string, 'green' | 'gray' | 'blue'> = {
    ACTIVE: 'green',
    INACTIVE: 'gray',
    VISITOR: 'blue',
  }

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Membros', to: '/membros' }, { label: member.name }]}
      title="Perfil do Membro"
      action={{ label: 'Salvar Alterações', icon: <Save className="h-4 w-4" />, onClick: () => navigate(`/membros/${id}/editar`) }}
    >
      <div className="h-2 rounded-t-2xl bg-brand-800 -mb-2" />
      <Card className="rounded-t-none">
        <CardBody className="pt-6 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
          <img src={member.avatarUrl || 'https://i.pravatar.cc/150'} className="h-20 w-20 rounded-full object-cover shrink-0" alt="" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold text-brand-900">{member.name}</h2>
              <Badge tone={statusTone[member.status] || 'gray'}>{member.status}</Badge>
            </div>
            <p className="text-sm text-brand-300 flex items-center gap-1.5 mt-1">
              {member.role} <span className="text-brand-100">•</span> {member.congregationName || '—'}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 text-sm text-brand-500">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone || '—'}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {member.address || '—'}</span>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <Button variant="outline" onClick={() => navigate(`/membros/${member.id}/editar`)}>Editar Perfil</Button>
            <Button variant="danger" onClick={() => {
              membersService.update(member.id, { status: 'INACTIVE' })
                .then(() => {
                  showToast({ title: 'Sucesso', description: `${member.name} foi desativado.` })
                  navigate('/membros')
                })
                .catch(() => showToast({ title: 'Erro', description: 'Falha ao desativar.', variant: 'destructive' }))
            }}>Desativar Membro</Button>
          </div>
        </CardBody>
      </Card>

      <div className="mt-6">
        <Tabs tabs={['Informações Pessoais', 'Histórico', 'Contribuições', 'Documentos']} active={tab} onChange={setTab} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          {tab === 'Informações Pessoais' && (
            <Card>
              <CardBody className="pt-6">
                <h3 className="font-bold text-brand-900 mb-5">Dados Cadastrais</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  <ReadField label="Data de Nascimento" value={member.birthDate || '—'} />
                  <ReadField label="Sexo" value={member.gender || '—'} />
                  <ReadField label="Estado Civil" value={member.maritalStatus || '—'} />
                  <ReadField label="Profissão" value={member.profession || '—'} />
                  <ReadField label="Data de Batismo" value={member.baptismDate || '—'} />
                  <ReadField label="Data de Entrada" value={member.memberSince || '—'} />
                </div>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-brand-900 mb-1.5">Observações Gerais</p>
                  <p className="text-sm text-brand-500 bg-brand-50 rounded-lg px-4 py-3 border border-brand-100">{member.notes || 'Nenhuma observação.'}</p>
                </div>
              </CardBody>
            </Card>
          )}
          {tab === 'Histórico' && (
            <Card><CardBody className="pt-6 text-center text-brand-300">Histórico disponível em breve.</CardBody></Card>
          )}
          {tab === 'Contribuições' && (
            <Card><CardBody className="pt-6 text-center text-brand-300">Contribuições disponíveis em breve.</CardBody></Card>
          )}
          {tab === 'Documentos' && (
            <Card><CardBody className="pt-6 text-center text-brand-300">Documentos disponíveis em breve.</CardBody></Card>
          )}
        </div>
        <Card className="h-fit">
          <CardBody className="pt-6">
            <h3 className="font-bold text-brand-900 mb-4">Informações Adicionais</h3>
            <p className="text-sm text-brand-300">Membro desde {member.memberSince ? new Date(member.memberSince).toLocaleDateString() : '—'}</p>
            <p className="text-sm text-brand-300 mt-2">Congregação: {member.congregationName || '—'}</p>
            <p className="text-sm text-brand-300 mt-2">Igreja: {member.churchName || '—'}</p>
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-900 mb-1.5">{label}</p>
      <div className="rounded-lg border border-brand-100 bg-brand-50/40 px-3.5 py-2.5 text-sm text-brand-700">{value}</div>
    </div>
  )
}