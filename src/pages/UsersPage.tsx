import { useState, useEffect, useMemo } from 'react'
import { Plus, Edit2, UserX, UserCheck, ShieldCheck, Loader2, Check, Building2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Switch } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { usersService } from '@/services'
import { http } from '@/lib/http'
import { cn } from '@/lib/format'

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  const { church: currentChurch, isRoot, hasPermission } = useApp()

  const canCreate     = isRoot || hasPermission('USER_CREATE')
  const canEdit       = isRoot || hasPermission('USER_UPDATE')
  const canManagePerms = isRoot || hasPermission('USER_ROLE_MANAGE')
  const canManageCongAccess = isRoot || hasPermission('USER_CHURCH_TRANSFER')

  const [users, setUsers]             = useState<ApiUser[]>([])
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [loading, setLoading]         = useState(true)

  // Modal criar/editar
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<ApiUser | null>(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({ name: '', email: '', password: '', newPassword: '' })

  // Modal permissões
  const [permOpen, setPermOpen]           = useState(false)
  const [permUser, setPermUser]           = useState<ApiUser | null>(null)
  const [availPerms, setAvailPerms]       = useState<PermissionItem[]>([])
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())
  const [permLoading, setPermLoading]     = useState(false)
  const [permSaving, setPermSaving]       = useState(false)

  // Modal congregações vinculadas + acesso à Igreja principal (sede)
  const [congOpen, setCongOpen]                 = useState(false)
  const [congModalUser, setCongModalUser]       = useState<ApiUser | null>(null)
  const [selectedCongIds, setSelectedCongIds]   = useState<Set<number>>(new Set())
  const [accessMainChurch, setAccessMainChurch] = useState(true)
  const [congModalLoading, setCongModalLoading] = useState(false)
  const [congModalSaving, setCongModalSaving]   = useState(false)

  // ── Carga ──────────────────────────────────────────────────────────────────

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const uRes = await usersService.list({ size: 200 })
      const raw = uRes as any
      setUsers(raw?.data || raw?.content || [])

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
    setForm({ name: '', email: '', password: '', newPassword: '' })
    setOpen(true)
  }

  function openEdit(u: ApiUser) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', newPassword: '' })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      if (editing) {
        await usersService.update(editing.id, { name: form.name })
        if (form.newPassword?.length >= 8) {
          try { await usersService.resetPassword(editing.id, form.newPassword) }
          catch { showToast('Dados salvos, mas falha ao trocar a senha.') }
        }
        showToast('Usuário atualizado.')
      } else {
        if (!form.email || !form.password) {
          showToast('E-mail e senha são obrigatórios.'); setSaving(false); return
        }
        // Perfil de acesso e vínculo com Igreja/Congregação não entram mais
        // no cadastro — são configurados depois via "Permissões" e
        // "Congregações" na listagem, com o usuário já criado.
        await usersService.create({
          name: form.name, email: form.email, password: form.password, active: true,
        })
        showToast('Usuário criado. Configure as permissões e o acesso a unidades na listagem.')
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

  // ── Modal congregações vinculadas ───────────────────────────────────────────

  async function openCongregations(u: ApiUser) {
    setCongModalUser(u)
    setCongOpen(true)
    setCongModalLoading(true)
    try {
      const [congRes, mainChurchRes] = await Promise.all([
        http.get<any>(`/users/${u.id}/congregations`),
        usersService.getAccessMainChurch(u.id),
      ])
      const raw = congRes?.data
      const list: any[] = raw?.data || raw || []
      setSelectedCongIds(new Set(list.map((c: any) => Number(c.id))))
      setAccessMainChurch((mainChurchRes as any)?.accessMainChurch ?? true)
    } catch { showToast('Falha ao carregar congregações vinculadas.') }
    finally { setCongModalLoading(false) }
  }

  function toggleCongregation(id: number) {
    setSelectedCongIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function saveCongregations() {
    if (!congModalUser) return
    setCongModalSaving(true)
    try {
      await Promise.all([
        http.put(`/users/${congModalUser.id}/congregations`, Array.from(selectedCongIds)),
        usersService.setAccessMainChurch(congModalUser.id, accessMainChurch),
      ])
      showToast(`Unidades de acesso de ${congModalUser.name} atualizadas.`)
      setCongOpen(false)
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Falha ao salvar.')
    } finally { setCongModalSaving(false) }
  }

  // Organizar permissões disponíveis por módulo
  const permsByModule = useMemo(() => {
    const result: Record<string, PermissionItem[]> = {}
    MODULES.forEach(mod => {
      result[mod.key] = availPerms.filter(p =>
        mod.categories.some(category => category === p.category) && mod.filter(p.name)
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
                  {(canEdit || canManagePerms || canManageCongAccess) && <Th>Ações</Th>}
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
                    {(canEdit || canManagePerms || canManageCongAccess) && (
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
                          {canManageCongAccess && (
                            <button onClick={() => openCongregations(u)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-400"
                              title="Unidades de acesso">
                              <Building2 className="h-3.5 w-3.5" />
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
            // Troca de senha pelo administrador: não exige a senha atual do
            // usuário editado (uso típico é redefinir a senha de alguém que
            // a esqueceu). Chama o reset administrativo, não o autoatendimento.
            <Input label="Nova Senha (deixe em branco para não alterar)" type="password"
              value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })}
              placeholder="Mínimo 8 caracteres" />
          ) : (
            <Input label="Senha" type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          )}

          {!editing && (
            <p className="text-xs text-brand-400 bg-brand-50 rounded-lg px-3 py-2">
              O usuário é criado sem perfil de acesso nem vínculo com Igreja/Congregação definidos aqui.
              Depois de criado, use as ações "Permissões" e "Congregações" na listagem para configurar
              o que ele pode acessar.
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

      {/* ── Modal unidades de acesso (Igreja principal + congregações) ── */}
      <Modal open={congOpen} onClose={() => setCongOpen(false)}
        title={`Unidades de acesso — ${congModalUser?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setCongOpen(false)}>Cancelar</Button>
            <Button onClick={saveCongregations} disabled={congModalSaving}>
              {congModalSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                : <><Building2 className="h-4 w-4" /> Salvar</>}
            </Button>
          </>
        }
      >
        {congModalLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-brand-300" />
          </div>
        ) : (
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-brand-400 mb-3">
              Marque as unidades que este usuário poderá acessar. O acesso à Igreja principal (sede) é
              opcional: desligue-o se ele deve ficar restrito só às congregações marcadas abaixo.
            </p>

            <div className="flex items-center justify-between rounded-lg border border-brand-100 px-3 py-2.5 mb-3">
              <div>
                <p className="text-sm font-medium text-brand-900">Igreja principal (sede)</p>
                <p className="text-xs text-brand-400">Acesso a todos os dados da Igreja, não só de uma congregação.</p>
              </div>
              <Switch checked={accessMainChurch} onChange={setAccessMainChurch} />
            </div>

            {congregations.length === 0 ? (
              <p className="text-sm text-brand-300 py-4 text-center">Nenhuma congregação cadastrada nesta Igreja.</p>
            ) : (
              congregations.map(c => (
                <label key={c.id}
                  className="flex items-center gap-2.5 cursor-pointer py-2 px-2 rounded-lg hover:bg-brand-50 group">
                  <div onClick={() => toggleCongregation(c.id)}
                    className={cn(
                      'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                      selectedCongIds.has(c.id)
                        ? 'bg-brand-800 border-brand-800'
                        : 'bg-white border-brand-200'
                    )}>
                    {selectedCongIds.has(c.id) && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span onClick={() => toggleCongregation(c.id)}
                    className={cn(
                      'text-sm cursor-pointer',
                      selectedCongIds.has(c.id) ? 'text-brand-900 font-medium' : 'text-brand-500'
                    )}>
                    {c.name}
                  </span>
                </label>
              ))
            )}
          </div>
        )}
      </Modal>
    </Layout>
  )
}