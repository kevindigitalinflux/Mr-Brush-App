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

export interface CompletedJob {
  id: string
  siteName: string
  clientName: string
  timeStart: string
  timeEnd: string
  zonesTotal: number
  zonesDone: number
  dayLabel: string
  date: string
}

interface AppContextValue {
  user: User | null
  setUser: (user: User | null) => void
  language: Language
  setLanguage: (lang: Language) => void
  activeJobId: string | null
  setActiveJobId: (id: string | null) => void
  isOnline: boolean
  completedZones: Set<string>
  markZoneComplete: (zoneId: string) => void
  completedJobs: CompletedJob[]
  markJobComplete: (job: CompletedJob) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [completedZones, setCompletedZones] = useState<Set<string>>(new Set())
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([])

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

  function markZoneComplete(zoneId: string) {
    setCompletedZones((prev) => new Set([...prev, zoneId]))
  }

  function markJobComplete(job: CompletedJob) {
    setCompletedJobs((prev) => {
      if (prev.some((j) => j.id === job.id)) return prev
      return [job, ...prev]
    })
  }

  return (
    <AppContext.Provider value={{
      user, setUser, language, setLanguage, activeJobId, setActiveJobId, isOnline,
      completedZones, markZoneComplete, completedJobs, markJobComplete,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
