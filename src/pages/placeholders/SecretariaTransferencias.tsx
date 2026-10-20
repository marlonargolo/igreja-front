/**
 * SecretariaTransferencias.tsx
 *
 * ISOLAMENTO:
 * - Membros: backend filtra pela Igreja do usuário automaticamente (sem churchId no request)
 * - Congregações destino: usa congregationsService (não churchesService)
 *   → backend retorna APENAS congregações da Igreja do usuário
 */
import { useState, useEffect, useCallback } from 'react'
import { ArrowRight } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Extras'
import { membersService, type MemberTransfer } from '@/services'
import { congregationsService, type Congregation } from '@/services/congregations.service'

export default function SecretariaTransferencias() {
  const showToast = useToast()
  const [members, setMembers]         = useState<any[]>([])
  const [congregations, setCongregations] = useState<Congregation[]>([])
  const [transfers, setTransfers]     = useState<MemberTransfer[]>([])
  const [loading, setLoading]         = useState(true)
  const [open, setOpen]               = useState(false)
  const [saving, setSaving]           = useState(false)
  const [form, setForm] = useState({
    memberId: '',
    congregacaoDestino: '',
    motivo: '',
  })

  const loadTransfers = useCallback(async () => {
    try {
      const res = await membersService.listTransfers({ size: 50 })
      const list = (res as any)?.data || []
      setTransfers(Array.isArray(list) ? list : [])
    } catch {
      setTransfers([])
    }
  }, [])

  useEffect(() => {
    Promise.all([
      // membersService.list() — backend aplica filtro de Igreja automaticamente
      membersService.list({ size: 200 }),
      // congregationsService.list() — backend retorna APENAS as da Igreja do usuário
      congregationsService.list({ page: 0, size: 200 }),
      loadTransfers(),
    ]).then(([mRes, cRes]) => {
      const mRaw = mRes as any
      const mList = mRaw?.data?.data || mRaw?.data?.content || mRaw?.data || []
      setMembers(Array.isArray(mList) ? mList : [])

      const cRaw = (cRes as any)?.data
      const cList = cRaw?.data?.data || cRaw?.data || cRaw?.content || []
      setCongregations(Array.isArray(cList) ? cList : [])
    }).catch(() => {
      showToast('Falha ao carregar dados.')
      setMembers([])
    }).finally(() => setLoading(false))
  }, [loadTransfers])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.memberId || !form.congregacaoDestino) {
      showToast('Selecione o membro e a congregação destino.')
      return
    }
    setSaving(true)
    try {
      await membersService.transfer(Number(form.memberId), Number(form.congregacaoDestino), form.motivo)
      showToast('Transferência registrada com sucesso.')
      setOpen(false)
      setForm({ memberId: '', congregacaoDestino: '', motivo: '' })
      await Promise.all([loadTransfers(), reloadMembers()])
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Falha ao registrar a transferência.')
    } finally {
      setSaving(false)
    }
  }

  async function reloadMembers() {
    try {
      const mRes = await membersService.list({ size: 200 })
      const mRaw = mRes as any
      const mList = mRaw?.data?.data || mRaw?.data?.content || mRaw?.data || []
      setMembers(Array.isArray(mList) ? mList : [])
    } catch { /* mantém a lista anterior */ }
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
          ) : transfers.length === 0 ? (
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
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Membro</Th><Th>De</Th><Th>Para</Th><Th>Motivo</Th><Th>Data</Th>
                </tr>
              </Thead>
              <tbody>
                {transfers.map(t => (
                  <Tr key={t.id}>
                    <Td className="font-semibold">{t.memberName}</Td>
                    <Td className="text-brand-500">{t.fromCongregationName || '—'}</Td>
                    <Td className="text-brand-500">{t.toCongregationName}</Td>
                    <Td className="text-brand-500">{t.reason || '—'}</Td>
                    <Td className="text-brand-500">
                      {new Date(t.transferredAt).toLocaleDateString('pt-BR')}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
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
            {congregations
              .filter(c => !selectedMember || String(c.id) !== String(selectedMember.congregationId))
              .map(c => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
          </Select>

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
