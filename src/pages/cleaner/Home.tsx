import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { BottomNav } from '../../components/BottomNav'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { MOCK_JOBS } from '../../lib/mockJobs'
import { useTranslation } from '../../lib/useTranslation'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { gsap, useGSAP } from '../../lib/gsap'
import type { Language } from '../../lib/i18n'

type JobStatus = 'not_started' | 'in_progress' | 'completed'

interface DisplayJob {
  id: string; siteName: string; clientName: string; status: JobStatus
  timeStart: string; timeEnd: string; zonesTotal: number; zonesDone: number
}

const LANG_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
]

const STATUS_STYLES: Record<JobStatus, { bg: string; text: string; label: string }> = {
  in_progress: { bg: 'bg-[#F1DEAD]', text: 'text-[#6F613A]', label: 'IN PROGRESS' },
  not_started: { bg: 'bg-[#E3E3DD]', text: 'text-[#434844]', label: 'NOT STARTED' },
  completed:   { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]', label: 'COMPLETED' },
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ClockIcon({ color = '#434844' }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#434844" strokeWidth="2" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#434844" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CheckSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l5 5L20 7" stroke="#B8A77A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Mobile-only components ───────────────────────────────────────────────────

const STAT_RING: Record<string, string> = {
  black: 'border-black', yellow: 'border-[#F1DEAD]', gray: 'border-[#C3C8C2]',
}

function StatBubble({ value, label, ring }: { value: string; label: string; ring: keyof typeof STAT_RING }) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full border-2 ${STAT_RING[ring]} flex items-center justify-center mb-1`}>
        <span className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black leading-none">{value}</span>
      </div>
      <span className="font-['Lato',sans-serif] text-[10px] tracking-[0.5px] uppercase text-[#6B5D36] text-center">{label}</span>
    </div>
  )
}

function MobileJobCard({ job, onPress }: { job: DisplayJob; onPress: () => void }) {
  const s = STATUS_STYLES[job.status]
  return (
    <button onClick={onPress} className="job-card w-full bg-white border border-[#C3C8C2] rounded-[12px] p-[21px] flex flex-col gap-4 text-left cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] leading-tight">{job.siteName}</h3>
          <span className="font-['Lato',sans-serif] text-base text-[#6B5D36]">{job.clientName}</span>
        </div>
        <span className={`shrink-0 ${s.bg} ${s.text} font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.35px] uppercase px-4 py-1 rounded-full`}>{s.label}</span>
      </div>
      <div className="border-t border-[#E3E3DD] pt-[9px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon />
          <span className="font-['Lato',sans-serif] text-sm text-[#434844]">{job.timeStart} – {job.timeEnd}</span>
        </div>
        <span className="font-['Lato',sans-serif] font-bold text-sm tracking-[0.7px] text-[#434844] bg-[#F4F4EE] border border-[#C3C8C2] rounded-full px-[13px] py-[7px]">
          {job.zonesDone}/{job.zonesTotal} Zones
        </span>
      </div>
    </button>
  )
}

function LanguageDropdown() {
  const { language, setLanguage } = useApp()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (dropdownRef.current && open) {
      gsap.fromTo(dropdownRef.current, { opacity: 0, scale: 0.92, y: -8 }, { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: 'power2.out' })
    }
  }, [open])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative z-50">
      <button onClick={() => setOpen((p) => !p)} aria-label="Change language"
        className="w-10 h-10 rounded-full bg-white border border-[#C3C8C2] shadow-sm flex items-center justify-center mt-1 cursor-pointer hover:bg-[#F4F4EE] transition-colors">
        <GlobeIcon />
      </button>
      {open && (
        <div ref={dropdownRef} className="absolute right-0 top-12 bg-white border border-[#D0CFCA] rounded-[12px] shadow-lg overflow-hidden min-w-[160px]" style={{ transformOrigin: 'top right' }}>
          {LANG_OPTIONS.map((opt) => (
            <button key={opt.code} onClick={() => { setLanguage(opt.code); setOpen(false) }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F4F4EE] transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{opt.flag}</span>
                <span className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19]">{opt.label}</span>
              </div>
              {language === opt.code && <CheckSmall />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Desktop-only components ──────────────────────────────────────────────────

function DesktopStatCard({ value, label, sublabel }: { value: string; label: string; sublabel?: string }) {
  return (
    <div className="bg-white border border-[#E3E3DD] rounded-[12px] p-7 flex flex-col items-center gap-2 shadow-sm">
      <span className="font-['Poppins',sans-serif] font-bold text-[56px] leading-none text-[#1A1C19]">{value}</span>
      <span className="font-['Lato',sans-serif] text-[13px] tracking-[0.8px] uppercase text-[#737874]">{label}</span>
      {sublabel && <span className="font-['Lato',sans-serif] text-[12px] text-[#B8A77A]">{sublabel}</span>}
    </div>
  )
}

function DesktopJobCard({ job, onPress }: { job: DisplayJob; onPress: () => void }) {
  const s = STATUS_STYLES[job.status]
  return (
    <button onClick={onPress} className="desk-job-card w-full bg-white border border-[#E3E3DD] rounded-[12px] p-6 flex flex-col gap-4 text-left cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[22px] text-[#1A1C19] leading-tight">{job.siteName}</h3>
          <span className="font-['Lato',sans-serif] text-sm text-[#6B5D36] mt-0.5 block">{job.clientName}</span>
        </div>
        <span className={`shrink-0 ${s.bg} ${s.text} font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.5px] uppercase px-3 py-1 rounded-full`}>{s.label}</span>
      </div>
      <div className="border-t border-[#F0EFE8] pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon color="#737874" />
          <span className="font-['Lato',sans-serif] text-sm text-[#737874]">{job.timeStart} – {job.timeEnd}</span>
        </div>
        <span className="font-['Lato',sans-serif] font-bold text-sm text-[#434844] bg-[#F4F4EE] border border-[#D5D5CF] rounded-full px-3 py-1">
          {job.zonesDone}/{job.zonesTotal} Zones
        </span>
      </div>
    </button>
  )
}

// ─── Shared job data hook ─────────────────────────────────────────────────────

function useJobData() {
  const { completedZones } = useApp()
  const jobs: DisplayJob[] = MOCK_JOBS.map((job) => {
    const zonesDone = job.zones.filter((z) => completedZones.has(z.id)).length
    const zonesTotal = job.zones.length
    const status: JobStatus = zonesDone === 0 ? 'not_started' : zonesDone === zonesTotal ? 'completed' : 'in_progress'
    return { id: job.id, siteName: job.siteName, clientName: job.clientName, timeStart: job.timeStart, timeEnd: job.timeEnd, zonesTotal, zonesDone, status }
  })
  const totalZones = jobs.reduce((s, j) => s + j.zonesTotal, 0)
  const doneZones = jobs.reduce((s, j) => s + j.zonesDone, 0)
  const allDone = jobs.every((j) => j.status === 'completed')
  return { jobs, totalZones, doneZones, allDone }
}

// ─── Desktop Home ─────────────────────────────────────────────────────────────

function DesktopHome() {
  const { user } = useApp()
  const navigate = useNavigate()
  const { jobs, totalZones, doneZones } = useJobData()
  const containerRef = useRef<HTMLDivElement>(null)

  const h = new Date().getHours()
  const greetingKey = h < 12 ? 'good_morning' : h < 18 ? 'good_afternoon' : 'good_evening'
  const t = useTranslation()
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.dh-header',   { opacity: 0, y: 14, duration: 0.4 })
      .from('.dh-stat',     { opacity: 0, y: 12, scale: 0.97, duration: 0.4, stagger: 0.07 }, '-=0.2')
      .from('.dh-section',  { opacity: 0, y: 10, duration: 0.3 }, '-=0.15')
      .from('.desk-job-card', { opacity: 0, y: 14, duration: 0.4, stagger: 0.08 }, '-=0.1')
  }, { scope: containerRef })

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="jobs" />
      <main className="flex-1 overflow-y-auto">
        <div ref={containerRef} className="max-w-5xl mx-auto px-10 py-10 flex flex-col gap-10">

          {/* Header */}
          <div className="dh-header flex items-start justify-between">
            <div>
              <h1 className="font-['Poppins',sans-serif] font-bold text-[44px] text-[#1A1C19] leading-[1.1] tracking-[-1px]">
                {t(greetingKey)}, {user?.name ?? 'Cleaner'}
              </h1>
              <p className="font-['Lato',sans-serif] text-[#737874] text-lg mt-1">Here is the overview for today's assignments.</p>
            </div>
            <span className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.4px] text-[#737874] mt-3">{dateStr}</span>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="dh-stat"><DesktopStatCard value={String(jobs.length)} label={t('total_jobs')} /></div>
            <div className="dh-stat"><DesktopStatCard value={String(doneZones)} label={t('zones_done')} /></div>
            <div className="dh-stat"><DesktopStatCard value={String(totalZones - doneZones)} label={t('remaining')} /></div>
          </div>

          {/* Jobs */}
          <div>
            <div className="dh-section flex items-center justify-between mb-5">
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[28px] text-[#1A1C19] tracking-[-0.3px]">Active Assignments</h2>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {jobs.map((job) => (
                <DesktopJobCard key={job.id} job={job} onPress={() => navigate(`/cleaner/job/${job.id}`)} />
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

// ─── Mobile Home ──────────────────────────────────────────────────────────────

function MobileHome() {
  const { user } = useApp()
  const navigate = useNavigate()
  const { jobs, totalZones, doneZones, allDone } = useJobData()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  const h = new Date().getHours()
  const greetingKey = h < 12 ? 'good_morning' : h < 18 ? 'good_afternoon' : 'good_evening'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })
  const zonesRing = doneZones === totalZones ? 'black' : doneZones > 0 ? 'yellow' : 'gray'

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.home-greeting', { opacity: 0, y: 14, duration: 0.45 })
      .from('.home-stats',    { opacity: 0, y: 12, scale: 0.97, duration: 0.4 }, '-=0.25')
      .from('.home-heading',  { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.job-card',      { opacity: 0, y: 22, duration: 0.45, stagger: 0.08 }, '-=0.15')
  }, { scope: containerRef })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto pb-[100px]">
        <div className="flex flex-col gap-4 pt-8">
          <div className="home-greeting w-full px-6 flex items-start justify-between">
            <div>
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.32px] text-[#1A1C19] leading-[38px]">
                {t(greetingKey)},<br />{user?.name ?? 'Cleaner'}
              </h2>
              <span className="font-['Lato',sans-serif] text-base text-[#6B5D36]">{today}</span>
            </div>
            <LanguageDropdown />
          </div>
          <div className="home-stats w-full px-6">
            <div className="bg-white border border-[#C3C8C2] rounded-[12px] px-[17px] py-[17px] flex items-center justify-between">
              <StatBubble value={String(jobs.length)} label={t('total_jobs')} ring="black" />
              <div className="w-px h-8 bg-[#E3E3DD]" />
              <StatBubble value={`${doneZones}/${totalZones}`} label={t('zones_done')} ring={zonesRing} />
              <div className="w-px h-8 bg-[#E3E3DD]" />
              <StatBubble value={allDone ? '0h' : '4.5h'} label={t('remaining')} ring="gray" />
            </div>
          </div>
          <div className="home-heading w-full px-6 pt-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19]">{t('your_jobs_today')}</h3>
          </div>
          {allDone ? (
            <div className="w-full px-6">
              <div className="bg-white border border-[#C3C8C2] rounded-[12px] flex flex-col items-center p-[33px]">
                <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] text-center mb-2">All Jobs Completed</h3>
                <p className="font-['Lato',sans-serif] text-base text-[#6B5D36] text-center leading-[1.6]">
                  You've successfully finished all your scheduled tasks for today. Great work!
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full px-6 flex flex-col gap-4">
              {jobs.map((job) => (
                <MobileJobCard key={job.id} job={job} onPress={() => navigate(`/cleaner/job/${job.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav active="jobs" />
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Home screen — shows today's jobs and shift stats. */
export function Home() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopHome /> : <MobileHome />
}
