import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { SignOutConfirmButton } from '../../components/SignOutConfirmButton'
import { BottomNav } from '../../components/BottomNav'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { supabase } from '../../lib/supabase'
import { useTranslation } from '../../lib/useTranslation'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { gsap, useGSAP } from '../../lib/gsap'
import type { Language } from '../../lib/i18n'

type JobStatus = 'not_started' | 'in_progress' | 'completed'

interface DisplayJob {
  id: string
  siteName: string
  address: string
  status: JobStatus
  zonesTotal: number
  zonesDone: number
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

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#737874" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" stroke="#737874" strokeWidth="2" />
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

// ─── Live data hook ───────────────────────────────────────────────────────────

function useJobData(userId: string | undefined) {
  const [jobs, setJobs] = useState<DisplayJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    async function load() {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Round 1: all zones assigned to this cleaner
      const { data: zoneRows } = await supabase
        .from('job_zones')
        .select('id, job_id, status')
        .eq('cleaner_id', userId)
        .neq('status', 'deleted')

      const myZones = (zoneRows ?? []) as { id: string; job_id: string; status: string | null }[]
      if (myZones.length === 0) { setJobs([]); setLoading(false); return }

      const jobIds = [...new Set(myZones.map((z) => z.job_id))]

      // Round 2: jobs scheduled for today
      const { data: jobRows } = await supabase
        .from('jobs')
        .select('id, facility_id, status')
        .in('id', jobIds)
        .eq('scheduled_date', today)

      const todayJobs = (jobRows ?? []) as { id: string; facility_id: string; status: string }[]
      if (todayJobs.length === 0) { setJobs([]); setLoading(false); return }

      // Round 3: facility names and addresses
      const facilityIds = [...new Set(todayJobs.map((j) => j.facility_id))]
      const { data: facilityRows } = await supabase
        .from('facilities')
        .select('id, name, address')
        .in('id', facilityIds)

      const facilityMap: Record<string, { name: string; address: string }> = Object.fromEntries(
        (facilityRows ?? []).map((f) => {
          const row = f as { id: string; name: string; address: string | null }
          return [row.id, { name: row.name, address: row.address ?? '' }]
        })
      )

      const doneStatuses = new Set(['completed', 'flagged_no_photo'])

      const result: DisplayJob[] = todayJobs.map((j) => {
        const zones = myZones.filter((z) => z.job_id === j.id)
        const facility = facilityMap[j.facility_id]
        const validStatuses = ['not_started', 'in_progress', 'completed'] as const
        const status: JobStatus = validStatuses.includes(j.status as JobStatus)
          ? (j.status as JobStatus)
          : 'not_started'
        return {
          id: j.id,
          siteName: facility?.name ?? 'Site',
          address: facility?.address ?? '',
          status,
          zonesTotal: zones.length,
          zonesDone: zones.filter((z) => doneStatuses.has(z.status ?? '')).length,
        }
      })

      setJobs(result)
      setLoading(false)
    }

    void load()
  }, [userId])

  const totalZones = jobs.reduce((sum, j) => sum + j.zonesTotal, 0)
  const doneZones = jobs.reduce((sum, j) => sum + j.zonesDone, 0)
  const allDone = jobs.length > 0 && doneZones === totalZones

  return { jobs, totalZones, doneZones, allDone, loading }
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
        <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] leading-tight">{job.siteName}</h3>
        <span className={`shrink-0 ${s.bg} ${s.text} font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.35px] uppercase px-4 py-1 rounded-full`}>{s.label}</span>
      </div>
      <div className="border-t border-[#E3E3DD] pt-[9px] flex items-center justify-between gap-3">
        {job.address ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <LocationIcon />
            <span className="font-['Lato',sans-serif] text-sm text-[#737874] truncate">{job.address}</span>
          </div>
        ) : <div className="flex-1" />}
        <span className="shrink-0 font-['Lato',sans-serif] font-bold text-sm tracking-[0.7px] text-[#434844] bg-[#F4F4EE] border border-[#C3C8C2] rounded-full px-[13px] py-[7px]">
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
        className="w-10 h-10 rounded-full bg-white border border-[#C3C8C2] flex items-center justify-center cursor-pointer hover:bg-[#F4F4EE] transition-colors">
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

function DesktopStatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white border border-[#E3E3DD] rounded-[12px] p-7 flex flex-col items-center gap-2 shadow-sm">
      <span className="font-['Poppins',sans-serif] font-bold text-[56px] leading-none text-[#1A1C19]">{value}</span>
      <span className="font-['Lato',sans-serif] text-[13px] tracking-[0.8px] uppercase text-[#737874]">{label}</span>
    </div>
  )
}

function DesktopJobCard({ job, onPress }: { job: DisplayJob; onPress: () => void }) {
  const s = STATUS_STYLES[job.status]
  return (
    <button onClick={onPress} className="desk-job-card w-full bg-white border border-[#E3E3DD] rounded-[12px] p-6 flex flex-col gap-4 text-left cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-[22px] text-[#1A1C19] leading-tight">{job.siteName}</h3>
        <span className={`shrink-0 ${s.bg} ${s.text} font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.5px] uppercase px-3 py-1 rounded-full`}>{s.label}</span>
      </div>
      <div className="border-t border-[#F0EFE8] pt-4 flex items-center justify-between gap-3">
        {job.address ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <LocationIcon />
            <span className="font-['Lato',sans-serif] text-sm text-[#737874] truncate">{job.address}</span>
          </div>
        ) : <div className="flex-1" />}
        <span className="shrink-0 font-['Lato',sans-serif] font-bold text-sm text-[#434844] bg-[#F4F4EE] border border-[#D5D5CF] rounded-full px-3 py-1">
          {job.zonesDone}/{job.zonesTotal} Zones
        </span>
      </div>
    </button>
  )
}

// ─── Desktop Home ─────────────────────────────────────────────────────────────

