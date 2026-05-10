import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Language } from '../lib/i18n'
import type { UserRole } from '../lib/auth'

interface User {
  id: string
  display_id: string
  role: UserRole
  name: string
  language: Language
}

interface AppContextValue {
  user: User | null
  setUser: (user: User | null) => void
  language: Language
  setLanguage: (lang: Language) => void
  activeJobId: string | null
  setActiveJobId: (id: string | null) => void
  isOnline: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <AppContext.Provider value={{ user, setUser, language, setLanguage, activeJobId, setActiveJobId, isOnline }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
