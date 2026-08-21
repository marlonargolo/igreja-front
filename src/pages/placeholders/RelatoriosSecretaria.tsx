import { useState, useEffect, useMemo } from 'react'
import { Download } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Extras'
import { membersService, type Member } from '@/services'
import { churchesService, type Church } from '@/services/churches.service'

const GRUPOS_RELATORIO = [
  { key: 'membros',      label: 'Relatório de Membros' },
  { key: 'obreiros',     label: 'Relatório de Obreiros' },
  { key: 'funcoes',      label: 'Relatório por Função' },
  { key: 'grupos',       label: 'Relatório por Grupo' },
  { key: 'ministerios',  label: 'Relatório por Ministério' },
  { key: 'congregacoes', label: 'Relatório de Congregações' },
]

const SUB: Record<string, string[]> = {
  membros:     ['Todos', 'Ativos', 'Inativos', 'Transferidos', 'Visitantes', 'Aniversariantes do Mês'],
  obreiros:    ['Todos os Cargos', 'Pastores', 'Presbíteros', 'Diáconos', 'Missionários', 'Obreiros'],
  funcoes:     ['Todas as Funções', 'Músicos', 'Professores EBD', 'Líderes de Jovens', 'Líderes de Louvor', 'Auxiliares'],
  grupos:      ['Todos os Grupos', 'Grupo de Louvor', 'Grupo de Jovens', 'Grupo de Crianças', 'Grupo de Casais'],
  ministerios: ['Todos os Ministérios', 'Jovens', 'Crianças', 'União de Senhoras', 'Varões', 'Ação Social'],
  congregacoes: [],
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function RelatoriosSecretaria() {
  const showToast = useToast()
  const [grupo, setGrupo] = useState('membros')
  const [sub, setSub] = useState('Todos')
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

  // Ao trocar grupo, resetar sub para o primeiro item
  function selectGrupo(key: string) {
    setGrupo(key)
    const opts = SUB[key]
    setSub(opts?.[0] || '')
  }

  const subOptions = SUB[grupo] || []

  // Filtrar por congregação
  const byChurch = useMemo(() =>
    churchFilter === 'Todas'
      ? members
      : members.filter(m => String((m as any).churchId) === churchFilter),
    [members, churchFilter]
  )

  async function generate() {
    setGenerating(true)
    try {
      if (grupo === 'congregacoes') {
        printCongregacoes(churches)
        return
      }

      let data: Member[] = byChurch
      let titulo = GRUPOS_RELATORIO.find(g => g.key === grupo)?.label || ''
      let separadoPorCampo = false

      if (grupo === 'membros') {
        titulo += ` — ${sub}`
        if (sub === 'Ativos')       data = data.filter(m => m.status === 'ACTIVE')
        else if (sub === 'Inativos')    data = data.filter(m => m.status !== 'ACTIVE' && m.status !== 'VISITOR')
        else if (sub === 'Visitantes')  data = data.filter(m => m.status === 'VISITOR')
        else if (sub === 'Transferidos') data = data.filter(m => (m as any).transferred === true)
        else if (sub === 'Aniversariantes do Mês') {
          data = data.filter(m => {
            if (!m.birthDate) return false
            return String(new Date(m.birthDate).getMonth() + 1).padStart(2,'0') === mes
          })
          titulo += ` — ${MESES[parseInt(mes) - 1]}`
        }
      }

      else if (grupo === 'obreiros') {
        const CARGO_MAP: Record<string, string[]> = {
          'Pastores':    ['Pastor(a)', 'Pastor'],
          'Presbíteros': ['Presbítero'],
          'Diáconos':    ['Diácono', 'Diaconisa'],
          'Missionários':['Missionário(a)', 'Missionário'],
          'Obreiros':    ['Obreiro'],
        }
        if (sub === 'Todos os Cargos') {
          separadoPorCampo = true
          printSeparadoPorCampo(data, 'cargo', 'Relatório de Obreiros por Cargo',
            ['Pastor(a)','Pastor','Presbítero','Missionário(a)','Missionário','Diácono','Diaconisa','Obreiro'])
          return
        } else {
          const cargos = CARGO_MAP[sub] || [sub]
          data = data.filter(m => cargos.some(c => ((m as any).cargo || '').includes(c)))
          titulo += ` — ${sub}`
        }
      }

      else if (grupo === 'funcoes') {
        const FUNC_MAP: Record<string, string> = {
          'Músicos':          'Músico',
          'Professores EBD':  'Professor EBD',
          'Líderes de Jovens':'Líder de Jovens',
          'Líderes de Louvor':'Líder de Louvor',
          'Auxiliares':       'Auxiliar',
        }
        if (sub === 'Todas as Funções') {
          printSeparadoPorCampo(data, 'funcoes', 'Relatório por Função',
            ['Músico','Professor EBD','Líder de Jovens','Líder de Louvor','Auxiliar'])
          return
        } else {
          const funcao = FUNC_MAP[sub] || sub
          data = data.filter(m => ((m as any).funcoes || '').includes(funcao))
          titulo += ` — ${sub}`
        }
      }

      else if (grupo === 'grupos') {
        if (sub === 'Todos os Grupos') {
          printSeparadoPorCampo(data, 'grupo', 'Relatório por Grupo',
            ['Grupo de Louvor','Grupo de Jovens','Grupo de Crianças','Grupo de Casais'])
          return
        } else {
          data = data.filter(m => ((m as any).grupo || (m as any).funcoes || '').includes(sub))
          titulo += ` — ${sub}`
        }
      }

      else if (grupo === 'ministerios') {
        if (sub === 'Todos os Ministérios') {
          printSeparadoPorCampo(data, 'ministerio', 'Relatório por Ministério',
            ['Jovens','Crianças','União de Senhoras','Varões','Ação Social'])
          return
        } else {
          data = data.filter(m => ((m as any).ministerio || (m as any).funcoes || '').includes(sub))
          titulo += ` — ${sub}`
        }
      }

      printReport(data, titulo)
    } catch {
      showToast('Falha ao gerar relatório.')
    } finally {
      setGenerating(false)
    }
  }

  function printReport(data: Member[], titulo: string) {
    const win = window.open('', '_blank')
    if (!win) return
    const churchLabel = churchFilter !== 'Todas'
      ? churches.find(c => String(c.id) === churchFilter)?.name || ''
      : 'Todas as Congregações'

    const rows = data.map(m => `<tr>
      <td>${m.name}</td>
      <td>${m.email || '—'}</td>
      <td>${m.phone || '—'}</td>
      <td>${(m as any).cargo || '—'}</td>
      <td>${(m as any).funcoes || '—'}</td>
      <td>${m.status === 'ACTIVE' ? 'Ativo' : m.status === 'VISITOR' ? 'Visitante' : 'Inativo'}</td>
      <td>${m.birthDate ? new Date(m.birthDate).toLocaleDateString('pt-BR') : '—'}</td>
    </tr>`).join('')

    win.document.write(`<html><head><title>${titulo}</title>
    <style>
      body{font-family:Arial;font-size:12px;padding:20px}
      h1{font-size:16px;color:#1E3A5F;margin-bottom:2px}
      .sub{color:#666;font-size:11px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{background:#1E3A5F;color:white;padding:8px;text-align:left;font-size:11px}
      td{padding:7px 8px;border-bottom:1px solid #eee;font-size:11px}
      tr:nth-child(even) td{background:#f9f9f9}
    </style></head><body>
    <h1>${titulo}</h1>
    <p class="sub">
      Congregação: ${churchLabel} &nbsp;|&nbsp;
      Gerado em ${new Date().toLocaleString('pt-BR')} &nbsp;|&nbsp;
      Total: ${data.length} registros
    </p>
    <table>
      <thead><tr>
        <th>Nome</th><th>E-mail</th><th>Telefone</th>
        <th>Cargo</th><th>Funções</th><th>Status</th><th>Nascimento</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function printSeparadoPorCampo(data: Member[], campo: string, titulo: string, valores: string[]) {
    const win = window.open('', '_blank')
    if (!win) return
    const churchLabel = churchFilter !== 'Todas'
      ? churches.find(c => String(c.id) === churchFilter)?.name || ''
      : 'Todas as Congregações'

    let html = ''
    valores.forEach(valor => {
      const grupo = data.filter(m => {
        const v = (m as any)[campo] || (m as any).funcoes || (m as any).cargo || ''
        return v.includes(valor)
      })
      if (grupo.length === 0) return
      html += `
        <h2 style="color:#1E3A5F;margin-top:24px;border-bottom:1px solid #eee;padding-bottom:4px;font-size:13px">
          ${valor} (${grupo.length})
        </h2>
        <table width="100%" style="border-collapse:collapse;margin-bottom:8px">
          <thead><tr style="background:#1E3A5F;color:white">
            <th style="padding:6px;font-size:11px;text-align:left">Nome</th>
            <th style="padding:6px;font-size:11px;text-align:left">Telefone</th>
            <th style="padding:6px;font-size:11px;text-align:left">E-mail</th>
            <th style="padding:6px;font-size:11px;text-align:left">Status</th>
          </tr></thead>
          <tbody>
          ${grupo.map((m, i) => `
            <tr style="${i % 2 === 0 ? '' : 'background:#f9f9f9'}">
              <td style="padding:6px;font-size:11px;border-bottom:1px solid #eee">${m.name}</td>
              <td style="padding:6px;font-size:11px;border-bottom:1px solid #eee">${m.phone || '—'}</td>
              <td style="padding:6px;font-size:11px;border-bottom:1px solid #eee">${m.email || '—'}</td>
              <td style="padding:6px;font-size:11px;border-bottom:1px solid #eee">${m.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</td>
            </tr>`).join('')}
          </tbody>
        </table>`
    })

    win.document.write(`<html><head><title>${titulo}</title>
    <style>body{font-family:Arial;padding:20px}h1{font-size:16px;color:#1E3A5F}</style></head>
    <body>
    <h1>${titulo}</h1>
    <p style="color:#666;font-size:11px;margin-bottom:16px">
      Congregação: ${churchLabel} &nbsp;|&nbsp; Gerado em ${new Date().toLocaleString('pt-BR')}
    </p>
    ${html || '<p style="color:#666">Nenhum registro encontrado.</p>'}
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  function printCongregacoes(list: Church[]) {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = list.map(c => `<tr>
      <td>${c.name}</td>
      <td>${[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${c.phone || '—'}</td>
      <td>${c.cnpj || '—'}</td>
      <td>${c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}</td>
    </tr>`).join('')

    win.document.write(`<html><head><title>Relatório de Congregações</title>
    <style>
      body{font-family:Arial;font-size:12px;padding:20px}
      h1{font-size:16px;color:#1E3A5F;margin-bottom:4px}
      p{color:#666;font-size:11px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{background:#1E3A5F;color:white;padding:8px;text-align:left;font-size:11px}
      td{padding:7px 8px;border-bottom:1px solid #eee;font-size:11px}
      tr:nth-child(even) td{background:#f9f9f9}
    </style></head><body>
    <h1>Relatório de Congregações</h1>
    <p>Gerado em ${new Date().toLocaleString('pt-BR')} — Total: ${list.length} congregações</p>
    <table>
      <thead><tr>
        <th>Nome</th><th>Cidade/UF</th><th>E-mail</th><th>Telefone</th><th>CNPJ</th><th>Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 400)
  }

  return (
    <Layout crumbs={[{ label: 'Secretaria' }, { label: 'Relatórios' }]} title="Relatórios — Secretaria">

      {/* Filtro de congregação + mês */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <Select
            label="Congregação"
            value={churchFilter}
            onChange={e => setChurchFilter(e.target.value)}
          >
            <option value="Todas">Todas as Congregações</option>
            {churches.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </Select>
          {grupo === 'membros' && sub === 'Aniversariantes do Mês' && (
            <Select label="Mês" value={mes} onChange={e => setMes(e.target.value)}>
              {MESES.map((m, i) => (
                <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
              ))}
            </Select>
          )}
        </div>
      </Card>

      {/* Seleção do tipo de relatório */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {GRUPOS_RELATORIO.map(g => (
          <button
            key={g.key}
            onClick={() => selectGrupo(g.key)}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              grupo === g.key
                ? 'border-brand-800 bg-brand-50'
                : 'border-brand-100 bg-white hover:border-brand-300'
            }`}
          >
            <span className={`font-semibold text-sm ${grupo === g.key ? 'text-brand-900' : 'text-brand-500'}`}>
              {g.label}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-opções */}
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
                    sub === s
                      ? 'bg-brand-800 text-white border-brand-800'
                      : 'bg-white text-brand-700 border-brand-200 hover:border-brand-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Gerar */}
      <Card>
        <CardBody className="pt-5 flex items-center gap-4">
          <Button onClick={generate} disabled={generating}>
            <Download className="h-4 w-4" />
            {generating ? 'Gerando...' : 'Gerar e Imprimir'}
          </Button>
          <p className="text-xs text-brand-300">
            {churchFilter !== 'Todas'
              ? `Filtrando: ${churches.find(c => String(c.id) === churchFilter)?.name}`
              : 'Consolidado de todas as congregações'}
          </p>
        </CardBody>
      </Card>
    </Layout>
  )
}