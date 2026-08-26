import { useState, useEffect } from 'react'
import { Plus, Edit2, UserX, UserCheck, ShieldCheck } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { usersService } from '@/services'
import { churchesService, type Church } from '@/services/churches.service'
import { http } from '@/lib/http'
import type { ApiSuccess } from '@/types/api'

// Mapa role nome → ID no banco
const ROLE_ID_MAP: Record<string, number> = {
  ADMIN: 2, PASTOR_PRINCIPAL: 3, PASTOR_CONGREGACAO: 4,
  TESOUREIRO: 5, SECRETARIO: 6, USUARIO: 7,
}

const ADMIN_ROLES = ['ROOT', 'ADMIN']
const CHURCH_ADMIN_ROLES = ['ROOT', 'ADMIN', 'PASTOR_PRINCIPAL']

const ROLE_PERMISSIONS_DISPLAY: Record<string, Record<string, string[]>> = {
  ADMIN: {
    configuracoes: ['Ver Congregações', 'Editar Congregações', 'Ver Usuários', 'Criar Usuários', 'Editar Usuários'],
    secretaria:    ['Ver Membros', 'Criar Membros', 'Editar Membros', 'Excluir Membros', 'Ver Relatórios', 'Gerenciar Transferências', 'Emitir Credenciais'],
    tesouraria:    ['Ver Receitas', 'Lançar Receitas', 'Editar Receitas', 'Ver Despesas', 'Lançar Despesas', 'Editar Despesas', 'Ver Transferências', 'Lançar Transferências', 'Ver Relatórios'],
    patrimonio:    ['Ver Bens', 'Cadastrar Bens', 'Editar Bens', 'Baixa de Bens', 'Ver Relatórios'],
    contabilidade: ['Ver Lançamentos', 'Confirmar Lançamentos', 'Fechar Período', 'Exportar Contábil', 'Ver Demonstrações'],
    administracao: ['Gerenciar Igrejas', 'Gerenciar Assinatura', 'Fazer Backup', 'Ver Integrações'],
  },
  PASTOR_PRINCIPAL: {
    configuracoes: ['Ver Congregações', 'Ver Usuários'],
    secretaria:    ['Ver Membros', 'Criar Membros', 'Editar Membros', 'Ver Relatórios', 'Gerenciar Transferências', 'Emitir Credenciais'],
    tesouraria:    ['Ver Receitas', 'Ver Despesas', 'Ver Relatórios'],
    patrimonio:    ['Ver Bens', 'Ver Relatórios'],
    contabilidade: ['Ver Lançamentos', 'Ver Demonstrações'],
    administracao: [],
  },
  TESOUREIRO: {
    configuracoes: [],
    secretaria:    [],
    tesouraria:    ['Ver Receitas', 'Lançar Receitas', 'Editar Receitas', 'Ver Despesas', 'Lançar Despesas', 'Editar Despesas', 'Ver Transferências', 'Lançar Transferências', 'Ver Relatórios'],
    patrimonio:    ['Ver Bens'],
    contabilidade: ['Ver Lançamentos', 'Confirmar Lançamentos', 'Exportar Contábil', 'Ver Demonstrações'],
    administracao: [],
  },
  SECRETARIO: {
    configuracoes: [],
    secretaria:    ['Ver Membros', 'Criar Membros', 'Editar Membros', 'Ver Relatórios', 'Emitir Credenciais'],
    tesouraria:    [],
    patrimonio:    [],
    contabilidade: [],
    administracao: [],
  },
  USUARIO: {
    configuracoes: [],
    secretaria:    ['Ver Membros'],
    tesouraria:    [],
    patrimonio:    [],
    contabilidade: [],
    administracao: [],
  },
}

