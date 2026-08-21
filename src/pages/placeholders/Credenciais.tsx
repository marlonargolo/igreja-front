import { useEffect, useState } from 'react'
import { Printer, Search } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'
import { membersService, type Member } from '@/services'

export default function Credenciais() {
  const showToast = useToast()
  const { church } = useApp()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    membersService.list({ size: 200 })
      .then(res => {
        const raw = res as any
        setMembers(raw?.data || raw?.content || [])
      })
      .catch(() => showToast('Falha ao carregar membros.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) && m.status === 'ACTIVE'
  )

  function toggle(id: number) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(m => m.id)))
  }

  function printSelected() {
    const toPrint = members.filter(m => selected.has(m.id))
    if (toPrint.length === 0) { showToast('Selecione ao menos um membro.'); return }

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return

    const cards = toPrint.map(m => `
      <div class="card">
        <div class="header">
          <h2>${church?.name || 'IgrejaHub'}</h2>
          <p>Credencial de Membro</p>
        </div>
        <div class="body">
          <img src="${m.avatarUrl || 'https://i.pravatar.cc/150?u=' + m.email}" />
          <div class="info">
            <h3>${m.name}</h3>
            <p><strong>Cargo:</strong> ${(m as any).cargo || '—'}</p>
            <p><strong>RG:</strong> ${(m as any).rg || '—'}</p>
            <p><strong>CPF:</strong> ${(m as any).cpf || '—'}</p>
            <p><strong>Membro desde:</strong> ${m.memberSince ? new Date(m.memberSince).toLocaleDateString('pt-BR') : '—'}</p>
          </div>
        </div>
        <div class="footer">
          <span>Emitida em ${new Date().toLocaleDateString('pt-BR')}</span>
          <span>${m.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}</span>
        </div>
      </div>
    `).join('')

    win.document.write(`
      <html><head><title>Credenciais</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .card { background: white; border: 2px solid #1E3A5F; border-radius: 12px; padding: 0; overflow: hidden; break-inside: avoid; }
        .header { background: #1E3A5F; color: white; padding: 12px 16px; }
        .header h2 { font-size: 14px; margin: 0; }
        .header p { font-size: 11px; opacity: 0.8; margin: 2px 0 0; }
        .body { display: flex; gap: 12px; padding: 14px 16px; align-items: flex-start; }
        img { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #1E3A5F; shrink: 0; }
        .info h3 { font-size: 14px; color: #1E3A5F; margin-bottom: 4px; }
        .info p { font-size: 11px; color: #555; margin: 2px 0; }
        .footer { padding: 8px 16px; border-top: 1px solid #eee; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
        @media print { body { background: white; } }
      </style></head>
      <body><div class="grid">${cards}</div></body></html>
    `)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }

  return (
    <Layout
      crumbs={[{ label: 'Secretaria' }, { label: 'Credenciais' }]}
      title="Credenciais de Membros"
      action={{ label: `Imprimir (${selected.size})`, icon: <Printer className="h-4 w-4" />, onClick: printSelected }}
    >
      <Card className="mb-4 p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar membro..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <Button variant="outline" onClick={selectAll}>
          {selected.size === filtered.length ? 'Desmarcar todos' : 'Selecionar todos'}
        </Button>
      </Card>

      <Card>
        <CardHeader><CardTitle>Membros Ativos — {filtered.length}</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : (
            <div className="divide-y divide-brand-100">
              {filtered.map(m => (
                <label key={m.id} className="flex items-center gap-4 py-3 px-2 cursor-pointer hover:bg-brand-50/40">
                  <input
                    type="checkbox"
                    checked={selected.has(m.id)}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 rounded border-brand-200"
                  />
                  <img src={m.avatarUrl || 'https://i.pravatar.cc/150?u=' + m.email} className="h-9 w-9 rounded-full object-cover" alt="" />
                  <div className="flex-1">
                    <p className="font-semibold text-brand-900">{m.name}</p>
                    <p className="text-xs text-brand-300">{(m as any).cargo || 'Membro'}</p>
                  </div>
                  <Badge tone="green">Ativo</Badge>
                </label>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}