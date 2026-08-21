import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Construction } from 'lucide-react'

export default function TesourariaPlaceholder({ title }: { title: string }) {
  return (
    <Layout crumbs={[{ label: 'Tesouraria' }, { label: title }]} title={title}>
      <Card>
        <CardBody className="py-20 flex flex-col items-center justify-center text-center gap-4">
          <Construction className="h-10 w-10 text-brand-200" />
          <p className="text-brand-900 font-bold text-lg">{title}</p>
          <p className="text-brand-300 text-sm max-w-sm">
            Esta funcionalidade está sendo implementada. Em breve estará disponível.
          </p>
        </CardBody>
      </Card>
    </Layout>
  )
}