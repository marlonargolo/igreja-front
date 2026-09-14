/**
 * AdminDocumentos.tsx — Exclusivo ROOT
 * Enviar documentos para igrejas/congregações e gerenciar o que foi enviado.
 */
import { useState, useEffect } from 'react'
import { Upload, Trash2, Download, FileText, Plus } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { http } from '@/lib/http'
import { churchesService, type Church } from '@/services/churches.service'
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

export default function AdminDocumentos() {
  const showToast = useToast()
  const [docs,          setDocs]          = useState<Doc[]>([])
  const [churches,      setChurches]      = useState<Church[]>([])
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [loading,       setLoading]       = useState(true)
  const [open,          setOpen]          = useState(false)
  const [sending,       setSending]       = useState(false)
  const [churchFilter,  setChurchFilter]  = useState('')

  const [form, setForm] = useState({
    title: '', description: '', churchId: '', congregationId: '',
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [docsRes, churchList] = await Promise.all([
        http.get<any>('/documents', { page: 0, size: 200 }),
        churchesService.list(),
      ])
      const raw = docsRes?.data
      setDocs(raw?.data?.data || raw?.data?.content || raw?.data || [])
      setChurches(churchList)
    } catch { showToast('Falha ao carregar.') }
    finally { setLoading(false) }
  }

  async function loadCongregations(churchId: string) {
    if (!churchId) { setCongregations([]); return }
    try {
      const res = await http.get<any>('/congregations', { page: 0, size: 200 })
      const raw = res?.data
      const list = raw?.data?.data || raw?.data || raw?.content || []
      setCongregations(Array.isArray(list) ? list.filter((c: any) => String(c.churchId) === churchId) : [])
    } catch { setCongregations([]) }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.churchId || !file) {
      showToast('Título, igreja e arquivo são obrigatórios.'); return
    }
    setSending(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('churchId', form.churchId)
      if (form.congregationId) fd.append('congregationId', form.congregationId)

      await http.upload('/documents', file) // usa multipart — ajustar se necessário
      // Como o upload precisa de campos extras, usamos fetch direto:
      const access = localStorage.getItem('igrejahub_access_token')
      const fdFull = new FormData()
      fdFull.append('file', file)
      fdFull.append('title', form.title)
      if (form.description) fdFull.append('description', form.description)
      fdFull.append('churchId', form.churchId)
      if (form.congregationId) fdFull.append('congregationId', form.congregationId)
      const res = await fetch(`http://2.24.80.229:3000/api/documents`, {
        method: 'POST',
        headers: { ...(access ? { Authorization: `Bearer ${access}` } : {}) },
        body: fdFull,
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
    try {
      await http.delete(`/documents/${id}`)
      showToast('Documento excluído.')
      loadAll()
    } catch { showToast('Falha ao excluir.') }
  }

  const filtered = churchFilter
    ? docs.filter(d => String(d.churchId) === churchFilter)
    : docs

  const churchName = (id: number) => churches.find(c => c.id === id)?.name || `Igreja ${id}`

  function formatSize(bytes?: number) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Layout crumbs={[{ label: 'Administração' }, { label: 'Documentações' }]} title="Documentações"
      action={{ label: 'Enviar Documento', icon: <Plus className="h-4 w-4" />, onClick: () => setOpen(true) }}>

      {/* Filtro por Igreja */}
      <Card className="mb-4 p-4">
        <Select label="Filtrar por Igreja" value={churchFilter}
          onChange={e => setChurchFilter(e.target.value)}>
          <option value="">Todas as Igrejas</option>
          {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </Select>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documentos Enviados ({filtered.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? <div className="py-8 text-center text-brand-300">Carregando...</div>
          : filtered.length === 0 ? <div className="py-8 text-center text-brand-300">Nenhum documento enviado.</div>
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
                      {d.congregationId && <Badge tone="purple">Congregação {d.congregationId}</Badge>}
                      <span className="text-xs text-brand-300">{d.fileName} · {formatSize(d.fileSize)}</span>
                      <span className="text-xs text-brand-300">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={`${FILES_BASE}${d.fileUrl}`} target="_blank" rel="noreferrer"
                      className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Download">
                      <Download className="h-4 w-4" />
                    </a>
                    <button onClick={() => handleDelete(d.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal Enviar Documento */}
      <Modal open={open} onClose={() => setOpen(false)} title="Enviar Documento"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </>
        }>
        <form onSubmit={handleSend} className="space-y-4">
          <Input label="Título do Documento" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />

          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5">Descrição (opcional)</p>
            <textarea rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500 resize-none"
              placeholder="Breve descrição do documento..." />
          </div>

          <Select label="Igreja Destino" value={form.churchId}
            onChange={async e => {
              setForm({ ...form, churchId: e.target.value, congregationId: '' })
              await loadCongregations(e.target.value)
            }}>
            <option value="">— Selecione a Igreja —</option>
            {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>

          {congregations.length > 0 && (
            <Select label="Congregação Destino (opcional)" value={form.congregationId}
              onChange={e => setForm({ ...form, congregationId: e.target.value })}>
              <option value="">Toda a Igreja</option>
              {congregations.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>
          )}

          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Arquivo
            </p>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-sm text-brand-500" required />
            {file && <p className="text-xs text-brand-300 mt-1">{file.name} ({formatSize(file.size)})</p>}
          </div>
        </form>
      </Modal>
    </Layout>
  )
}