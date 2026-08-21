import { useEffect, useState } from 'react'
import { Plus, MapPin, Phone, Mail, ArrowRight, Upload, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { useNavigate } from 'react-router-dom'
import { churchesService, type Church } from '@/services/churches.service'

const ADMIN_ROLES = ['ROOT', 'ADMIN', 'PASTOR_PRINCIPAL']

// URL base para servir arquivos do backend
const FILES_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://2.24.80.229:3000'

function churchLogoUrl(logoUrl?: string): string | undefined {
  if (!logoUrl) return undefined
  if (logoUrl.startsWith('http')) return logoUrl
  return `${FILES_BASE}${logoUrl}`
}

export default function CongregarcoesPage() {
  const showToast = useToast()
  const navigate = useNavigate()
  const { user, church, setChurch } = useApp()
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Church | null>(null)
  const [openNew, setOpenNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', city: '', state: '', address: '',
    phone: '', email: '', cnpj: '',
  })

  const isAdmin = user?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const list = await churchesService.list()
      setChurches(list)
    } catch {
      showToast('Falha ao carregar congregações.')
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

  function handleCardClick(c: Church) {
    if (!isAdmin) {
      showToast('Sem permissão para alterar a congregação ativa.')
      return
    }
    setSelected(c)
  }

  function switchContext(c: Church) {
    setChurch({ id: String(c.id), name: c.name, city: c.city || '', state: c.state || '' })
    showToast(`Contexto alterado para: ${c.name}`)
    setSelected(null)
    navigate('/dashboard')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      // 1. Criar a congregação
      const created = await churchesService.create({ ...form, status: 'ACTIVE' })

      // 2. Se houver logo selecionada, fazer upload
      if (logoFile && created?.id) {
        try {
          const logoUrl = await churchesService.uploadLogo(created.id, logoFile)
          showToast('Congregação cadastrada com logo.')
        } catch {
          showToast('Congregação cadastrada, mas falha no upload da logo.')
        }
      } else {
        showToast('Congregação cadastrada com sucesso.')
      }

      setOpenNew(false)
      setForm({ name: '', city: '', state: '', address: '', phone: '', email: '', cnpj: '' })
      setLogoFile(null)
      setLogoPreview(null)
      load()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao cadastrar.')
    } finally {
      setSaving(false)
    }
  }

  const visible = isAdmin ? churches : churches.filter(c => String(c.id) === String(church?.id))

  return (
    <Layout
      crumbs={[{ label: 'Configurações' }, { label: 'Congregações' }]}
      title="Congregações"
      action={isAdmin ? {
        label: 'Nova Congregação',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setOpenNew(true),
      } : undefined}
    >
      {loading ? (
        <div className="flex justify-center py-20 text-brand-300">Carregando...</div>
      ) : visible.length === 0 ? (
        <div className="flex justify-center py-20 text-brand-300">Nenhuma congregação disponível.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(c => {
            const logo = churchLogoUrl(c.logoUrl)
            return (
              <button key={c.id} onClick={() => handleCardClick(c)} className="text-left">
                <Card className={`h-full transition-all ${isAdmin ? 'hover:shadow-soft hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}>
                  {logo ? (
                    <img src={logo} alt={c.name} className="h-28 w-full object-cover rounded-t-2xl" />
                  ) : (
                    <div className="h-28 w-full bg-brand-50 rounded-t-2xl flex items-center justify-center">
                      <span className="text-4xl font-extrabold text-brand-200">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
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
                      <p className="text-sm text-brand-300 flex items-center gap-1 mb-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {[c.city, c.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {c.phone && <p className="text-xs text-brand-300 flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</p>}
                    {c.email && <p className="text-xs text-brand-300 flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</p>}
                    {isAdmin && (
                      <p className="text-xs text-brand-500 mt-3 font-medium flex items-center gap-1">
                        <ArrowRight className="h-3.5 w-3.5" /> Clique para acessar
                      </p>
                    )}
                  </CardBody>
                </Card>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal detalhe */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          footer={
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
              <Button onClick={() => switchContext(selected)}>
                <ArrowRight className="h-4 w-4" /> Acessar esta congregação
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            {churchLogoUrl(selected.logoUrl) && (
              <img src={churchLogoUrl(selected.logoUrl)} alt={selected.name} className="h-32 w-full object-cover rounded-xl mb-4" />
            )}
            {[
              ['Cidade / Estado', [selected.city, selected.state].filter(Boolean).join(' / ') || '—'],
              ['Endereço', selected.address || '—'],
              ['Telefone', selected.phone || '—'],
              ['E-mail', selected.email || '—'],
              ['CNPJ', selected.cnpj || '—'],
              ['Status', selected.status === 'ACTIVE' ? 'Ativa' : 'Inativa'],
            ].map(([l, v]) => (
              <div key={l} className="flex gap-2">
                <span className="font-semibold text-brand-900 w-32 shrink-0">{l}:</span>
                <span className="text-brand-500">{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Modal nova congregação */}
      <Modal
        open={openNew}
        onClose={() => { setOpenNew(false); setLogoFile(null); setLogoPreview(null) }}
        title="Nova Congregação"
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
          <Input
            label="Nome da Congregação"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="UF" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} placeholder="SP" />
          </div>
          <Input label="Endereço" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Telefone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="E-mail" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label="CNPJ" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />

          {/* Upload de logo */}
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-2 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Logo da Igreja
            </p>
            {logoPreview ? (
              <div className="relative inline-block">
                <img src={logoPreview} alt="Preview" className="h-24 w-24 rounded-xl object-cover border border-brand-100" />
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                  className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-brand-200 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
                <Upload className="h-5 w-5 text-brand-300" />
                <div>
                  <p className="text-sm font-medium text-brand-700">Clique para selecionar</p>
                  <p className="text-xs text-brand-300">PNG, JPG ou SVG. Máx. 5MB.</p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={e => handleLogoChange(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </form>
      </Modal>
    </Layout>
  )
}