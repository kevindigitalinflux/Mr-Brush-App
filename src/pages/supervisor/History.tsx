import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryTab = 'mine' | 'workers'

interface HistoryJob {
  id: string
  scheduled_date: string
  facility_name: string
  status: string
  zone_total: number
  zone_done: number
  supervisor_name?: string
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="#C3C8C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({ job }: { job: HistoryJob }) {
  const navigate = useNavigate()
  const t = useTranslation()
  const isComplete = job.status === 'completed'
  const date = new Date(job.scheduled_date)
  const dayNum = date.toLocaleDateString('en-GB', { day: 'numeric' })
  const dayAbbr = date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()

  return (
    <button
      onClick={() => navigate(`/supervisor/evidence/${job.id}`)}
      className="history-row w-full bg-white border border-[#D0CFCA] rounded-[12px] flex items-stretch overflow-hidden text-left hover:shadow-sm transition-shadow cursor-pointer"
    >
      <div className="w-[68px] flex flex-col items-center justify-center border-r border-[#E3E3DD] py-4 shrink-0">
        <span className="font-['Poppins',sans-serif] font-bold text-[30px] text-[#1A1C19] leading-none">{dayNum}</span>
        <span className="font-['Lato',sans-serif] text-[11px] tracking-[1px] text-[#737874] uppercase mt-0.5">{dayAbbr}</span>
      </div>
      <div className="flex-1 px-4 py-4 flex flex-col justify-center gap-0.5 min-w-0">
        <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19] truncate">
          {job.facility_name}
        </p>
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
          {job.zone_done} {t('of_count')} {job.zone_total} {t('zones')}
          {job.supervisor_name ? ` · ${job.supervisor_name}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-2 pr-4">
        <span className={[
          "font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.5px] px-2.5 py-1 rounded-full",
          isComplete ? 'bg-[#D7E6DB] text-[#2F4A3D]' : 'bg-[#E3E3DD] text-[#737874]',
        ].join(' ')}>
          {isComplete ? t('sv_done_pill') : t('sv_part_pill')}
        </span>
        <ChevronRightIcon />
      </div>
    </button>
  )
}

// ─── Shared content (data + rendering, no outer wrapper) ─────────────────────

function HistoryContent({ compact = false }: { compact?: boolean }) {
  const { user } = useApp()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<HistoryTab>('mine')
  const [jobs, setJobs] = useState<HistoryJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)

    async function load() {
      const query = supabase
        .from('jobs')
        .select(`
          id, scheduled_date, status,
          facilities ( name ),
          job_zones ( id, status ),
          profiles!jobs_supervisor_id_fkey ( full_name )
        `)
        .lt('scheduled_date', new Date().toISOString().slice(0, 10))
        .order('scheduled_date', { ascending: false })
        .limit(60)

      const { data } = await (tab === 'mine'
        ? query.eq('supervisor_id', user!.id)
        : query.eq('company_id', user!.company_id))

      if (data) {
        const mapped: HistoryJob[] = (data as unknown as {
          id: string
          scheduled_date: string
          status: string
          facilities: { name: string } | null
          job_zones: { id: string; status: string }[]
          profiles: { full_name: string } | null
        }[]).map((r) => ({
          id: r.id,
          scheduled_date: r.scheduled_date,
          facility_name: r.facilities?.name ?? 'Unknown Site',
          status: r.status,
          zone_total: r.job_zones?.length ?? 0,
          zone_done: (r.job_zones ?? []).filter((z) => z.status === 'completed' || z.status === 'flagged_no_photo').length,
          supervisor_name: tab === 'workers' ? (r.profiles?.full_name ?? undefined) : undefined,
        }))
        setJobs(mapped)
      }
      setLoading(false)
    }

    load()
  }, [user, tab])

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.history-heading', { opacity: 0, y: 14, duration: 0.4 })
      .from('.history-row', { opacity: 0, y: 10, duration: 0.35, stagger: 0.05 }, '-=0.2')
  }, { scope: containerRef, dependencies: [loading, tab] })

  return (
    <div ref={containerRef} className={compact ? 'max-w-5xl mx-auto px-10 py-10' : 'w-full max-w-[480px] mx-auto px-6 pt-10 pb-8'}>
      <div className={compact ? 'history-heading mb-8 flex items-start justify-between' : 'history-heading mb-5'}>
        <h1 className={`font-['Poppins',sans-serif] font-bold text-[#1A1C19] leading-[1.1] tracking-[-0.4px] ${compact ? 'text-[32px]' : 'text-[32px] mb-0'}`}>
          {t('sv_history_title')}
        </h1>
        {compact && (
          <span className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.4px] text-[#737874] mt-2">
            {new Date().toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            }).toUpperCase()}
          </span>
        )}
      </div>
      <div className={compact ? 'max-w-2xl' : ''}>

      {/* Tab toggle */}
      <div className="flex bg-[#E3E3DD] rounded-[8px] p-1 mb-6">
        {(['mine', 'workers'] as HistoryTab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              "flex-1 h-9 rounded-[6px] font-['Poppins',sans-serif] font-semibold text-[13px] transition-colors",
              tab === key ? 'bg-white text-[#1A1C19] shadow-sm' : 'text-[#737874]',
            ].join(' ')}
          >
            {key === 'mine' ? t('sv_my_shifts') : t('sv_all_workers')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[76px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 flex flex-col items-center gap-2 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_past_shifts')}</p>
          <p className="font-['Lato',sans-serif] text-sm text-[#737874]">
            {t('sv_no_past_shifts_body')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => <HistoryRow key={job.id} job={job} />)}
        </div>
      )}
      </div>
    </div>
  )
}

// ─── Desktop History ──────────────────────────────────────────────────────────

function DesktopHistory() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="history" />
      <main className="flex-1 overflow-y-auto ml-60">
        <HistoryContent compact />
      </main>
    </div>
  )
}

// ─── Mobile History ───────────────────────────────────────────────────────────

function MobileHistory() {
  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <HistoryContent />
      <SupervisorNav active="history" />
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Past job history for the supervisor — their own shifts and worker shifts. */
export function History() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopHistory /> : <MobileHistory />
}
