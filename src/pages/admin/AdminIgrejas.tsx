/**
 * AdminIgrejas.tsx — Corrigido
 *
 * MUDANÇAS:
 * 1. Tela exclusiva ROOT (guarda no frontend + backend)
 * 2. Formulário agora inclui: seleção de Plano, criação do usuário admin da Igreja
 * 3. Planos carregados via API real (/plans)
 * 4. Sem dados mockados
 * 5. Mensagem clara ao tentar criar sem ser ROOT
 */
import { useEffect, useState } from 'react'
import { Plus, MapPin, Phone, Mail, Edit2, Trash2, Upload, X, Lock } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { churchesService, type Church } from '@/services/churches.service'
import { fetchAddressByCep, fetchCompanyByCnpj } from '@/services/externalApis.service'
import { http } from '@/lib/http'

const FILES_BASE = 'http://2.24.80.229:3000'

function logoUrl(url?: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('blob:')) return url
  return `${FILES_BASE}${url}`
}

interface Plan { id: number; name: string; price: number; maxUsers: number; maxCongregations: number }

export default function AdminIgrejas() {
  const showToast = useToast()
  const { user: currentUser } = useApp()
  const isRoot = currentUser?.roles?.includes('ROOT') ?? false

  const [churches, setChurches] = useState<Church[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Church | null>(null)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', city: '', state: '', address: '',
    zipCode: '', phone: '', email: '', cnpj: '', status: 'ACTIVE',
    planId: '',
    // Usuário admin — só no cadastro novo
    adminName: '', adminEmail: '', adminPassword: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [list, plansRes] = await Promise.all([
        churchesService.list(),
        isRoot ? http.get<any>('/plans') : Promise.resolve(null),
      ])
      setChurches(list)
      if (plansRes) {
        const planList: Plan[] = plansRes.data?.data || plansRes.data || []
        setPlans(planList)
      }
    } catch {
      showToast('Falha ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogoChange(file: File | null) {
    setLogoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = e => setLogoPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setLogoPreview(null)
    }
  }

  async function handleCepSearch(cep: string) {
    try {
      const data = await fetchAddressByCep(cep)
      setForm(prev => ({ ...prev, city: data.city, state: data.state,
        address: data.street ? `${data.street} - ${data.neighborhood}` : prev.address, zipCode: data.cep }))
      showToast('CEP encontrado!')
    } catch (error: any) { showToast(error.message || 'Erro ao buscar CEP') }
  }

  async function handleCnpjSearch(cnpj: string) {
    try {
      const data = await fetchCompanyByCnpj(cnpj)
      setForm(prev => ({ ...prev, name: data.fantasyName || data.name || prev.name,
        city: data.city || prev.city, state: data.state || prev.state,
        address: data.street ? `${data.street}${data.number ? `, ${data.number}` : ''}` : prev.address,
        phone: data.phone || prev.phone, email: data.email || prev.email,
        cnpj: data.cnpj || prev.cnpj, zipCode: data.cep || prev.zipCode }))
      showToast('CNPJ encontrado!')
    } catch (error: any) { showToast(error.message || 'Erro ao buscar CNPJ') }
  }

  function openNew() {
    if (!isRoot) { showToast('Apenas o ROOT pode cadastrar novas igrejas.'); return }
    setEditing(null)
    setLogoFile(null); setLogoPreview(null)
    setForm({ name: '', city: '', state: '', address: '', zipCode: '', phone: '', email: '',
      cnpj: '', status: 'ACTIVE', planId: String(plans[0]?.id || ''),
      adminName: '', adminEmail: '', adminPassword: '' })
    setOpen(true)
  }

  function openEdit(c: Church) {
    setEditing(c)
    setLogoFile(null)
    setLogoPreview(logoUrl(c.logoUrl) || null)
    setForm({ name: c.name, city: c.city || '', state: c.state || '', address: c.address || '',
      zipCode: c.zipCode || '', phone: c.phone || '', email: c.email || '', cnpj: c.cnpj || '',
      status: c.status || 'ACTIVE', planId: '',
      adminName: '', adminEmail: '', adminPassword: '' })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }

    if (!editing) {
      // Validações do cadastro de nova Igreja
      if (!form.planId) { showToast('Selecione um plano.'); return }
      if (!form.adminName || !form.adminEmail || !form.adminPassword) {
        showToast('Preencha os dados do usuário administrador.'); return
      }
    }

    setSaving(true)
    try {
      let saved: Church
      if (editing) {
        saved = await churchesService.update(editing.id, {
          name: form.name, city: form.city, state: form.state, address: form.address,
          zipCode: form.zipCode, phone: form.phone, email: form.email, cnpj: form.cnpj,
          status: form.status,
        }) as unknown as Church
        showToast('Igreja atualizada.')
      } else {
        // Criar Igreja + vincular Plano + criar Admin
        saved = await churchesService.create({
          name: form.name, city: form.city, state: form.state, address: form.address,
          zipCode: form.zipCode, phone: form.phone, email: form.email, cnpj: form.cnpj,
          planId: Number(form.planId),
          adminName: form.adminName, adminEmail: form.adminEmail, adminPassword: form.adminPassword,
        }) as unknown as Church
        showToast('Igreja cadastrada com administrador.')
      }

      if (logoFile && saved?.id) {
        try {
          await churchesService.uploadLogo(saved.id, logoFile)
          showToast('Logo enviada.')
        } catch { showToast('Igreja salva, mas falha no upload da logo.') }
      }

      setOpen(false)
      loadData()
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(c: Church) {
    if (!isRoot) { showToast('Apenas o ROOT pode desativar igrejas.'); return }
    if (!confirm(`Desativar "${c.name}"?`)) return
    try {
      await churchesService.remove(c.id)
      showToast(`${c.name} desativada.`)
      loadData()
    } catch { showToast('Falha ao desativar.') }
  }

  return (
    <Layout
      crumbs={[{ label: 'Administração' }, { label: 'Cadastro de Igrejas' }]}
      title="Cadastro de Igrejas"
      action={isRoot ? { label: 'Nova Igreja', icon: <Plus className="h-4 w-4" />, onClick: openNew } : undefined}
    >
      {!isRoot && (
        <div className="flex items-center gap-2 text-sm text-brand-400 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-6">
          <Lock className="h-4 w-4" />
          Apenas o ROOT pode criar novas igrejas. Aqui você visualiza as igrejas disponíveis.
        </div>
      )}

      {/* Cards visuais */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {churches.map(c => {
          const logo = logoUrl(c.logoUrl)
          return (
            <Card key={c.id} className="overflow-hidden">
              {logo ? (
                <img src={logo} alt={c.name} className="h-32 w-full object-cover" />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center">
                  <span className="text-5xl font-extrabold text-white/30">{c.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <CardBody className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-brand-900">{c.name}</p>
                  <Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>
                    {c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                {(c.city || c.state) && (
                  <p className="text-xs text-brand-300 flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" /> {[c.city, c.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {c.phone && <p className="text-xs text-brand-300 flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</p>}
                {c.email && <p className="text-xs text-brand-300 flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</p>}
                {isRoot && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-brand-100">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(c)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Tabela resumida */}
      <Card>
        <CardHeader><CardTitle>Todas as Igrejas ({churches.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : (
            <Table>
              <Thead>
                <tr><Th>Nome</Th><Th>Cidade/UF</Th><Th>CNPJ</Th><Th>Status</Th>{isRoot && <Th>Ações</Th>}</tr>
              </Thead>
              <tbody>
                {churches.map(c => (
                  <Tr key={c.id}>
                    <Td className="font-semibold flex items-center gap-2">
                      {logoUrl(c.logoUrl) && <img src={logoUrl(c.logoUrl)} alt="" className="h-7 w-7 rounded object-cover" />}
                      {c.name}
                    </Td>
                    <Td className="text-brand-500">{[c.city, c.state].filter(Boolean).join('/')}</Td>
                    <Td className="text-brand-500">{c.cnpj || '—'}</Td>
                    <Td><Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>{c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}</Badge></Td>
                    {isRoot && (
                      <Td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(c)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </Td>
                    )}
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal criar/editar */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); setLogoFile(null); setLogoPreview(null) }}
        title={editing ? `Editar: ${editing.name}` : 'Nova Igreja'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Igreja'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome da Igreja" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

          {/* CNPJ */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input label="CNPJ" value={form.cnpj}
                onChange={e => {
                  const value = e.target.value
                  setForm({ ...form, cnpj: value })
                  if (value.replace(/\D/g, '').length === 14) handleCnpjSearch(value)
                }}
                placeholder="00.000.000/0001-00" />
            </div>
            <Button type="button" variant="outline" className="mt-6"
              onClick={() => form.cnpj && handleCnpjSearch(form.cnpj)}
              disabled={!form.cnpj || form.cnpj.replace(/\D/g, '').length !== 14}>
              Buscar CNPJ
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="UF" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} />
          </div>

          {/* CEP */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input label="CEP" value={form.zipCode}
                onChange={e => {
                  const value = e.target.value
                  setForm({ ...form, zipCode: value })
                  if (value.replace(/\D/g, '').length === 8) handleCepSearch(value)
                }} placeholder="00000-000" />
            </div>
            <Button type="button" variant="outline" className="mt-6"
              onClick={() => form.zipCode && handleCepSearch(form.zipCode)}
              disabled={!form.zipCode || form.zipCode.replace(/\D/g, '').length !== 8}>
              Buscar CEP
            </Button>
          </div>

          <Input label="Endereço" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="E-mail" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Ativa</option>
            <option value="INACTIVE">Inativa</option>
          </Select>

          {/* ── Plano — APENAS no cadastro novo ── */}
          {!editing && (
            <>
              <div className="border-t border-brand-100 pt-4">
                <p className="text-sm font-bold text-brand-900 mb-3">Plano de Assinatura</p>
                <Select label="Plano" value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} required>
                  <option value="">Selecione um plano...</option>
                  {plans.filter(p => p.active !== false).map(p => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} — R$ {p.price.toFixed(2)}/mês · {p.maxUsers} usuários · {p.maxCongregations} congregações
                    </option>
                  ))}
                </Select>
              </div>

              {/* ── Usuário administrador da Igreja ── */}
              <div className="border-t border-brand-100 pt-4">
                <p className="text-sm font-bold text-brand-900 mb-1">Usuário Administrador da Igreja</p>
                <p className="text-xs text-brand-400 mb-3">
                  Este usuário terá acesso administrativo somente a esta Igreja.
                  Contabilidade e administração do sistema não estarão disponíveis.
                </p>
                <div className="space-y-3">
                  <Input label="Nome do Administrador" value={form.adminName}
                    onChange={e => setForm({ ...form, adminName: e.target.value })} required />
                  <Input label="E-mail do Administrador" type="email" value={form.adminEmail}
                    onChange={e => setForm({ ...form, adminEmail: e.target.value })} required />
                  <Input label="Senha inicial" type="password" value={form.adminPassword}
                    onChange={e => setForm({ ...form, adminPassword: e.target.value })}
                    placeholder="Mínimo 8 caracteres" required />
                </div>
              </div>
            </>
          )}

          {/* Upload de logo */}
          <div className="border-t border-brand-100 pt-4">
            <p className="text-sm font-semibold text-brand-900 mb-2 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Logo da Igreja
            </p>
            {logoPreview ? (
              <div className="flex items-center gap-3">
                <img src={logoPreview} alt="Logo" className="h-20 w-20 rounded-xl object-cover border border-brand-100" />
                <button type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(editing ? logoUrl(editing.logoUrl) || null : null) }}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> Remover
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-brand-200 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
                <Upload className="h-5 w-5 text-brand-300" />
                <div>
                  <p className="text-sm font-medium text-brand-700">Clique para selecionar a logo</p>
                  <p className="text-xs text-brand-300">PNG, JPG ou SVG. Máx. 5MB.</p>
                </div>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  className="hidden" onChange={e => handleLogoChange(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
