import { useEffect, useState } from 'react'
import { ShieldCheck, Plus } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Extras'
import { usersService } from '@/services'

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ROOT: 'Acesso total ao sistema. Reservado para suporte IgrejaHub.',
  ADMIN: 'Administrador da organização. Acesso a todos os módulos.',
  PASTOR_PRINCIPAL: 'Acesso a membros, congregações e relatórios.',
  TESOUREIRO: 'Acesso total ao módulo financeiro e contábil.',
  SECRETARIO: 'Cadastro e consulta de membros.',
  USUARIO: 'Acesso básico de leitura.',
}

const ROLE_TONE: Record<string, 'yellow' | 'green' | 'purple' | 'orange' | 'blue' | 'gray'> = {
  ROOT: 'yellow',
  ADMIN: 'green',
  PASTOR_PRINCIPAL: 'purple',
  TESOUREIRO: 'orange',
  SECRETARIO: 'blue',
  USUARIO: 'gray',
}

export default function PerfisPage() {
  const showToast = useToast()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    usersService.getRoles()
      .then(res => {
        const raw = res as any
        setProfiles(raw?.data || raw || [])
      })
      .catch(() => showToast('Falha ao carregar perfis.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout
      crumbs={[{ label: 'Configurações' }, { label: 'Perfis e Permissões' }]}
      title="Perfis e Permissões"
    >
      {loading ? (
        <div className="flex justify-center py-20 text-brand-300">Carregando...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p: any) => (
            <Card key={p.id || p.name}>
              <CardBody className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-500" />
                    <p className="font-bold text-brand-900">{p.name}</p>
                  </div>
                  <Badge tone={ROLE_TONE[p.name] || 'gray'}>{p.name}</Badge>
                </div>
                <p className="text-sm text-brand-300">
                  {ROLE_DESCRIPTIONS[p.name] || 'Perfil de acesso customizado.'}
                </p>
                {p.permissions && p.permissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-brand-100">
                    <p className="text-xs text-brand-300 mb-2">{p.permissions.length} permissões</p>
                    <div className="flex flex-wrap gap-1">
                      {p.permissions.slice(0, 5).map((perm: any) => (
                        <span key={perm.id || perm.name} className="text-[10px] bg-brand-50 text-brand-500 px-1.5 py-0.5 rounded">
                          {perm.name || perm}
                        </span>
                      ))}
                      {p.permissions.length > 5 && (
                        <span className="text-[10px] text-brand-300">+{p.permissions.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardBody className="pt-5">
          <p className="text-sm font-bold text-brand-900 mb-3">Como funcionam os perfis</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-brand-500">
            <p>Os perfis são atribuídos no cadastro de cada usuário em <strong>Configurações → Usuários</strong>.</p>
            <p>Perfis como ROOT e ADMIN têm acesso irrestrito. Perfis como SECRETARIO e TESOUREIRO têm acesso somente às áreas pertinentes.</p>
          </div>
        </CardBody>
      </Card>
    </Layout>
  )
}