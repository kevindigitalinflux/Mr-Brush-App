import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export type NavTab = 'jobs' | 'history' | 'notifications'

function BriefcaseIcon({ active }: { active: boolean }) {
  const c = active ? '#F8F8F2' : '#434844'
  return (
    <svg width="18" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke={c} strokeWidth="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={c} strokeWidth="2" />
    </svg>
  )
}

function HistoryIcon({ active }: { active: boolean }) {
  const c = active ? '#F8F8F2' : '#434844'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon({ active }: { active: boolean }) {
  const c = active ? '#F8F8F2' : '#434844'
  return (
    <svg width="16" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={c} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function NavItem({
  label, active, icon, onClick,
}: {
  label: string; active: boolean; icon: ReactNode; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-1 flex flex-col items-center py-1 rounded-[12px] cursor-pointer transition-colors',
        active ? 'bg-[#B8A77A]' : 'bg-transparent',
      ].join(' ')}
    >
      {icon}
      <span className={[
        "font-['Lato',sans-serif] font-bold text-sm tracking-[0.7px] mt-[3px]",
        active ? 'text-[#F8F8F2]' : 'text-[#434844]',
      ].join(' ')}>
        {label}
      </span>
    </button>
  )
}

/** Persistent bottom navigation bar shared across cleaner screens. */
export function BottomNav({ active }: { active: NavTab }) {
  const navigate = useNavigate()
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-[#C3C8C2] flex items-center px-4 pt-[17px] pb-4 z-50">
      <NavItem
        label="Jobs"
        active={active === 'jobs'}
        icon={<BriefcaseIcon active={active === 'jobs'} />}
        onClick={() => navigate('/cleaner/home')}
      />
      <NavItem
        label="History"
        active={active === 'history'}
        icon={<HistoryIcon active={active === 'history'} />}
        onClick={() => navigate('/cleaner/history')}
      />
      <NavItem
        label="Notifications"
        active={active === 'notifications'}
        icon={<BellIcon active={active === 'notifications'} />}
        onClick={() => navigate('/cleaner/notifications')}
      />
    </div>
  )
}
