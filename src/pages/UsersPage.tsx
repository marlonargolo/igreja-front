import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, UserX, UserCheck, ShieldCheck, Loader2, Check } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { usersService } from '@/services'
import { churchesService, type Church } from '@/services/churches.service'
import { http } from '@/lib/http'
import { cn } from '@/lib/format'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ApiRole { id: number; name: string; description?: string }
interface ApiUser {
  id: number; name: string; email: string
  active: boolean; roles: string[]; permissions: string[]
}
interface PermissionItem {
  id: number; name: string; description?: string; category: string
}
interface Congregation { id: number; name: string; churchId?: number }

// Cores dos badges — apenas visual
const ROLE_TONE: Record<string, any> = {
  ROOT: 'yellow', ADMIN: 'green', PASTOR_PRINCIPAL: 'purple',
  PASTOR_CONGREGACAO: 'blue', TESOUREIRO: 'orange', SECRETARIO: 'blue', USUARIO: 'gray',
}

// ── Mapeamento de módulos do sistema para categorias de permissão ─────────────
// Cada módulo exibe as permissões cujo campo `category` do banco está listado.
// Os nomes e a ordem determinam como aparecem na UI.
const MODULES = [
  {
    key: 'dashboard',
    label: '📊 Dashboard',
    description: 'Acesso ao painel principal e resumos',
    categories: ['REPORTS'],
    // Dentro de REPORTS, apenas REPORT_VIEW faz sentido para Dashboard
    filter: (name: string) => name === 'REPORT_VIEW',
  },
  {
    key: 'secretaria',
    label: '👥 Secretaria',
    description: 'Gestão de membros e transferências',
    categories: ['MEMBERS'],
    filter: () => true,
  },
  {
    key: 'tesouraria',
    label: '💰 Tesouraria',
    description: 'Transações financeiras e relatórios',
    categories: ['FINANCE'],
    filter: () => true,
  },
  {
    key: 'patrimonio',
    label: '🏛️ Patrimônio',
    description: 'Bens e movimentações patrimoniais',
    categories: ['ASSETS'],
    filter: () => true,
  },
  {
    key: 'contabilidade',
    label: '📒 Contabilidade',
    description: 'Lançamentos e demonstrações contábeis',
    categories: ['ACCOUNTING'],
    filter: (name: string) => name !== 'ACCOUNTING_ADMIN',
  },
  {
    key: 'relatorios',
    label: '📈 Relatórios',
    description: 'Geração e exportação de relatórios',
    categories: ['REPORTS'],
    filter: (name: string) => name !== 'REPORT_VIEW', // REPORT_VIEW já está em Dashboard
  },
  {
    key: 'configuracoes',
    label: '⚙️ Configurações',
    description: 'Usuários, congregações e configurações',
    categories: ['USERS', 'SETTINGS'],
    filter: () => true,
  },
  {
    key: 'suporte',
    label: '🎧 Suporte',
    description: 'Chamados de suporte técnico',
    categories: ['SUPPORT'],
    filter: () => true,
  },
] as const

