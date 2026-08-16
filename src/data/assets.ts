import type { Asset } from '@/types'

export const assets: Asset[] = [
  { code: 'PAT-001', description: 'Templo Central de Curitiba', category: 'Imóveis', congregation: 'Sede Curitiba Centro', originalValue: 550000, currentValue: 650000, status: 'Ativo', location: 'Av. Sete de Setembro, 4520', responsible: 'Pr. Carlos Santos' },
  { code: 'PAT-014', description: 'Chevrolet Spin (7 lugares)', category: 'Veículos', congregation: 'Congregação Água Verde', originalValue: 115000, currentValue: 98500, status: 'Ativo', location: 'Garagem Sede', responsible: 'Marcos Vinícius' },
  { code: 'PAT-032', description: 'Mesa de Som Behringer X32', category: 'Equipamentos', congregation: 'Sede Curitiba Centro', originalValue: 18200, currentValue: 14500, status: 'Em Manutenção', location: 'Sala de Mídia', responsible: 'Lucas Pereira' },
  { code: 'PAT-045', description: 'Terreno para Futuro Templo', category: 'Imóveis', congregation: 'Congregação Batel', originalValue: 100000, currentValue: 100000, status: 'Ativo', location: 'Rua Comendador Araújo', responsible: 'Ricardo Dias' },
  { code: 'PAT-051', description: 'Projetor Laser Epson 5000L', category: 'Equipamentos', congregation: 'Congregação Cabral', originalValue: 8900, currentValue: 6300, status: 'Ativo', location: 'Salão Principal', responsible: 'Fernanda Alves' },
  { code: 'PAT-078', description: 'Ar Condicionado Split 24000 BTUs', category: 'Equipamentos', congregation: 'Ponto Sítio Cercado', originalValue: 4500, currentValue: 3200, status: 'Ativo', location: 'Recepção', responsible: 'Mariana Costa' },
  { code: 'PAT-082', description: 'Van Mercedes Sprinter', category: 'Veículos', congregation: 'Sede Curitiba Centro', originalValue: 210000, currentValue: 178000, status: 'Ativo', location: 'Garagem Sede', responsible: 'Diego Martins' },
  { code: 'PAT-091', description: 'Piano Digital Yamaha P-125', category: 'Equipamentos', congregation: 'Congregação Central', originalValue: 6200, currentValue: 4800, status: 'Baixado', location: 'Sala de Louvor', responsible: 'Camila Ferreira' },
]

export const assetCategories = ['Todas', 'Imóveis', 'Veículos', 'Equipamentos']
