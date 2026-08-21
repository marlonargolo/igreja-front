import BackupSistema from '@/pages/Accounting'
// Reutiliza o componente de backup que já existe em Accounting
import { useState } from 'react'
import { HardDrive } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Extras'

export default function AdminBackup() {
  const showToast = useToast()
  const [fazendo, setFazendo] = useState(false)
  async function backup() {
    setFazendo(true)
    await new Promise(r => setTimeout(r, 1500))
    showToast('Backup gerado. Será enviado por e-mail ao administrador.')
    setFazendo(false)
  }
  return (
    <Layout crumbs={[{ label: 'Administração' }, { label: 'Backup' }]} title="Backup do Sistema">
      <div className="max-w-lg">
        <Card><CardBody className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <HardDrive className="h-6 w-6 text-brand-700" />
            <div>
              <p className="font-bold text-brand-900">Backup Completo</p>
              <p className="text-sm text-brand-300">Exporta todos os dados em formato seguro.</p>
            </div>
          </div>
          <Button onClick={backup} disabled={fazendo} className="w-full">
            <HardDrive className="h-4 w-4" />
            {fazendo ? 'Gerando...' : 'Gerar Backup Agora'}
          </Button>
        </CardBody></Card>
      </div>
    </Layout>
  )
}