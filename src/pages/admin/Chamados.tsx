import { useState, useEffect, useRef } from 'react'
import { Plus, Send, Paperclip, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'

interface Mensagem {
  id: number
  autor: string
  texto: string
  dataHora: string
  tipo: 'cliente' | 'suporte'
}

interface Chamado {
  id: number
  titulo: string
  categoria: string
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO'
  criadoEm: string
  mensagens: Mensagem[]
}

const CATEGORIAS = ['Financeiro', 'Membros', 'Contabilidade', 'Acesso / Usuários', 'Configurações', 'Erro no sistema', 'Dúvida', 'Outro']
const PRIORIDADES: { value: Chamado['prioridade']; label: string }[] = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
]

const STATUS_TONE: Record<string, 'green' | 'yellow' | 'blue' | 'gray' | 'red'> = {
  ABERTO: 'yellow',
  EM_ATENDIMENTO: 'blue',
  AGUARDANDO: 'yellow',
  RESOLVIDO: 'green',
  FECHADO: 'gray',
}

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto',
  EM_ATENDIMENTO: 'Em Atendimento',
  AGUARDANDO: 'Aguardando',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado',
}

const PRIORIDADE_TONE: Record<string, 'red' | 'orange' | 'yellow' | 'gray'> = {
  URGENTE: 'red', ALTA: 'orange', MEDIA: 'yellow', BAIXA: 'gray',
}

