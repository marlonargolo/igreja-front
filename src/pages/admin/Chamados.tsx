import { useState, useEffect, useRef } from 'react'
import { Plus, Send, AlertCircle } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { supportService, type SupportTicket } from '@/services/support.service'

const CATEGORIAS = ['Financeiro', 'Membros', 'Contabilidade', 'Acesso / Usuários', 'Configurações', 'Erro no sistema', 'Dúvida', 'Outro']

const STATUS_TONE: Record<string, 'green' | 'yellow' | 'blue' | 'gray'> = {
  ABERTO: 'yellow', EM_ATENDIMENTO: 'blue', AGUARDANDO: 'yellow', RESOLVIDO: 'green', FECHADO: 'gray',
}
const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto', EM_ATENDIMENTO: 'Em Atendimento', AGUARDANDO: 'Aguardando', RESOLVIDO: 'Resolvido', FECHADO: 'Fechado',
}
const PRIO_TONE: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  URGENTE: 'red', ALTA: 'orange', MEDIA: 'yellow', BAIXA: 'gray',
}

export default function Chamados() {
  const showToast = useToast()
  const { user } = useApp()
  const [chamados, setChamados] = useState<SupportTicket[]>([])
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [openNovo, setOpenNovo] = useState(false)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState({
    title: '', category: CATEGORIAS[0], priority: 'MEDIA', descricao: '',
  })

  useEffect(() => { loadTickets() }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.mensagens?.length])

  // Polling para atualizar mensagens a cada 10s
  useEffect(() => {
    if (!selected) return
    const interval = setInterval(async () => {
      try {
        const updated = await supportService.get(selected.id)
        setSelected(updated)
        setChamados(prev => prev.map(c => c.id === updated.id ? updated : c))
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [selected?.id])

  async function loadTickets() {
    setLoading(true)
    try {
      const list = await supportService.list()
      // Mapear campos do backend para o formato do frontend
      const mapped = list.map((t: any) => ({
        id: t.id,
        titulo: t.title || t.titulo,
        category: t.category,
        priority: t.priority || 'MEDIA',
        status: t.status,
        criadoEm: t.criadoEm || t.createdAt,
        mensagens: (t.mensagens || []).map((m: any) => ({
          id: m.id,
          autor: m.autor || m.author,
          texto: m.texto || m.message,
          tipo: m.tipo || m.type || 'cliente',
          dataHora: m.dataHora || m.createdAt,
        })),
      })) as SupportTicket[]
      setChamados(mapped)
    } catch {
      showToast('Falha ao carregar chamados.')
    } finally {
      setLoading(false)
    }
  }

  async function abrirChamado(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.descricao) { showToast('Preencha título e descrição.'); return }
    setSaving(true)
    try {
      const novo = await supportService.create(form)
      const mapped: SupportTicket = {
        id: novo.id,
        titulo: (novo as any).title || (novo as any).titulo,
        category: (novo as any).category,
        priority: (novo as any).priority || 'MEDIA',
        status: (novo as any).status,
        criadoEm: (novo as any).criadoEm || (novo as any).createdAt,
        mensagens: ((novo as any).mensagens || []).map((m: any) => ({
          id: m.id,
          autor: m.autor || m.author,
          texto: m.texto || m.message,
          tipo: m.tipo || m.type,
          dataHora: m.dataHora || m.createdAt,
        })),
      }
      setChamados(prev => [mapped, ...prev])
      showToast('Chamado aberto! Nossa equipe foi notificada.')
      setOpenNovo(false)
      setForm({ title: '', category: CATEGORIAS[0], priority: 'MEDIA', descricao: '' })
      setSelected(mapped)
    } catch {
      showToast('Falha ao abrir chamado.')
    } finally {
      setSaving(false)
    }
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim() || !selected) return
    setEnviando(true)
    try {
      const msg = await supportService.sendMessage(selected.id, novaMensagem)
      const mapped = {
        id: (msg as any).id,
        autor: (msg as any).autor || (msg as any).author,
        texto: (msg as any).texto || (msg as any).message,
        tipo: (msg as any).tipo || (msg as any).type || 'cliente' as const,
        dataHora: (msg as any).dataHora || (msg as any).createdAt,
      }
      const updatedSelected = { ...selected, mensagens: [...selected.mensagens, mapped] }
      setSelected(updatedSelected)
      setChamados(prev => prev.map(c => c.id === selected.id ? updatedSelected : c))
      setNovaMensagem('')
    } catch {
      showToast('Falha ao enviar mensagem.')
    } finally {
      setEnviando(false)
    }
  }

  async function fecharChamado(id: number) {
    try {
      await supportService.close(id)
      setChamados(prev => prev.map(c => c.id === id ? { ...c, status: 'FECHADO' } : c))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'FECHADO' } : null)
      showToast('Chamado encerrado.')
    } catch {
      showToast('Falha ao encerrar chamado.')
    }
  }

  const filtrados = chamados.filter(c =>
    filtroStatus === 'Todos' || c.status === filtroStatus
  )

  return (
    <Layout
      crumbs={[{ label: 'Suporte' }, { label: 'Chamados' }]}
      title="Chamados de Suporte"
      action={{ label: 'Abrir Chamado', icon: <Plus className="h-4 w-4" />, onClick: () => setOpenNovo(true) }}
    >
      <div className="grid lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Lista */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <Select label="" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="Todos">Todos os Status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="text-center text-brand-300 py-8">Carregando...</div>
            ) : filtrados.length === 0 ? (
              <div className="text-center text-brand-300 py-8">Nenhum chamado.</div>
            ) : filtrados.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selected?.id === c.id ? 'border-brand-800 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-brand-900 text-sm leading-tight">{c.titulo}</p>
                  <Badge tone={PRIO_TONE[c.priority]}>{c.priority}</Badge>
                </div>
                <p className="text-xs text-brand-300 mb-2">{c.category}</p>
                <div className="flex items-center justify-between">
                  <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  <span className="text-xs text-brand-300">
                    {c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        {selected ? (
          <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-100 flex items-start justify-between">
              <div>
                <p className="font-bold text-brand-900">{selected.titulo}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
                  <Badge tone={PRIO_TONE[selected.priority]}>{selected.priority}</Badge>
                  <span className="text-xs text-brand-300">#{selected.id}</span>
                </div>
              </div>
              {selected.status !== 'FECHADO' && selected.status !== 'RESOLVIDO' && (
                <Button size="sm" variant="outline" onClick={() => fecharChamado(selected.id)}>
                  Encerrar
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {(selected.mensagens || []).map(msg => (
                <div key={msg.id} className={`flex ${msg.tipo === 'cliente' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                    msg.tipo === 'cliente'
                      ? 'bg-brand-800 text-white rounded-tr-sm'
                      : 'bg-brand-50 text-brand-900 border border-brand-100 rounded-tl-sm'
                  }`}>
                    <p className={`text-xs font-semibold mb-1 ${msg.tipo === 'cliente' ? 'text-white/70' : 'text-brand-500'}`}>
                      {msg.autor}
                    </p>
                    <p className="leading-relaxed">{msg.texto}</p>
                    <p className={`text-xs mt-1 ${msg.tipo === 'cliente' ? 'text-white/50' : 'text-brand-300'}`}>
                      {msg.dataHora ? new Date(msg.dataHora).toLocaleString('pt-BR') : ''}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selected.status !== 'FECHADO' && selected.status !== 'RESOLVIDO' ? (
              <div className="px-5 py-4 border-t border-brand-100 flex gap-3">
                <input
                  value={novaMensagem}
                  onChange={e => setNovaMensagem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
                  placeholder="Digite sua mensagem... (Enter para enviar)"
                  className="flex-1 px-4 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500"
                />
                <Button onClick={enviarMensagem} disabled={enviando || !novaMensagem.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-brand-100 text-center text-sm text-brand-300">
                Este chamado está encerrado.
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center bg-brand-50/50 rounded-2xl border-2 border-dashed border-brand-100">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-brand-200 mx-auto mb-3" />
              <p className="text-brand-500 font-medium">Selecione um chamado para ver o histórico</p>
              <Button className="mt-4" onClick={() => setOpenNovo(true)}>
                <Plus className="h-4 w-4" /> Abrir Chamado
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal novo chamado */}
      <Modal
        open={openNovo}
        onClose={() => setOpenNovo(false)}
        title="Abrir Chamado de Suporte"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpenNovo(false)}>Cancelar</Button>
            <Button onClick={abrirChamado} disabled={saving}>
              {saving ? 'Enviando...' : 'Abrir Chamado'}
            </Button>
          </>
        }
      >
        <form onSubmit={abrirChamado} className="space-y-4">
          <Input
            label="Título do Chamado"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Ex: Erro ao confirmar lançamento financeiro"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoria" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Prioridade" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </Select>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5">Descrição do Problema</p>
            <textarea
              rows={5}
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descreva detalhadamente o problema..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500 resize-none"
              required
            />
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-xs text-brand-500">
            Ao abrir o chamado, nossa equipe receberá uma notificação. Você receberá atualizações no e-mail <strong>{user?.email}</strong>.
          </div>
        </form>
      </Modal>
    </Layout>
  )
}