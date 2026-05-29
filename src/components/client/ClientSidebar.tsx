import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { SignOutConfirmButton } from '../SignOutConfirmButton'
import { useTranslation } from '../../lib/useTranslation'
import type { Language } from '../../lib/i18n'
import logoSrc from '../../assets/logo/logo.png'
import { gsap, useGSAP } from '../../lib/gsap'

export type ClientTab = 'overview' | 'evidence' | 'complaints' | 'history' | 'notifications'

interface Props {
  active: ClientTab
  complaintsCount?: number
}

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function OverviewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EvidenceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ComplaintsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
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

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = { key: ClientTab; labelKey: string; path: string; icon: () => React.ReactElement }

const NAV: NavItem[] = [
  { key: 'overview',   labelKey: 'cl_nav_overview',   path: '/client/overview',   icon: OverviewIcon   },
  { key: 'evidence',   labelKey: 'cl_nav_evidence',   path: '/client/evidence',   icon: EvidenceIcon   },
  { key: 'complaints', labelKey: 'cl_nav_complaints', path: '/client/complaints', icon: ComplaintsIcon },
  { key: 'history',    labelKey: 'cl_nav_history',    path: '/client/history',    icon: HistoryIcon    },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────

/** Persistent left navigation for all client desktop screens. */
export function ClientSidebar({ active, complaintsCount = 0 }: Props) {
  const { user, language, setLanguage } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'CL'

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
            {user?.name ?? 'Client'}
          </span>
          <span className="font-['Lato',sans-serif] text-[11px] text-[#737874] tracking-[0.5px]">
            {t('cl_portal_label')}
          </span>
        </div>
      </div>

      <div className="h-px bg-[#D5D5CF] mx-4 mb-3" />

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 pt-1">
        {NAV.map(({ key, labelKey, path, icon: Icon }) => {
          const isActive = active === key
          const showBadge = key === 'complaints' && complaintsCount > 0
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
              <span className="font-['Poppins',sans-serif] font-semibold text-[14px] flex-1 text-left">
                {t(labelKey)}
              </span>
              {showBadge && (
                <span className={[
                  'min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5',
                  isActive ? 'bg-white/30' : 'bg-red-500',
                ].join(' ')}>
                  <span className="text-white text-[10px] font-bold leading-none">
                    {complaintsCount > 9 ? '9+' : complaintsCount}
                  </span>
                </span>
              )}
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

        <SignOutConfirmButton
          triggerClassName="flex items-center gap-2.5 w-full px-3 py-2 rounded-[8px] text-[#737874] hover:bg-[#E5E5DF] hover:text-[#1A1C19] transition-colors"
          popoverSide="above"
          popoverAlign="left"
        >
          <LogOutIcon />
          <span className="font-['Lato',sans-serif] text-[13px]">{t('cl_sign_out')}</span>
        </SignOutConfirmButton>
      </div>

    </aside>
  )
}
