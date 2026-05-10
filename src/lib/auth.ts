export type UserRole = 'cleaner' | 'supervisor' | 'manager'

const PREFIX_MAP: Record<string, UserRole> = {
  C: 'cleaner',
  S: 'supervisor',
  M: 'manager',
}

/** Derives user role from display_id prefix (C/S/M). Fixed — do not change. */
export function getRoleFromId(displayId: string): UserRole | null {
  const prefix = displayId.charAt(0).toUpperCase()
  return PREFIX_MAP[prefix] ?? null
}

export function getRouteForRole(role: UserRole): string {
  const routes: Record<UserRole, string> = {
    cleaner: '/cleaner/home',
    supervisor: '/supervisor',
    manager: '/manager',
  }
  return routes[role]
}
