import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { BottomNav } from '../../components/BottomNav'
import { MOCK_JOBS } from '../../lib/mockJobs'
import { useTranslation } from '../../lib/useTranslation'
import type { Language } from '../../lib/i18n'

// ─── Types ───────────────────────────────────────────────────────────────────

type JobStatus = 'not_started' | 'in_progress' | 'completed'

interface DisplayJob {
  id: string
  siteName: string
  clientName: string
  status: JobStatus
  timeStart: string
  timeEnd: string
  zonesTotal: number
  zonesDone: number
}

const LANG_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
]

// ─── Icons ───────────────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#434844" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="#434844" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Sub-components ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<JobStatus, { bg: string; text: string; label: string }> = {
  in_progress: { bg: 'bg-[#F1DEAD]', text: 'text-[#6F613A]', label: 'IN PROGRESS' },
  not_started: { bg: 'bg-[#E3E3DD]', text: 'text-[#434844]', label: 'NOT STARTED' },
  completed:   { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]', label: 'COMPLETED' },
}

const STAT_RING: Record<string, string> = {
  black:  'border-black',
  yellow: 'border-[#F1DEAD]',
  gray:   'border-[#C3C8C2]',
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

function JobCard({ job, onPress }: { job: DisplayJob; onPress: () => void }) {
  const s = STATUS_STYLES[job.status]
  return (
    <button
      onClick={onPress}
      className="w-full bg-white border border-[#C3C8C2] rounded-[12px] p-[21px] flex flex-col gap-4 text-left cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] leading-tight">
            {job.siteName}
          </h3>
          <span className="font-['Lato',sans-serif] text-base text-[#6B5D36]">{job.clientName}</span>
        </div>
        <span className={`shrink-0 ${s.bg} ${s.text} font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.35px] uppercase px-4 py-1 rounded-full`}>
          {s.label}
        </span>
      </div>
      <div className="border-t border-[#E3E3DD] pt-[9px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon />
          <span className="font-['Lato',sans-serif] text-sm text-[#434844]">
            {job.timeStart} – {job.timeEnd}
          </span>
        </div>
        <span className="font-['Lato',sans-serif] font-bold text-sm tracking-[0.7px] text-[#434844] bg-[#F4F4EE] border border-[#C3C8C2] rounded-full px-[13px] py-[7px]">
          {job.zonesDone}/{job.zonesTotal} Zones
        </span>
      </div>
    </button>
  )
}

function AllDoneState() {
  return (
    <div className="border-t border-dashed border-[#C3C8C2] pt-16 pb-8 px-8">
      <div className="bg-white border border-[#C3C8C2] rounded-[12px] flex flex-col items-center p-[33px]">
        <div className="w-32 h-32 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] shadow-sm flex items-center justify-center mb-4">
          <CheckCircleIcon />
        </div>
        <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] text-center mb-2">
          All Jobs Completed
        </h3>
        <p className="font-['Lato',sans-serif] text-base text-[#6B5D36] text-center leading-[1.6]">
          You've successfully finished all your scheduled tasks for today. Great work!
        </p>
      </div>
    </div>
  )
}

// ─── Language dropdown ────────────────────────────────────────────────────────

function LanguageDropdown() {
  const { language, setLanguage } = useApp()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Change language"
        className="w-10 h-10 rounded-full bg-white border border-[#C3C8C2] shadow-sm flex items-center justify-center mt-1 cursor-pointer hover:bg-[#F4F4EE] transition-colors"
      >
        <GlobeIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 bg-white border border-[#D0CFCA] rounded-[12px] shadow-lg overflow-hidden min-w-[160px]">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => { setLanguage(opt.code); setOpen(false) }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F4F4EE] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{opt.flag}</span>
                <span className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19]">
                  {opt.label}
                </span>
              </div>
              {language === opt.code && <CheckSmall />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

/** Home screen — shows today's jobs and shift stats. */
export function Home() {
  const { user, completedZones } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()

  const jobs: DisplayJob[] = MOCK_JOBS.map((job) => {
    const zonesDone = job.zones.filter((z) => completedZones.has(z.id)).length
    const zonesTotal = job.zones.length
    const status: JobStatus =
      zonesDone === 0 ? 'not_started' :
      zonesDone === zonesTotal ? 'completed' : 'in_progress'
    return { id: job.id, siteName: job.siteName, clientName: job.clientName, timeStart: job.timeStart, timeEnd: job.timeEnd, zonesTotal, zonesDone, status }
  })

  const totalJobs = jobs.length
  const totalZones = jobs.reduce((s, j) => s + j.zonesTotal, 0)
  const doneZones = jobs.reduce((s, j) => s + j.zonesDone, 0)
  const allDone = jobs.every((j) => j.status === 'completed')

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const h = new Date().getHours()
  const greetingKey = h < 12 ? 'good_morning' : h < 18 ? 'good_afternoon' : 'good_evening'
  const greeting = t(greetingKey)

  const zonesRing = doneZones === totalZones ? 'black' : doneZones > 0 ? 'yellow' : 'gray'

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-[100px]">

        {/* Top section */}
        <div className="flex flex-col gap-4 pt-8">

          {/* Welcome header */}
          <div className="w-full px-6 flex items-start justify-between">
            <div>
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.32px] text-[#1A1C19] leading-[38px]">
                {greeting},<br />{user?.name ?? 'Cleaner'}
              </h2>
              <span className="font-['Lato',sans-serif] text-base text-[#6B5D36]">{today}</span>
            </div>
            <LanguageDropdown />
          </div>

          {/* Stats bar */}
          <div className="w-full px-6">
            <div className="bg-white border border-[#C3C8C2] rounded-[12px] px-[17px] py-[17px] flex items-center justify-between">
              <StatBubble value={String(totalJobs)} label={t('total_jobs')} ring="black" />
              <div className="w-px h-8 bg-[#E3E3DD]" />
              <StatBubble value={`${doneZones}/${totalZones}`} label={t('zones_done')} ring={zonesRing} />
              <div className="w-px h-8 bg-[#E3E3DD]" />
              <StatBubble value={allDone ? '0h' : '4.5h'} label={t('remaining')} ring="gray" />
            </div>
          </div>

          {/* Jobs list heading */}
          <div className="w-full px-6 pt-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19]">
              {t('your_jobs_today')}
            </h3>
          </div>

          {/* Jobs or all-done state */}
          {allDone ? (
            <div className="w-full px-6">
              <AllDoneState />
            </div>
          ) : (
            <div className="w-full px-6 flex flex-col gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => navigate(`/cleaner/job/${job.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="jobs" />
    </div>
  )
}
