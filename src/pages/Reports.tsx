// src/pages/Reports.tsx
import { useState, useEffect } from 'react'
import { Users, Wallet, Share2, Package, Landmark, Activity, Download } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, Thead, Tr, Th, Td } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { reportsService, type ReportJob } from '@/services'

const reportCards = [
  { title: 'Relatório de Membros', category: 'Membros', color: 'bg-blue-50 text-blue-600' },
  { title: 'Relatório Financeiro', category: 'Financeiro', color: 'bg-green-50 text-green-600' },
  { title: 'Relatório de Congregações', category: 'Membros', color: 'bg-purple-50 text-purple-600' },
  { title: 'Relatório de Patrimônio', category: 'Patrimônio', color: 'bg-yellow-50 text-yellow-600' },
  { title: 'Relatório Contábil', category: 'Contábil', color: 'bg-red-50 text-red-600' },
  { title: 'Relatório de Atividades', category: 'Atividades', color: 'bg-indigo-50 text-indigo-600' },
]

const icons: Record<string, any> = {
  'Relatório de Membros': Users,
  'Relatório Financeiro': Wallet,
  'Relatório de Congregações': Share2,
  'Relatório de Patrimônio': Package,
  'Relatório Contábil': Landmark,
  'Relatório de Atividades': Activity,
}

const typeTone: Record<string, 'blue' | 'green' | 'yellow' | 'purple'> = {
  Financeiro: 'green',
  Membros: 'blue',
  Contábil: 'yellow',
  Patrimônio: 'purple',
  Atividades: 'purple',
}

export default function Reports() {
  const { showToast } = useToast()
  const [reports, setReports] = useState<ReportJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsService.list({ page: 0, size: 10 })
      .then(res => setReports(res.data || []))
      .catch(() => showToast({ title: 'Erro', description: 'Falha ao carregar relatórios.', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [])

  async function generateReport(type: string) {
    try {
      const job = await reportsService.create({
        name: `${type} - ${new Date().toLocaleDateString()}`,
        type: type.toUpperCase() as any,
        format: 'PDF',
      })
      showToast({ title: 'Gerando relatório', description: 'O relatório será baixado automaticamente.' })
      // Poll até completar
      const completed = await reportsService.pollUntilComplete(job.id)
      if (completed.fileUrl) {
        window.open(reportsService.downloadUrl(job.id), '_blank')
      }
    } catch (err) {
      showToast({ title: 'Erro', description: 'Falha ao gerar relatório.', variant: 'destructive' })
    }
  }

  return (
    <Layout crumbs={[{ label: 'Igreja Sede' }, { label: 'Relatórios' }]} title="Painel de Relatórios" searchPlaceholder="Filtrar relatórios...">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {reportCards.map((r) => {
          const Icon = icons[r.title] ?? Activity
          return (
            <Card key={r.title} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${r.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-bold text-brand-300 uppercase tracking-wide">{r.category}</span>
              </div>
              <h3 className="font-bold text-brand-900 mb-1.5">{r.title}</h3>
              <p className="text-sm text-brand-300 mb-4 leading-relaxed">Gere um relatório completo em PDF.</p>
              <Button className="w-full" onClick={() => generateReport(r.title.replace('Relatório de ', ''))}>Gerar Relatório</Button>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Relatórios Gerados Recentemente</CardTitle>
          <button className="text-sm font-semibold text-brand-700 hover:underline">Ver Histórico Completo</button>
        </CardHeader>
        <CardBody className="pt-2">
          {loading ? (
            <div className="py-8 text-center">Carregando...</div>
          ) : reports.length === 0 ? (
            <div className="py-8 text-center text-brand-300">Nenhum relatório gerado recentemente.</div>
          ) : (
            <Table>
              <Thead><tr><Th>Nome do Arquivo</Th><Th>Tipo</Th><Th>Gerado em</Th><Th>Solicitado por</Th><Th className="text-right">Download</Th></tr></Thead>
              <tbody>
                {reports.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-semibold">{r.name}</Td>
                    <Td><Badge tone={typeTone[r.type] || 'gray'}>{r.type}</Badge></Td>
                    <Td className="text-brand-500">{new Date(r.createdAt).toLocaleString()}</Td>
                    <Td className="text-brand-500">{r.requestedBy}</Td>
                    <Td className="text-right">
                      {r.status === 'COMPLETED' ? (
                        <button onClick={() => window.open(reportsService.downloadUrl(r.id), '_blank')} className="text-brand-500 hover:text-brand-800 inline-flex">
                          <Download className="h-4 w-4" />
                        </button>
                      ) : (
                        <Badge tone="yellow">{r.status}</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}