/**
 * SecretariaDocumentos.tsx
 * Documentos da Igreja/Congregação do usuário — recebidos via ROOT ou
 * enviados pela própria Secretaria. Backend resolve churchId/congregationId
 * sempre pelo contexto do chamador (headers X-Church-Id/X-Congregation-Id);
 * o formulário de envio nem pergunta isso, porque não tem o que escolher.
 */
import { useState, useEffect } from 'react'
import { Download, FileText, Eye, Upload, Trash2, Plus } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { http } from '@/lib/http'

interface Doc {
  id: number
  title: string
  description?: string
  fileName: string
  fileUrl: string
  fileType?: string
  fileSize?: number
  createdAt: string
  congregationId?: number
}

const FILES_BASE = 'http://2.24.80.229:3000'

function formatSize(bytes?: number) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isPdf(d: Doc) { return d.fileType === 'application/pdf' || d.fileName.endsWith('.pdf') }
function isImage(d: Doc) { return d.fileType?.startsWith('image/') || false }

export default function SecretariaDocumentos() {
  const showToast = useToast()
  const { hasPermission, isRoot } = useApp()
  const canUpload = isRoot || hasPermission('SETTINGS_UPDATE')
  const [docs,     setDocs]     = useState<Doc[]>([])
  const [loading,  setLoading]  = useState(true)
  const [preview,  setPreview]  = useState<Doc | null>(null)
  const [open,     setOpen]     = useState(false)
  const [sending,  setSending]  = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => { loadDocs() }, [])

  function loadDocs() {
    setLoading(true)
    // Backend filtra pela Igreja/Congregação do usuário via headers
    http.get<any>('/documents', { page: 0, size: 200 })
      .then(res => {
        const raw = res?.data
        const list = raw?.data?.data || raw?.data?.content || raw?.data || []
        setDocs(Array.isArray(list) ? list : [])
      })
      .catch(() => showToast('Falha ao carregar documentos.'))
      .finally(() => setLoading(false))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !file) { showToast('Título e arquivo são obrigatórios.'); return }
    setSending(true)
    try {
      await http.upload('/documents', file, 'file', {
        title: form.title,
        ...(form.description ? { description: form.description } : {}),
      })
      showToast('Documento enviado.')
      setOpen(false)
      setForm({ title: '', description: '' })
      setFile(null)
      loadDocs()
    } catch (err: any) {
      showToast(err?.message || 'Falha ao enviar documento.')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este documento? Essa ação não pode ser desfeita.')) return
    try {
      await http.delete(`/documents/${id}`)
      showToast('Documento excluído.')
      loadDocs()
    } catch {
      showToast('Falha ao excluir documento.')
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Secretaria' }, { label: 'Documentos' }]}
      title="Documentos"
      action={canUpload
        ? { label: 'Enviar Documento', icon: <Plus className="h-4 w-4" />, onClick: () => setOpen(true) }
        : undefined}
    >

      <Card>
        <CardHeader><CardTitle>Documentos ({docs.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : docs.length === 0 ? (
            <div className="py-8 text-center text-brand-300">
              Nenhum documento ainda.
              <br />
              <span className="text-xs">
                {canUpload
                  ? 'Envie um documento ou aguarde um recebido pela administração.'
                  : 'Os documentos enviados pela administração aparecerão aqui.'}
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map(d => (
                <div key={d.id}
                  className="flex items-start gap-4 p-4 border border-brand-100 rounded-xl hover:bg-brand-50/30 transition-colors">
                  <FileText className="h-8 w-8 text-brand-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-brand-900">{d.title}</p>
                    {d.description && (
                      <p className="text-sm text-brand-400 mt-0.5">{d.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {d.congregationId && (
                        <Badge tone="purple">Específico da Congregação</Badge>
                      )}
                      {!d.congregationId && (
                        <Badge tone="blue">Toda a Igreja</Badge>
                      )}
                      <span className="text-xs text-brand-300">
                        {d.fileName} · {formatSize(d.fileSize)}
                      </span>
                      {d.createdAt && (
                        <span className="text-xs text-brand-300">
                          {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(isPdf(d) || isImage(d)) && (
                      <button onClick={() => setPreview(d)}
                        className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <a href={`${FILES_BASE}${d.fileUrl}`} target="_blank" rel="noreferrer"
                      className="p-1.5 rounded hover:bg-brand-50 text-brand-400" title="Download">
                      <Download className="h-4 w-4" />
                    </a>
                    {canUpload && (
                      <button onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-400" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Enviar Documento"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSend} className="space-y-4">
          <Input label="Título do Documento" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5">Descrição (opcional)</p>
            <textarea rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500 resize-none" />
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5 flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Arquivo
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-sm text-brand-500"
              required
            />
            {file && <p className="text-xs text-brand-300 mt-1">{file.name} ({formatSize(file.size)})</p>}
          </div>
          <p className="text-xs text-brand-300 bg-brand-50 rounded-lg px-3 py-2">
            O documento fica visível para a sua Igreja. Se você estiver dentro de uma Congregação específica,
            fica visível só para ela.
          </p>
        </form>
      </Modal>

      {/* Preview inline */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-brand-900/70 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-100">
              <p className="font-semibold text-brand-900">{preview.title}</p>
              <button onClick={() => setPreview(null)} className="text-brand-400 hover:text-brand-700">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {isPdf(preview) ? (
                <iframe src={`${FILES_BASE}${preview.fileUrl}`} className="w-full h-[75vh] rounded-lg border" />
              ) : (
                <img src={`${FILES_BASE}${preview.fileUrl}`} alt={preview.title}
                  className="max-w-full mx-auto rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}