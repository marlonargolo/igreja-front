import { useState, useEffect } from 'react'
import { Plus, Edit2, UserX, UserCheck, ShieldCheck, Key } from 'lucide-react'
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

const ROLES = ['ADMIN', 'PASTOR_PRINCIPAL', 'TESOUREIRO', 'SECRETARIO', 'USUARIO']
const ADMIN_ROLES = ['ROOT', 'ADMIN']

// Módulos e permissões disponíveis
const MODULOS = [
  {
    key: 'configuracoes',
    label: 'Configurações',
    perms: ['Ver Congregações', 'Editar Congregações', 'Ver Usuários', 'Criar Usuários', 'Editar Usuários'],
  },
  {
    key: 'secretaria',
    label: 'Secretaria',
    perms: ['Ver Membros', 'Criar Membros', 'Editar Membros', 'Excluir Membros', 'Ver Relatórios', 'Gerenciar Transferências', 'Emitir Credenciais'],
  },
  {
    key: 'tesouraria',
    label: 'Tesouraria',
    perms: ['Ver Receitas', 'Lançar Receitas', 'Editar Receitas', 'Ver Despesas', 'Lançar Despesas', 'Editar Despesas', 'Ver Transferências', 'Lançar Transferências', 'Ver Relatórios'],
  },
  {
    key: 'patrimonio',
    label: 'Patrimônio',
    perms: ['Ver Bens', 'Cadastrar Bens', 'Editar Bens', 'Baixa de Bens', 'Ver Relatórios'],
  },
  {
    key: 'contabilidade',
    label: 'Contabilidade',
    perms: ['Ver Lançamentos', 'Confirmar Lançamentos', 'Fechar Período', 'Exportar Contábil', 'Ver Demonstrações'],
  },
  {
    key: 'administracao',
    label: 'Administração',
    perms: ['Gerenciar Igrejas', 'Gerenciar Assinatura', 'Fazer Backup', 'Ver Integrações'],
  },
]

const ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  ADMIN: {
    configuracoes: ['Ver Congregações', 'Editar Congregações', 'Ver Usuários', 'Criar Usuários', 'Editar Usuários'],
    secretaria: ['Ver Membros', 'Criar Membros', 'Editar Membros', 'Excluir Membros', 'Ver Relatórios', 'Gerenciar Transferências', 'Emitir Credenciais'],
    tesouraria: ['Ver Receitas', 'Lançar Receitas', 'Editar Receitas', 'Ver Despesas', 'Lançar Despesas', 'Editar Despesas', 'Ver Transferências', 'Lançar Transferências', 'Ver Relatórios'],
    patrimonio: ['Ver Bens', 'Cadastrar Bens', 'Editar Bens', 'Baixa de Bens', 'Ver Relatórios'],
    contabilidade: ['Ver Lançamentos', 'Confirmar Lançamentos', 'Fechar Período', 'Exportar Contábil', 'Ver Demonstrações'],
    administracao: ['Gerenciar Igrejas', 'Gerenciar Assinatura', 'Fazer Backup', 'Ver Integrações'],
  },
  PASTOR_PRINCIPAL: {
    configuracoes: ['Ver Congregações', 'Ver Usuários'],
    secretaria: ['Ver Membros', 'Criar Membros', 'Editar Membros', 'Ver Relatórios', 'Gerenciar Transferências', 'Emitir Credenciais'],
    tesouraria: ['Ver Receitas', 'Ver Despesas', 'Ver Relatórios'],
    patrimonio: ['Ver Bens', 'Ver Relatórios'],
    contabilidade: ['Ver Lançamentos', 'Ver Demonstrações'],
    administracao: [],
  },
  TESOUREIRO: {
    configuracoes: [],
    secretaria: [],
    tesouraria: ['Ver Receitas', 'Lançar Receitas', 'Editar Receitas', 'Ver Despesas', 'Lançar Despesas', 'Editar Despesas', 'Ver Transferências', 'Lançar Transferências', 'Ver Relatórios'],
    patrimonio: ['Ver Bens'],
    contabilidade: ['Ver Lançamentos', 'Confirmar Lançamentos', 'Exportar Contábil', 'Ver Demonstrações'],
    administracao: [],
  },
  SECRETARIO: {
    configuracoes: [],
    secretaria: ['Ver Membros', 'Criar Membros', 'Editar Membros', 'Ver Relatórios', 'Emitir Credenciais'],
    tesouraria: [],
    patrimonio: [],
    contabilidade: [],
    administracao: [],
  },
  USUARIO: {
    configuracoes: [],
    secretaria: ['Ver Membros'],
    tesouraria: [],
    patrimonio: [],
    contabilidade: [],
    administracao: [],
  },
}

