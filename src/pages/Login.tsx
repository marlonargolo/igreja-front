import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cloud, Eye, EyeOff, Share2, Wallet, Users, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Input'
import { authService } from "@/services/auth.service"
import { useToast } from '@/components/ui/Extras'
import { useApp } from '@/lib/AppContext'

const features = [
  { icon: Share2, title: 'Gestão Multi-Igrejas', desc: 'Monitore sedes e congregações simultaneamente.' },
  { icon: Wallet, title: 'Controle Financeiro', desc: 'Entradas, dízimos, despesas e relatórios em tempo real.' },
  { icon: Users, title: 'Membros & Insights', desc: 'Acompanhe a frequência e a evolução de sua comunidade.' },
]

export default function Login() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { setUser } = useApp()
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState(() => localStorage.getItem('saved_email') || '')
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('saved_email')))
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const user = await authService.login({ email, password })
      
      // Salvar usuário no AppContext
      setUser(user)
      
      // Salvar no localStorage para persistência
      localStorage.setItem('user', JSON.stringify(user))
      
      if (remember) {
        localStorage.setItem('remember_me', 'true')
        localStorage.setItem('saved_email', email)
      } else {
        localStorage.removeItem('remember_me')
        localStorage.removeItem('saved_email')
      }
      
      if (user.churches && user.churches.length > 0) {
        navigate('/selecionar-igreja')
      } else {
        navigate('/dashboard')
      }
    } catch (error: any) {
      showToast(error?.message || 'Credenciais inválidas. Tente novamente.')
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-[46%] bg-brand-800 text-white px-14 py-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -left-16 bottom-24 h-56 w-56 rounded-full bg-white/5" />
        <div className="flex items-center gap-2.5 relative">
          <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center">
            <Cloud className="h-5 w-5 text-brand-800" fill="currentColor" />
          </div>
          <span className="font-extrabold text-xl">IgrejaHub</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Gestão inteligente para<br /> igrejas conectadas
          </h1>
          <p className="text-white/70 text-base max-w-md mb-10">
            Simplifique a administração de todas as suas congregações em um só ecossistema seguro, moderno e integrado.
          </p>
          <div className="space-y-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-white/60 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs relative">© 2026 IgrejaHub. Todos os direitos reservados.</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-white">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-extrabold text-brand-900">Boas-vindas ao hub</h2>
          <p className="text-brand-300 text-sm mt-1 mb-8">Faça login para gerenciar sua igreja conectada.</p>
          <div className="space-y-4">
            <Input
              label="E-mail profissional"
              type="email"
              placeholder="exemplo@igrejahub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <div className="relative">
              <Input
                label="Sua senha"
                type={showPass ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-[38px] text-brand-300 hover:text-brand-700"
                disabled={isLoading}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={remember} onChange={setRemember} />
              <span className="text-sm text-brand-700">Lembrar-me</span>
            </label>
            <button
              type="button"
              className="text-sm font-semibold text-brand-700 hover:underline"
              onClick={() => navigate('/forgot-password')}
            >
              Esqueci minha senha
            </button>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Entrando...
              </div>
            ) : 'Entrar na plataforma'}
          </Button>
          
        </form>
      </div>
    </div>
  )
}