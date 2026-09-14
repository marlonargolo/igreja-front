// src/components/admin-externa/CredentialsModal.tsx
//
// Exibição única das credenciais de um usuário recém-criado pela
// Administração Externa (ex.: administrador de uma nova Igreja).
// A senha só é mostrada aqui — depois de fechado, não há como recuperá-la.
import { useState } from 'react'
import { Copy, Check, AlertTriangle, KeyRound } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface Credentials {
  name: string
  email: string
  password: string
}

export function CredentialsModal({
  open, onClose, credentials, title = 'Administrador criado com sucesso',
}: {
  open: boolean
  onClose: () => void
  credentials: Credentials | null
  title?: string
}) {
  const [copied, setCopied] = useState(false)

  if (!credentials) return null

  async function handleCopy() {
    const text = `Nome: ${credentials!.name}\nE-mail: ${credentials!.email}\nSenha: ${credentials!.password}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard indisponível — usuário copia manualmente */ }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <p><strong>Esta senha será exibida apenas uma vez.</strong> Copie e repasse com segurança ao administrador antes de fechar esta janela.</p>
        </div>

        <div className="rounded-xl border border-brand-100 divide-y divide-brand-100 overflow-hidden">
          <Row label="Nome" value={credentials.name} />
          <Row label="E-mail" value={credentials.email} />
          <Row label="Senha" value={credentials.password} mono />
        </div>

        <Button variant="outline" className="w-full" onClick={handleCopy}>
          {copied
            ? <><Check className="h-4 w-4 text-green-600" /> Credenciais copiadas</>
            : <><Copy className="h-4 w-4" /> Copiar credenciais</>}
        </Button>

        <p className="text-xs text-brand-400 flex items-start gap-1.5">
          <KeyRound className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Oriente o administrador a alterar a senha no primeiro acesso.
        </p>
      </div>
    </Modal>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-brand-50/40">
      <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">{label}</span>
      <span className={mono ? 'text-sm font-mono font-bold text-brand-900' : 'text-sm font-medium text-brand-900'}>{value}</span>
    </div>
  )
}
