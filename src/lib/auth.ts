export type UserRole = 'cleaner' | 'supervisor' | 'client'

interface ParsedId {
  role: UserRole
  email: string
}

/**
 * Parses a display ID into role + internal Supabase email alias.
 * Order matters: CL before C, R before nothing.
 * Formats: C0001 (cleaner), S0001 (supervisor), CL0001 (client), R001 (replacement cleaner)
 */
export function parseDisplayId(id: string): ParsedId | null {
  const upper = id.trim().toUpperCase()
  if (/^CL\d{4}$/.test(upper)) return { role: 'client',     email: `${upper.toLowerCase()}@internal.mrbrush.app` }
  if (/^C\d{4}$/.test(upper))  return { role: 'cleaner',    email: `${upper.toLowerCase()}@internal.mrbrush.app` }
  if (/^S\d{4}$/.test(upper))  return { role: 'supervisor', email: `${upper.toLowerCase()}@internal.mrbrush.app` }
  if (/^R\d{3}$/.test(upper))  return { role: 'cleaner',    email: `${upper.toLowerCase()}@internal.mrbrush.app` }
  return null
}

export function getRouteForRole(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    cleaner:    '/cleaner/home',
    supervisor: '/supervisor/home',
    client:     '/client/home',
  }
  return routes[role]
}
