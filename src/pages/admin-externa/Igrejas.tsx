// src/pages/admin-externa/Igrejas.tsx
//
// Módulo de Igrejas da Administração Externa: listagem com filtros,
// paginação, ações por igreja e criação completa (com plano, admin e logo)
// exibindo as credenciais do administrador criado apenas uma vez.
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Eye, Edit2, Trash2, Users, MapPin as MapPinIcon,
  Power, Upload, X,
} from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { CredentialsModal } from '@/components/admin-externa/CredentialsModal'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, Pagination } from '@/components/ui/Misc'
import { useToast } from '@/components/ui/Extras'
import { churchesService, resolveLogoUrl, type Church } from '@/services/churches.service'
import { fetchAddressByCep, fetchCompanyByCnpj } from '@/services/externalApis.service'
import { http } from '@/lib/http'

interface Plan { id: number; name: string; price: number; maxUsers: number; maxCongregations: number; active?: boolean }

const PAGE_SIZE = 10

export default function Igrejas() {
  const showToast = useToast()
  const navigate = useNavigate()

  const [churches, setChurches] = useState<Church[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({ search: '', city: '', state: '', status: '', planId: '' })

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Church | null>(null)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null)

  const [form, setForm] = useState({
    name: '', city: '', state: '', address: '', zipCode: '', phone: '', email: '', cnpj: '',
    status: 'ACTIVE', planId: '', adminName: '', adminEmail: '', adminPassword: '',
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError(false)
    try {
      const [list, plansRes] = await Promise.all([
        churchesService.list({ size: 500 }),
        http.get<any>('/plans').catch(() => null),
      ])
      setChurches(list)
      if (plansRes) {
        const planList: Plan[] = plansRes.data?.data || plansRes.data || []
        setPlans(planList)
      }
    } catch {
      setError(true)
      showToast('Falha ao carregar igrejas.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => churches.filter(c => {
    if (filters.search && !c.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.city && !(c.city || '').toLowerCase().includes(filters.city.toLowerCase())) return false
    if (filters.state && (c.state || '').toUpperCase() !== filters.state.toUpperCase()) return false
    if (filters.status && c.status !== filters.status) return false
    return true
  }), [churches, filters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleLogoChange(file: File | null) {
    setLogoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = e => setLogoPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else setLogoPreview(null)
  }

  async function handleCepSearch(cep: string) {
    try {
      const data = await fetchAddressByCep(cep)
      setForm(prev => ({ ...prev, city: data.city, state: data.state,
        address: data.street ? `${data.street} - ${data.neighborhood}` : prev.address, zipCode: data.cep }))
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
    } catch (error: any) { showToast(error.message || 'Erro ao buscar CNPJ') }
  }

  function openNew() {
    setEditing(null)
    setLogoFile(null); setLogoPreview(null)
    setForm({ name: '', city: '', state: '', address: '', zipCode: '', phone: '', email: '', cnpj: '',
      status: 'ACTIVE', planId: String(plans[0]?.id || ''), adminName: '', adminEmail: '', adminPassword: '' })
    setOpen(true)
  }

  function openEdit(c: Church) {
    setEditing(c)
    setLogoFile(null)
    setLogoPreview(resolveLogoUrl(c.logoUrl) || null)
    setForm({ name: c.name, city: c.city || '', state: c.state || '', address: c.address || '',
      zipCode: c.zipCode || '', phone: c.phone || '', email: c.email || '', cnpj: c.cnpj || '',
      status: c.status || 'ACTIVE', planId: '', adminName: '', adminEmail: '', adminPassword: '' })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    if (!editing) {
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
        saved = await churchesService.create({
          name: form.name, city: form.city, state: form.state, address: form.address,
          zipCode: form.zipCode, phone: form.phone, email: form.email, cnpj: form.cnpj,
          planId: Number(form.planId),
          adminName: form.adminName, adminEmail: form.adminEmail, adminPassword: form.adminPassword,
        }) as unknown as Church
      }

      if (logoFile && saved?.id) {
        try { await churchesService.uploadLogo(saved.id, logoFile) }
        catch { showToast('Igreja salva, mas falha no upload da logo.') }
      }

      setOpen(false)
      loadData()

      if (!editing) {
        setCredentials({ name: form.adminName, email: form.adminEmail, password: form.adminPassword })
      } else {
        showToast('Igreja atualizada com sucesso.')
      }
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar. Nenhuma alteração foi aplicada.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(c: Church) {
    const next = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    if (!confirm(`${next === 'ACTIVE' ? 'Ativar' : 'Desativar'} "${c.name}"?`)) return
    try {
      await churchesService.update(c.id, { status: next })
      showToast(`${c.name} ${next === 'ACTIVE' ? 'ativada' : 'desativada'}.`)
      loadData()
    } catch { showToast('Falha ao alterar status.') }
  }

  async function handleDelete(c: Church) {
    if (!confirm(`Excluir (logicamente) "${c.name}"? Esta ação pode ser revertida pelo suporte.`)) return
    try {
      await churchesService.remove(c.id)
      showToast(`${c.name} excluída.`)
      loadData()
    } catch { showToast('Falha ao excluir.') }
  }

  return (
    <AdminExternaLayout
      crumbs={[{ label: 'Igrejas' }]}
      title="Igrejas"
      action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Nova Igreja</Button>}
    >
      {/* Filtros */}
      <Card className="mb-4 p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300" />
            <input
              placeholder="Buscar por nome..."
              value={filters.search}
              onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1) }}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <Input placeholder="Cidade" value={filters.city}
            onChange={e => { setFilters({ ...filters, city: e.target.value }); setPage(1) }} />
          <Input placeholder="UF" maxLength={2} value={filters.state}
            onChange={e => { setFilters({ ...filters, state: e.target.value }); setPage(1) }} />
          <Select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}>
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativa</option>
            <option value="INACTIVE">Inativa</option>
          </Select>
          <Select value={filters.planId} onChange={e => setFilters({ ...filters, planId: e.target.value })}>
            <option value="">Todos os planos</option>
            {plans.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Igrejas ({filtered.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-400">Falha ao comunicar com o backend.</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Nenhuma igreja encontrada" description="Ajuste os filtros ou cadastre uma nova igreja." />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr><Th>Nome</Th><Th>CNPJ</Th><Th>Cidade/UF</Th><Th>Status</Th><Th>Ações</Th></tr>
                </Thead>
                <tbody>
                  {pageItems.map(c => (
                    <Tr key={c.id}>
                      <Td className="font-semibold flex items-center gap-2">
                        {resolveLogoUrl(c.logoUrl) && <img src={resolveLogoUrl(c.logoUrl)} alt="" className="h-7 w-7 rounded object-cover" />}
                        {c.name}
                      </Td>
                      <Td className="text-brand-500">{c.cnpj || '—'}</Td>
                      <Td className="text-brand-500">{[c.city, c.state].filter(Boolean).join('/') || '—'}</Td>
                      <Td><Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>{c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}</Badge></Td>
                      <Td>
                        <div className="flex gap-1">
                          <button onClick={() => navigate(`/admin-externa/igrejas/${c.id}`)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Ver detalhes"><Eye className="h-3.5 w-3.5" /></button>
                          <button onClick={() => navigate(`/admin-externa/congregacoes?churchId=${c.id}`)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Congregações"><MapPinIcon className="h-3.5 w-3.5" /></button>
                          <button onClick={() => navigate(`/admin-externa/usuarios?churchId=${c.id}`)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Usuários"><Users className="h-3.5 w-3.5" /></button>
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => toggleStatus(c)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title={c.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}><Power className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(c)} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <div className="pt-4 flex justify-end">
                <Pagination page={page} total={totalPages} onChange={setPage} />
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Modal criar/editar */}
      <Modal open={open} onClose={() => { setOpen(false); setLogoFile(null); setLogoPreview(null) }}
        title={editing ? `Editar: ${editing.name}` : 'Nova Igreja'}
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Igreja'}</Button>
        </>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome da Igreja" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

          <div className="flex gap-2">
            <div className="flex-1">
              <Input label="CNPJ" value={form.cnpj}
                onChange={e => {
                  const value = e.target.value
                  setForm({ ...form, cnpj: value })
                  if (value.replace(/\D/g, '').length === 14) handleCnpjSearch(value)
                }} placeholder="00.000.000/0001-00" />
            </div>
            <Button type="button" variant="outline" className="mt-6"
              onClick={() => form.cnpj && handleCnpjSearch(form.cnpj)}
              disabled={!form.cnpj || form.cnpj.replace(/\D/g, '').length !== 14}>Buscar CNPJ</Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="UF" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} />
          </div>

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
              disabled={!form.zipCode || form.zipCode.replace(/\D/g, '').length !== 8}>Buscar CEP</Button>
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

          {!editing && (
            <>
              <div className="border-t border-brand-100 pt-4">
                <p className="text-sm font-bold text-brand-900 mb-3">Plano de Assinatura</p>
                <Select label="Plano" value={form.planId} onChange={e => setForm({ ...form, planId: e.target.value })} required>
                  <option value="">Selecione um plano...</option>
                  {plans.filter(p => p.active !== false).map(p => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} — R$ {p.price?.toFixed(2)}/mês · {p.maxUsers} usuários · {p.maxCongregations} congregações
                    </option>
                  ))}
                </Select>
              </div>

              <div className="border-t border-brand-100 pt-4">
                <p className="text-sm font-bold text-brand-900 mb-1">Usuário Administrador da Igreja</p>
                <p className="text-xs text-brand-400 mb-3">Este usuário terá acesso administrativo somente a esta Igreja.</p>
                <div className="space-y-3">
                  <Input label="Nome do Administrador" value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} required />
                  <Input label="E-mail do Administrador" type="email" value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} required />
                  <Input label="Senha inicial" type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} placeholder="Mínimo 8 caracteres" required />
                </div>
              </div>
            </>
          )}

          <div className="border-t border-brand-100 pt-4">
            <p className="text-sm font-semibold text-brand-900 mb-2 flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Logo da Igreja</p>
            {logoPreview ? (
              <div className="flex items-center gap-3">
                <img src={logoPreview} alt="Logo" className="h-20 w-20 rounded-xl object-cover border border-brand-100" />
                <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(editing ? resolveLogoUrl(editing.logoUrl) || null : null) }}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"><X className="h-3.5 w-3.5" /> Remover</button>
              </div>
            ) : (
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-brand-200 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
                <Upload className="h-5 w-5 text-brand-300" />
                <div>
                  <p className="text-sm font-medium text-brand-700">Clique para selecionar a logo</p>
                  <p className="text-xs text-brand-300">PNG, JPG ou SVG. Máx. 5MB.</p>
                </div>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden"
                  onChange={e => handleLogoChange(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>
        </form>
      </Modal>

      <CredentialsModal open={!!credentials} onClose={() => setCredentials(null)} credentials={credentials} />
    </AdminExternaLayout>
  )
}
