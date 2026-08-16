// src/pages/Members.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Pencil, ChevronDown } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Input'
import { Pagination, EmptyState } from '@/components/ui/Misc'
import { membersService, type Member } from '@/services'
import { useToast } from '@/components/ui/Extras'

const statusTone: Record<string, 'green' | 'gray' | 'blue'> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  VISITOR: 'blue',
}

const PAGE_SIZE = 8

export default function Members() {
  const navigate = useNavigate()
  const showToast = useToast()
  const [query, setQuery] = useState('')
  const [congregation, setCongregation] = useState('Todas')
  const [status, setStatus] = useState('Todas')
  const [role, setRole] = useState('Todas')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [congregationOptions, setCongregationOptions] = useState<string[]>(['Todas'])
  const [roleOptions, setRoleOptions] = useState<string[]>(['Todas'])

  useEffect(() => {
    loadMembers()
  }, [query, congregation, status, role, page])

  async function loadMembers() {
    setLoading(true)
    try {
      const params: any = {
        page,
        size: PAGE_SIZE,
        search: query || undefined,
        status: status !== 'Todas' ? status : undefined,
        role: role !== 'Todas' ? role : undefined,
        congregationId: congregation !== 'Todas' ? Number(congregation) : undefined,
        // churchId será adicionado pelo service
      }
      const res = await membersService.list(params)
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setMembers(list)
      setTotal(res.meta?.total || res.data?.meta?.total || list.length)
      // Extrair opções de filtro
      const congSet = new Set(res.data.map(m => m.congregationName || '—'))
      setCongregationOptions(['Todas', ...Array.from(congSet)])
      const roleSet = new Set(res.data.map(m => m.role))
      setRoleOptions(['Todas', ...Array.from(roleSet)])
    } catch (err: any) {
      console.error('Erro ao carregar membros:', err)
      showToast('Falha ao carregar membros.')
      // Fallback para não quebrar
      setMembers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageItems = members

  function toggleAll() {
    setSelected(selected.length === pageItems.length ? [] : pageItems.map((m) => m.id))
  }

  return (
    <Layout
      crumbs={[{ label: 'Igreja Sede' }, { label: 'Membros' }]}
      title="Membros"
      searchPlaceholder="Buscar membros..."
      action={{ label: 'Novo Membro', icon: <UserPlus className="h-4 w-4" />, onClick: () => navigate('/membros/novo') }}
    >
      <Card className="p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0) }}
              placeholder="Pesquisar por nome, e-mail ou cargo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-100 bg-brand-50/50 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-brand-300"
            />
          </div>
          <FilterSelect
            value={congregation}
            onChange={(v) => { setCongregation(v); setPage(0) }}
            options={congregationOptions}
            label="Congregação"
          />
          <FilterSelect
            value={status}
            onChange={(v) => { setStatus(v); setPage(0) }}
            options={['Todas', 'ACTIVE', 'INACTIVE', 'VISITOR']}
            label="Status"
          />
          <FilterSelect
            value={role}
            onChange={(v) => { setRole(v); setPage(0) }}
            options={roleOptions}
            label="Função"
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="py-8 text-center">Carregando...</div>
        ) : pageItems.length === 0 ? (
          <EmptyState title="Nenhum membro encontrado" description="Ajuste os filtros de busca ou cadastre um novo membro." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th className="w-10"><Checkbox checked={selected.length === pageItems.length} onChange={toggleAll} /></Th>
                <Th>Foto</Th>
                <Th>Nome</Th>
                <Th>E-mail</Th>
                <Th>Telefone</Th>
                <Th>Congregação</Th>
                <Th>Função</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <tbody>
              {pageItems.map((m) => (
                <Tr key={m.id} className="cursor-pointer" onClick={() => navigate(`/membros/${m.id}`)}>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.includes(m.id)}
                      onChange={() =>
                        setSelected((s) =>
                          s.includes(m.id) ? s.filter((x) => x !== m.id) : [...s, m.id]
                        )
                      }
                    />
                  </Td>
                  <Td>
                    <img
                      src={m.avatarUrl || 'https://i.pravatar.cc/150'}
                      className="h-9 w-9 rounded-full object-cover"
                      alt=""
                    />
                  </Td>
                  <Td className="font-semibold">{m.name}</Td>
                  <Td className="text-brand-500">{m.email}</Td>
                  <Td className="text-brand-500">{m.phone}</Td>
                  <Td>{m.congregationName || '—'}</Td>
                  <Td>{m.role}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone[m.status]}>{m.status}</Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/membros/${m.id}/editar`) }}
                        className="text-brand-300 hover:text-brand-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-brand-100">
          <p className="text-sm text-brand-300">
            Mostrando {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} de {total} membros
          </p>
          <Pagination page={page + 1} total={totalPages} onChange={(p) => setPage(p - 1)} />
        </div>
      </Card>
    </Layout>
  )
}

function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3.5 pr-9 py-2.5 rounded-lg border border-brand-100 bg-white text-sm text-brand-700 outline-none focus:border-brand-500 cursor-pointer min-w-[150px]"
      >
        {options.map((o) => <option key={o} value={o}>{o === 'Todas' ? label : o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-300 pointer-events-none" />
    </div>
  )
}