const roleTone: Record<string, 'green' | 'purple' | 'blue' | 'yellow' | 'orange' | 'gray'> = {
  ROOT: 'yellow', ADMIN: 'green', PASTOR_PRINCIPAL: 'purple',
  TESOUREIRO: 'orange', SECRETARIO: 'blue', USUARIO: 'gray',
}

export default function UsersPage() {
  const showToast = useToast()
  const { user: currentUser } = useApp()
  const [tab, setTab] = useState('Usuários')
  const [users, setUsers] = useState<any[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)

  // Modal criar/editar usuário
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', newPassword: '', role: 'USUARIO', churchId: '',
  })

  // Modal de permissões
  const [permOpen, setPermOpen] = useState(false)
  const [permUser, setPermUser] = useState<any | null>(null)
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})

  const isAdmin = currentUser?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [uRes, cList] = await Promise.all([
        usersService.list({ size: 100 }),
        churchesService.list(),
      ])
      const raw = uRes as any
      setUsers(raw?.data || raw?.content || [])
      setChurches(cList)
    } catch {
      showToast('Falha ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', email: '', password: '', newPassword: '', role: 'USUARIO', churchId: '' })
    setOpen(true)
  }

  function openEdit(u: any) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: '', newPassword: '', role: u.roles?.[0] || 'USUARIO', churchId: '' })
    setOpen(true)
  }

  function openPermissions(u: any) {
    setPermUser(u)
    const role = u.roles?.[0] || 'USUARIO'
    // Carregar permissões salvas no localStorage ou usar as do perfil padrão
    const saved = localStorage.getItem(`user_perms_${u.id}`)
    if (saved) {
      setPermissions(JSON.parse(saved))
    } else {
      setPermissions(ROLE_PERMISSIONS[role] || {})
    }
    setPermOpen(true)
  }

  function togglePerm(modulo: string, perm: string) {
    setPermissions(prev => {
      const current = prev[modulo] || []
      const has = current.includes(perm)
      return {
        ...prev,
        [modulo]: has ? current.filter(p => p !== perm) : [...current, perm],
      }
    })
  }

  function toggleModulo(modulo: string, perms: string[]) {
    setPermissions(prev => {
      const current = prev[modulo] || []
      const allSelected = perms.every(p => current.includes(p))
      return { ...prev, [modulo]: allSelected ? [] : [...perms] }
    })
  }

  function savePermissions() {
    if (!permUser) return
    localStorage.setItem(`user_perms_${permUser.id}`, JSON.stringify(permissions))
    showToast(`Permissões de ${permUser.name} salvas com sucesso.`)
    setPermOpen(false)
    setPermUser(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      if (editing) {
        // Atualizar nome
        await usersService.update(editing.id, { name: form.name })
        // Atualizar email se mudou
        if (form.email && form.email !== editing.email) {
          await usersService.update(editing.id, { name: form.name } as any)
          // email update via endpoint específico se existir
        }
        // Atualizar senha se fornecida
        if (form.newPassword && form.newPassword.length >= 6) {
          try {
            await usersService.changePassword(form.password, form.newPassword)
            showToast('Usuário e senha atualizados.')
          } catch {
            showToast('Dados atualizados, mas falha ao alterar senha — verifique a senha atual.')
          }
        } else {
          showToast('Usuário atualizado.')
        }
      } else {
        if (!form.email) { showToast('E-mail é obrigatório.'); setSaving(false); return }
        if (!form.password) { showToast('Senha é obrigatória.'); setSaving(false); return }
        await usersService.create({
          name: form.name,
          email: form.email,
          password: form.password,
          active: true,
        })
        showToast('Usuário criado com sucesso.')
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
      action={isAdmin ? { label: 'Novo Usuário', icon: <Plus className="h-4 w-4" />, onClick: openNew } : undefined}
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
                    {isAdmin && <Th>Ações</Th>}
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
                      <Td>
                        <Badge tone={u.active ? 'green' : 'gray'}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </Td>
                      {isAdmin && (
                        <Td>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Editar">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => openPermissions(u)} className="p-1.5 rounded hover:bg-purple-50 text-purple-400" title="Permissões">
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => toggleActive(u)} className={`p-1.5 rounded ${u.active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500'}`} title={u.active ? 'Desativar' : 'Ativar'}>
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
          <p className="text-sm text-brand-500">
            Clique no ícone <ShieldCheck className="h-3.5 w-3.5 inline text-purple-400" /> ao lado de um usuário para configurar permissões individuais.
            Abaixo estão as permissões padrão por perfil.
          </p>
          {ROLES.map(role => (
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
                    const perms = ROLE_PERMISSIONS[role]?.[mod.key] || []
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

      {/* Modal criar/editar usuário */}
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
          <Input
            label="Nome Completo"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />

          {/* Email — editável em ambos os casos */}
          <Input
            label={editing ? 'E-mail (atual)' : 'E-mail'}
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required={!editing}
            placeholder={editing ? editing.email : 'usuario@igreja.com'}
          />

          {/* Senha */}
          {editing ? (
            <>
              <Input
                label="Senha Atual (para alterar senha)"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Deixe em branco para não alterar"
              />
              <Input
                label="Nova Senha"
                type="password"
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </>
          ) : (
            <Input
              label="Senha"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          )}

          <Select
            label="Perfil de Acesso"
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>

          <Select
            label="Congregação"
            value={form.churchId}
            onChange={e => setForm({ ...form, churchId: e.target.value })}
          >
            <option value="">— Todas as congregações —</option>
            {churches.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </Select>
        </form>
      </Modal>

      {/* Modal de permissões individuais */}
      <Modal
        open={permOpen}
        onClose={() => setPermOpen(false)}
        title={`Permissões — ${permUser?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setPermOpen(false)}>Cancelar</Button>
            <Button onClick={savePermissions}>
              <ShieldCheck className="h-4 w-4" /> Salvar Permissões
            </Button>
          </>
        }
      >
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          <p className="text-sm text-brand-300">
            Perfil base: <Badge tone={roleTone[permUser?.roles?.[0]] || 'gray'}>{permUser?.roles?.[0] || 'USUARIO'}</Badge>
            &nbsp;— as permissões abaixo substituem o padrão do perfil.
          </p>
          {MODULOS.map(mod => {
            const modPerms = permissions[mod.key] || []
            const allSelected = mod.perms.every(p => modPerms.includes(p))
            return (
              <div key={mod.key} className="border border-brand-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-brand-900 text-sm">{mod.label}</p>
                  <button
                    type="button"
                    onClick={() => toggleModulo(mod.key, mod.perms)}
                    className={`text-xs font-semibold px-2 py-1 rounded ${allSelected ? 'bg-brand-800 text-white' : 'bg-brand-50 text-brand-700'}`}
                  >
                    {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {mod.perms.map(perm => {
                    const has = modPerms.includes(perm)
                    return (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={has}
                          onChange={() => togglePerm(mod.key, perm)}
                          className="h-4 w-4 rounded border-brand-200 text-brand-800"
                        />
                        <span className={`text-sm ${has ? 'text-brand-900 font-medium' : 'text-brand-400'}`}>
                          {perm}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Modal>
    </Layout>
  )
}