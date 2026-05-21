import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { LanguageSheet } from '../../components/supervisor/LanguageSheet'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ZoneSummary {
  id: string
  status: string
  cleaner_id: string | null
}

interface SiteJob {
  id: string
  facility_id: string
  status: string
  facility_name: string
  zones: ZoneSummary[]
  pending_evidence: number
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#1A1C19" strokeWidth="2" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Shared data hook ─────────────────────────────────────────────────────────

function useDashboardData() {
  const { user } = useApp()
  const [jobs, setJobs] = useState<SiteJob[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [issueCount, setIssueCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (silent = false) => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    if (!silent) setLoading(true)

    const { data: jobRows } = await supabase
      .from('jobs')
      .select(`
        id, status, facility_id,
        facilities ( name ),
        job_zones ( id, status, cleaner_id ),
        cleaning_logs ( id, status )
      `)
      .eq('supervisor_id', user.id)
      .eq('scheduled_date', today)

    if (jobRows) {
      const mapped: SiteJob[] = (jobRows as unknown as {
        id: string; facility_id: string; status: string
        facilities: { name: string } | null
        job_zones: ZoneSummary[]
        cleaning_logs: { id: string; status: string }[]
      }[]).map((r) => ({
        id: r.id,
        facility_id: r.facility_id,
        status: r.status,
        facility_name: r.facilities?.name ?? 'Unknown Site',
        zones: (r.job_zones ?? []).filter((z) => z.status !== 'deleted'),
        pending_evidence: (r.cleaning_logs ?? []).filter((l) => l.status === 'pending_review').length,
      }))
      setJobs(mapped.filter((j) => j.status !== 'completed'))
      setPendingCount(mapped.reduce((sum, j) => sum + j.pending_evidence, 0))
      setIssueCount(mapped.reduce((sum, j) =>
        sum + j.zones.filter((z) => z.status === 'flagged_no_photo').length, 0))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) load() }, [load, user])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('supervisor-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_zones' }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_logs' }, () => load(true))
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [user, load])

