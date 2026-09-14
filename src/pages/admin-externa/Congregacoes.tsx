// src/pages/admin-externa/Congregacoes.tsx
//
// Módulo de Congregações da Administração Externa. Exige a seleção de uma
// Igreja (via seletor local ou seletor global do cabeçalho) para listar,
// criar, editar e desativar congregações daquela igreja.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Edit2, Power, MapPin, AlertTriangle } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/Misc'
import { useToast } from '@/components/ui/Extras'
import { useAdminExterna } from '@/lib/AdminExternaContext'
import { congregationsService, type Congregation } from '@/services/congregations.service'
import { usersService } from '@/services/users.service'
import { http } from '@/lib/http'

export default function Congregacoes() {
  const showToast = useToast()
  const { churches, scopeChurchId, setScope } = useAdminExterna()
  const [searchParams] = useSearchParams()

  const initialChurchId = searchParams.get('churchId') || scopeChurchId
  const [churchId, setChurchId] = useState<string | null>(initialChurchId)

  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [pastors, setPastors] = useState<{ id: number; name: string }[]>([])
  const [planLimit, setPlanLimit] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Congregation | null>(null)
  const [saving, setSaving] = useState(false)
  const [pastorMode, setPastorMode] = useState<'existing' | 'new'>('existing')

  const [form, setForm] = useState({
    name: '', city: '', state: '', address: '', status: 'ACTIVE',
    pastorId: '', newPastorName: '', newPastorEmail: '', newPastorPassword: '',
  })

  useEffect(() => {
    const cid = searchParams.get('churchId')
    if (cid && cid !== churchId) { setChurchId(cid); setScope(cid) }
  }, [searchParams])

  useEffect(() => {
    if (churchId) loadAll(churchId)
    else { setCongregations([]); setPastors([]) }
  }, [churchId])

  async function loadAll(cid: string) {
    setLoading(true)
    try {
      const [congs, pastorsRes, plansRes] = await Promise.all([
        congregationsService.listByChurch(Number(cid)),
        usersService.list({ size: 200, churchId: cid }).catch(() => ({ data: [] })),
        http.get<any>('/plans').catch(() => null),
      ])
      setCongregations(Array.isArray(congs) ? congs : [])
      const usersList: any[] = (pastorsRes as any)?.data || []
      setPastors(usersList
        .filter(u => (u.roles || []).some((r: string) => r.toUpperCase().includes('PASTOR')))
        .map(u => ({ id: u.id, name: u.name })))
      // Limite do plano — melhor esforço (nem todo backend expõe planId na igreja/plans)
      setPlanLimit(null)
      void plansRes
    } catch { showToast('Falha ao carregar congregações.') }
    finally { setLoading(false) }
  }

  function selectChurch(id: string) {
    setChurchId(id || null)
    setScope(id || null)
  }

  function openNew() {
    setEditing(null)
    setPastorMode('existing')
    setForm({ name: '', city: '', state: '', address: '', status: 'ACTIVE', pastorId: '', newPastorName: '', newPastorEmail: '', newPastorPassword: '' })
    setOpen(true)
  }

  function openEdit(c: Congregation) {
    setEditing(c)
    setPastorMode('existing')
    setForm({ name: c.name, city: c.city || '', state: c.state || '', address: c.address || '',
      status: c.status, pastorId: c.pastorId ? String(c.pastorId) : '', newPastorName: '', newPastorEmail: '', newPastorPassword: '' })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!churchId) return
    if (!form.name) { showToast('Nome é obrigatório.'); return }

    if (!editing && planLimit !== null && congregations.length >= planLimit) {
      showToast(`Limite de ${planLimit} congregações do plano atingido.`); return
    }

    setSaving(true)
    try {
      let pastorId: number | undefined = form.pastorId ? Number(form.pastorId) : undefined

      if (pastorMode === 'new' && form.newPastorName && form.newPastorEmail && form.newPastorPassword) {
        const created = await usersService.create({
          name: form.newPastorName, email: form.newPastorEmail, password: form.newPastorPassword,
          active: true, ...( { churchId: Number(churchId), roleName: 'PASTOR_CONGREGACAO' } as any),
        })
        pastorId = created.id
      }

      if (editing) {
        await congregationsService.update(editing.id, {
          name: form.name, city: form.city, state: form.state, address: form.address,
          status: form.status as any, pastorId: pastorId ?? null,
        })
        showToast('Congregação atualizada.')
      } else {
        await congregationsService.create({
          name: form.name, city: form.city, state: form.state, address: form.address,
          status: form.status as any, pastorId: pastorId ?? null, churchId: Number(churchId),
        })
        showToast('Congregação criada.')
      }
      setOpen(false)
      loadAll(churchId)
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar congregação.')
    } finally { setSaving(false) }
  }

  async function toggleStatus(c: Congregation) {
    const next = c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    if (!confirm(`${next === 'ACTIVE' ? 'Ativar' : 'Desativar'} "${c.name}"?`)) return
    try {
      await congregationsService.update(c.id, { status: next as any })
      showToast(`${c.name} ${next === 'ACTIVE' ? 'ativada' : 'desativada'}.`)
      if (churchId) loadAll(churchId)
    } catch { showToast('Falha ao alterar status.') }
  }

  return (
    <AdminExternaLayout
      crumbs={[{ label: 'Congregações' }]}
      title="Congregações"
      action={churchId ? <Button onClick={openNew}><Plus className="h-4 w-4" /> Nova Congregação</Button> : undefined}
    >
      <Card className="mb-4 p-4">
        <Select label="Igreja" value={churchId ?? ''} onChange={e => selectChurch(e.target.value)}>
          <option value="">— Selecione uma Igreja —</option>
          {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </Select>
      </Card>

      {!churchId ? (
        <EmptyState title="Selecione uma Igreja" description="Escolha uma igreja acima para visualizar e gerenciar suas congregações." />
      ) : (
        <Card>
          <CardHeader><CardTitle>Congregações ({congregations.length})</CardTitle></CardHeader>
          <CardBody className="pt-2">
            {loading ? (
              <div className="py-8 text-center text-brand-300">Carregando...</div>
            ) : congregations.length === 0 ? (
              <EmptyState title="Nenhuma congregação" description="Cadastre a primeira congregação desta igreja." />
            ) : (
              <Table>
                <Thead>
                  <tr><Th>Nome</Th><Th>Cidade/UF</Th><Th>Pastor</Th><Th>Membros</Th><Th>Status</Th><Th>Ações</Th></tr>
                </Thead>
                <tbody>
                  {congregations.map(c => (
                    <Tr key={c.id}>
                      <Td className="font-semibold flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand-300" /> {c.name}</Td>
                      <Td className="text-brand-500">{[c.city, c.state].filter(Boolean).join('/') || '—'}</Td>
                      <Td className="text-brand-500">{c.pastorName || '—'}</Td>
                      <Td className="text-brand-500">{c.members ?? '—'}</Td>
                      <Td><Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>{c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}</Badge></Td>
                      <Td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => toggleStatus(c)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Ativar/Desativar"><Power className="h-3.5 w-3.5" /></button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Editar: ${editing.name}` : 'Nova Congregação'}
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {planLimit !== null && !editing && congregations.length >= planLimit && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> Limite de congregações do plano atingido ({planLimit}).
            </div>
          )}
          <Input label="Nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="UF" maxLength={2} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
          </div>
          <Input label="Endereço" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Ativa</option>
            <option value="INACTIVE">Inativa</option>
          </Select>

          <div className="border-t border-brand-100 pt-4">
            <p className="text-sm font-bold text-brand-900 mb-2">Pastor Responsável</p>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setPastorMode('existing')}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border ${pastorMode === 'existing' ? 'bg-brand-800 text-white border-brand-800' : 'border-brand-100 text-brand-500'}`}>
                Pastor Existente
              </button>
              <button type="button" onClick={() => setPastorMode('new')}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border ${pastorMode === 'new' ? 'bg-brand-800 text-white border-brand-800' : 'border-brand-100 text-brand-500'}`}>
                Novo Pastor
              </button>
            </div>
            {pastorMode === 'existing' ? (
              <Select value={form.pastorId} onChange={e => setForm({ ...form, pastorId: e.target.value })}>
                <option value="">Sem pastor vinculado</option>
                {pastors.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </Select>
            ) : (
              <div className="space-y-3">
                <Input label="Nome do Pastor" value={form.newPastorName} onChange={e => setForm({ ...form, newPastorName: e.target.value })} />
                <Input label="E-mail" type="email" value={form.newPastorEmail} onChange={e => setForm({ ...form, newPastorEmail: e.target.value })} />
                <Input label="Senha inicial" type="password" value={form.newPastorPassword} onChange={e => setForm({ ...form, newPastorPassword: e.target.value })} />
              </div>
            )}
          </div>
        </form>
      </Modal>
    </AdminExternaLayout>
  )
}
