import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { ClientNav } from '../../components/client/ClientNav'
import { ClientSidebar } from '../../components/client/ClientSidebar'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacilityInfo {
  id: string
  name: string
  address: string | null
}

interface EvidenceItem {
  id: string
  publicUrl: string
  zoneName: string
  submittedAt: string
}

interface OverviewState {
  loading: boolean
  facilities: FacilityInfo[]
  openComplaintCount: number
  cleansThisMonth: number
  lastCleanedDate: string | null
  lastResolvedAt: string | null
  recentEvidence: EvidenceItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastCleaned(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
}

function formatResolved(isoStr: string | null): string {
  if (!isoStr) return 'None'
  const days = Math.floor((Date.now() - new Date(isoStr).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatEvidenceTime(isoStr: string): string {
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useOverviewData(): OverviewState {
  const { user } = useApp()
  const [state, setState] = useState<OverviewState>({
    loading: true, facilities: [], openComplaintCount: 0,
    cleansThisMonth: 0, lastCleanedDate: null, lastResolvedAt: null, recentEvidence: [],
  })

  const load = useCallback(async () => {
    if (!user) return

    // Step 1 — get client's facilities via org chain
    const { data: memberRows } = await supabase
      .from('client_org_members')
      .select('org_id')
      .eq('profile_id', user.id)

    const orgIds = (memberRows ?? []).map((m) => (m as { org_id: string }).org_id)
    if (orgIds.length === 0) { setState((s) => ({ ...s, loading: false, facilities: [] })); return }

    const { data: facilityRows } = await supabase
      .from('facilities')
      .select('id, name, address')
      .in('org_id', orgIds)

    const facilities: FacilityInfo[] = (facilityRows ?? []).map((f) => (f as { id: string; name: string; address: string | null }))
    const facilityIds = facilities.map((f) => f.id)
    if (facilityIds.length === 0) {
      setState((s) => ({ ...s, loading: false, facilities }))
      return
    }

    const monthStart = new Date()
    monthStart.setDate(1)
    const monthStartStr = monthStart.toISOString().slice(0, 10)

    // Step 2 — parallel data fetch
    const [openCmp, monthJobs, lastJob, lastResolved, recentJobs] = await Promise.all([
      supabase.from('complaints').select('id').in('facility_id', facilityIds).neq('status', 'resolved'),
      supabase.from('jobs').select('id').in('facility_id', facilityIds).eq('status', 'completed').gte('scheduled_date', monthStartStr),
      supabase.from('jobs').select('scheduled_date').in('facility_id', facilityIds).eq('status', 'completed').order('scheduled_date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('complaints').select('resolved_at').in('facility_id', facilityIds).eq('status', 'resolved').not('resolved_at', 'is', null).order('resolved_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('jobs').select('id').in('facility_id', facilityIds).order('scheduled_date', { ascending: false }).limit(10),
    ])

    // Step 3 — evidence via recent job IDs
    const recentJobIds = (recentJobs.data ?? []).map((j) => j.id)
    let recentEvidence: EvidenceItem[] = []
    if (recentJobIds.length > 0) {
      const { data: logRows } = await supabase
        .from('cleaning_logs')
        .select('submitted_at, job_zones ( zone_name ), evidence_files ( id, public_url )')
        .in('job_id', recentJobIds)
        .order('submitted_at', { ascending: false })
        .limit(8)

      recentEvidence = (logRows ?? []).flatMap((log) => {
        const l = log as unknown as { submitted_at: string; job_zones: { zone_name: string } | null; evidence_files: { id: string; public_url: string }[] }
        const zone = l.job_zones?.zone_name ?? 'Zone'
        return (l.evidence_files ?? []).map((ef) => ({
          id: ef.id, publicUrl: ef.public_url, zoneName: zone, submittedAt: l.submitted_at,
        }))
      }).slice(0, 3)
    }

    setState({
      loading: false,
      facilities,
      openComplaintCount: openCmp.data?.length ?? 0,
      cleansThisMonth: monthJobs.data?.length ?? 0,
      lastCleanedDate: lastJob.data?.scheduled_date ?? null,
      lastResolvedAt: lastResolved.data?.resolved_at ?? null,
      recentEvidence,
    })
  }, [user])

  useEffect(() => { if (user) void load() }, [load, user])
  return state
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function ComplaintBanner({ count, onTap }: { count: number; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="ov-banner w-full bg-[#FDF6E3] border border-[#B8A77A] rounded-[12px] px-5 py-3.5 flex items-center gap-3 text-left"
    >
      <div className="w-8 h-8 rounded-full bg-[#B8A77A]/20 flex items-center justify-center shrink-0 text-[#B8A77A]">
        <AlertIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#3D3B3A]">
          {count} open issue{count > 1 ? 's' : ''} require{count === 1 ? 's' : ''} attention
        </p>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874]">
          Tap to view and track your complaint status
        </p>
      </div>
      <span className="text-[#B8A77A] shrink-0"><ChevronRightIcon /></span>
    </button>
  )
}

function SiteStatusCard({ facility, lastCleanedDate, openCount }: {
  facility: FacilityInfo; lastCleanedDate: string | null; openCount: number
}) {
  const allClear = openCount === 0
  return (
    <div className="ov-site bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden">
      <div className="bg-[#3D3B3A] px-5 py-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-white truncate">
            {facility.name}
          </h3>
          {facility.address && (
            <p className="font-['Lato',sans-serif] text-[11px] text-white/50 truncate mt-0.5">{facility.address}</p>
          )}
        </div>
        {allClear ? (
          <span className="shrink-0 flex items-center gap-1.5 bg-[#2F4A3D] text-white font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.8px] px-3 py-1 rounded-full uppercase">
            <CheckCircleIcon /> All Clear
          </span>
        ) : (
          <span className="shrink-0 bg-red-500 text-white font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.8px] px-3 py-1 rounded-full uppercase">
            {openCount} issue{openCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="px-5 py-4">
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
          {lastCleanedDate
            ? <>Last cleaned: <span className="text-[#3D3B3A] font-bold">{formatLastCleaned(lastCleanedDate)}</span></>
            : 'No cleaning visits on record yet'}
        </p>
      </div>
    </div>
  )
}

function StatTile({ value, label, accent }: { value: string; label: string; accent?: 'brass' | 'red' | 'green' }) {
  const colour = accent === 'red' ? 'text-red-500' : accent === 'green' ? 'text-[#2F4A3D]' : 'text-[#B8A77A]'
  return (
    <div className="ov-stat flex-1 bg-white border border-[#D0CFCA] rounded-[12px] px-3 py-4 flex flex-col items-center gap-1">
      <span className={`font-['Poppins',sans-serif] font-bold text-[28px] leading-none ${colour}`}>{value}</span>
      <span className="font-['Lato',sans-serif] text-[11px] text-[#737874] text-center leading-snug">{label}</span>
    </div>
  )
}

function EvidenceStrip({ items, onViewAll }: { items: EvidenceItem[]; onViewAll: () => void }) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="ov-ev-header flex items-center justify-between mb-3">
        <h2 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#3D3B3A]">Recent Evidence</h2>
        <button onClick={onViewAll} className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#B8A77A]">
          View all →
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-6 px-6 snap-x snap-mandatory">
        {items.map((item) => (
          <div key={item.id} className="ov-ev-card relative shrink-0 w-[148px] h-[148px] rounded-[12px] overflow-hidden bg-[#E3E3DD] snap-start">
            <img src={item.publicUrl} alt={item.zoneName} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pt-8 pb-2.5">
              <p className="font-['Lato',sans-serif] text-white text-[11px] font-bold truncate">{item.zoneName}</p>
              <p className="font-['Lato',sans-serif] text-white/70 text-[10px]">{formatEvidenceTime(item.submittedAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-[70px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
      <div className="h-[88px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="flex-1 h-[88px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />)}
      </div>
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="w-[148px] h-[148px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse shrink-0" />)}
      </div>
    </div>
  )
}

// ─── Mobile view ──────────────────────────────────────────────────────────────

function MobileOverview() {
  const { user } = useApp()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const data = useOverviewData()

  useGSAP(() => {
    if (data.loading) return
    gsap.set(['.ov-heading', '.ov-banner', '.ov-site', '.ov-stat', '.ov-ev-header', '.ov-ev-card'], { clearProps: 'all' })
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.ov-heading',   { opacity: 0, y: 14, duration: 0.4 })
      .from('.ov-banner',    { opacity: 0, y: 10, duration: 0.3 }, '-=0.1')
      .from('.ov-site',      { opacity: 0, y: 12, duration: 0.35, stagger: 0.08 }, '-=0.15')
      .from('.ov-stat',      { opacity: 0, y: 10, duration: 0.3, stagger: 0.07 }, '-=0.15')
      .from('.ov-ev-header', { opacity: 0, y: 8, duration: 0.25 }, '-=0.1')
      .from('.ov-ev-card',   { opacity: 0, x: 16, duration: 0.3, stagger: 0.07 }, '-=0.1')
  }, { scope: containerRef, dependencies: [data.loading] })

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="fixed inset-0 bg-[#F5F4EF] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pt-10 pb-[100px]">

        {/* Header */}
        <div className="ov-heading mb-7">
          <p className="font-['Lato',sans-serif] text-[14px] text-[#737874]">{greeting},</p>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] text-[#3D3B3A] leading-[1.1] tracking-[-0.4px]">
            {user?.name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="font-['Lato',sans-serif] text-[12px] text-[#9A9A94] mt-1 tracking-[0.5px]">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
          </p>
        </div>

        {data.loading ? <Skeleton /> : (
          <div className="flex flex-col gap-5">

            {/* Active complaint banner */}
            {data.openComplaintCount > 0 && (
              <ComplaintBanner count={data.openComplaintCount} onTap={() => navigate('/client/complaints')} />
            )}

            {/* Site status card(s) */}
            {data.facilities.length > 0 && (
              <div className="flex flex-col gap-3">
                {data.facilities.map((facility) => (
                  <SiteStatusCard
                    key={facility.id}
                    facility={facility}
                    lastCleanedDate={data.lastCleanedDate}
                    openCount={data.openComplaintCount}
                  />
                ))}
              </div>
            )}

            {data.facilities.length === 0 && (
              <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-6 text-center">
                <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#3D3B3A]">No sites linked yet</p>
                <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">Contact your supervisor to get set up.</p>
              </div>
            )}

            {/* Quick stats */}
            <div className="flex gap-3">
              <StatTile
                value={String(data.cleansThisMonth)}
                label="Cleans this month"
                accent="brass"
              />
              <StatTile
                value={String(data.openComplaintCount)}
                label="Open issues"
                accent={data.openComplaintCount > 0 ? 'red' : 'brass'}
              />
              <StatTile
                value={formatResolved(data.lastResolvedAt)}
                label="Last resolved"
                accent="green"
              />
            </div>

            {/* Recent evidence */}
            <EvidenceStrip items={data.recentEvidence} onViewAll={() => navigate('/client/evidence')} />

          </div>
        )}
      </div>

      <ClientNav active="overview" complaintsCount={data.openComplaintCount} />
    </div>
  )
}

// ─── Desktop view ─────────────────────────────────────────────────────────────

function DesktopOverview() {
  const { user } = useApp()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const data = useOverviewData()

  useGSAP(() => {
    if (data.loading) return
    gsap.set(['.ov-heading', '.ov-banner', '.ov-site', '.ov-stat', '.ov-ev-header', '.ov-ev-card'], { clearProps: 'all' })
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.ov-heading',   { opacity: 0, y: 14, duration: 0.4 })
      .from('.ov-banner',    { opacity: 0, y: 10, duration: 0.3 }, '-=0.1')
      .from('.ov-stat',      { opacity: 0, y: 10, duration: 0.3, stagger: 0.07 }, '-=0.1')
      .from('.ov-site',      { opacity: 0, y: 12, duration: 0.35, stagger: 0.08 }, '-=0.1')
      .from('.ov-ev-header', { opacity: 0, y: 8, duration: 0.25 }, '-=0.1')
      .from('.ov-ev-card',   { opacity: 0, x: 16, duration: 0.3, stagger: 0.07 }, '-=0.1')
  }, { scope: containerRef, dependencies: [data.loading] })

  const dateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).toUpperCase()

  return (
    <div className="min-h-screen bg-[#F5F4EF]">
      <ClientSidebar active="overview" complaintsCount={data.openComplaintCount} />
      <main className="ml-60">
        <div ref={containerRef} className="max-w-5xl mx-auto px-10 py-10 flex flex-col gap-8">

          {/* Header */}
          <div className="ov-heading flex items-end justify-between">
            <div>
              <p className="font-['Lato',sans-serif] text-[#737874] text-lg">Welcome back,</p>
              <h1 className="font-['Poppins',sans-serif] font-bold text-[44px] text-[#3D3B3A] leading-[1.1] tracking-[-1px]">
                {user?.name?.split(' ')[0] ?? 'there'}
              </h1>
            </div>
            <span className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.4px] text-[#737874] mb-2">
              {dateStr}
            </span>
          </div>

          {data.loading ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => <div key={i} className="h-[100px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />)}
              </div>
              <div className="h-[80px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
              <div className="h-[100px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
            </div>
          ) : (
            <>
              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: String(data.cleansThisMonth), label: 'Cleans this month', accent: 'brass' as const },
                  { value: String(data.openComplaintCount), label: 'Open issues', accent: (data.openComplaintCount > 0 ? 'red' : 'brass') as 'red' | 'brass' },
                  { value: formatResolved(data.lastResolvedAt), label: 'Last issue resolved', accent: 'green' as const },
                ].map((tile) => (
                  <div key={tile.label} className="ov-stat bg-white border border-[#D0CFCA] rounded-[12px] px-6 py-5 flex flex-col gap-1">
                    <span className={`font-['Poppins',sans-serif] font-bold text-[36px] leading-none ${tile.accent === 'red' ? 'text-red-500' : tile.accent === 'green' ? 'text-[#2F4A3D]' : 'text-[#B8A77A]'}`}>
                      {tile.value}
                    </span>
                    <span className="font-['Lato',sans-serif] text-[13px] text-[#737874]">{tile.label}</span>
                  </div>
                ))}
              </div>

              {/* Complaint banner */}
              {data.openComplaintCount > 0 && (
                <ComplaintBanner count={data.openComplaintCount} onTap={() => navigate('/client/complaints')} />
              )}

              {/* Site status cards */}
              {data.facilities.length === 0 ? (
                <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 text-center">
                  <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#3D3B3A]">No sites linked yet</p>
                  <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">Contact your supervisor to get your account set up.</p>
                </div>
              ) : (
                <div className={`grid gap-5 ${data.facilities.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {data.facilities.map((facility) => (
                    <SiteStatusCard
                      key={facility.id}
                      facility={facility}
                      lastCleanedDate={data.lastCleanedDate}
                      openCount={data.openComplaintCount}
                    />
                  ))}
                </div>
              )}

              {/* Evidence strip */}
              {data.recentEvidence.length > 0 && (
                <div>
                  <div className="ov-ev-header flex items-center justify-between mb-4">
                    <h2 className="font-['Poppins',sans-serif] font-semibold text-[22px] text-[#3D3B3A]">Recent Evidence</h2>
                    <button onClick={() => navigate('/client/evidence')} className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#B8A77A] hover:text-[#a8976a] transition-colors">
                      View full feed →
                    </button>
                  </div>
                  <div className="flex gap-4">
                    {data.recentEvidence.map((item) => (
                      <div key={item.id} className="ov-ev-card relative w-[200px] h-[200px] rounded-[12px] overflow-hidden bg-[#E3E3DD] shrink-0">
                        <img src={item.publicUrl} alt={item.zoneName} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-10 pb-3">
                          <p className="font-['Lato',sans-serif] text-white text-[12px] font-bold truncate">{item.zoneName}</p>
                          <p className="font-['Lato',sans-serif] text-white/70 text-[11px]">{formatEvidenceTime(item.submittedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Client portal — site overview screen. Shows at a glance: site status, quick stats, recent evidence. */
export function Overview() {
  return (
    <>
      <div className="md:hidden"><MobileOverview /></div>
      <div className="hidden md:block"><DesktopOverview /></div>
    </>
  )
}
