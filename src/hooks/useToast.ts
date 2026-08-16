// src/hooks/useToast.ts
import { useState, useCallback } from 'react'

interface Toast {
  title: string
  description: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toastState, setToastState] = useState<Toast | null>(null)

  const showToast = useCallback((props: Toast) => {
    setToastState(props)
    setTimeout(() => setToastState(null), 5000)
  }, [])

  return { toast: toastState, showToast } // ← chave única
}