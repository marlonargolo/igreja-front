import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Construction } from 'lucide-react'
export default function AdminAparencia() {
  return (
    <Layout crumbs={[{ label: 'Administração' }, { label: 'Aparência' }]} title="Aparência">
      <Card><CardBody className="py-20 flex flex-col items-center gap-4">
        <Construction className="h-10 w-10 text-brand-200" />
        <p className="text-brand-300">Personalização de cores e logo disponível em breve.</p>
      </CardBody></Card>
    </Layout>
  )
}