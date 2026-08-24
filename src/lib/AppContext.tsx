// src/lib/AppContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface Church {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
  churches?: Church[]
}

interface AppContextType {
  user: User | null
  church: Church | null
  setUser: (user: User | null) => void
  setChurch: (church: Church | null) => void
  loading: boolean
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [church, setChurch] = useState<Church | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar usuário do localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        // Usuário não encontrado
      }
    }

    // Carregar igreja do localStorage
    const savedChurch = localStorage.getItem('igrejahub_current_church')
    if (savedChurch) {
      try {
        setChurch(JSON.parse(savedChurch))
      } catch {
        setChurch({ id: '2', name: 'Igreja Principal' })
      }
    } else {
      setChurch({ id: '2', name: 'Igreja Principal' })
    }
    setLoading(false)
  }, [])

  const value = {
    user,
    setUser,
    church,
    setChurch,
    loading
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider')
  }
  return ctx
}