function DesktopHome() {
  const { user } = useApp()
  const navigate = useNavigate()
  const { jobs, totalZones, doneZones, loading } = useJobData(user?.id)
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useTranslation()

  const h = new Date().getHours()
  const greetingKey = h < 12 ? 'good_morning' : h < 18 ? 'good_afternoon' : 'good_evening'
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.dh-header',     { opacity: 0, y: 14, duration: 0.4 })
      .from('.dh-stat',       { opacity: 0, y: 12, scale: 0.97, duration: 0.4, stagger: 0.07 }, '-=0.2')
      .from('.dh-section',    { opacity: 0, y: 10, duration: 0.3 }, '-=0.15')
      .from('.desk-job-card', { opacity: 0, y: 14, duration: 0.4, stagger: 0.08 }, '-=0.1')
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="jobs" />
      <main className="flex-1 overflow-y-auto ml-60">
        <div ref={containerRef} className="max-w-5xl mx-auto px-10 py-10 flex flex-col gap-10">

          <div className="dh-header flex items-start justify-between">
            <div>
              <h1 className="font-['Poppins',sans-serif] font-bold text-[44px] text-[#1A1C19] leading-[1.1] tracking-[-1px]">
                {t(greetingKey)}, {user?.name ?? 'Cleaner'}
              </h1>
              <p className="font-['Lato',sans-serif] text-[#737874] text-lg mt-1">{t('home_overview')}</p>
            </div>
            <span className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.4px] text-[#737874] mt-3">{dateStr}</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-[140px] bg-white border border-[#E3E3DD] rounded-[12px] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div className="dh-stat"><DesktopStatCard value={String(jobs.length)} label={t('total_jobs')} /></div>
              <div className="dh-stat"><DesktopStatCard value={String(doneZones)} label={t('zones_done')} /></div>
              <div className="dh-stat"><DesktopStatCard value={String(totalZones - doneZones)} label={t('remaining')} /></div>
            </div>
          )}

          <div>
            <div className="dh-section flex items-center justify-between mb-5">
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[28px] text-[#1A1C19] tracking-[-0.3px]">{t('home_active_assignments')}</h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-5">
                {[1, 2].map((i) => <div key={i} className="h-[140px] bg-white border border-[#E3E3DD] rounded-[12px] animate-pulse" />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white border border-[#E3E3DD] rounded-[12px] p-12 flex flex-col items-center gap-2 shadow-sm">
                <p className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19]">{t('home_no_jobs')}</p>
                <p className="font-['Lato',sans-serif] text-base text-[#737874]">{t('home_no_jobs_body')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {jobs.map((job) => (
                  <DesktopJobCard key={job.id} job={job} onPress={() => navigate(`/cleaner/job/${job.id}`)} />
                ))}
              </div>
            )}
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
  const { jobs, totalZones, doneZones, allDone, loading } = useJobData(user?.id)
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  const h = new Date().getHours()
  const greetingKey = h < 12 ? 'good_morning' : h < 18 ? 'good_afternoon' : 'good_evening'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' })
  const zonesRing = doneZones === totalZones && totalZones > 0 ? 'black' : doneZones > 0 ? 'yellow' : 'gray'

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'transform,opacity' } })
      .from('.home-greeting', { opacity: 0, y: 14, duration: 0.45 })
      .from('.home-stats',    { opacity: 0, y: 12, scale: 0.97, duration: 0.4 }, '-=0.25')
      .from('.home-heading',  { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.job-card',      { opacity: 0, y: 22, duration: 0.45, stagger: 0.08 }, '-=0.15')
  }, { scope: containerRef, dependencies: [loading] })

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
            <div className="flex items-center gap-2 mt-1">
              <LanguageDropdown />
              <SignOutConfirmButton triggerClassName="w-10 h-10 rounded-full bg-white border border-[#C3C8C2] flex items-center justify-center text-[#6B5D36] hover:bg-[#F4F4EE] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SignOutConfirmButton>
            </div>
          </div>

          <div className="home-stats w-full px-6">
            {loading ? (
              <div className="h-[86px] bg-white border border-[#C3C8C2] rounded-[12px] animate-pulse" />
            ) : (
              <div className="bg-white border border-[#C3C8C2] rounded-[12px] px-[17px] py-[17px] flex items-center justify-between">
                <StatBubble value={String(jobs.length)} label={t('total_jobs')} ring="black" />
                <div className="w-px h-8 bg-[#E3E3DD]" />
                <StatBubble value={`${doneZones}/${totalZones}`} label={t('zones_done')} ring={zonesRing} />
                <div className="w-px h-8 bg-[#E3E3DD]" />
                <StatBubble value={String(totalZones - doneZones)} label={t('remaining')} ring="gray" />
              </div>
            )}
          </div>

          <div className="home-heading w-full px-6 pt-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19]">{t('your_jobs_today')}</h3>
          </div>

          {loading ? (
            <div className="w-full px-6 flex flex-col gap-4">
              {[1, 2].map((i) => <div key={i} className="h-[130px] bg-white border border-[#C3C8C2] rounded-[12px] animate-pulse" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="w-full px-6">
              <div className="bg-white border border-[#C3C8C2] rounded-[12px] flex flex-col items-center p-[33px]">
                <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] text-center mb-2">{t('home_no_jobs')}</h3>
                <p className="font-['Lato',sans-serif] text-base text-[#6B5D36] text-center leading-[1.6]">
                  {t('home_no_jobs_body')}
                </p>
              </div>
            </div>
          ) : allDone ? (
            <div className="w-full px-6">
              <div className="bg-white border border-[#C3C8C2] rounded-[12px] flex flex-col items-center p-[33px]">
                <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] text-center mb-2">{t('home_all_done')}</h3>
                <p className="font-['Lato',sans-serif] text-base text-[#6B5D36] text-center leading-[1.6]">
                  {t('home_all_done_body')}
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

/** Home screen — shows today's jobs and shift stats fetched live from Supabase. */
export function Home() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopHome /> : <MobileHome />
}
