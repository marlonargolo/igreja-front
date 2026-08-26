import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Extras'
import { membersService } from '@/services'
import { churchesService, type Church } from '@/services/churches.service'

export default function SecretariaTransferencias() {
  const showToast = useToast()
  const [members, setMembers] = useState<any[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    memberId: '',
    congregacaoDestino: '',
    motivo: '',
    data: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    Promise.all([
      membersService.list({ size: 200 }),
      churchesService.list(),
    ]).then(([mRes, cList]) => {
      const raw = mRes as any
      const list = raw?.data?.data || raw?.data?.content || raw?.data || []
      setMembers(Array.isArray(list) ? list : [])
      setChurches(cList)
    }).catch(() => {
      showToast('Falha ao carregar dados.')
      setMembers([])
    }).finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.memberId || !form.congregacaoDestino) {
      showToast('Selecione o membro e a congregação destino.')
      return
    }
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    showToast('Transferência registrada com sucesso.')
    setOpen(false)
    setForm({ memberId: '', congregacaoDestino: '', motivo: '', data: new Date().toISOString().split('T')[0] })
    setSaving(false)
  }

  const selectedMember = members.find(m => String(m.id) === form.memberId)

  return (
    <Layout
      crumbs={[{ label: 'Secretaria' }, { label: 'Transferências' }]}
      title="Transferências de Membros"
      action={{ label: 'Nova Transferência', icon: <ArrowRight className="h-4 w-4" />, onClick: () => setOpen(true) }}
    >
      <Card>
        <CardHeader><CardTitle>Transferências Registradas</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : (
            <div className="py-8 text-center text-brand-300">
              Nenhuma transferência registrada.
              <br />
              <button
                onClick={() => setOpen(true)}
                className="mt-3 text-brand-700 font-semibold text-sm hover:underline"
              >
                Registrar agora
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova Transferência de Membro"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar Transferência'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Membro"
            value={form.memberId}
            onChange={e => setForm({ ...form, memberId: e.target.value })}
          >
            <option value="">— Selecione o membro —</option>
            {members.map(m => (
              <option key={m.id} value={String(m.id)}>{m.name}</option>
            ))}
          </Select>

          {selectedMember && (
            <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 text-sm text-brand-700">
              <p><strong>Congregação atual:</strong> {selectedMember.congregationName || '—'}</p>
              <p><strong>Status:</strong> {selectedMember.status}</p>
            </div>
          )}

          <Select
            label="Congregação Destino"
            value={form.congregacaoDestino}
            onChange={e => setForm({ ...form, congregacaoDestino: e.target.value })}
          >
            <option value="">— Selecione a congregação destino —</option>
            {churches.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </Select>

          <Input
            label="Data da Transferência"
            type="date"
            value={form.data}
            onChange={e => setForm({ ...form, data: e.target.value })}
          />

          <div>
            <p className="text-sm font-semibold text-brand-900 mb-1.5">Motivo</p>
            <textarea
              rows={3}
              value={form.motivo}
              onChange={e => setForm({ ...form, motivo: e.target.value })}
              placeholder="Motivo da transferência (opcional)..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-100 text-sm outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </form>
      </Modal>
    </Layout>
  )
}