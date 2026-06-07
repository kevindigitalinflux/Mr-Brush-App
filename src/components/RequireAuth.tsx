import { Navigate, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'

/**
 * Layout route guard — blocks unauthenticated access to all portal routes.
 * Renders nothing while the session is still being rehydrated on page load
 * (prevents a flash-redirect before Supabase confirms the stored session).
 */
export function RequireAuth() {
  const { user, sessionChecked } = useApp()

  if (!sessionChecked) return null
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