// ─── Componente ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  const showToast = useToast()
  const { user: currentUser, church: currentChurch, isRoot, hasPermission } = useApp()

  const canCreate     = isRoot || hasPermission('USER_CREATE')
  const canEdit       = isRoot || hasPermission('USER_UPDATE')
  const canManagePerms = isRoot || hasPermission('USER_ROLE_MANAGE')

  const [users, setUsers]             = useState<ApiUser[]>([])
  const [availableRoles, setAvailableRoles] = useState<ApiRole[]>([])
  const [allChurches, setAllChurches] = useState<Church[]>([])
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [loading, setLoading]         = useState(true)

  // Modal criar/editar
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<ApiUser | null>(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({
    name: '', email: '', password: '', newPassword: '',
    roleName: '', churchId: '', congregationId: '',
  })

  // Modal permissões
  const [permOpen, setPermOpen]           = useState(false)
  const [permUser, setPermUser]           = useState<ApiUser | null>(null)
  const [availPerms, setAvailPerms]       = useState<PermissionItem[]>([])
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())
  const [permLoading, setPermLoading]     = useState(false)
  const [permSaving, setPermSaving]       = useState(false)

  // ── Carga ──────────────────────────────────────────────────────────────────

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [uRes, rolesRes] = await Promise.all([
        usersService.list({ size: 200 }),
        http.get<any>('/roles/available'),
      ])
      const raw = uRes as any
      setUsers(raw?.data || raw?.content || [])
      const rolesRaw = rolesRes?.data
      setAvailableRoles(rolesRaw?.data || rolesRaw || [])

      if (isRoot) {
        const churches = await churchesService.list()
        setAllChurches(Array.isArray(churches) ? churches : [])
      }
      if (currentChurch?.id) await loadCongregations(Number(currentChurch.id))
    } catch { showToast('Falha ao carregar dados.') }
    finally { setLoading(false) }
  }

  async function loadCongregations(churchId: number) {
    try {
      const res = await http.get<any>('/congregations', { churchId, page: 0, size: 200 })
      const raw = res?.data
      const list = raw?.data?.data || raw?.data || raw?.content || []
      setCongregations(Array.isArray(list) ? list : [])
    } catch { setCongregations([]) }
  }

  // ── Modal criar/editar ──────────────────────────────────────────────────────

  function openNew() {
    setEditing(null)
    setForm({
      name: '', email: '', password: '', newPassword: '',
      roleName: availableRoles[availableRoles.length - 1]?.name || '',
      churchId: '', congregationId: '',
    })
    setOpen(true)
  }

  function openEdit(u: ApiUser) {
    setEditing(u)
    setForm({
      name: u.name, email: u.email, password: '', newPassword: '',
      roleName: u.roles?.[0] || '',
      churchId: '', congregationId: '',
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      if (editing) {
        await usersService.update(editing.id, {
          name: form.name,
          ...(form.roleName ? { roleName: form.roleName } : {}),
        } as any)
        if (form.newPassword?.length >= 6) {
          try { await usersService.changePassword(form.password, form.newPassword) }
          catch { showToast('Dados salvos, mas falha ao trocar a senha.') }
        }
        showToast('Usuário atualizado.')
      } else {
        if (!form.email || !form.password) {
          showToast('E-mail e senha são obrigatórios.'); setSaving(false); return
        }
        const payload: any = {
          name: form.name, email: form.email,
          password: form.password, active: true,
          roleName: form.roleName || undefined,
        }
        if (isRoot && form.churchId)       payload.churchId       = Number(form.churchId)
        if (form.congregationId)           payload.congregationId = Number(form.congregationId)
        await usersService.create(payload)
        showToast('Usuário criado.')
      }
      setOpen(false)
      loadAll()
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Falha ao salvar.')
    } finally { setSaving(false) }
  }

  // ── Modal permissões ────────────────────────────────────────────────────────

  async function openPermissions(u: ApiUser) {
    setPermUser(u)
    setPermOpen(true)
    setPermLoading(true)
    try {
      const [availRes, currentRes] = await Promise.all([
        http.get<any>('/users/permissions/available'),
        http.get<any>(`/users/${u.id}/permissions`),
      ])
      const availRaw = availRes?.data
      setAvailPerms(availRaw?.data || availRaw || [])
      const currentRaw = currentRes?.data
      const current: string[] = currentRaw?.data || currentRaw || []
      setSelectedPerms(new Set(current))
    } catch { showToast('Falha ao carregar permissões.') }
    finally { setPermLoading(false) }
  }

  function togglePerm(name: string) {
    setSelectedPerms(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function toggleModule(permsInModule: string[]) {
    const allOn = permsInModule.every(n => selectedPerms.has(n))
    setSelectedPerms(prev => {
      const next = new Set(prev)
      if (allOn) permsInModule.forEach(n => next.delete(n))
      else permsInModule.forEach(n => next.add(n))
      return next
    })
  }

  async function savePermissions() {
    if (!permUser) return
    setPermSaving(true)
    try {
      await http.put(`/users/${permUser.id}/permissions`, Array.from(selectedPerms))
      showToast(`Permissões de ${permUser.name} salvas com sucesso.`)
      setPermOpen(false)
      loadAll()
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Falha ao salvar permissões.')
    } finally { setPermSaving(false) }
  }

  // Organizar permissões disponíveis por módulo
  const permsByModule = useMemo(() => {
    const result: Record<string, PermissionItem[]> = {}
    MODULES.forEach(mod => {
      result[mod.key] = availPerms.filter(p =>
        mod.categories.includes(p.category as any) && mod.filter(p.name)
      )
    })
    return result
  }, [availPerms])

  async function toggleActive(u: ApiUser) {
    try {
      if (u.active) { await usersService.disable(u.id); showToast(`${u.name} desativado.`) }
      else { await usersService.enable(u.id); showToast(`${u.name} ativado.`) }
      loadAll()
    } catch { showToast('Falha ao alterar status.') }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Layout
      crumbs={[{ label: 'Configurações' }, { label: 'Usuários' }]}
      title="Usuários"
      action={canCreate
        ? { label: 'Novo Usuário', icon: <Plus className="h-4 w-4" />, onClick: openNew }
        : undefined}
    >
      <Card>
        <CardHeader><CardTitle>Usuários ({users.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-brand-300">Nenhum usuário encontrado.</div>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Nome</Th><Th>E-mail</Th><Th>Perfil</Th><Th>Status</Th>
                  {(canEdit || canManagePerms) && <Th>Ações</Th>}
                </tr>
              </Thead>
              <tbody>
                {users.map(u => (
                  <Tr key={u.id}>
                    <Td className="font-semibold">{u.name}</Td>
                    <Td className="text-brand-500">{u.email}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {(u.roles || []).map(r => (
                          <Badge key={r} tone={ROLE_TONE[r] || 'gray'}>{r}</Badge>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={u.active ? 'green' : 'gray'}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Td>
                    {(canEdit || canManagePerms) && (
                      <Td>
                        <div className="flex gap-1">
                          {canEdit && (
                            <button onClick={() => openEdit(u)}
                              className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Editar">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canManagePerms && (
                            <button onClick={() => openPermissions(u)}
                              className="p-1.5 rounded hover:bg-purple-50 text-purple-400"
                              title="Gerenciar Permissões">
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => toggleActive(u)}
                            className={`p-1.5 rounded ${u.active
                              ? 'hover:bg-red-50 text-red-400'
                              : 'hover:bg-green-50 text-green-500'}`}>
                            {u.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
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

      {/* ── Modal criar/editar ── */}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editing ? `Editar: ${editing.name}` : 'Novo Usuário'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome Completo" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label="E-mail" type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required={!editing} disabled={!!editing} />
          {editing ? (
            <>
              <Input label="Senha Atual (deixe em branco para não alterar)" type="password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <Input label="Nova Senha" type="password" value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Mínimo 8 caracteres" />
            </>
          ) : (
            <Input label="Senha" type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          )}

          {/* Perfil: texto livre com sugestões dinâmicas */}
          <div>
            <label className="block text-sm font-semibold text-brand-900 mb-1.5">Perfil de Acesso</label>
            <input list="roles-list" value={form.roleName}
              onChange={e => setForm({ ...form, roleName: e.target.value })}
              placeholder="Digite ou selecione um perfil..."
              className="w-full rounded-lg border border-brand-100 bg-white px-3.5 py-2.5 text-sm text-brand-900 placeholder:text-brand-300 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
            <datalist id="roles-list">
              {availableRoles.map(r => <option key={r.id} value={r.name} />)}
            </datalist>
          </div>

          {/* ROOT: seleciona a Igreja */}
          {!editing && isRoot && (
            <Select label="Igreja *" value={form.churchId}
              onChange={async e => {
                const val = e.target.value
                setForm({ ...form, churchId: val, congregationId: '' })
                if (val) await loadCongregations(Number(val))
              }}>
              <option value="">Selecione uma Igreja...</option>
              {allChurches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>
          )}

          {/* Congregação opcional */}
          {!editing &&
           !currentUser?.roles?.includes('PASTOR_CONGREGACAO') &&
           congregations.length > 0 && (
            <Select label="Vincular a Congregação (opcional)"
              value={form.congregationId}
              onChange={e => setForm({ ...form, congregationId: e.target.value })}>
              <option value="">Acesso à Igreja toda</option>
              {congregations
                .filter(c => !form.churchId || String(c.churchId) === form.churchId)
                .map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>
          )}

          {!editing && (
            <p className="text-xs text-brand-400 bg-brand-50 rounded-lg px-3 py-2">
              {isRoot ? 'Selecione a Igreja de destino. Congregação é opcional.'
                : currentUser?.roles?.includes('PASTOR_CONGREGACAO')
                ? 'O usuário será vinculado à sua congregação automaticamente.'
                : 'O usuário será vinculado à sua Igreja automaticamente.'}
            </p>
          )}
        </form>
      </Modal>

      {/* ── Modal permissões por módulo ── */}
      <Modal open={permOpen} onClose={() => setPermOpen(false)} size="lg"
        title={`Permissões — ${permUser?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPermOpen(false)}>Cancelar</Button>
            <Button onClick={savePermissions} disabled={permSaving}>
              {permSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                : <><ShieldCheck className="h-4 w-4" /> Salvar Permissões</>}
            </Button>
          </>
        }
      >
        {permLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-brand-300" />
          </div>
        ) : (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <p className="text-xs text-brand-400 mb-4">
              Permissões individuais são adicionadas ao perfil do usuário.
              Marque o que este usuário pode acessar em cada módulo.
            </p>

            {MODULES.map(mod => {
              const perms = permsByModule[mod.key] || []
              if (perms.length === 0) return null

              const names = perms.map(p => p.name)
              const allOn  = names.every(n => selectedPerms.has(n))
              const someOn = names.some(n => selectedPerms.has(n))

              return (
                <div key={mod.key}
                  className={cn(
                    'border rounded-xl overflow-hidden transition-colors',
                    allOn ? 'border-brand-800' : someOn ? 'border-brand-300' : 'border-brand-100'
                  )}>
                  {/* Cabeçalho do módulo */}
                  <button type="button" onClick={() => toggleModule(names)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-brand-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center text-base shrink-0',
                        allOn ? 'bg-brand-800 text-white' : 'bg-brand-100 text-brand-500'
                      )}>
                        {mod.label.split(' ')[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-brand-900">
                          {mod.label.split(' ').slice(1).join(' ')}
                        </p>
                        <p className="text-xs text-brand-400">{mod.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-brand-300">
                        {names.filter(n => selectedPerms.has(n)).length}/{names.length}
                      </span>
                      <div className={cn(
                        'h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                        allOn  ? 'bg-brand-800 border-brand-800' :
                        someOn ? 'bg-brand-200 border-brand-400' :
                                 'bg-white border-brand-200'
                      )}>
                        {(allOn || someOn) && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                  </button>

                  {/* Permissões individuais do módulo */}
                  <div className="px-4 pb-3 pt-1 grid sm:grid-cols-2 gap-1 border-t border-brand-100 bg-brand-50/30">
                    {perms.map(perm => (
                      <label key={perm.name}
                        className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-brand-50 group">
                        <div onClick={() => togglePerm(perm.name)}
                          className={cn(
                            'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                            selectedPerms.has(perm.name)
                              ? 'bg-brand-800 border-brand-800'
                              : 'bg-white border-brand-200'
                          )}>
                          {selectedPerms.has(perm.name) && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                        <div onClick={() => togglePerm(perm.name)} className="cursor-pointer">
                          <p className={cn(
                            'text-sm leading-tight',
                            selectedPerms.has(perm.name)
                              ? 'text-brand-900 font-medium'
                              : 'text-brand-500'
                          )}>
                            {perm.description || perm.name}
                          </p>
                          <p className="text-[10px] text-brand-300 font-mono">{perm.name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Modal>
    </Layout>
  )
}