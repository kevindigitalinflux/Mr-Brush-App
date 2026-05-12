import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Language } from '../lib/i18n'
import logoSrc from '../assets/logo/logo.png'

type NavKey = 'jobs' | 'history' | 'notifications'

interface Props { active: NavKey }

const NAV: { key: NavKey; label: string; path: string; icon: () => React.ReactElement }[] = [
  { key: 'jobs',          label: 'Jobs',          path: '/cleaner/home',          icon: BriefcaseIcon },
  { key: 'history',       label: 'History',       path: '/cleaner/history',       icon: ClockIcon },
  { key: 'notifications', label: 'Notifications', path: '/cleaner/notifications', icon: BellIcon },
]

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function BriefcaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

/** Persistent left navigation for all cleaner desktop screens. */
export function DesktopSidebar({ active }: Props) {
  const { user, setUser, language, setLanguage } = useApp()
  const navigate = useNavigate()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

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

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#EEEEE8] border-r border-[#D5D5CF] flex flex-col overflow-y-auto z-30">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <img src={logoSrc} alt="Mr Brush & Co." className="w-8 h-8 object-contain shrink-0" />
        <span className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19] leading-tight">
          Mr Brush & Co.
        </span>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 px-5 pb-5">
        <div className="w-9 h-9 rounded-full bg-[#B8A77A] flex items-center justify-center shrink-0">
          <span className="font-['Poppins',sans-serif] font-semibold text-sm text-white">{initials}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1A1C19] truncate">
            {user?.name ?? 'Cleaner'}
          </span>
          <span className="font-['Lato',sans-serif] text-[11px] text-[#737874] tracking-[0.5px]">
            Cleaner Portal
          </span>
        </div>
      </div>

      <div className="h-px bg-[#D5D5CF] mx-4 mb-3" />

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 pt-1">
        {NAV.map(({ key, label, path, icon: Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={[
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-[8px] text-left transition-colors',
                isActive
                  ? 'bg-[#F1DEAD] text-[#6B5D36]'
                  : 'text-[#434844] hover:bg-[#E5E5DF] hover:text-[#1A1C19]',
              ].join(' ')}
            >
              <Icon />
              <span className="font-['Poppins',sans-serif] font-semibold text-[14px]">{label}</span>
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
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-[#D0CFCA] rounded-[10px] shadow-lg overflow-hidden">
              {LANGS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => { setLanguage(opt.code); setLangOpen(false) }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#F4F4EE] transition-colors cursor-pointer"
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
          <span className="font-['Lato',sans-serif] text-[13px]">Sign Out</span>
        </button>
      </div>

    </aside>
  )
}
