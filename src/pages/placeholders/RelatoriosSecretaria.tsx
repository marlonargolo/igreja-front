import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Extras'
import { useConfig } from '@/lib/ConfigContext'
import { membersService, type Member } from '@/services'
import { churchesService, type Church } from '@/services/churches.service'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const GRUPOS_RELATORIO = [
  { key: 'aniversariantes', label: 'Aniversariantes do Mês' },
  { key: 'membros',         label: 'Relatório de Membros' },
  { key: 'obreiros',        label: 'Relatório de Obreiros' },
  { key: 'funcoes',         label: 'Relatório por Função' },
  { key: 'grupos',          label: 'Relatório por Grupo' },
  { key: 'ministerios',     label: 'Relatório por Ministério' },
  { key: 'congregacoes',    label: 'Relatório de Congregações' },
]

export default function RelatoriosSecretaria() {
  const showToast = useToast()
  const { config } = useConfig()
  const [grupo, setGrupo] = useState('aniversariantes')
  const [sub, setSub] = useState('')
  const [churchFilter, setChurchFilter] = useState('Todas')
  const [mes, setMes] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [generating, setGenerating] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [churches, setChurches] = useState<Church[]>([])

  useEffect(() => {
    Promise.all([
      membersService.list({ size: 500 }) as any,
      churchesService.list(),
    ]).then(([mRes, cList]) => {
      const raw = mRes as any
      setMembers(raw?.data || raw?.content || [])
      setChurches(cList)
    }).catch(() => showToast('Falha ao carregar dados.'))
  }, [])

  // Sub-opções dinâmicas do ConfigContext
  const SUB: Record<string, string[]> = {
    aniversariantes: [],
    membros:         ['Todos', ...config.statusMembros],
    obreiros:        ['Todos os Cargos', ...config.cargos],
    funcoes:         ['Todas as Funções', ...config.funcoes],
    grupos:          ['Todos os Grupos', ...config.grupos],
    ministerios:     ['Todos os Ministérios', ...config.ministerios],
    congregacoes:    [],
  }

  // Reset sub ao trocar grupo
  function selectGrupo(k: string) {
    setGrupo(k)
    const opts = SUB[k]
    setSub(opts?.[0] || '')
  }

  const subOptions = SUB[grupo] || []

  const byChurch = churchFilter === 'Todas'
    ? members
    : members.filter(m => String((m as any).churchId) === churchFilter)

  function statusToFilter(s: string): string {
    const lower = s.toLowerCase()
    if (lower.includes('ativo') && !lower.includes('in')) return 'ACTIVE'
    if (lower.includes('inativo')) return 'INACTIVE'
    if (lower.includes('visitor') || lower.includes('congregado')) return 'VISITOR'
    return s.toUpperCase()
  }

  async function generate() {
    setGenerating(true)
    try {
      if (grupo === 'congregacoes') { printCongregacoes(churches); return }

      let data: Member[] = byChurch
      let titulo = GRUPOS_RELATORIO.find(g => g.key === grupo)?.label || ''

      if (grupo === 'aniversariantes') {
        titulo = `Aniversariantes de ${MESES[parseInt(mes) - 1]}`
        data = data.filter(m => {
          if (!m.birthDate) return false
          return String(new Date(m.birthDate).getMonth() + 1).padStart(2, '0') === mes
        })
      }

      else if (grupo === 'membros') {
        if (sub && sub !== 'Todos') {
          const filterStatus = statusToFilter(sub)
          data = data.filter(m =>
            m.status === filterStatus ||
            m.status?.toLowerCase() === sub.toLowerCase()
          )
          titulo += ` — ${sub}`
        }
      }

      else if (grupo === 'obreiros') {
        if (sub !== 'Todos os Cargos' && sub) {
          data = data.filter(m => ((m as any).cargo || '').includes(sub))
          titulo += ` — ${sub}`
        } else {
          printSeparado(data, 'cargo', titulo, config.cargos)
          return
        }
      }

      else if (grupo === 'funcoes') {
        if (sub !== 'Todas as Funções' && sub) {
          data = data.filter(m => ((m as any).funcoes || '').includes(sub))
          titulo += ` — ${sub}`
        } else {
          printSeparado(data, 'funcoes', titulo, config.funcoes)
          return
        }
      }

      else if (grupo === 'grupos') {
        if (sub !== 'Todos os Grupos' && sub) {
          data = data.filter(m => ((m as any).funcoes || (m as any).grupo || '').includes(sub))
          titulo += ` — ${sub}`
        } else {
          printSeparado(data, 'grupo', titulo, config.grupos)
          return
        }
      }

      else if (grupo === 'ministerios') {
        if (sub !== 'Todos os Ministérios' && sub) {
          data = data.filter(m => ((m as any).funcoes || (m as any).ministerio || '').includes(sub))
          titulo += ` — ${sub}`
        } else {
          printSeparado(data, 'ministerio', titulo, config.ministerios)
          return
        }
      }

      printReport(data, titulo)
    } catch {
      showToast('Falha ao gerar relatório.')
    } finally {
      setGenerating(false)
    }
  }

  function churchLabel() {
    if (churchFilter === 'Todas') return 'Todas as Congregações'
    return churches.find(c => String(c.id) === churchFilter)?.name || ''
  }

  function printReport(data: Member[], titulo: string) {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = data.map(m => `<tr>
      <td>${m.name}</td><td>${m.email || '—'}</td><td>${m.phone || '—'}</td>
      <td>${(m as any).cargo || '—'}</td><td>${(m as any).funcoes || '—'}</td>
      <td>${m.status}</td>
      <td>${m.birthDate ? new Date(m.birthDate).toLocaleDateString('pt-BR') : '—'}</td>
    </tr>`).join('')
    win.document.write(`<html><head><title>${titulo}</title>
    <style>body{font-family:Arial;font-size:12px;padding:20px}
    h1{font-size:16px;color:#1E3A5F;margin-bottom:2px}
    .sub{color:#666;font-size:11px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    th{background:#1E3A5F;color:white;padding:8px;text-align:left;font-size:11px}
    td{padding:7px 8px;border-bottom:1px solid #eee;font-size:11px}
    tr:nth-child(even) td{background:#f9f9f9}</style></head><body>
    <h1>${titulo}</h1>
    <p class="sub">Congregação: ${churchLabel()} | Gerado em ${new Date().toLocaleString('pt-BR')} | Total: ${data.length}</p>
    <table><thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Cargo</th><th>Funções</th><th>Status</th><th>Nascimento</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function printSeparado(data: Member[], campo: string, titulo: string, valores: string[]) {
    const win = window.open('', '_blank')
    if (!win) return
    let html = ''
    valores.forEach(valor => {
      const grupo = data.filter(m => ((m as any)[campo] || (m as any).funcoes || (m as any).cargo || '').includes(valor))
      if (!grupo.length) return
      html += `<h2 style="color:#1E3A5F;margin-top:20px;border-bottom:1px solid #eee;padding-bottom:4px;font-size:13px">${valor} (${grupo.length})</h2>
      <table width="100%" style="border-collapse:collapse;margin-bottom:8px">
        <thead><tr style="background:#1E3A5F;color:white">
          <th style="padding:6px;font-size:11px;text-align:left">Nome</th>
          <th style="padding:6px;font-size:11px;text-align:left">Telefone</th>
          <th style="padding:6px;font-size:11px;text-align:left">E-mail</th>
          <th style="padding:6px;font-size:11px;text-align:left">Status</th>
        </tr></thead><tbody>
        ${grupo.map((m, i) => `<tr style="${i%2===0?'':'background:#f9f9f9'}">
          <td style="padding:6px;font-size:11px;border-bottom:1px solid #eee">${m.name}</td>
          <td style="padding:6px;font-size:11px;border-bottom:1px solid #eee">${m.phone||'—'}</td>
          <td style="padding:6px;font-size:11px;border-bottom:1px solid #eee">${m.email||'—'}</td>
          <td style="padding:6px;font-size:11px;border-bottom:1px solid #eee">${m.status}</td>
        </tr>`).join('')}
        </tbody></table>`
    })
    win.document.write(`<html><head><title>${titulo}</title>
    <style>body{font-family:Arial;padding:20px}h1{font-size:16px;color:#1E3A5F}</style></head>
    <body><h1>${titulo}</h1>
    <p style="color:#666;font-size:11px;margin-bottom:16px">Congregação: ${churchLabel()} | ${new Date().toLocaleString('pt-BR')}</p>
    ${html||'<p style="color:#666">Nenhum registro encontrado.</p>'}</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function printCongregacoes(list: Church[]) {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = list.map(c => `<tr>
      <td>${c.name}</td><td>${[c.city,c.state].filter(Boolean).join(', ')||'—'}</td>
      <td>${c.email||'—'}</td><td>${c.phone||'—'}</td><td>${c.cnpj||'—'}</td>
      <td>${c.status==='ACTIVE'?'Ativa':'Inativa'}</td></tr>`).join('')
    win.document.write(`<html><head><title>Congregações</title>
    <style>body{font-family:Arial;font-size:12px;padding:20px}
    h1{font-size:16px;color:#1E3A5F;margin-bottom:4px}
    table{width:100%;border-collapse:collapse}
    th{background:#1E3A5F;color:white;padding:8px;text-align:left;font-size:11px}
    td{padding:7px 8px;border-bottom:1px solid #eee;font-size:11px}
    tr:nth-child(even) td{background:#f9f9f9}</style></head><body>
    <h1>Relatório de Congregações</h1>
    <p style="color:#666;font-size:11px;margin-bottom:16px">Gerado em ${new Date().toLocaleString('pt-BR')} — Total: ${list.length}</p>
    <table><thead><tr><th>Nome</th><th>Cidade/UF</th><th>E-mail</th><th>Telefone</th><th>CNPJ</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <Layout crumbs={[{ label: 'Secretaria' }, { label: 'Relatórios' }]} title="Relatórios — Secretaria">

      {/* Aniversariantes em destaque no topo */}
      <Card className="mb-6 border-2 border-brand-200 bg-brand-50/50">
        <CardBody className="pt-5 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <p className="font-bold text-brand-900 mb-1">🎂 Aniversariantes do Mês</p>
            <p className="text-sm text-brand-400">Gera lista de membros aniversariantes no mês selecionado.</p>
          </div>
          <div className="flex items-end gap-3">
            <Select label="Mês" value={mes} onChange={e => setMes(e.target.value)}>
              {MESES.map((m, i) => (
                <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </Select>
            <Button onClick={() => { selectGrupo('aniversariantes'); setTimeout(generate, 100) }}>
              <Download className="h-4 w-4" /> Imprimir
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filtro de congregação */}
      <Card className="mb-4 p-4">
        <Select label="Congregação" value={churchFilter} onChange={e => setChurchFilter(e.target.value)}>
          <option value="Todas">Todas as Congregações</option>
          {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </Select>
      </Card>

      {/* Tipos de relatório */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {GRUPOS_RELATORIO.filter(g => g.key !== 'aniversariantes').map(g => (
          <button
            key={g.key}
            onClick={() => selectGrupo(g.key)}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              grupo === g.key ? 'border-brand-800 bg-brand-50' : 'border-brand-100 bg-white hover:border-brand-300'
            }`}
          >
            <span className={`font-semibold text-sm ${grupo === g.key ? 'text-brand-900' : 'text-brand-500'}`}>
              {g.label}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-opções dinâmicas */}
      {subOptions.length > 0 && (
        <Card className="mb-6">
          <CardBody className="pt-5">
            <p className="text-sm font-semibold text-brand-900 mb-3">Filtrar por</p>
            <div className="flex flex-wrap gap-2">
              {subOptions.map(s => (
                <button
                  key={s}
                  onClick={() => setSub(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    sub === s ? 'bg-brand-800 text-white border-brand-800' : 'bg-white text-brand-700 border-brand-200 hover:border-brand-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="pt-5 flex items-center gap-4">
          <Button onClick={generate} disabled={generating}>
            <Download className="h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar e Imprimir'}
          </Button>
          <p className="text-xs text-brand-300">{churchLabel()}</p>
        </CardBody>
      </Card>
    </Layout>
  )
}