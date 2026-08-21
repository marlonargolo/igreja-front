import { useEffect, useState } from 'react'
import { Plus, MapPin, Phone, Mail, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { churchesService, type Church } from '@/services/churches.service'

// Perfis que podem ver/editar todas as unidades
const ADMIN_ROLES = ['ROOT', 'ADMIN', 'PASTOR_PRINCIPAL', 'PRESIDENTE']

export default function UnidadesPage() {
  const showToast = useToast()
  const { user } = useApp()
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Church | null>(null)
  const [openNew, setOpenNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', state: '', address: '', phone: '', email: '', cnpj: '' })

  const isAdmin = user?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const list = await churchesService.list()
      setChurches(list)
    } catch {
      showToast('Falha ao carregar unidades.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      await churchesService.create({ ...form, status: 'ACTIVE' })
      showToast('Unidade cadastrada com sucesso.')
      setOpenNew(false)
      setForm({ name: '', city: '', state: '', address: '', phone: '', email: '', cnpj: '' })
      load()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao cadastrar unidade.')
    } finally {
      setSaving(false)
    }
  }

  // Se não for admin, só mostra a unidade do usuário (simulado: todas por ora)
  const visible = isAdmin ? churches : churches.slice(0, 1)

  return (
    <Layout
      crumbs={[{ label: 'Configurações' }, { label: 'Unidades' }]}
      title="Unidades"
      action={isAdmin ? {
        label: 'Nova Unidade',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setOpenNew(true),
      } : undefined}
    >
      {loading ? (
        <div className="flex justify-center py-20 text-brand-300">Carregando...</div>
      ) : visible.length === 0 ? (
        <div className="flex justify-center py-20 text-brand-300">Nenhuma unidade cadastrada.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(c => (
            <button
              key={c.id}
              onClick={() => isAdmin ? setSelected(c) : showToast('Sem permissão para editar esta unidade.')}
              className="text-left"
            >
              <Card className="hover:shadow-soft hover:-translate-y-0.5 transition-all cursor-pointer h-full">
                <CardBody className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="font-bold text-brand-900">{c.name}</p>
                    <Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>
                      {c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  {(c.city || c.state) && (
                    <p className="text-sm text-brand-300 flex items-center gap-1 mb-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[c.city, c.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {c.phone && (
                    <p className="text-xs text-brand-300 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </p>
                  )}
                  {c.email && (
                    <p className="text-xs text-brand-300 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email}
                    </p>
                  )}
                  {isAdmin && (
                    <p className="text-xs text-brand-500 mt-3 font-medium">Clique para ver detalhes →</p>
                  )}
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Modal detalhe/edição */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          footer={
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              <Button onClick={() => showToast('Edição de unidades em breve.')}>Editar</Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <Row label="Nome" value={selected.name} />
            <Row label="Cidade / Estado" value={[selected.city, selected.state].filter(Boolean).join(' / ') || '—'} />
            <Row label="Endereço" value={selected.address || '—'} />
            <Row label="Telefone" value={selected.phone || '—'} />
            <Row label="E-mail" value={selected.email || '—'} />
            <Row label="CNPJ" value={selected.cnpj || '—'} />
            <Row label="Status" value={selected.status === 'ACTIVE' ? 'Ativa' : 'Inativa'} />
          </div>
        </Modal>
      )}

      {/* Modal nova unidade */}
      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="Nova Unidade"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nome da Unidade" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="Estado (UF)" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} placeholder="SP" />
          </div>
          <Input label="Endereço" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="E-mail" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label="CNPJ" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
        </form>
      </Modal>
    </Layout>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold text-brand-900 w-32 shrink-0">{label}:</span>
      <span className="text-brand-500">{value}</span>
    </div>
  )
}