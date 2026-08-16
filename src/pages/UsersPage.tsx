// src/pages/UsersPage.tsx
import { useState, useEffect } from 'react'
import { UserPlus, ShieldCheck } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'
import { usersService, type User } from '@/services'
import { EmptyState } from '@/components/ui/Misc'

const roleTone: Record<string, 'green' | 'purple' | 'blue' | 'yellow' | 'orange' | 'gray'> = {
  ROOT: 'yellow',
  ADMIN: 'green',
  PASTOR: 'purple',
  SECRETARY: 'blue',
  TREASURER: 'orange',
  USER: 'gray',
}

export default function UsersPage() {
  const [tab, setTab] = useState('Usuários Ativos')
  const [users, setUsers] = useState<User[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [inviteData, setInviteData] = useState({ name: '', email: '', password: '', roleIds: [] as number[] })
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadData()
  }, [tab])

  async function loadData() {
    setLoading(true)
    try {
      if (tab === 'Usuários Ativos') {
        const res = await usersService.list({ page: 0, size: 20 })
        setUsers(res.data || [])
        const roles = await usersService.getRoles()
        setProfiles(roles.data || [])
      } else if (tab === 'Perfis de Acesso') {
        const roles = await usersService.getRoles()
        setProfiles(roles.data || [])
      } else if (tab === 'Logs de Atividades') {
        const logsRes = await usersService.getAuditLogs({ page: 0, size: 20 })
        setLogs(logsRes.data || [])
      }
    } catch (err) {
      showToast('mensagem')
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await usersService.create({
        name: inviteData.name,
        email: inviteData.email,
        password: inviteData.password,
        roleIds: inviteData.roleIds,
        active: true,
      })
      showToast({ title: 'Convite enviado', description: 'O usuário receberá um e-mail com instruções.' })
      setOpen(false)
      setInviteData({ name: '', email: '', password: '', roleIds: [] })
      loadData()
    } catch (err) {
      showToast({ title: 'Erro', description: 'Falha ao criar usuário.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Configurações Gerais' }, { label: 'Usuários' }]}
      title="Usuários e Permissões"
      searchPlaceholder="Buscar no painel..."
      action={{ label: 'Novo Usuário', icon: <UserPlus className="h-4 w-4" />, onClick: () => setOpen(true) }}
    >
      <Tabs tabs={['Usuários Ativos', 'Perfis de Acesso', 'Logs de Atividades']} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'Usuários Ativos' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <Table>
              <Thead>
                <tr><Th>Nome</Th><Th>E-mail</Th><Th>Perfis</Th><Th>Status</Th></tr>
              </Thead>
              <tbody>
                {loading ? (
                  <Tr><Td colSpan={4} className="text-center py-8">Carregando...</Td></Tr>
                ) : users.length === 0 ? (
                  <Tr><Td colSpan={4} className="text-center py-8"><EmptyState title="Nenhum usuário" /></Td></Tr>
                ) : (
                  users.map((u) => (
                    <Tr key={u.id}>
                      <Td className="font-semibold">{u.name}</Td>
                      <Td className="text-brand-500">{u.email}</Td>
                      <Td>
                        {u.roles.map(r => <Badge key={r} tone={roleTone[r] || 'gray'}>{r}</Badge>)}
                      </Td>
                      <Td><Badge tone={u.active ? 'green' : 'gray'}>{u.active ? 'Ativo' : 'Inativo'}</Badge></Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Perfis de Acesso</CardTitle></CardHeader>
              <CardBody className="pt-1">
                <div className="space-y-2.5">
                  {profiles.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-brand-900">{p.name}</span>
                      <Badge tone="blue">—</Badge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
            <div className="bg-brand-800 text-white rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4" />
                <h4 className="font-bold text-sm">Segurança</h4>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Recomendamos ativar autenticação de dois fatores (2FA) para todos os perfis com acesso a dados contábeis e financeiros.
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'Perfis de Acesso' && (
        <Card>
          <CardBody className="pt-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {profiles.map((p) => (
                <div key={p.id} className="border border-brand-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-brand-900 text-sm">{p.name}</p>
                    <Badge tone="blue">0/0</Badge>
                  </div>
                  <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                    <div className="h-full bg-brand-700 rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {tab === 'Logs de Atividades' && (
        <Card>
          {loading ? (
            <div className="py-8 text-center">Carregando...</div>
          ) : logs.length === 0 ? (
            <EmptyState title="Nenhum log encontrado" />
          ) : (
            <div className="divide-y divide-brand-100">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-brand-900">{l.userEmail}</p>
                    <p className="text-sm text-brand-500">{l.action}</p>
                  </div>
                  <span className="text-xs text-brand-300">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo Usuário"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={submitting}>
              {submitting ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Nome Completo"
            value={inviteData.name}
            onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            required
          />
          <Input
            label="Senha"
            type="password"
            value={inviteData.password}
            onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
            required
          />
          <Select
            label="Perfil de Acesso"
            multiple
            value={inviteData.roleIds.map(String)}
            onChange={(e) => setInviteData({ ...inviteData, roleIds: Array.from(e.target.selectedOptions, o => Number(o.value)) })}
          >
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </form>
      </Modal>
    </Layout>
  )
}