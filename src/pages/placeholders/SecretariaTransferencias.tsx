import { useEffect, useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Extras'
import { membersService, type Member } from '@/services'
import { churchesService, type Church } from '@/services/churches.service'

export default function SecretariaTransferencias() {
  const showToast = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Member | null>(null)
  const [destino, setDestino] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      membersService.list({ size: 100 }),
      churchesService.list(),
    ]).then(([mRes, cList]) => {
      const raw = mRes as any
      setMembers(raw?.data || raw?.content || [])
      setChurches(cList)
    }).catch(() => showToast('Falha ao carregar dados.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleTransfer() {
    if (!selected || !destino) { showToast('Selecione o membro e a unidade de destino.'); return }
    setSubmitting(true)
    try {
      await membersService.update(selected.id, { churchId: Number(destino) } as any)
      showToast(`${selected.name} transferido com sucesso.`)
      setSelected(null)
      setDestino('')
      const mRes = await membersService.list({ size: 100 }) as any
      setMembers(mRes?.data || mRes?.content || [])
    } catch {
      showToast('Falha ao realizar transferência.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout
      crumbs={[{ label: 'Secretaria' }, { label: 'Transferências' }]}
      title="Transferência de Membros"
    >
      <Card className="mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar membro pelo nome..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Membros — selecione para transferir</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-brand-300">Nenhum membro encontrado.</div>
          ) : (
            <div className="divide-y divide-brand-100">
              {filtered.map(m => (
                <div key={m.id} className="flex items-center justify-between py-3 px-2">
                  <div>
                    <p className="font-semibold text-brand-900">{m.name}</p>
                    <p className="text-xs text-brand-300">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={m.status === 'ACTIVE' ? 'green' : 'gray'}>{m.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => { setSelected(m); setDestino('') }}>
                      <ArrowRight className="h-3.5 w-3.5" /> Transferir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Transferir: ${selected?.name}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={handleTransfer} disabled={submitting || !destino}>
              {submitting ? 'Transferindo...' : 'Confirmar Transferência'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-brand-500">
            Selecione a unidade de destino. Após a confirmação, o membro será vinculado à nova unidade.
          </p>
          <Select
            label="Unidade de Destino"
            value={destino}
            onChange={e => setDestino(e.target.value)}
          >
            <option value="">— Selecione —</option>
            {churches
              .filter(c => String(c.id) !== String((selected as any)?.churchId))
              .map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.city}/{c.state}</option>
              ))
            }
          </Select>
        </div>
      </Modal>
    </Layout>
  )
}