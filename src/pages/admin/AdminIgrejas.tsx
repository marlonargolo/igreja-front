import { useEffect, useState } from 'react'
import { Plus, MapPin, Phone, Mail, Edit2, Trash2, Upload, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { churchesService, type Church } from '@/services/churches.service'

const FILES_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://2.24.80.229:3000'

function logoUrl(url?: string): string | undefined {
  if (!url) return undefined
  return url.startsWith('http') ? url : `${FILES_BASE}${url}`
}

export default function AdminIgrejas() {
  const showToast = useToast()
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Church | null>(null)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', city: '', state: '', address: '',
    zipCode: '', phone: '', email: '', cnpj: '', status: 'ACTIVE',
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const list = await churchesService.list()
      setChurches(list)
    } catch {
      showToast('Falha ao carregar igrejas.')
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

  function openNew() {
    setEditing(null)
    setLogoFile(null)
    setLogoPreview(null)
    setForm({ name: '', city: '', state: '', address: '', zipCode: '', phone: '', email: '', cnpj: '', status: 'ACTIVE' })
    setOpen(true)
  }

  function openEdit(c: Church) {
    setEditing(c)
    setLogoFile(null)
    setLogoPreview(logoUrl(c.logoUrl) || null)
    setForm({
      name: c.name,
      city: c.city || '',
      state: c.state || '',
      address: c.address || '',
      zipCode: c.zipCode || '',
      phone: c.phone || '',
      email: c.email || '',
      cnpj: c.cnpj || '',
      status: c.status || 'ACTIVE',
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { showToast('Nome é obrigatório.'); return }
    setSaving(true)
    try {
      let saved: Church
      if (editing) {
        saved = await churchesService.update(editing.id, form) as unknown as Church
        showToast('Igreja atualizada.')
      } else {
        saved = await churchesService.create({ ...form }) as unknown as Church
        showToast('Igreja cadastrada.')
      }

      // Upload da logo se selecionada
      if (logoFile && saved?.id) {
        try {
          await churchesService.uploadLogo(saved.id, logoFile)
          showToast('Logo enviada com sucesso.')
        } catch {
          showToast('Igreja salva, mas falha no upload da logo.')
        }
      }

      setOpen(false)
      load()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(c: Church) {
    if (!confirm(`Desativar "${c.name}"?`)) return
    try {
      await churchesService.remove(c.id)
      showToast(`${c.name} desativada.`)
      load()
    } catch {
      showToast('Falha ao desativar.')
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Administração' }, { label: 'Cadastro de Igrejas' }]}
      title="Cadastro de Igrejas"
      action={{ label: 'Nova Igreja', icon: <Plus className="h-4 w-4" />, onClick: openNew }}
    >
      {/* Cards visuais */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {churches.map(c => {
          const logo = logoUrl(c.logoUrl)
          return (
            <Card key={c.id} className="overflow-hidden">
              {logo ? (
                <img src={logo} alt={c.name} className="h-32 w-full object-cover" />
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-brand-800 to-brand-600 flex items-center justify-center">
                  <span className="text-5xl font-extrabold text-white/30">
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
                  <p className="text-xs text-brand-300 flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" /> {[c.city, c.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {c.phone && <p className="text-xs text-brand-300 flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</p>}
                {c.email && <p className="text-xs text-brand-300 flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</p>}
                {c.cnpj && <p className="text-xs text-brand-300 mt-1">CNPJ: {c.cnpj}</p>}
                <div className="flex gap-2 mt-4 pt-3 border-t border-brand-100">
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                    <Edit2 className="h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(c)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* Tabela resumida */}
      <Card>
        <CardHeader><CardTitle>Todas as Igrejas ({churches.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : (
            <Table>
              <Thead>
                <tr><Th>Nome</Th><Th>Cidade/UF</Th><Th>CNPJ</Th><Th>Status</Th><Th>Ações</Th></tr>
              </Thead>
              <tbody>
                {churches.map(c => (
                  <Tr key={c.id}>
                    <Td className="font-semibold flex items-center gap-2">
                      {logoUrl(c.logoUrl) && (
                        <img src={logoUrl(c.logoUrl)} alt="" className="h-7 w-7 rounded object-cover" />
                      )}
                      {c.name}
                    </Td>
                    <Td className="text-brand-500">{[c.city, c.state].filter(Boolean).join('/')}</Td>
                    <Td className="text-brand-500">{c.cnpj || '—'}</Td>
                    <Td><Badge tone={c.status === 'ACTIVE' ? 'green' : 'gray'}>{c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-brand-50 text-brand-400"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 rounded hover:bg-red-50 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal criar/editar */}
      <Modal
        open={open}
        onClose={() => { setOpen(false); setLogoFile(null); setLogoPreview(null) }}
        title={editing ? `Editar: ${editing.name}` : 'Nova Igreja'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Igreja'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nome da Igreja" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cidade" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="UF" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} placeholder="SP" />
          </div>
          <Input label="Endereço" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CEP" value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} placeholder="00000-000" />
            <Input label="Telefone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="E-mail" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input label="CNPJ" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
          </div>
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Ativa</option>
            <option value="INACTIVE">Inativa</option>
          </Select>

          {/* Upload de logo */}
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-2 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Logo da Igreja
            </p>
            {logoPreview ? (
              <div className="flex items-center gap-3">
                <img src={logoPreview} alt="Logo" className="h-20 w-20 rounded-xl object-cover border border-brand-100" />
                {!editing || logoFile ? (
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(editing ? logoUrl(editing.logoUrl) || null : null) }}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Remover nova logo
                  </button>
                ) : (
                  <label className="text-xs text-brand-700 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" /> Trocar logo
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleLogoChange(e.target.files?.[0] || null)} />
                  </label>
                )}
              </div>
            ) : (
              <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-brand-200 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
                <Upload className="h-5 w-5 text-brand-300" />
                <div>
                  <p className="text-sm font-medium text-brand-700">Clique para selecionar a logo</p>
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