/**
 * SecretariaDocumentos.tsx
 * Documentos recebidos via ROOT — visíveis pela Igreja/Congregação destino.
 * Backend filtra automaticamente pelo contexto do usuário via header X-Church-Id.
 */
import { useState, useEffect } from 'react'
import { Download, FileText, Eye } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Extras'
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
  const [docs,     setDocs]     = useState<Doc[]>([])
  const [loading,  setLoading]  = useState(true)
  const [preview,  setPreview]  = useState<Doc | null>(null)

  useEffect(() => {
    // Backend filtra pela Igreja do usuário via header X-Church-Id
    http.get<any>('/documents', { page: 0, size: 200 })
      .then(res => {
        const raw = res?.data
        const list = raw?.data?.data || raw?.data?.content || raw?.data || []
        setDocs(Array.isArray(list) ? list : [])
      })
      .catch(() => showToast('Falha ao carregar documentos.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout crumbs={[{ label: 'Secretaria' }, { label: 'Documentos' }]} title="Documentos Recebidos">

      <Card>
        <CardHeader><CardTitle>Documentos ({docs.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : docs.length === 0 ? (
            <div className="py-8 text-center text-brand-300">
              Nenhum documento recebido ainda.
              <br />
              <span className="text-xs">Os documentos enviados pela administração aparecerão aqui.</span>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

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