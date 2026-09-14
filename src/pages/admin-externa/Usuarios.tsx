// src/pages/admin-externa/Usuarios.tsx
//
// Módulo de Usuários da Administração Externa. Exige a seleção de uma
// Igreja para listar, criar, editar, desativar, redefinir senha e excluir
// usuários daquela igreja (e, opcionalmente, de uma congregação específica).
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Edit2, UserX, UserCheck, KeyRound, Trash2 } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { CredentialsModal } from '@/components/admin-externa/CredentialsModal'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/Misc'
import { useToast } from '@/components/ui/Extras'
import { useAdminExterna } from '@/lib/AdminExternaContext'
import { usersService, type User } from '@/services/users.service'
import { congregationsService, type Congregation } from '@/services/congregations.service'
import { http } from '@/lib/http'

const ROLE_TONE: Record<string, any> = {
  ROOT: 'yellow', ADMIN: 'green', PASTOR_PRINCIPAL: 'purple',
  PASTOR_CONGREGACAO: 'blue', TESOUREIRO: 'orange', SECRETARIO: 'blue', USUARIO: 'gray',
}

export default function Usuarios() {
  const showToast = useToast()
  const { churches, scopeChurchId, setScope } = useAdminExterna()
  const [searchParams] = useSearchParams()

  const [churchId, setChurchId] = useState<string | null>(searchParams.get('churchId') || scopeChurchId)
  const [users, setUsers] = useState<User[]>([])
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState<{ name: string; email: string; password: string } | null>(null)

  const [form, setForm] = useState({ name: '', email: '', password: '', roleName: '', congregationId: '' })

  useEffect(() => {
    const cid = searchParams.get('churchId')
    if (cid && cid !== churchId) { setChurchId(cid); setScope(cid) }
  }, [searchParams])

  useEffect(() => {
    if (churchId) loadAll(churchId)
    else { setUsers([]); setCongregations([]) }
  }, [churchId])

  async function loadAll(cid: string) {
    setLoading(true)
    try {
      const [uRes, congs, rolesRes] = await Promise.all([
        usersService.list({ size: 200, churchId: cid }),
        congregationsService.listByChurch(Number(cid)),
        http.get<any>('/roles/available').catch(() => null),
      ])
      setUsers((uRes as any)?.data || [])
      setCongregations(Array.isArray(congs) ? congs : [])
      const rolesRaw = rolesRes?.data
      setRoles(rolesRaw?.data || rolesRaw || [])
    } catch { showToast('Falha ao carregar usuários.') }
    finally { setLoading(false) }
  }

  function selectChurch(id: string) {
    setChurchId(id || null)
    setScope(id || null)
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', email: '', password: '', roleName: '', congregationId: '' })
    setOpen(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', roleName: u.roles?.[0] || '', congregationId: '' })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!churchId) return
    if (!form.name) { showToast('Nome é obrigatório.'); return }

    setSaving(true)
    try {
      if (editing) {
        await usersService.update(editing.id, { name: form.name, ...(form.roleName ? { roleName: form.roleName } as any : {}) })
        showToast('Usuário atualizado.')
        setOpen(false)
      } else {
        if (!form.email || !form.password) { showToast('E-mail e senha são obrigatórios.'); setSaving(false); return }
        await usersService.create({
          name: form.name, email: form.email, password: form.password, active: true,
          ...( { roleName: form.roleName || undefined, churchId: Number(churchId),
            congregationId: form.congregationId ? Number(form.congregationId) : undefined } as any),
        })
        setOpen(false)
        setCredentials({ name: form.name, email: form.email, password: form.password })
      }
      loadAll(churchId)
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar usuário.')
    } finally { setSaving(false) }
  }

  async function toggleActive(u: User) {
    try {
      if (u.active) { await usersService.disable(u.id); showToast(`${u.name} desativado.`) }
      else { await usersService.enable(u.id); showToast(`${u.name} ativado.`) }
      if (churchId) loadAll(churchId)
    } catch { showToast('Falha ao alterar status.') }
  }

  async function handleReset(u: User) {
    if (!confirm(`Redefinir a senha de "${u.name}"?`)) return
    try {
      const res = await usersService.resetPassword(u.id)
      if (res?.password) {
        setCredentials({ name: u.name, email: u.email, password: res.password })
      } else {
        showToast('Senha redefinida. O usuário receberá instruções por e-mail.')
      }
    } catch { showToast('Falha ao redefinir senha.') }
  }

  async function handleDelete(u: User) {
    if (!confirm(`Excluir (logicamente) o usuário "${u.name}"?`)) return
    try {
      await usersService.remove(u.id)
      showToast(`${u.name} excluído.`)
      if (churchId) loadAll(churchId)
    } catch { showToast('Falha ao excluir usuário.') }
  }

  return (
    <AdminExternaLayout
      crumbs={[{ label: 'Usuários' }]}
      title="Usuários"
      action={churchId ? <Button onClick={openNew}><Plus className="h-4 w-4" /> Novo Usuário</Button> : undefined}
    >
      <Card className="mb-4 p-4">
        <Select label="Igreja" value={churchId ?? ''} onChange={e => selectChurch(e.target.value)}>
          <option value="">— Selecione uma Igreja —</option>
          {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </Select>
      </Card>

      {!churchId ? (
        <EmptyState title="Selecione uma Igreja" description="Escolha uma igreja acima para visualizar e gerenciar seus usuários." />
      ) : (
        <Card>
          <CardHeader><CardTitle>Usuários ({users.length})</CardTitle></CardHeader>
          <CardBody className="pt-2">
            {loading ? (
              <div className="py-8 text-center text-brand-300">Carregando...</div>
            ) : users.length === 0 ? (
              <EmptyState title="Nenhum usuário" description="Cadastre o primeiro usuário desta igreja." />
            ) : (
              <Table>
                <Thead>
                  <tr><Th>Nome</Th><Th>E-mail</Th><Th>Perfil</Th><Th>Último acesso</Th><Th>Status</Th><Th>Ações</Th></tr>
                </Thead>
                <tbody>
                  {users.map(u => (
                    <Tr key={u.id}>
                      <Td className="font-semibold">{u.name}</Td>
                      <Td className="text-brand-500">{u.email}</Td>
                      <Td><div className="flex flex-wrap gap-1">{(u.roles || []).map(r => <Badge key={r} tone={ROLE_TONE[r] || 'gray'}>{r}</Badge>)}</div></Td>
                      <Td className="text-brand-500">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('pt-BR') : '—'}</Td>
                      <Td><Badge tone={u.active ? 'green' : 'gray'}>{u.active ? 'Ativo' : 'Inativo'}</Badge></Td>
                      <Td>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Editar"><Edit2 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleReset(u)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Redefinir senha"><KeyRound className="h-3.5 w-3.5" /></button>
                          <button onClick={() => toggleActive(u)} className={`p-1.5 rounded ${u.active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500'}`} title={u.active ? 'Desativar' : 'Ativar'}>
                            {u.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => handleDelete(u)} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Editar: ${editing.name}` : 'Novo Usuário'}
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Usuário'}</Button>
        </>}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome Completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="E-mail" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required={!editing} disabled={!!editing} />
          {!editing && (
            <Input label="Senha inicial" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          )}
          <div>
            <label className="block text-sm font-semibold text-brand-900 mb-1.5">Perfil de Acesso</label>
            <input list="roles-list-externa" value={form.roleName} onChange={e => setForm({ ...form, roleName: e.target.value })}
              placeholder="Digite ou selecione um perfil..."
              className="w-full rounded-lg border border-brand-100 bg-white px-3.5 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            <datalist id="roles-list-externa">{roles.map(r => <option key={r.id} value={r.name} />)}</datalist>
          </div>
          {!editing && congregations.length > 0 && (
            <Select label="Vincular a Congregação (opcional)" value={form.congregationId} onChange={e => setForm({ ...form, congregationId: e.target.value })}>
              <option value="">Acesso à Igreja toda</option>
              {congregations.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>
          )}
        </form>
      </Modal>

      <CredentialsModal open={!!credentials} onClose={() => setCredentials(null)} credentials={credentials} title="Credenciais do usuário" />
    </AdminExternaLayout>
  )
}
