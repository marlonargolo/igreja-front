/**
 * CongregarcoesPage.tsx — /configuracoes/congregacoes
 *
 * CORRIGIDO:
 * - Usa congregationsService (não churchesService)
 * - Cria via POST /congregations (não POST /churches)
 * - Backend filtra automaticamente pela Igreja do usuário logado
 * - Igrejas NÃO aparecem aqui em hipótese alguma
 * - Criação: churchId preenchido automaticamente pelo backend (Igreja do criador)
 */
import { useEffect, useState } from 'react'
import { Plus, MapPin, Phone, Mail, Edit2, Trash2, Upload, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { congregationsService, type Congregation } from '@/services/congregations.service'
import { fetchAddressByCep } from '@/services/externalApis.service'

const FILES_BASE = 'http://2.24.80.229:3000'

function resolveImg(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('blob:')) return url
  return `${FILES_BASE}${url}`
}

export default function CongregarcoesPage() {
  const showToast = useToast()
  const { user, church, hasPermission, isRoot } = useApp()

  const canManage = isRoot || hasPermission('SETTINGS_UPDATE')

  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [loading, setLoading] = useState(true)

  // Modal criar/editar
  const [openNew, setOpenNew]   = useState(false)
  const [editing, setEditing]   = useState<Congregation | null>(null)
  const [saving, setSaving]     = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '', city: '', state: '', address: '',
    phone: '', email: '', cep: '',
  })

  useEffect(() => { load() }, [church?.id])

  async function load() {
    setLoading(true)
    try {
      // Backend filtra automaticamente pela Igreja do usuário — não passar churchId aqui
      // para não vazar o ID para um usuário mal-intencionado interceptar a URL
      const res = await congregationsService.list({ page: 0, size: 200 })
      const raw = (res as any)?.data
      const list = raw?.data || raw?.content || raw || []
      setCongregations(Array.isArray(list) ? list : [])
    } catch {
      showToast('Falha ao carregar congregações.')
      setCongregations([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCepSearch(cep: string) {
    try {
      const data = await fetchAddressByCep(cep)
      setForm(prev => ({
        ...prev,
        city: data.city, state: data.state, cep: data.cep,
        address: data.street ? `${data.street}${data.neighborhood ? ` - ${data.neighborhood}` : ''}` : prev.address,
      }))
      showToast('CEP encontrado!')
    } catch (err: any) { showToast(err.message || 'Erro ao buscar CEP') }
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

  function openCreate() {
    setEditing(null)
    setForm({ name: '', city: '', state: '', address: '', phone: '', email: '', cep: '' })
    setLogoFile(null); setLogoPreview(null)
    setOpenNew(true)
  }

  function openEdit(c: Congregation) {
    setEditing(c)
    setForm({ name: c.name, city: c.city || '', state: c.state || '',
      address: c.address || '', phone: '', email: '', cep: '' })
    setLogoFile(null)
    setLogoPreview(resolveImg(c.imageUrl) || null)
    setOpenNew(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      if (editing) {
        await congregationsService.update(editing.id, {
          name: form.name, city: form.city, state: form.state, address: form.address,
        })
        showToast('Congregação atualizada.')
      } else {
        // churchId NÃO é enviado — o backend usa o churchId do usuário logado automaticamente
        // Exceção: ROOT pode informar via campo churchId no payload, mas aqui usamos a Igreja atual
        const payload: any = {
          name: form.name, city: form.city || undefined, state: form.state || undefined,
          address: form.address || undefined,
          // Para ROOT: passa o churchId da Igreja selecionada no contexto
          churchId: church?.id ? Number(church.id) : undefined,
        }
        const created = await congregationsService.create(payload) as any
        showToast('Congregação cadastrada.')
      }
      setOpenNew(false)
      load()
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Falha ao salvar.')
    } finally { setSaving(false) }
  }

  async function handleDelete(c: Congregation) {
    if (!confirm(`Desativar a congregação "${c.name}"?`)) return
    try {
      await congregationsService.remove(c.id)
      showToast(`${c.name} desativada.`)
      load()
    } catch { showToast('Falha ao desativar.') }
  }

  return (
    <Layout
      crumbs={[{ label: 'Configurações' }, { label: 'Congregações' }]}
      title={`Congregações${church?.name ? ` — ${church.name}` : ''}`}
      action={canManage ? {
        label: 'Nova Congregação',
        icon: <Plus className="h-4 w-4" />,
        onClick: openCreate,
      } : undefined}
    >
      {loading ? (
        <div className="flex justify-center py-20 text-brand-300">Carregando...</div>
      ) : congregations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-brand-300">
          <p>Nenhuma congregação cadastrada.</p>
          {canManage && (
            <p className="text-sm">Clique em "Nova Congregação" para adicionar.</p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {congregations.map(c => {
            const img = resolveImg(c.imageUrl)
            return (
              <Card key={c.id} className="h-full">
                {img ? (
                  <img src={img} alt={c.name} className="h-28 w-full object-cover rounded-t-2xl" />
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
                  {canManage && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-brand-100">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        <Edit2 className="h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(c)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      <Modal open={openNew} onClose={() => { setOpenNew(false); setLogoFile(null); setLogoPreview(null) }}
        title={editing ? `Editar: ${editing.name}` : 'Nova Congregação'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome da Congregação" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} required />

          <div className="flex gap-2">
            <div className="flex-1">
              <Input label="CEP" value={form.cep}
                onChange={e => {
                  const v = e.target.value
                  setForm({ ...form, cep: v })
                  if (v.replace(/\D/g, '').length === 8) handleCepSearch(v)
                }}
                placeholder="00000-000" />
            </div>
            <Button type="button" variant="outline" className="mt-6"
              onClick={() => form.cep && handleCepSearch(form.cep)}
              disabled={form.cep.replace(/\D/g, '').length !== 8}>
              Buscar CEP
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="UF" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} />
          </div>
          <Input label="Endereço" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />

          {/* Imagem */}
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-2 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Imagem da Congregação
            </p>
            {logoPreview ? (
              <div className="flex items-center gap-3">
                <img src={logoPreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover border border-brand-100" />
                <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> Remover
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-brand-200 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
                <Upload className="h-5 w-5 text-brand-300" />
                <div>
                  <p className="text-sm font-medium text-brand-700">Clique para selecionar</p>
                  <p className="text-xs text-brand-300">PNG, JPG. Máx. 5MB.</p>
                </div>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden" onChange={e => handleLogoChange(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>
        </form>
      </Modal>
    </Layout>
  )
}