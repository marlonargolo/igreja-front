// src/pages/admin-externa/ConfiguracoesGlobais.tsx
import { useEffect, useState } from 'react'
import { Save, AlertCircle, ShieldCheck, Mail, Plug } from 'lucide-react'
import { AdminExternaLayout } from '@/components/admin-externa/AdminExternaLayout'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Extras'
import { adminService, type GlobalSettings } from '@/services/admin.service'

export default function ConfiguracoesGlobais() {
  const showToast = useToast()
  const [settings, setSettings] = useState<GlobalSettings>({})
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminService.getGlobalSettings()
      .then(s => { if (s) setSettings(s); else setUnavailable(true) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const saved = await adminService.updateGlobalSettings(settings)
      setSettings(saved)
      showToast('Configurações globais salvas.')
    } catch {
      showToast('Falha ao salvar. Verifique se o endpoint de configurações globais está disponível.')
    } finally { setSaving(false) }
  }

  function set<K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <AdminExternaLayout crumbs={[{ label: 'Configurações Globais' }]} title="Configurações Globais"
      action={!unavailable ? <Button onClick={handleSave} disabled={saving || loading}><Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar Alterações'}</Button> : undefined}
    >
      {loading ? (
        <div className="py-12 text-center text-brand-300">Carregando...</div>
      ) : unavailable ? (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center gap-2 text-brand-400">
            <AlertCircle className="h-8 w-8 text-amber-400" />
            <p className="font-semibold text-brand-900">Endpoint de configurações globais indisponível.</p>
            <p className="text-sm">Assim que o backend expuser <code className="text-xs bg-brand-50 px-1.5 py-0.5 rounded">/settings/global</code>, esta tela passará a exibir e permitir a edição dos parâmetros.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Segurança e Política de Senha</CardTitle></CardHeader>
            <CardBody className="pt-2 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Tamanho mínimo da senha" type="number" min={6} value={settings.passwordMinLength ?? 8}
                  onChange={e => set('passwordMinLength', Number(e.target.value))} />
                <Input label="Timeout de sessão (minutos)" type="number" min={5} value={settings.sessionTimeoutMinutes ?? 60}
                  onChange={e => set('sessionTimeoutMinutes', Number(e.target.value))} />
              </div>
              <Switch checked={!!settings.passwordRequireNumber} onChange={v => set('passwordRequireNumber', v)} label="Exigir número na senha" />
              <Switch checked={!!settings.passwordRequireSpecialChar} onChange={v => set('passwordRequireSpecialChar', v)} label="Exigir caractere especial na senha" />
              <Switch checked={!!settings.twoFactorRequired} onChange={v => set('twoFactorRequired', v)} label="Exigir autenticação em duas etapas para ROOT e Administradores" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Configurações de E-mail</CardTitle></CardHeader>
            <CardBody className="pt-2 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Servidor SMTP" value={settings.smtpHost ?? ''} onChange={e => set('smtpHost', e.target.value)} />
                <Input label="Porta" type="number" value={settings.smtpPort ?? 587} onChange={e => set('smtpPort', Number(e.target.value))} />
                <Input label="Usuário SMTP" value={settings.smtpUser ?? ''} onChange={e => set('smtpUser', e.target.value)} />
                <Input label="E-mail de envio (from)" value={settings.smtpFrom ?? ''} onChange={e => set('smtpFrom', e.target.value)} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Plug className="h-4 w-4" /> Integrações</CardTitle></CardHeader>
            <CardBody className="pt-2 space-y-4">
              <Input label="Webhook de integração" value={settings.integrationWebhookUrl ?? ''} onChange={e => set('integrationWebhookUrl', e.target.value)} placeholder="https://..." />
              <Input label="Chave de API" value={settings.integrationApiKey ?? ''} onChange={e => set('integrationApiKey', e.target.value)} placeholder="••••••••" />
            </CardBody>
          </Card>
        </div>
      )}
    </AdminExternaLayout>
  )
}
