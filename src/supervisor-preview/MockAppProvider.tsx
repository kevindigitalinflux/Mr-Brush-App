import { useEffect, type ReactNode } from 'react'
import { AppProvider, useApp } from '../context/AppContext'
import { MOCK_SUPERVISOR } from './mockData'

function AutoLogin({ children }: { children: ReactNode }) {
  const { setUser } = useApp()
  useEffect(() => {
    setUser(MOCK_SUPERVISOR)
  }, [setUser])
  return <>{children}</>
}

/** Wraps AppProvider and auto-injects a mock supervisor user for the preview. */
export function MockAppProvider({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AutoLogin>{children}</AutoLogin>
    </AppProvider>
  )
}
