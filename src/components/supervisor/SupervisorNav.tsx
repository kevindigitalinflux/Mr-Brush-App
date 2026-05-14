import { useNavigate } from 'react-router-dom'

export type SupervisorTab = 'dashboard' | 'jobs' | 'workers' | 'history'

function DashboardIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : '#434B4D'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke={stroke} strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke={stroke} strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke={stroke} strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke={stroke} strokeWidth="2" />
    </svg>
  )
}

function JobsIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : '#434B4D'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={stroke} strokeWidth="2" />
      <path d="M8 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke={stroke} strokeWidth="2" />
      <path d="M8 12h8M8 16h5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function WorkersIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : '#434B4D'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="4" stroke={stroke} strokeWidth="2" />
      <path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 21v-1a5 5 0 0 0-4-4.9" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="7" r="3" stroke={stroke} strokeWidth="2" />
    </svg>
  )
}

function HistoryIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : '#434B4D'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const TABS: { id: SupervisorTab; label: string; route: string }[] = [
  { id: 'dashboard', label: 'Dashboard', route: '/supervisor/dashboard' },
  { id: 'jobs',      label: 'Jobs',      route: '/supervisor/jobs'      },
  { id: 'workers',   label: 'Workers',   route: '/supervisor/workers'   },
  { id: 'history',   label: 'History',   route: '/supervisor/history'   },
]

/** Bottom navigation bar for the supervisor portal. */
export function SupervisorNav({ active }: { active: SupervisorTab }) {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E3E3DD] flex items-center justify-around h-[72px] px-2 safe-bottom">
      {TABS.map(({ id, label, route }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => navigate(route)}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-col items-center gap-1 flex-1 py-2"
          >
            <div className={[
              'w-12 h-8 rounded-full flex items-center justify-center transition-colors',
              isActive ? 'bg-[#B8A77A]' : 'bg-transparent',
            ].join(' ')}>
              {id === 'dashboard' && <DashboardIcon active={isActive} />}
              {id === 'jobs'      && <JobsIcon active={isActive} />}
              {id === 'workers'   && <WorkersIcon active={isActive} />}
              {id === 'history'   && <HistoryIcon active={isActive} />}
            </div>
            <span className={[
              "font-['Lato',sans-serif] text-[11px] tracking-[0.3px]",
              isActive ? 'text-[#B8A77A] font-bold' : 'text-[#434B4D]',
            ].join(' ')}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
