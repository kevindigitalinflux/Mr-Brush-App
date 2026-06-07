import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Language } from '../lib/i18n'
import type { UserRole } from '../lib/auth'
import { flushOfflineQueue } from '../lib/offlineQueue'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  display_id: string
  role: UserRole
  name: string
  language: Language
  company_id: string
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
  sessionChecked: boolean
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

const LANG_KEY = 'mr_brush_lang'

function readStoredLang(): Language {
  try {
    const v = localStorage.getItem(LANG_KEY)
    if (v === 'en' || v === 'es' || v === 'pt') return v
  } catch { /* ignore */ }
  return 'en'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [language, setLanguageState] = useState<Language>(readStoredLang)

  function setLanguage(lang: Language) {
    try { localStorage.setItem(LANG_KEY, lang) } catch { /* ignore */ }
    setLanguageState(lang)
  }
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

  // Rehydrate user from an existing Supabase session on page refresh.
  // onAuthStateChange alone does not cover this case — when the page loads with
  // a stored session, user starts as null and the INITIAL_SESSION event hits
  // the handler below while prev is still null, so it returns null unchanged.
  // getSession() fetches the live session and populates user from the profile.
  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setSessionChecked(true); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_id, role, full_name, company_id')
        .eq('id', session.user.id)
        .single()
      if (!profile) { setSessionChecked(true); return }
      const p = profile as { display_id: string; role: string; full_name: string | null; company_id: string }
      setUser({
        id: session.user.id,
        display_id: p.display_id,
        role: p.role as UserRole,
        name: p.full_name ?? p.display_id,
        language: readStoredLang(),
        company_id: p.company_id ?? '',
      })
      setSessionChecked(true)
    })
  }, [])

  // Clear app state when the Supabase session is signed out or replaced by a
  // different user (e.g. a cleaner logging in on another tab).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        return
      }
      setUser(prev => {
        if (!prev) return prev
        if (session?.user.id && session.user.id !== prev.id) return null
        return prev
      })
    })
    return () => subscription.unsubscribe()
  }, [])

  // Flush any queued offline submissions when connected and authenticated
  useEffect(() => {
    if (!isOnline || !user) return
    void flushOfflineQueue((zoneId) => {
      setCompletedZones((prev) => new Set([...prev, zoneId]))
    })
  }, [isOnline, user])

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
      user, setUser, sessionChecked, language, setLanguage, activeJobId, setActiveJobId, isOnline,
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