export default function Chamados() {
  const showToast = useToast()
  const { user, church } = useApp()
  const [chamados, setChamados] = useState<Chamado[]>([
    {
      id: 1,
      titulo: 'Erro ao confirmar lançamento financeiro',
      categoria: 'Financeiro',
      prioridade: 'ALTA',
      status: 'EM_ATENDIMENTO',
      criadoEm: '2026-08-19T10:00:00',
      mensagens: [
        { id: 1, autor: 'Admin', texto: 'Ao tentar confirmar lançamento de dízimo, o sistema retorna erro 500.', dataHora: '2026-08-19T10:00:00', tipo: 'cliente' },
        { id: 2, autor: 'Suporte IgrejaHub', texto: 'Identificamos o problema. Estamos trabalhando na correção. Em breve atualizaremos.', dataHora: '2026-08-19T10:30:00', tipo: 'suporte' },
      ],
    },
  ])
  const [openNovo, setOpenNovo] = useState(false)
  const [selectedChamado, setSelectedChamado] = useState<Chamado | null>(null)
  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [form, setForm] = useState({
    titulo: '', categoria: CATEGORIAS[0], prioridade: 'MEDIA' as Chamado['prioridade'], descricao: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedChamado) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedChamado?.mensagens])

  const filtrados = chamados.filter(c =>
    filtroStatus === 'Todos' || c.status === filtroStatus
  )

  async function abrirChamado(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo || !form.descricao) { showToast('Preencha título e descrição.'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))

    const novoChamado: Chamado = {
      id: Date.now(),
      titulo: form.titulo,
      categoria: form.categoria,
      prioridade: form.prioridade,
      status: 'ABERTO',
      criadoEm: new Date().toISOString(),
      mensagens: [{
        id: Date.now(),
        autor: user?.name || 'Usuário',
        texto: form.descricao,
        dataHora: new Date().toISOString(),
        tipo: 'cliente',
      }],
    }
    setChamados(prev => [novoChamado, ...prev])

    // Simular envio de email de notificação
    showToast(`Chamado aberto! Nossa equipe foi notificada por e-mail e responderá em breve.`)
    setOpenNovo(false)
    setForm({ titulo: '', categoria: CATEGORIAS[0], prioridade: 'MEDIA', descricao: '' })
    setSaving(false)
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim() || !selectedChamado) return
    setEnviando(true)
    await new Promise(r => setTimeout(r, 400))

    const msg: Mensagem = {
      id: Date.now(),
      autor: user?.name || 'Usuário',
      texto: novaMensagem,
      dataHora: new Date().toISOString(),
      tipo: 'cliente',
    }

    setChamados(prev => prev.map(c =>
      c.id === selectedChamado.id
        ? { ...c, mensagens: [...c.mensagens, msg] }
        : c
    ))
    setSelectedChamado(prev => prev ? { ...prev, mensagens: [...prev.mensagens, msg] } : prev)
    setNovaMensagem('')
    setEnviando(false)

    // Simular resposta automática do suporte após 2s
    setTimeout(() => {
      const resposta: Mensagem = {
        id: Date.now() + 1,
        autor: 'Suporte IgrejaHub',
        texto: 'Recebemos sua mensagem e notificamos nossa equipe de suporte. Você receberá uma resposta por e-mail em breve.',
        dataHora: new Date().toISOString(),
        tipo: 'suporte',
      }
      setChamados(prev => prev.map(c =>
        c.id === selectedChamado.id
          ? { ...c, mensagens: [...c.mensagens, resposta], status: 'EM_ATENDIMENTO' }
          : c
      ))
      setSelectedChamado(prev => prev ? {
        ...prev,
        mensagens: [...prev.mensagens, resposta],
        status: 'EM_ATENDIMENTO',
      } : prev)
    }, 2000)
  }

  function fecharChamado(id: number) {
    setChamados(prev => prev.map(c => c.id === id ? { ...c, status: 'FECHADO' } : c))
    if (selectedChamado?.id === id) setSelectedChamado(prev => prev ? { ...prev, status: 'FECHADO' } : null)
    showToast('Chamado encerrado.')
  }

  return (
    <Layout
      crumbs={[{ label: 'Suporte' }, { label: 'Chamados' }]}
      title="Chamados de Suporte"
      action={{ label: 'Abrir Chamado', icon: <Plus className="h-4 w-4" />, onClick: () => setOpenNovo(true) }}
    >
      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Lista de chamados */}
        <div className="flex flex-col gap-3">
          <Select label="" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="Todos">Todos os Status</option>
            {Object.keys(STATUS_LABEL).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </Select>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtrados.length === 0 ? (
              <div className="text-center text-brand-300 py-8">Nenhum chamado encontrado.</div>
            ) : (
              filtrados.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChamado(c)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedChamado?.id === c.id ? 'border-brand-800 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-brand-900 text-sm leading-tight">{c.titulo}</p>
                    <Badge tone={PRIORIDADE_TONE[c.prioridade]}>{c.prioridade}</Badge>
                  </div>
                  <p className="text-xs text-brand-300 mb-2">{c.categoria}</p>
                  <div className="flex items-center justify-between">
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                    <span className="text-xs text-brand-300">
                      {new Date(c.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat do chamado */}
        {selectedChamado ? (
          <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-brand-100 shadow-card overflow-hidden">
            {/* Header do chat */}
            <div className="px-5 py-4 border-b border-brand-100 flex items-start justify-between">
              <div>
                <p className="font-bold text-brand-900">{selectedChamado.titulo}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge tone={STATUS_TONE[selectedChamado.status]}>{STATUS_LABEL[selectedChamado.status]}</Badge>
                  <Badge tone={PRIORIDADE_TONE[selectedChamado.prioridade]}>{selectedChamado.prioridade}</Badge>
                  <span className="text-xs text-brand-300"># {selectedChamado.id}</span>
                </div>
              </div>
              {selectedChamado.status !== 'FECHADO' && selectedChamado.status !== 'RESOLVIDO' && (
                <Button size="sm" variant="outline" onClick={() => fecharChamado(selectedChamado.id)}>
                  Encerrar
                </Button>
              )}
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedChamado.mensagens.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.tipo === 'cliente' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                      msg.tipo === 'cliente'
                        ? 'bg-brand-800 text-white rounded-tr-sm'
                        : 'bg-brand-50 text-brand-900 border border-brand-100 rounded-tl-sm'
                    }`}
                  >
                    <p className={`text-xs font-semibold mb-1 ${msg.tipo === 'cliente' ? 'text-white/70' : 'text-brand-500'}`}>
                      {msg.autor}
                    </p>
                    <p className="leading-relaxed">{msg.texto}</p>
                    <p className={`text-xs mt-1 ${msg.tipo === 'cliente' ? 'text-white/50' : 'text-brand-300'}`}>
                      {new Date(msg.dataHora).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensagem */}
            {selectedChamado.status !== 'FECHADO' && selectedChamado.status !== 'RESOLVIDO' ? (
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
              <p className="text-brand-300 text-sm mt-1">ou abra um novo chamado de suporte</p>
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
            value={form.titulo}
            onChange={e => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ex: Erro ao confirmar lançamento financeiro"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoria" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Prioridade" value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value as any })}>
              {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5">Descrição do Problema</p>
            <textarea
              rows={5}
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descreva detalhadamente o problema, incluindo os passos para reproduzi-lo..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500 resize-none"
              required
            />
          </div>
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-3 text-xs text-brand-500">
            Ao abrir o chamado, nossa equipe receberá um e-mail de notificação. Você também receberá atualizações no e-mail cadastrado (<strong>{user?.email}</strong>).
          </div>
        </form>
      </Modal>
    </Layout>
  )
}