import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import type { Language } from '../../lib/i18n'
import logoSrc from '../../assets/logo/logo.png'
import { gsap, useGSAP } from '../../lib/gsap'

export type SupervisorTab = 'dashboard' | 'jobs' | 'workers' | 'history'

interface Props { active: SupervisorTab }

const NAV: { key: SupervisorTab; labelKey: string; path: string; icon: () => React.ReactElement }[] = [
  { key: 'dashboard', labelKey: 'sv_nav_dashboard', path: '/supervisor/dashboard', icon: DashboardIcon },
  { key: 'jobs',      labelKey: 'sv_nav_jobs',      path: '/supervisor/jobs',      icon: JobsIcon      },
  { key: 'workers',   labelKey: 'sv_nav_workers',   path: '/supervisor/workers',   icon: WorkersIcon   },
  { key: 'history',   labelKey: 'sv_nav_history',   path: '/supervisor/history',   icon: HistoryIcon   },
]

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function JobsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function WorkersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 21v-1a5 5 0 0 0-4-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="19" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l5 5L20 7" stroke="#B8A77A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

/** Persistent left navigation for all supervisor desktop screens. */
export function SupervisorDesktopSidebar({ active }: Props) {
  const { user, setUser, language, setLanguage } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'SV'

  const activeLang = LANGS.find((l) => l.code === language) ?? LANGS[0]

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useGSAP(() => {
    gsap.from(sidebarRef.current, { x: -16, opacity: 0, duration: 0.35, ease: 'power2.out' })
  }, { scope: sidebarRef })

  return (
    <aside ref={sidebarRef} className="fixed left-0 top-0 h-screen w-60 bg-[#EEEEE8] border-r border-[#D5D5CF] flex flex-col overflow-y-auto z-30">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <img src={logoSrc} alt="Mr Brush & Co." className="w-8 h-8 object-contain shrink-0" />
        <span className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19] leading-tight">
          Mr Brush & Co.
        </span>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-5 pb-5">
        <div className="w-9 h-9 rounded-full bg-[#1A1C19] flex items-center justify-center shrink-0">
          <span className="font-['Poppins',sans-serif] font-semibold text-sm text-[#B8A77A]">{initials}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1A1C19] truncate">
            {user?.name ?? 'Supervisor'}
          </span>
          <span className="font-['Lato',sans-serif] text-[11px] text-[#737874] tracking-[0.5px]">
            {t('sv_portal_label')}
          </span>
        </div>
      </div>

      <div className="h-px bg-[#D5D5CF] mx-4 mb-3" />

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 pt-1">
        {NAV.map(({ key, labelKey, path, icon: Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={[
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-[8px] text-left transition-all duration-200',
                isActive
                  ? 'bg-[#B8A77A] text-white shadow-sm'
                  : 'text-[#434844] hover:bg-[#E5E5DF] hover:text-[#1A1C19]',
              ].join(' ')}
            >
              <Icon />
              <span className="font-['Poppins',sans-serif] font-semibold text-[14px]">{t(labelKey)}</span>
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[#D5D5CF] flex flex-col gap-1">

        {/* Language selector */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen((p) => !p)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] text-[#737874] hover:bg-[#E5E5DF] hover:text-[#1A1C19] transition-colors"
          >
            <GlobeIcon />
            <span className="font-['Lato',sans-serif] text-[13px] font-bold tracking-[0.8px] flex-1 text-left">
              {activeLang.label}
            </span>
            <span className={`transition-transform duration-200 ${langOpen ? '' : 'rotate-180'}`}>
              <ChevronUpIcon />
            </span>
          </button>

          {langOpen && (
            <div className="anim-slide-up absolute bottom-full left-0 right-0 mb-1 bg-white border border-[#D0CFCA] rounded-[10px] shadow-lg overflow-hidden">
              {LANGS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => { setLanguage(opt.code); setLangOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#F4F4EE] transition-colors"
                >
                  <span className="text-base leading-none">{opt.flag}</span>
                  <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1A1C19] flex-1 text-left">
                    {opt.label}
                  </span>
                  {language === opt.code && <CheckIcon />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => { setUser(null); navigate('/login') }}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] text-[#737874] hover:bg-[#E5E5DF] hover:text-[#1A1C19] transition-colors"
        >
          <LogOutIcon />
          <span className="font-['Lato',sans-serif] text-[13px]">{t('sv_sign_out')}</span>
        </button>
      </div>

    </aside>
  )
}
