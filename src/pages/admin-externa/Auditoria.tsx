// src/pages/admin-externa/Auditoria.tsx
import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, Pagination } from '@/components/ui/Misc'
import { useToast } from '@/components/ui/Extras'
import { useAdminExterna } from '@/lib/AdminExternaContext'
import { adminService, type AuditLogEntry } from '@/services/admin.service'

const ACTION_OPTIONS = [
  { value: '', label: 'Todas as ações' },
  { value: 'CHURCH_CREATED', label: 'Criação de Igreja' },
  { value: 'USER_CREATED', label: 'Criação de Usuário' },
  { value: 'FINANCE_UPDATED', label: 'Alteração Financeira' },
  { value: 'DOCUMENT_SENT', label: 'Envio de Documento' },
]

export default function Auditoria() {
  const showToast = useToast()
  const { churches } = useAdminExterna()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', churchId: '', userQuery: '', action: '' })

  useEffect(() => { load() }, [filters.dateFrom, filters.dateTo, filters.churchId, filters.action, page])

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const res = await adminService.auditLogs({
        page: page - 1, size: 20,
        dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined,
        churchId: filters.churchId || undefined, action: filters.action || undefined,
      })
      setLogs(res.data)
    } catch { setError(true); showToast('Falha ao carregar auditoria.') }
    finally { setLoading(false) }
  }

  const filtered = filters.userQuery
    ? logs.filter(l => (l.userName || '').toLowerCase().includes(filters.userQuery.toLowerCase()))
    : logs

  return (
    <AdminExternaLayout crumbs={[{ label: 'Auditoria' }]} title="Auditoria">
      <Card className="mb-4 p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input label="De" type="date" value={filters.dateFrom} onChange={e => { setFilters({ ...filters, dateFrom: e.target.value }); setPage(1) }} />
          <Input label="Até" type="date" value={filters.dateTo} onChange={e => { setFilters({ ...filters, dateTo: e.target.value }); setPage(1) }} />
          <Select label="Igreja" value={filters.churchId} onChange={e => { setFilters({ ...filters, churchId: e.target.value }); setPage(1) }}>
            <option value="">Todas</option>
            {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>
          <Input label="Usuário" placeholder="Nome do usuário..." value={filters.userQuery} onChange={e => setFilters({ ...filters, userQuery: e.target.value })} />
          <Select label="Ação" value={filters.action} onChange={e => { setFilters({ ...filters, action: e.target.value }); setPage(1) }}>
            {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Histórico de Ações ({filtered.length})</CardTitle></CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center text-brand-300">Carregando...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-400">Falha ao comunicar com o backend.</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Nenhum registro encontrado" description="Ajuste os filtros para ver outros períodos ou ações." />
          ) : (
            <>
              <Table>
                <Thead><tr><Th>Data/Hora</Th><Th>Ação</Th><Th>Usuário</Th><Th>Igreja</Th><Th>Detalhes</Th></tr></Thead>
                <tbody>
                  {filtered.map(l => (
                    <Tr key={l.id}>
                      <Td className="text-brand-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString('pt-BR')}</Td>
                      <Td><Badge tone="blue">{l.action}</Badge></Td>
                      <Td className="text-brand-700">{l.userName || '—'}</Td>
                      <Td className="text-brand-500">{l.churchName || '—'}</Td>
                      <Td className="text-brand-500">{l.description || '—'}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <div className="pt-4 flex justify-end">
                <Pagination page={page} total={Math.max(page, page + (logs.length === 20 ? 1 : 0))} onChange={setPage} />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </AdminExternaLayout>
  )
}