  return { jobs, pendingCount, issueCount, loading }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SiteCard({ job }: { job: SiteJob }) {
  const navigate = useNavigate()
  const t = useTranslation()
  const total = job.zones.length
  const done = job.zones.filter((z) => z.status === 'completed' || z.status === 'flagged_no_photo').length
  const assignedCleaners = new Set(job.zones.map((z) => z.cleaner_id).filter(Boolean)).size
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="site-card bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden">
      <div className="bg-[#1A1C19] px-5 py-3 flex items-center justify-between">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-base text-white truncate pr-3">
          {job.facility_name}
        </h3>
        <span className="shrink-0 bg-[#B8A77A] text-[#1A1C19] font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.8px] px-2.5 py-0.5 rounded-full uppercase">
          {t('sv_active_pill')}
        </span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-['Lato',sans-serif] text-[#737874]">
            {assignedCleaners} cleaner{assignedCleaners !== 1 ? 's' : ''} · {total} zone{total !== 1 ? 's' : ''}
          </span>
          <span className="font-['Lato',sans-serif] font-bold text-[#1A1C19]">{done}/{total}</span>
        </div>
        <div className="w-full h-2 bg-[#E3E3DD] rounded-full overflow-hidden">
          <div className="h-full bg-[#B8A77A] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <button
          onClick={() => navigate(`/supervisor/jobs?facility=${job.facility_id}`)}
          className="mt-1 w-full h-10 border border-[#B8A77A] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-[#B8A77A] hover:bg-[#B8A77A] hover:text-white transition-colors"
        >
          {t('sv_manage_facility')}
        </button>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, onClick, accent, className: extraClass = '' }: {
  label: string; value: number; icon: React.ReactNode
  onClick?: () => void; accent?: 'warning' | 'error'; className?: string
}) {
  const valueColor = accent === 'error' && value > 0
    ? 'text-[#BA1A1A]'
    : accent === 'warning' && value > 0
      ? 'text-[#B8A77A]'
      : 'text-[#1A1C19]'

  return (
    <button
      onClick={onClick}
      aria-disabled={!onClick}
      className={[
        'w-full bg-white rounded-[16px] border border-[#D0CFCA] overflow-hidden flex flex-col text-left group',
        onClick
          ? 'cursor-pointer hover:-translate-y-1.5 hover:shadow-xl hover:border-[#B8A77A] transition-[border-color,box-shadow,transform] duration-150'
          : 'cursor-default pointer-events-none',
        extraClass,
      ].join(' ')}
    >
      {/* Dark header */}
      <div className="bg-[#1A1C19] px-6 py-6 flex items-center justify-between">
        <div className="w-11 h-11 rounded-[12px] bg-[#B8A77A]/20 flex items-center justify-center text-[#B8A77A]">
          {icon}
        </div>
        {onClick && (
          <span className="text-[#B8A77A] opacity-60 group-hover:opacity-100 transition-opacity">
            <ChevronRightIcon />
          </span>
        )}
      </div>
      {/* Body */}
      <div className="flex-1 px-6 py-6 flex flex-col justify-end gap-1.5">
        <span className={`font-['Poppins',sans-serif] font-bold text-[48px] leading-none ${valueColor}`}>{value}</span>
        <span className="font-['Lato',sans-serif] text-[13px] text-[#737874] leading-snug">{label}</span>
      </div>
    </button>
  )
}

function EmptyState() {
  const navigate = useNavigate()
  const t = useTranslation()
  return (
    <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 flex flex-col items-center gap-2 text-center">
      <div className="w-14 h-14 rounded-full bg-[#F4F4EE] border border-[#D0CFCA] flex items-center justify-center mb-1">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="#B8A77A" strokeWidth="2" />
          <path d="M8 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="#B8A77A" strokeWidth="2" />
        </svg>
      </div>
      <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_active_shifts')}</p>
      <p className="font-['Lato',sans-serif] text-sm text-[#737874] max-w-[240px]">{t('sv_no_active_shifts_body')}</p>
      <button
        onClick={() => navigate('/supervisor/jobs')}
        className="mt-3 h-10 px-6 bg-[#B8A77A] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#a8976a] transition-colors"
      >
        {t('sv_go_to_jobs')}
      </button>
    </div>
  )
}

// ─── Desktop Dashboard ────────────────────────────────────────────────────────

function DesktopDashboard() {
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { jobs, pendingCount, issueCount, loading } = useDashboardData()

  const h = new Date().getHours()
  const greeting = h < 12 ? t('good_morning') : h < 17 ? t('good_afternoon') : t('good_evening')
  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).toUpperCase()

