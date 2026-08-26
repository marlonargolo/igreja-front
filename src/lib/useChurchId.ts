import { useApp } from '@/lib/AppContext'

/**
 * Retorna o churchId atual como número.
 * Usado em todas as requisições que precisam filtrar por igreja.
 */
export function useChurchId(): number | undefined {
  const { church } = useApp()
  return church?.id ? Number(church.id) : undefined
}