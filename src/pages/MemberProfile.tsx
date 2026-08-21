import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Save, Plus, Trash2, Printer } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Extras'
import { membersService, type Member } from '@/services'
import { EmptyState } from '@/components/ui/Misc'
import { useApp } from '@/lib/AppContext'
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

interface Occurrence {
  id: number
  memberId: number
  occurrenceDate: string
  description: string
  createdAt: string
}

const statusTone: Record<string, 'green' | 'gray' | 'blue'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  VISITOR: 'blue',
}

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const { church } = useApp()
  const [tab, setTab] = useState('Informações Pessoais')
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [newOccurrence, setNewOccurrence] = useState({ date: new Date().toISOString().split('T')[0], description: '' })
  const [savingOcc, setSavingOcc] = useState(false)

  useEffect(() => {
    if (id) {
      membersService.get(Number(id))
        .then(data => setMember(data))
        .catch(() => showToast('Membro não encontrado.'))
        .finally(() => setLoading(false))
    }
  }, [id])

  useEffect(() => {
    if (id && tab === 'Ocorrências') loadOccurrences()
  }, [id, tab])

  async function loadOccurrences() {
    try {
      const res = await http.get<ApiSuccess<Occurrence[]>>(`/members/${id}/occurrences`)
      setOccurrences(Array.isArray(res.data) ? res.data : [])
    } catch {
      setOccurrences([])
    }
  }

  async function addOccurrence() {
    if (!newOccurrence.description.trim()) return
    setSavingOcc(true)
    try {
      await http.post(`/members/${id}/occurrences`, {
        occurrenceDate: newOccurrence.date,
        description: newOccurrence.description,
      })
      showToast('Ocorrência registrada.')
      setNewOccurrence({ date: new Date().toISOString().split('T')[0], description: '' })
      loadOccurrences()
    } catch {
      showToast('Falha ao salvar ocorrência.')
    } finally {
      setSavingOcc(false)
    }
  }

  async function removeOccurrence(occId: number) {
    try {
      await http.delete(`/members/${id}/occurrences/${occId}`)
      setOccurrences(prev => prev.filter(o => o.id !== occId))
      showToast('Ocorrência removida.')
    } catch {
      showToast('Falha ao remover ocorrência.')
    }
  }

  function printCredencial() {
  if (!member) return
  const logo = church?.logoUrl
    ? (church.logoUrl.startsWith('http')
        ? church.logoUrl
        : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://2.24.80.229:3000'}${church.logoUrl}`)
    : null

  const win = window.open('', '_blank', 'width=420,height=300')
  if (!win) return
  win.document.write(`
    <html><head><title>Credencial</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      .card { border: 2px solid #1E3A5F; border-radius: 12px; padding: 20px; max-width: 360px; }
      .header { background: #1E3A5F; color: white; margin: -20px -20px 16px; padding: 14px 20px; border-radius: 10px 10px 0 0; display: flex; align-items: center; gap: 12px; }
      .header img.logo { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; background: white; }
      .header-text h2 { margin: 0; font-size: 15px; }
      .header-text p { margin: 2px 0 0; font-size: 11px; opacity: 0.8; }
      .body { display: flex; gap: 16px; align-items: flex-start; }
      img.avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #1E3A5F; }
      .info h3 { margin: 0 0 4px; font-size: 15px; color: #1E3A5F; }
      .info p { margin: 2px 0; font-size: 12px; color: #555; }
      .footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
    </style></head><body>
    <div class="card">
      <div class="header">
        ${logo ? `<img class="logo" src="${logo}" onerror="this.style.display='none'" />` : ''}
        <div class="header-text">
          <h2>${church?.name || 'IgrejaHub'}</h2>
          <p>Credencial de Membro</p>
        </div>
      </div>
      <div class="body">
        <img class="avatar" src="${member.avatarUrl || `https://i.pravatar.cc/150?u=${member.email}`}" />
        <div class="info">
          <h3>${member.name}</h3>
          <p><strong>Cargo:</strong> ${(member as any).cargo || '—'}</p>
          <p><strong>RG:</strong> ${(member as any).rg || '—'}</p>
          <p><strong>CPF:</strong> ${(member as any).cpf || '—'}</p>
          <p><strong>Membro desde:</strong> ${member.memberSince ? new Date(member.memberSince).toLocaleDateString('pt-BR') : '—'}</p>
        </div>
      </div>
      <div class="footer">
        <span>Emitida em ${new Date().toLocaleDateString('pt-BR')}</span>
        <span>${member.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}</span>
      </div>
    </div>
    </body></html>
  `)
  win.document.close()
  setTimeout(() => win.print(), 400)
}
  function printFicha() {
  if (!member) return
  const logo = church?.logoUrl
    ? (church.logoUrl.startsWith('http')
        ? church.logoUrl
        : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://2.24.80.229:3000'}${church.logoUrl}`)
    : null

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html><head><title>Ficha de Membro — ${member.name}</title>
    <style>
      body { font-family: Arial; font-size: 12px; padding: 30px; max-width: 800px; margin: 0 auto; }
      .church-header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #1E3A5F; padding-bottom: 12px; margin-bottom: 20px; }
      .church-header img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
      .church-header h1 { margin: 0; font-size: 18px; color: #1E3A5F; }
      .church-header p { margin: 2px 0 0; font-size: 12px; color: #666; }
      h2 { font-size: 13px; color: #1E3A5F; margin: 20px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .field { margin-bottom: 8px; }
      .label { font-weight: bold; color: #333; font-size: 11px; display: block; }
      .value { border-bottom: 1px solid #ccc; min-height: 22px; padding: 2px 4px; font-size: 12px; color: #555; }
      .assinatura { margin-top: 40px; display: flex; gap: 40px; }
      .assinatura div { flex: 1; text-align: center; border-top: 1px solid #333; padding-top: 6px; font-size: 11px; }
      @media print { body { padding: 10px; } }
    </style></head>
    <body>
      <div class="church-header">
        ${logo ? `<img src="${logo}" onerror="this.style.display='none'" />` : ''}
        <div>
          <h1>${church?.name || 'IgrejaHub'}</h1>
          <p>Ficha de Cadastro de Membro</p>
        </div>
      </div>
      <h2>Dados Pessoais</h2>
      <div class="grid">
        <div class="field"><span class="label">Nome Completo</span><div class="value">${member.name}</div></div>
        <div class="field"><span class="label">Data de Nascimento</span><div class="value">${member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : ''}</div></div>
        <div class="field"><span class="label">RG</span><div class="value">${(member as any).rg || ''}</div></div>
        <div class="field"><span class="label">CPF</span><div class="value">${(member as any).cpf || ''}</div></div>
        <div class="field"><span class="label">Telefone</span><div class="value">${member.phone || ''}</div></div>
        <div class="field"><span class="label">E-mail</span><div class="value">${member.email || ''}</div></div>
        <div class="field"><span class="label">Estado Civil</span><div class="value">${member.maritalStatus || ''}</div></div>
        <div class="field"><span class="label">Profissão</span><div class="value">${member.profession || ''}</div></div>
      </div>
      <h2>Endereço</h2>
      <div class="field"><span class="label">Endereço Completo</span><div class="value">${member.address || ''}</div></div>
      <h2>Vínculo Eclesiástico</h2>
      <div class="grid">
        <div class="field"><span class="label">Cargo</span><div class="value">${(member as any).cargo || ''}</div></div>
        <div class="field"><span class="label">Data de Batismo</span><div class="value">${member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : ''}</div></div>
        <div class="field"><span class="label">Membro desde</span><div class="value">${member.memberSince ? new Date(member.memberSince).toLocaleDateString('pt-BR') : ''}</div></div>
        <div class="field"><span class="label">Status</span><div class="value">${member.status}</div></div>
      </div>
      <div class="assinatura">
        <div>Assinatura do Membro</div>
        <div>Secretário(a) Responsável</div>
        <div>Data: ___/___/______</div>
      </div>
    </body></html>
  `)
  win.document.close()
  setTimeout(() => win.print(), 400)
}

  if (loading) {
    return (
      <Layout crumbs={[{ label: 'Secretaria' }, { label: 'Membros', to: '/membros' }]} title="Carregando...">
        <div className="flex items-center justify-center h-64">Carregando...</div>
      </Layout>
    )
  }

  if (!member) {
    return (
      <Layout crumbs={[{ label: 'Secretaria' }, { label: 'Membros', to: '/membros' }]} title="Não encontrado">
        <EmptyState title="Membro não encontrado" description="O perfil solicitado não existe ou foi removido." />
      </Layout>
    )
  }

  return (
    <Layout
      crumbs={[{ label: 'Secretaria' }, { label: 'Membros', to: '/membros' }, { label: member.name }]}
      title="Perfil do Membro"
      action={{ label: 'Editar Perfil', icon: <Save className="h-4 w-4" />, onClick: () => navigate(`/membros/${id}/editar`) }}
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
              {(member as any).cargo || '—'}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 text-sm text-brand-500">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone || '—'}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {member.address || '—'}</span>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0 flex-wrap">
            <Button variant="outline" onClick={printCredencial}>
              <Printer className="h-4 w-4" /> Credencial
            </Button>
            <Button variant="outline" onClick={printFicha}>
              <Printer className="h-4 w-4" /> Imprimir Ficha
            </Button>
            <Button variant="outline" onClick={() => navigate(`/membros/${member.id}/editar`)}>Editar</Button>
            <Button variant="danger" onClick={() => {
              membersService.update(member.id, { status: 'INACTIVE' })
                .then(() => { showToast(`${member.name} foi desativado.`); navigate('/membros') })
                .catch(() => showToast('Falha ao desativar.'))
            }}>Desativar</Button>
          </div>
        </CardBody>
      </Card>

      <div className="mt-6">
        <Tabs
          tabs={['Informações Pessoais', 'Histórico', 'Ocorrências', 'Termo de Voluntariado', 'Contribuições', 'Documentos']}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          {tab === 'Informações Pessoais' && (
            <Card>
              <CardBody className="pt-6">
                <h3 className="font-bold text-brand-900 mb-5">Dados Cadastrais</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  <ReadField label="Data de Nascimento" value={member.birthDate ? new Date(member.birthDate).toLocaleDateString('pt-BR') : '—'} />
                  <ReadField label="Sexo" value={member.gender || '—'} />
                  <ReadField label="Estado Civil" value={member.maritalStatus || '—'} />
                  <ReadField label="Profissão" value={member.profession || '—'} />
                  <ReadField label="RG" value={(member as any).rg || '—'} />
                  <ReadField label="CPF" value={(member as any).cpf || '—'} />
                  <ReadField label="Cargo" value={(member as any).cargo || '—'} />
                  <ReadField label="Funções" value={(member as any).funcoes || '—'} />
                  <ReadField label="Data de Batismo" value={member.baptismDate ? new Date(member.baptismDate).toLocaleDateString('pt-BR') : '—'} />
                  <ReadField label="Data de Entrada" value={member.memberSince ? new Date(member.memberSince).toLocaleDateString('pt-BR') : '—'} />
                </div>
                {member.notes && (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-brand-900 mb-1.5">Observações</p>
                    <p className="text-sm text-brand-500 bg-brand-50 rounded-lg px-4 py-3 border border-brand-100">{member.notes}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {tab === 'Histórico' && (
  <Card>
    <CardBody className="pt-6">
      <h3 className="font-bold text-brand-900 mb-4">Histórico do Membro</h3>
      <div className="space-y-3">
        <div className="border border-brand-100 rounded-lg px-4 py-3 bg-brand-50/30">
          <p className="text-xs text-brand-300 mb-1">{member.memberSince ? new Date(member.memberSince).toLocaleDateString('pt-BR') : '—'}</p>
          <p className="text-sm text-brand-900 font-semibold">Membro cadastrado no sistema</p>
          <p className="text-xs text-brand-400 mt-0.5">Status inicial: {member.status}</p>
        </div>
        {(member as any).baptismDate && (
          <div className="border border-brand-100 rounded-lg px-4 py-3 bg-brand-50/30">
            <p className="text-xs text-brand-300 mb-1">{new Date((member as any).baptismDate).toLocaleDateString('pt-BR')}</p>
            <p className="text-sm text-brand-900 font-semibold">Data de Batismo registrada</p>
          </div>
        )}
        <p className="text-xs text-brand-300 text-center pt-2">
          Registro completo de alterações disponível após integração com módulo de auditoria.
        </p>
      </div>
    </CardBody>
  </Card>
)}

          {tab === 'Ocorrências' && (
            <Card>
              <CardBody className="pt-6">
                <h3 className="font-bold text-brand-900 mb-4">Registrar Ocorrência</h3>
                <div className="flex flex-col gap-3 mb-6">
                  <input
                    type="date"
                    value={newOccurrence.date}
                    onChange={(e) => setNewOccurrence(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500"
                  />
                  <textarea
                    rows={3}
                    placeholder="Descreva a ocorrência..."
                    value={newOccurrence.description}
                    onChange={(e) => setNewOccurrence(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500 resize-none"
                  />
                  <Button onClick={addOccurrence} disabled={savingOcc}>
                    <Plus className="h-4 w-4" /> {savingOcc ? 'Salvando...' : 'Adicionar Ocorrência'}
                  </Button>
                </div>

                <h3 className="font-bold text-brand-900 mb-3">Histórico de Ocorrências</h3>
                {occurrences.length === 0 ? (
                  <p className="text-brand-300 text-sm text-center py-4">Nenhuma ocorrência registrada.</p>
                ) : (
                  <div className="space-y-3">
                    {occurrences.map(o => (
                      <div key={o.id} className="border border-brand-100 rounded-lg px-4 py-3 bg-brand-50/30">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-brand-300 mb-1">{new Date(o.occurrenceDate).toLocaleDateString('pt-BR')}</p>
                            <p className="text-sm text-brand-900">{o.description}</p>
                          </div>
                          <button onClick={() => removeOccurrence(o.id)} className="text-brand-200 hover:text-red-500 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {tab === 'Termo de Voluntariado' && (
            <Card>
              <CardBody className="pt-6">
                <h3 className="font-bold text-brand-900 mb-2">Termo de Voluntariado</h3>
                <p className="text-sm text-brand-300 mb-6">
                  Este termo declara que o membro exerce suas atividades na igreja de forma voluntária,
                  sem vínculo empregatício, conforme a Lei 9.608/98.
                </p>
                <div className="bg-brand-50 border border-brand-100 rounded-lg p-5 text-sm text-brand-700 leading-relaxed mb-6">
                  <p>
                    Eu, <strong>{member.name}</strong>, portador(a) do RG nº{' '}
                    <strong>{(member as any).rg || '_______________'}</strong> e CPF nº{' '}
                    <strong>{(member as any).cpf || '_______________'}</strong>, declaro para
                    os devidos fins que presto serviços de forma voluntária e espontânea à{' '}
                    <strong>{church?.name || 'Igreja'}</strong>, sem receber qualquer
                    remuneração, gratificação, benefício ou vantagem financeira, em
                    conformidade com a Lei Federal nº 9.608 de 18 de fevereiro de 1998.
                  </p>
                  <p className="mt-4">
                    Declaro também estar ciente de que esta prestação de serviços não gera
                    vínculo empregatício nem obrigações trabalhistas ou previdenciárias de
                    qualquer espécie entre as partes.
                  </p>
                </div>
                <Button onClick={() => {
                  const win = window.open('', '_blank')
                  if (!win) return
                  win.document.write(`
                    <html><head><title>Termo de Voluntariado — ${member.name}</title>
                    <style>
                      body { font-family: Arial; font-size: 13px; padding: 40px; max-width: 720px; margin: 0 auto; line-height: 1.7; }
                      h1 { text-align: center; font-size: 16px; color: #1E3A5F; margin-bottom: 8px; }
                      h2 { text-align: center; font-size: 13px; color: #555; margin-bottom: 32px; font-weight: normal; }
                      p { margin-bottom: 16px; text-align: justify; }
                      .assinatura { margin-top: 60px; display: flex; gap: 40px; }
                      .assinatura div { flex: 1; text-align: center; border-top: 1px solid #333; padding-top: 8px; font-size: 12px; }
                    </style></head>
                    <body>
                      <h1>TERMO DE SERVIÇO VOLUNTÁRIO</h1>
                      <h2>${church?.name || 'Igreja'}</h2>
                      <p>Eu, <strong>${member.name}</strong>, portador(a) do RG nº <strong>${(member as any).rg || '_______________'}</strong> e CPF nº <strong>${(member as any).cpf || '_______________'}</strong>, residente e domiciliado(a) em ${member.address || '_______________'}, declaro para os devidos fins que presto serviços de forma voluntária e espontânea à <strong>${church?.name || 'Igreja'}</strong>, sem receber qualquer remuneração, gratificação, benefício ou vantagem financeira, em conformidade com a Lei Federal nº 9.608 de 18 de fevereiro de 1998.</p>
                      <p>Declaro ainda que estou ciente de que esta prestação de serviços não gera vínculo empregatício nem obrigações trabalhistas ou previdenciárias de qualquer espécie entre as partes.</p>
                      <p>Declaro que exerço a função/cargo de <strong>${(member as any).cargo || '_______________'}</strong> nesta instituição, de forma livre e espontânea, motivado(a) exclusivamente pelo espírito cívico, altruístico e religioso.</p>
                      <p>Por ser expressão da verdade, firmo o presente termo.</p>
                      <p style="text-align:center;margin-top:16px">${church?.city ? church.city + ', ' : ''}${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <div class="assinatura">
                        <div>${member.name}<br/><small>Voluntário(a)</small></div>
                        <div>Pastor / Responsável<br/><small>${church?.name || ''}</small></div>
                      </div>
                    </body></html>
                  `)
                  win.document.close()
                  setTimeout(() => win.print(), 400)
                }}>
                  <Printer className="h-4 w-4" /> Imprimir Termo
                </Button>
              </CardBody>
            </Card>
          )}

          {tab === 'Contribuições' && (
            <Card>
              <CardBody className="pt-6">
                <h3 className="font-bold text-brand-900 mb-4">Contribuições Financeiras</h3>
                <p className="text-sm text-brand-300 mb-4">
                  Vinculação de dízimos e ofertas ao perfil do membro disponível após configuração do módulo financeiro com identificação por membro.
                </p>
                <div className="bg-brand-50 border border-brand-100 rounded-lg p-4 text-sm text-brand-700">
                  Para registrar contribuições, acesse <strong>Tesouraria → Receitas</strong> e informe o nome do membro na descrição do lançamento.
                </div>
              </CardBody>
            </Card>
          )}
          {tab === 'Documentos' && (
            <Card>
              <CardBody className="pt-6">
                <h3 className="font-bold text-brand-900 mb-4">Documentos do Membro</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-brand-100 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-brand-900">Ficha de Cadastro</p>
                      <p className="text-xs text-brand-300">Formulário de admissão assinado</p>
                    </div>
                    <button
                      onClick={printFicha}
                      className="text-sm font-semibold text-brand-700 hover:underline flex items-center gap-1"
                    >
                      <Printer className="h-3.5 w-3.5" /> Imprimir
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-brand-100 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-brand-900">Termo de Voluntariado</p>
                      <p className="text-xs text-brand-300">Lei 9.608/98 — proteção trabalhista</p>
                    </div>
                    <button
                      onClick={() => setTab('Termo de Voluntariado')}
                      className="text-sm font-semibold text-brand-700 hover:underline"
                    >
                      Ver Termo
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-brand-100 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-brand-900">Credencial de Membro</p>
                      <p className="text-xs text-brand-300">Carteirinha com foto e cargo</p>
                    </div>
                    <button
                      onClick={printCredencial}
                      className="text-sm font-semibold text-brand-700 hover:underline flex items-center gap-1"
                    >
                      <Printer className="h-3.5 w-3.5" /> Imprimir
                    </button>
                  </div>
                  <p className="text-xs text-brand-300 text-center pt-2">
                    Upload de documentos digitalizados disponível em breve.
                  </p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardBody className="pt-6">
            <h3 className="font-bold text-brand-900 mb-4">Resumo</h3>
            <p className="text-sm text-brand-300">Membro desde {member.memberSince ? new Date(member.memberSince).toLocaleDateString('pt-BR') : '—'}</p>
            <p className="text-sm text-brand-300 mt-2">Cargo: {(member as any).cargo || '—'}</p>
            <p className="text-sm text-brand-300 mt-2">Igreja: {member.churchName || church?.name || '—'}</p>
            <p className="text-sm text-brand-300 mt-2">Congregação: {member.congregationName || '—'}</p>
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