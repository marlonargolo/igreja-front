// src/pages/Settings.tsx
import { useState, useEffect } from 'react'
import { Camera, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/format'
import { useToast } from '@/hooks/useToast'
import { settingsService, type OrganizationSettings } from '@/services'

const sections = ['Dados da Igreja', 'Aparência', 'Notificações', 'Integrações', 'Backup e Segurança', 'Assinatura']

export default function Settings() {
  const [active, setActive] = useState('Dados da Igreja')
  const [org, setOrg] = useState<OrganizationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    settingsService.getOrganization()
      .then(data => setOrg(data))
      .catch(() => showToast('mensagem'))
      .finally(() => setLoading(false))
  }, [])

  function handleClick(section: string) {
    if (section === 'Assinatura') {
      navigate('/configuracoes/assinatura')
      return
    }
    setActive(section)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!org) return
    setSaving(true)
    try {
      await settingsService.updateOrganization(org)
      showToast('mensagem')
    } catch (err) {
      showToast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout crumbs={[{ label: 'Painel' }, { label: 'Configurações' }]} title="Configurações do Sistema">
        <div className="flex items-center justify-center h-64">Carregando...</div>
      </Layout>
    )
  }

  return (
    <Layout
      crumbs={[{ label: 'Painel' }, { label: 'Configurações' }]}
      title="Configurações do Sistema"
      searchPlaceholder="Buscar no painel..."
    >
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Card className="p-3 h-fit">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => handleClick(s)}
                className={cn(
                  'w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                  active === s ? 'bg-brand-800 text-white' : 'text-brand-700 hover:bg-brand-50'
                )}
              >
                {s}
                {s === 'Assinatura' && <CreditCard className="h-3.5 w-3.5 opacity-70" />}
              </button>
            ))}
          </nav>
        </Card>

        <Card>
          <CardBody className="pt-6">
            {active === 'Dados da Igreja' && (
              <form onSubmit={handleSave}>
                <h3 className="font-bold text-brand-900 text-lg">Informações Gerais da Igreja</h3>
                <p className="text-sm text-brand-300 mt-1 mb-6">Atualize os dados institucionais oficiais.</p>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-brand-100">
                  <div className="h-16 w-16 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center overflow-hidden">
                    {org?.logoUrl ? <img src={org.logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <Camera className="h-5 w-5 text-brand-300" />}
                  </div>
                  <div>
                    <Button variant="outline" size="sm" onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/png,image/jpeg'
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          try {
                            // Usar upload se houver endpoint
                            showToast({ title: 'Em breve', description: 'Upload de logo será implementado.' })
                          } catch (err) {
                            showToast({ title: 'Erro', description: 'Falha no upload.', variant: 'destructive' })
                          }
                        }
                      }
                      input.click()
                    }}>
                      Alterar Logotipo
                    </Button>
                    <p className="text-xs text-brand-300 mt-1.5">Formatos: PNG, JPG. Máx. 2MB.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Input label="Nome da Igreja Sede" value={org?.name || ''} onChange={(e) => setOrg(prev => prev ? { ...prev, name: e.target.value } : null)} required />
                  <Input label="CNPJ" value={org?.cnpj || ''} onChange={(e) => setOrg(prev => prev ? { ...prev, cnpj: e.target.value } : null)} />
                  <Input label="Endereço" value={org?.address || ''} onChange={(e) => setOrg(prev => prev ? { ...prev, address: e.target.value } : null)} />
                  <Input label="CEP" value={org?.zipCode || ''} onChange={(e) => setOrg(prev => prev ? { ...prev, zipCode: e.target.value } : null)} />
                  <Input label="Telefone" value={org?.phone || ''} onChange={(e) => setOrg(prev => prev ? { ...prev, phone: e.target.value } : null)} />
                  <Input label="E-mail" type="email" value={org?.email || ''} onChange={(e) => setOrg(prev => prev ? { ...prev, email: e.target.value } : null)} />
                </div>
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-brand-100">
                  <Button type="button" variant="outline">Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
                </div>
              </form>
            )}
            {active === 'Aparência' && (
              <>
                <h3 className="font-bold text-brand-900 text-lg">Aparência</h3>
                <p className="text-sm text-brand-300 mt-1 mb-6">Personalize a identidade visual.</p>
                <div className="grid grid-cols-4 gap-3 max-w-md">
                  {['#203B59', '#315C86', '#4B739B', '#172536'].map((c) => (
                    <button key={c} className="h-14 rounded-xl border-2 border-brand-100 hover:border-brand-800" style={{ background: c }} onClick={() => {
                      showToast({ title: 'Em breve', description: 'Alteração de cor primária será implementada.' })
                    }} />
                  ))}
                </div>
              </>
            )}
            {active === 'Notificações' && (
              <>
                <h3 className="font-bold text-brand-900 text-lg">Notificações</h3>
                <p className="text-sm text-brand-300 mt-1 mb-6">Escolha como deseja ser notificado.</p>
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-900">E-mail</span>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-900">Push</span>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-900">SMS</span>
                    <Switch checked={false} onChange={() => {}} />
                  </div>
                </div>
              </>
            )}
            {active === 'Integrações' && (
              <>
                <h3 className="font-bold text-brand-900 text-lg">Integrações</h3>
                <p className="text-sm text-brand-300 mt-1 mb-6">Conecte o IgrejaHub a outras ferramentas (disponível em breve).</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {['Google Workspace', 'PIX Automático', 'WhatsApp Business', 'Mailchimp'].map((i) => (
                    <div key={i} className="border border-brand-100 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-900">{i}</span>
                      <Button size="sm" variant="outline" disabled>Em breve</Button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {active === 'Backup e Segurança' && (
              <>
                <h3 className="font-bold text-brand-900 text-lg">Backup e Segurança</h3>
                <p className="text-sm text-brand-300 mt-1 mb-6">Gerencie a segurança da conta e backups.</p>
                <div className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-900">2FA</span>
                    <Switch checked={false} onChange={() => showToast({ title: 'Em breve', description: '2FA será configurado.' })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-900">Backup automático</span>
                    <Switch checked={true} onChange={() => {}} />
                  </div>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </Layout>
  )
}