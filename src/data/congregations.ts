import type { Congregation } from '@/types'

export const congregations: Congregation[] = [
  {
    id: 'CNG-001', name: 'Igreja Central de Curitiba', city: 'Curitiba', state: 'PR',
    members: 1247, subCongregations: 8, tag: 'Pastor Principal', pastor: 'Pr. Carlos Eduardo',
    image: 'https://images.unsplash.com/photo-1548625149-720134bb1cb2?w=800&q=80',
    income: 45890, expense: 23456,
  },
  {
    id: 'CNG-002', name: 'Igreja Sudoeste', city: 'Cascavel', state: 'PR',
    members: 420, subCongregations: 3, tag: 'Administrador', pastor: 'Pr. André Nascimento',
    image: 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?w=800&q=80',
    income: 15200, expense: 8900,
  },
  {
    id: 'CNG-003', name: 'IgrejaHub Norte', city: 'Londrina', state: 'PR',
    members: 310, subCongregations: null, tag: 'Pastor Auxiliar', pastor: 'Pr. Diego Martins',
    image: 'https://images.unsplash.com/photo-1548032885-b5e38734688a?w=800&q=80',
    income: 9800, expense: 4200,
  },
  {
    id: 'CNG-004', name: 'Igreja Central de Ponta Grossa', city: 'Ponta Grossa', state: 'PR',
    members: 240, subCongregations: 2, tag: 'Pastor Principal', pastor: 'Pr. Vinícius Amaral',
    image: 'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=800&q=80',
    income: 7600, expense: 3100,
  },
  {
    id: 'CNG-005', name: 'Congregação Água Verde', city: 'Curitiba', state: 'PR',
    members: 180, subCongregations: null, tag: 'Congregação', pastor: 'Pb. Marcos Vinícius',
    image: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&q=80',
    income: 8900, expense: 5400,
  },
  {
    id: 'CNG-006', name: 'Congregação Batel', city: 'Curitiba', state: 'PR',
    members: 125, subCongregations: null, tag: 'Congregação', pastor: 'Pb. Ricardo Dias',
    image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80',
    income: 6300, expense: 4100,
  },
]

export const congregationDetail = {
  history: 'Fundada em 1998, a Igreja Central de Curitiba é a sede administrativa da rede IgrejaHub no Paraná, reunindo múltiplas congregações e pontos de pregação sob uma mesma governança.',
  services: [
    { day: 'Domingo', time: '09h00 e 18h00', name: 'Culto de Celebração' },
    { day: 'Quarta-feira', time: '19h30', name: 'Culto de Oração' },
    { day: 'Sábado', time: '19h00', name: 'Encontro de Jovens' },
  ],
  leaders: [
    { name: 'Pr. Carlos Eduardo', role: 'Pastor Principal', avatar: 'https://i.pravatar.cc/150?u=carlos-eduardo' },
    { name: 'Pb. Marcos Vinícius', role: 'Tesoureiro', avatar: 'https://i.pravatar.cc/150?u=marcos-vinicius' },
    { name: 'Sarah Reis', role: 'Secretária', avatar: 'https://i.pravatar.cc/150?u=sarah-reis' },
  ],
}