  useGSAP(() => {
    if (loading) return
    gsap.set(['.dd-header', '.dd-stat', '.dd-section', '.site-card'], { clearProps: 'all' })
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .fromTo('.dd-header',  { opacity: 0, y: 14 },              { opacity: 1, y: 0, duration: 0.4 })
      .fromTo('.dd-stat',    { opacity: 0 },                     { opacity: 1, duration: 0.35 }, '-=0.2')
      .fromTo('.dd-section', { opacity: 0, y: 10 },              { opacity: 1, y: 0, duration: 0.3 }, '-=0.15')
      .fromTo('.site-card',  { opacity: 0, y: 14 },              { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, '-=0.1')
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="dashboard" />
      <main className="flex-1 overflow-y-auto ml-60">
        <div ref={containerRef} className="max-w-5xl mx-auto px-10 py-10 flex flex-col gap-10">

          {/* Header */}
          <div className="dd-header flex items-start justify-between">
            <div>
              <p className="font-['Lato',sans-serif] text-[#737874] text-lg">{greeting},</p>
              <h1 className="font-['Poppins',sans-serif] font-bold text-[44px] text-[#1A1C19] leading-[1.1] tracking-[-1px]">
                {user?.name?.split(' ')[0] ?? 'Supervisor'}
              </h1>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.4px] text-[#737874]">
                {dateStr}
              </span>
              <button
                onClick={() => navigate('/supervisor/notifications')}
                aria-label="Notifications"
                className="w-10 h-10 rounded-full bg-white border border-[#D0CFCA] flex items-center justify-center hover:bg-[#F4F4EE] transition-colors"
              >
                <BellIcon />
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-6">
            <StatCard
              className="dd-stat"
              label={t('sv_pending_approvals')}
              value={pendingCount}
              icon={<CheckCircleIcon />}
              accent="warning"
              onClick={pendingCount > 0 ? () => navigate('/supervisor/evidence') : undefined}
            />
            <StatCard
              className="dd-stat"
              label={t('sv_issues_reported')}
              value={issueCount}
              icon={<AlertIcon />}
              accent={issueCount > 0 ? 'error' : undefined}
              onClick={() => navigate('/supervisor/issues')}
            />
            <StatCard
              className="dd-stat"
              label={t('sv_todays_sites')}
              value={jobs.length}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" />
                </svg>
              }
            />
            <StatCard
              className="dd-stat"
              label={t('sv_workers_on_shift')}
              value={new Set(jobs.flatMap((j) => j.zones.map((z) => z.cleaner_id)).filter(Boolean)).size}
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 21v-1a7 7 0 0 1 14 0v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
          </div>

          {/* Today's sites */}
          <div>
            <div className="dd-section flex items-center justify-between mb-5">
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[28px] text-[#1A1C19] tracking-[-0.3px]">
                {t('sv_todays_sites')}
              </h2>
              <button
                onClick={() => navigate('/supervisor/jobs')}
                className="font-['Poppins',sans-serif] font-semibold text-sm text-[#B8A77A] hover:text-[#a8976a] transition-colors"
              >
                {t('sv_view_all_jobs')} →
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[168px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {jobs.map((job) => <SiteCard key={job.id} job={job} />)}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

// ─── Mobile Dashboard ─────────────────────────────────────────────────────────

function MobileDashboard() {
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { jobs, pendingCount, issueCount, loading } = useDashboardData()
  const [showLangSheet, setShowLangSheet] = useState(false)

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.dash-heading', { opacity: 0, y: 16, duration: 0.4 })
      .from('.stat-card',    { opacity: 0, y: 12, duration: 0.35, stagger: 0.08 }, '-=0.2')
      .from('.site-card',    { opacity: 0, y: 16, duration: 0.4, stagger: 0.08 }, '-=0.15')
  }, { scope: containerRef, dependencies: [loading] })

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return t('good_morning')
    if (h < 17) return t('good_afternoon')
    return t('good_evening')
  })()

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pt-10 pb-[100px]">

        <div className="dash-heading flex items-center justify-between mb-6">
          <div>
            <p className="font-['Lato',sans-serif] text-[14px] text-[#737874]">{greeting},</p>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] text-[#1A1C19] leading-[1.1] tracking-[-0.4px]">
              {user?.name?.split(' ')[0] ?? 'Supervisor'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLangSheet(true)}
              aria-label="Change language"
              className="w-10 h-10 rounded-full bg-white border border-[#D0CFCA] flex items-center justify-center hover:bg-[#F4F4EE] transition-colors"
            >
              <GlobeIcon />
            </button>
            <button
              onClick={() => navigate('/supervisor/notifications')}
              aria-label="Notifications"
              className="w-10 h-10 rounded-full bg-white border border-[#D0CFCA] flex items-center justify-center hover:bg-[#F4F4EE] transition-colors"
            >
              <BellIcon />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <StatCard
            label={t('sv_pending_approvals')}
            value={pendingCount}
            icon={<CheckCircleIcon />}
            accent="warning"
            onClick={pendingCount > 0 ? () => navigate('/supervisor/evidence') : undefined}
          />
          <StatCard
            label={t('sv_issues_reported')}
            value={issueCount}
            icon={<AlertIcon />}
            accent={issueCount > 0 ? 'error' : undefined}
            onClick={() => navigate('/supervisor/issues')}
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1A1C19]">
            {t('sv_todays_sites')}
          </h2>
          <span className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-[168px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map((job) => <SiteCard key={job.id} job={job} />)}
          </div>
        )}
      </div>

      {showLangSheet && <LanguageSheet onClose={() => setShowLangSheet(false)} />}
      <SupervisorNav active="dashboard" />
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Supervisor dashboard — today's active sites, pending evidence, and issue count. */
export function Dashboard() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopDashboard /> : <MobileDashboard />
}