const MODULOS = [
  { key: 'configuracoes', label: 'Configurações', perms: ['Ver Congregações','Editar Congregações','Ver Usuários','Criar Usuários','Editar Usuários'] },
  { key: 'secretaria', label: 'Secretaria', perms: ['Ver Membros','Criar Membros','Editar Membros','Excluir Membros','Ver Relatórios','Gerenciar Transferências','Emitir Credenciais'] },
  { key: 'tesouraria', label: 'Tesouraria', perms: ['Ver Receitas','Lançar Receitas','Editar Receitas','Ver Despesas','Lançar Despesas','Editar Despesas','Ver Transferências','Lançar Transferências','Ver Relatórios'] },
  { key: 'patrimonio', label: 'Patrimônio', perms: ['Ver Bens','Cadastrar Bens','Editar Bens','Baixa de Bens','Ver Relatórios'] },
  { key: 'contabilidade', label: 'Contabilidade', perms: ['Ver Lançamentos','Confirmar Lançamentos','Fechar Período','Exportar Contábil','Ver Demonstrações'] },
  { key: 'administracao', label: 'Administração', perms: ['Gerenciar Igrejas','Gerenciar Assinatura','Fazer Backup','Ver Integrações'] },
]

const roleTone: Record<string, any> = {
  ROOT: 'yellow', ADMIN: 'green', PASTOR_PRINCIPAL: 'purple',
  TESOUREIRO: 'orange', SECRETARIO: 'blue', USUARIO: 'gray',
}

interface Congregation { id: number; name: string; churchId: number }

