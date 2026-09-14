// src/pages/admin-externa/Documentos.tsx
//
// Módulo de Documentos da Administração Externa. Envio de documentos para
// Igrejas/Congregações com hierarquia de visibilidade: um documento enviado
// para uma Igreja (sem congregação) fica visível para a igreja e todas as
// suas congregações; um documento enviado a uma congregação específica só
// fica visível para ela e para a igreja.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Upload, Trash2, Download, FileText, Plus } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/Misc'
import { useToast } from '@/components/ui/Extras'
import { useAdminExterna } from '@/lib/AdminExternaContext'
import { http, tokenStore } from '@/lib/http'
import { congregationsService, type Congregation } from '@/services/congregations.service'

interface Doc {
  id: number
  title: string
  description?: string
  fileName: string
  fileUrl: string
  fileType?: string
  fileSize?: number
  churchId: number
  congregationId?: number
  createdAt: string
}

const FILES_BASE = 'http://2.24.80.229:3000'

export default function Documentos() {
  const showToast = useToast()
  const { churches } = useAdminExterna()
  const [searchParams] = useSearchParams()

  const [docs, setDocs] = useState<Doc[]>([])
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const [filters, setFilters] = useState({
    churchId: searchParams.get('churchId') || '',
    congregationId: '', dateFrom: '', dateTo: '', fileType: '',
  })

  const [form, setForm] = useState({ title: '', description: '', churchId: '', congregationId: '' })
  const [formCongregations, setFormCongregations] = useState<Congregation[]>([])
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { loadAll() }, [filters.churchId, filters.dateFrom, filters.dateTo])

  useEffect(() => {
    if (filters.churchId) {
      congregationsService.listByChurch(Number(filters.churchId)).then(setCongregations).catch(() => setCongregations([]))
    } else setCongregations([])
  }, [filters.churchId])

  async function loadAll() {
    setLoading(true)
    try {
      const res = await http.get<any>('/documents', {
        page: 0, size: 200, churchId: filters.churchId || undefined,
        dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined,
      })
      const raw = res?.data
      setDocs(raw?.data?.data || raw?.data?.content || raw?.data || [])
    } catch { showToast('Falha ao carregar documentos.') }
    finally { setLoading(false) }
  }

  async function loadFormCongregations(churchId: string) {
    if (!churchId) { setFormCongregations([]); return }
    try { setFormCongregations(await congregationsService.listByChurch(Number(churchId))) }
    catch { setFormCongregations([]) }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.churchId || !file) { showToast('Título, igreja e arquivo são obrigatórios.'); return }
    setSending(true)
    try {
      const access = tokenStore.getAccess()
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      if (form.description) fd.append('description', form.description)
      fd.append('churchId', form.churchId)
      if (form.congregationId) fd.append('congregationId', form.congregationId)
      const res = await fetch(`${FILES_BASE}/api/documents`, {
        method: 'POST',
        headers: { ...(access ? { Authorization: `Bearer ${access}` } : {}) },
        body: fd,
      })
      if (!res.ok) throw new Error('Falha ao enviar')
      showToast('Documento enviado com sucesso.')
      setOpen(false)
      setForm({ title: '', description: '', churchId: '', congregationId: '' })
      setFile(null)
      loadAll()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao enviar documento.')
    } finally { setSending(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este documento?')) return
    try { await http.delete(`/documents/${id}`); showToast('Documento excluído.'); loadAll() }
    catch { showToast('Falha ao excluir.') }
  }

  const filtered = docs.filter(d => {
    if (filters.congregationId && String(d.congregationId) !== filters.congregationId) return false
    if (filters.fileType && !(d.fileType || d.fileName || '').toLowerCase().includes(filters.fileType.toLowerCase())) return false
    return true
  })

  const churchName = (id: number) => churches.find(c => Number(c.id) === id)?.name || `Igreja ${id}`

  function formatSize(bytes?: number) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <AdminExternaLayout crumbs={[{ label: 'Documentações' }]} title="Documentações"
      action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Enviar Documento</Button>}
    >
      {/* Filtros */}
      <Card className="mb-4 p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select label="Igreja" value={filters.churchId} onChange={e => setFilters({ ...filters, churchId: e.target.value, congregationId: '' })}>
            <option value="">Todas as Igrejas</option>
            {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>
          <Select label="Congregação" value={filters.congregationId} onChange={e => setFilters({ ...filters, congregationId: e.target.value })} disabled={!filters.churchId}>
            <option value="">Todas</option>
            {congregations.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>
          <Input label="De" type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
          <Input label="Até" type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documentos Enviados ({filtered.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? <div className="py-8 text-center text-brand-300">Carregando...</div>
          : filtered.length === 0 ? <EmptyState title="Nenhum documento" description="Ajuste os filtros ou envie um novo documento." />
          : (
            <div className="space-y-3">
              {filtered.map(d => (
                <div key={d.id} className="flex items-start gap-4 p-4 border border-brand-100 rounded-xl bg-brand-50/30">
                  <FileText className="h-8 w-8 text-brand-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-900">{d.title}</p>
                    {d.description && <p className="text-sm text-brand-400 mt-0.5">{d.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge tone="blue">{churchName(d.churchId)}</Badge>
                      {d.congregationId
                        ? <Badge tone="purple">Congregação #{d.congregationId} apenas</Badge>
                        : <Badge tone="gray">Visível para toda a igreja</Badge>}
                      <span className="text-xs text-brand-300">{d.fileName} · {formatSize(d.fileSize)}</span>
                      <span className="text-xs text-brand-300">{d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={`${FILES_BASE}${d.fileUrl}`} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Download"><Download className="h-4 w-4" /></a>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Enviar Documento"
        footer={<>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSend} disabled={sending}>{sending ? 'Enviando...' : 'Enviar Documento'}</Button>
        </>}>
        <form onSubmit={handleSend} className="space-y-4">
          <Input label="Título do Documento" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5">Descrição (opcional)</p>
            <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500 resize-none" />
          </div>
          <Select label="Igreja Destino" value={form.churchId}
            onChange={async e => { setForm({ ...form, churchId: e.target.value, congregationId: '' }); await loadFormCongregations(e.target.value) }}>
            <option value="">— Selecione a Igreja —</option>
            {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>
          {formCongregations.length > 0 && (
            <Select label="Congregação Destino (opcional)" value={form.congregationId} onChange={e => setForm({ ...form, congregationId: e.target.value })}>
              <option value="">Toda a Igreja (visível a todas as congregações)</option>
              {formCongregations.map(c => <option key={c.id} value={String(c.id)}>{c.name} (apenas esta congregação)</option>)}
            </Select>
          )}
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Arquivo</p>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm text-brand-500" required />
            {file && <p className="text-xs text-brand-300 mt-1">{file.name} ({formatSize(file.size)})</p>}
          </div>
        </form>
      </Modal>
    </AdminExternaLayout>
  )
}
