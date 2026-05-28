import { useNavigate } from 'react-router-dom'

export type ClientTab = 'overview' | 'evidence' | 'complaints' | 'history' | 'notifications'

function OverviewIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : '#434B4D'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EvidenceIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : '#434B4D'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke={stroke} strokeWidth="2" />
    </svg>
  )
}

function ComplaintsIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : '#434B4D'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill={stroke} stroke={stroke} strokeWidth="1.5" />
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

const TABS: { id: ClientTab; label: string; route: string }[] = [
  { id: 'overview',   label: 'Overview',   route: '/client/overview'   },
  { id: 'evidence',   label: 'Evidence',   route: '/client/evidence'   },
  { id: 'complaints', label: 'Complaints', route: '/client/complaints' },
  { id: 'history',    label: 'History',    route: '/client/history'    },
]

/** Bottom navigation bar for the client portal. */
export function ClientNav({ active, complaintsCount = 0 }: { active: ClientTab; complaintsCount?: number }) {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E3E3DD] flex items-center justify-around h-[72px] px-2 safe-bottom">
      {TABS.map(({ id, label, route }) => {
        const isActive = active === id
        const showBadge = id === 'complaints' && complaintsCount > 0
        return (
          <button
            key={id}
            onClick={() => navigate(route)}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-col items-center gap-1 flex-1 py-2"
          >
            <div className="relative">
              <div className={[
                'w-12 h-8 rounded-full flex items-center justify-center transition-colors',
                isActive ? 'bg-[#B8A77A]' : 'bg-transparent',
              ].join(' ')}>
                {id === 'overview'   && <OverviewIcon active={isActive} />}
                {id === 'evidence'   && <EvidenceIcon active={isActive} />}
                {id === 'complaints' && <ComplaintsIcon active={isActive} />}
                {id === 'history'    && <HistoryIcon active={isActive} />}
              </div>
              {showBadge && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                  <span className="text-white text-[10px] font-bold leading-none">
                    {complaintsCount > 9 ? '9+' : complaintsCount}
                  </span>
                </span>
              )}
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