export default function UsersPage() {
  const showToast = useToast()
  const { user: currentUser, church: currentChurch } = useApp()
  const [tab, setTab] = useState('Usuários')
  const [users, setUsers] = useState<any[]>([])
  const [allChurches, setAllChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)

  // Modal criar/editar
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', newPassword: '', role: 'USUARIO' })

  // Seleção de igrejas e congregações no modal
  const [selectedChurchIds, setSelectedChurchIds] = useState<number[]>([])
  const [congregationsByChurch, setCongregationsByChurch] = useState<Record<number, Congregation[]>>({})
  const [selectedCongregationIds, setSelectedCongregationIds] = useState<number[]>([])
  const [loadingCongs, setLoadingCongs] = useState(false)

  // Modal permissões
  const [permOpen, setPermOpen] = useState(false)
  const [permUser, setPermUser] = useState<any | null>(null)
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})

  const isRoot = currentUser?.roles?.includes('ROOT') ?? false
  const isAdmin = currentUser?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false
  const isChurchAdmin = currentUser?.roles?.some(r => CHURCH_ADMIN_ROLES.includes(r)) ?? false

  // Roles que o usuário atual pode criar (hierarquia)
  const availableRoles = isRoot
    ? ['ADMIN', 'PASTOR_PRINCIPAL', 'PASTOR_CONGREGACAO', 'TESOUREIRO', 'SECRETARIO', 'USUARIO']
    : isAdmin
    ? ['PASTOR_PRINCIPAL', 'PASTOR_CONGREGACAO', 'TESOUREIRO', 'SECRETARIO', 'USUARIO']
    : isChurchAdmin
    ? ['PASTOR_CONGREGACAO', 'TESOUREIRO', 'SECRETARIO', 'USUARIO']
    : ['USUARIO']

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [uRes, churches] = await Promise.all([
        usersService.list({ size: 100 }),
        churchesService.list(),
      ])
      const raw = uRes as any
      setUsers(raw?.data || raw?.content || [])
      // ROOT vê todas; admin de igreja vê só a sua
      setAllChurches(isRoot ? churches : churches.filter(c => String(c.id) === String(currentChurch?.id)))
    } catch {
      showToast('Falha ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  async function loadCongregationsForChurch(churchId: number) {
    if (congregationsByChurch[churchId]) return
    setLoadingCongs(true)
    try {
      const res = await http.get<ApiSuccess<any>>('/congregations', { churchId, page: 0, size: 100 })
      const raw = (res.data as any)
      const list: Congregation[] = raw?.data || raw?.content || raw || []
      setCongregationsByChurch(prev => ({ ...prev, [churchId]: list }))
    } catch {
      setCongregationsByChurch(prev => ({ ...prev, [churchId]: [] }))
    } finally {
      setLoadingCongs(false)
    }
  }

  async function toggleChurch(churchId: number) {
    const isSelected = selectedChurchIds.includes(churchId)
    if (isSelected) {
      setSelectedChurchIds(prev => prev.filter(id => id !== churchId))
      // Remover congregações dessa igreja da seleção
      const congsFromChurch = (congregationsByChurch[churchId] || []).map(c => c.id)
      setSelectedCongregationIds(prev => prev.filter(id => !congsFromChurch.includes(id)))
    } else {
      setSelectedChurchIds(prev => [...prev, churchId])
      await loadCongregationsForChurch(churchId)
    }
  }

  function toggleCongregation(congId: number) {
    setSelectedCongregationIds(prev =>
      prev.includes(congId) ? prev.filter(id => id !== congId) : [...prev, congId]
    )
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', email: '', password: '', newPassword: '', role: availableRoles[availableRoles.length - 1] })
    setSelectedChurchIds(isRoot ? [] : [Number(currentChurch?.id)])
    setSelectedCongregationIds([])
    setCongregationsByChurch({})
    // Se não for root, carregar congregações da igreja atual automaticamente
    if (!isRoot && currentChurch?.id) {
      loadCongregationsForChurch(Number(currentChurch.id))
    }
    setOpen(true)
  }

  async function openEdit(u: any) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', newPassword: '', role: u.roles?.[0] || 'USUARIO' })
    setSelectedChurchIds([])
    setSelectedCongregationIds([])
    setOpen(true)
    // Carregar vínculos existentes
    try {
      const [churchRes, congRes] = await Promise.all([
        http.get<ApiSuccess<any>>(`/users/${u.id}/churches`),
        http.get<ApiSuccess<any>>(`/users/${u.id}/congregations`),
      ])
      const churches: any[] = (churchRes.data as any) || []
      const congs: any[] = (congRes.data as any) || []
      const churchIds = churches.map((c: any) => c.id)
      setSelectedChurchIds(churchIds)
      setSelectedCongregationIds(congs.map((c: any) => c.id))
      // Carregar congregações de cada igreja vinculada
      for (const cid of churchIds) {
        await loadCongregationsForChurch(cid)
      }
    } catch {}
  }

  function openPermissions(u: any) {
    setPermUser(u)
    const role = u.roles?.[0] || 'USUARIO'
    const saved = localStorage.getItem(`user_perms_${u.id}`)
    if (saved) setPermissions(JSON.parse(saved))
    else setPermissions(ROLE_PERMISSIONS_DISPLAY[role] || {})
    setPermOpen(true)
  }

  function togglePerm(modulo: string, perm: string) {
    setPermissions(prev => {
      const cur = prev[modulo] || []
      return { ...prev, [modulo]: cur.includes(perm) ? cur.filter(p => p !== perm) : [...cur, perm] }
    })
  }

  function savePermissions() {
    if (!permUser) return
    localStorage.setItem(`user_perms_${permUser.id}`, JSON.stringify(permissions))
    showToast(`Permissões de ${permUser.name} salvas.`)
    setPermOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      let userId: number

      if (editing) {
        const roleId = ROLE_ID_MAP[form.role]
        await usersService.update(editing.id, {
          name: form.name,
          roleIds: roleId ? [roleId] : undefined,
        } as any)
        userId = editing.id
        if (form.newPassword?.length >= 6) {
          try { await usersService.changePassword(form.password, form.newPassword) } catch {}
        }
        showToast('Usuário atualizado.')
      } else {
        if (!form.email || !form.password) { showToast('E-mail e senha são obrigatórios.'); setSaving(false); return }
        const created = await usersService.create({
          name: form.name, email: form.email, password: form.password,
          roleName: form.role, active: true,
        } as any) as any
        userId = created?.id || created?.data?.id
        showToast(`Usuário criado com perfil ${form.role}.`)
      }

      // Salvar vínculos de igrejas e congregações
      if (userId) {
        await Promise.allSettled([
          http.put(`/users/${userId}/churches`, selectedChurchIds),
          http.put(`/users/${userId}/congregations`, selectedCongregationIds),
        ])
      }

      setOpen(false)
      loadAll()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(u: any) {
    try {
      if (u.active) { await usersService.disable(u.id); showToast(`${u.name} desativado.`) }
      else { await usersService.enable(u.id); showToast(`${u.name} ativado.`) }
      loadAll()
    } catch { showToast('Falha ao alterar status.') }
  }

  return (
    <Layout
      crumbs={[{ label: 'Configurações' }, { label: 'Usuários' }]}
      title="Usuários e Permissões"
      action={isChurchAdmin ? { label: 'Novo Usuário', icon: <Plus className="h-4 w-4" />, onClick: openNew } : undefined}
    >
      <Tabs tabs={['Usuários', 'Permissões por Perfil']} active={tab} onChange={setTab} className="mb-6" />

      {/* ── Usuários ── */}
      {tab === 'Usuários' && (
        <Card>
          <CardHeader><CardTitle>Usuários Cadastrados ({users.length})</CardTitle></CardHeader>
          <CardBody className="pt-2">
            {loading ? (
              <div className="py-8 text-center text-brand-300">Carregando...</div>
            ) : (
              <Table>
                <Thead>
                  <tr>
                    <Th>Nome</Th><Th>E-mail</Th><Th>Perfil</Th><Th>Status</Th>
                    {isChurchAdmin && <Th>Ações</Th>}
                  </tr>
                </Thead>
                <tbody>
                  {users.map(u => (
                    <Tr key={u.id}>
                      <Td className="font-semibold">{u.name}</Td>
                      <Td className="text-brand-500">{u.email}</Td>
                      <Td>
                        {(u.roles || []).map((r: string) => (
                          <Badge key={r} tone={roleTone[r] || 'gray'}>{r}</Badge>
                        ))}
                      </Td>
                      <Td><Badge tone={u.active ? 'green' : 'gray'}>{u.active ? 'Ativo' : 'Inativo'}</Badge></Td>
                      {isChurchAdmin && (
                        <Td>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Editar">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openPermissions(u)} className="p-1.5 rounded hover:bg-purple-50 text-purple-400" title="Permissões">
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => toggleActive(u)} className={`p-1.5 rounded ${u.active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500'}`}>
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
      )}

      {/* ── Permissões por Perfil ── */}
      {tab === 'Permissões por Perfil' && (
        <div className="space-y-4">
          {availableRoles.map(role => (
            <Card key={role}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge tone={roleTone[role] || 'gray'}>{role}</Badge>
                  <CardTitle>{role}</CardTitle>
                </div>
              </CardHeader>
              <CardBody className="pt-2">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MODULOS.map(mod => {
                    const perms = ROLE_PERMISSIONS_DISPLAY[role]?.[mod.key] || []
                    return (
                      <div key={mod.key} className="border border-brand-100 rounded-lg p-3">
                        <p className="text-xs font-bold text-brand-900 mb-2">{mod.label}</p>
                        {mod.perms.map(p => (
                          <div key={p} className="flex items-center gap-1.5 text-xs py-0.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${perms.includes(p) ? 'bg-green-500' : 'bg-brand-200'}`} />
                            <span className={perms.includes(p) ? 'text-brand-700' : 'text-brand-300'}>{p}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ── Modal criar/editar ── */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
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
          <Input label="Nome Completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <Input label={editing ? 'E-mail' : 'E-mail'} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required={!editing} disabled={!!editing} />

          {editing ? (
            <>
              <Input label="Senha Atual (para alterar)" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Deixe em branco para não alterar" />
              <Input label="Nova Senha" type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </>
          ) : (
            <Input label="Senha" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          )}

          <Select label="Perfil de Acesso" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>

          {/* ── Seleção de Igrejas e Congregações ── */}
          <div className="border border-brand-100 rounded-xl p-4 space-y-4">
            <p className="text-sm font-bold text-brand-900">Acesso a Igrejas e Congregações</p>
            <p className="text-xs text-brand-400">
              {isRoot ? 'Selecione as igrejas e depois as congregações de cada uma.' : 'Selecione as congregações de sua igreja.'}
            </p>

            {/* Seleção de igrejas — só ROOT vê todas */}
            {isRoot && (
              <div>
                <p className="text-xs font-semibold text-brand-700 mb-2">Igrejas</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {allChurches.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={selectedChurchIds.includes(c.id)}
                        onChange={() => toggleChurch(c.id)}
                        className="h-4 w-4 rounded border-brand-200"
                      />
                      <span className="text-sm text-brand-900">{c.name}</span>
                      {c.city && <span className="text-xs text-brand-300">{c.city}/{c.state}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Congregações das igrejas selecionadas */}
            {selectedChurchIds.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-brand-700 mb-2">
                  Congregações {loadingCongs && <span className="text-brand-300">(carregando...)</span>}
                </p>
                {selectedChurchIds.map(churchId => {
                  const church = allChurches.find(c => c.id === churchId)
                  const congs = congregationsByChurch[churchId] || []
                  return (
                    <div key={churchId} className="mb-3">
                      {isRoot && <p className="text-xs text-brand-500 font-medium mb-1">{church?.name}</p>}
                      {congs.length === 0 ? (
                        <p className="text-xs text-brand-300 pl-2">
                          {loadingCongs ? 'Carregando...' : 'Nenhuma congregação cadastrada.'}
                        </p>
                      ) : (
                        <div className="space-y-1 pl-2">
                          <label className="flex items-center gap-2 cursor-pointer py-0.5">
                            <input
                              type="checkbox"
                              checked={congs.every(c => selectedCongregationIds.includes(c.id))}
                              onChange={() => {
                                const allIds = congs.map(c => c.id)
                                const allSelected = allIds.every(id => selectedCongregationIds.includes(id))
                                if (allSelected) {
                                  setSelectedCongregationIds(prev => prev.filter(id => !allIds.includes(id)))
                                } else {
                                  setSelectedCongregationIds(prev => [...new Set([...prev, ...allIds])])
                                }
                              }}
                              className="h-4 w-4 rounded border-brand-200"
                            />
                            <span className="text-xs text-brand-500 font-medium">Todas as congregações</span>
                          </label>
                          {congs.map(cong => (
                            <label key={cong.id} className="flex items-center gap-2 cursor-pointer py-0.5 pl-4">
                              <input
                                type="checkbox"
                                checked={selectedCongregationIds.includes(cong.id)}
                                onChange={() => toggleCongregation(cong.id)}
                                className="h-4 w-4 rounded border-brand-200"
                              />
                              <span className="text-sm text-brand-900">{cong.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {selectedChurchIds.length === 0 && !isRoot && (
              <p className="text-xs text-brand-300">Nenhuma igreja selecionada para mostrar congregações.</p>
            )}
          </div>
        </form>
      </Modal>

      {/* ── Modal permissões individuais ── */}
      <Modal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        title={`Permissões — ${permUser?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPermOpen(false)}>Cancelar</Button>
            <Button onClick={savePermissions}><ShieldCheck className="h-4 w-4" /> Salvar</Button>
          </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {MODULOS.map(mod => {
            const modPerms = permissions[mod.key] || []
            const allSelected = mod.perms.every(p => modPerms.includes(p))
            return (
              <div key={mod.key} className="border border-brand-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-brand-900 text-sm">{mod.label}</p>
                  <button
                    type="button"
                    onClick={() => setPermissions(prev => ({ ...prev, [mod.key]: allSelected ? [] : [...mod.perms] }))}
                    className={`text-xs font-semibold px-2 py-1 rounded ${allSelected ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-700'}`}
                  >
                    {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mod.perms.map(perm => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modPerms.includes(perm)}
                        onChange={() => togglePerm(mod.key, perm)}
                        className="h-4 w-4 rounded border-brand-200"
                      />
                      <span className={`text-sm ${modPerms.includes(perm) ? 'text-brand-900 font-medium' : 'text-brand-400'}`}>
                        {perm}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Modal>
    </Layout>
  )
}