import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { ClientNav } from '../../components/client/ClientNav'
import { ClientSidebar } from '../../components/client/ClientSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { gsap, useGSAP } from '../../lib/gsap'

function currentMonthStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShiftRecord {
  id: string
  facilityName: string
  scheduledDate: string
  status: string
  totalZones: number
  completedZones: number
  cleanerNames: string[]
}

interface HistoryState {
  loading: boolean
  shifts: ShiftRecord[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShiftDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function monthLabelFromStr(str: string): string {
  return new Date(str + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useHistoryData(filterMonth: string): HistoryState & { reload: () => void } {
  const { user } = useApp()
  const [state, setState] = useState<HistoryState>({ loading: true, shifts: [] })

  const load = useCallback(async () => {
    if (!user || !filterMonth) return
    setState((s) => ({ ...s, loading: true }))

    const { data: memberRows } = await supabase
      .from('client_org_members')
      .select('org_id')
      .eq('profile_id', user.id)

    const orgIds = (memberRows ?? []).map((m) => (m as { org_id: string }).org_id)
    if (orgIds.length === 0) { setState({ loading: false, shifts: [] }); return }

    const { data: facilityRows } = await supabase
      .from('facilities')
      .select('id, name')
      .in('org_id', orgIds)

    const facilities: { id: string; name: string }[] = (facilityRows ?? []).map((f) => (f as { id: string; name: string }))
    const facilityIds = facilities.map((f) => f.id)
    if (facilityIds.length === 0) { setState({ loading: false, shifts: [] }); return }

    const facilityMap = Object.fromEntries(facilities.map((f) => [f.id, f.name]))

    const [yr, mo] = filterMonth.split('-').map(Number)
    const from = `${yr}-${String(mo).padStart(2, '0')}-01`
    const to = new Date(yr, mo, 0).toISOString().slice(0, 10)

    const { data: jobRows } = await supabase
      .from('jobs')
      .select('id, facility_id, scheduled_date, status')
      .in('facility_id', facilityIds)
      .gte('scheduled_date', from)
      .lte('scheduled_date', to)
      .order('scheduled_date', { ascending: false })

    if (!jobRows || jobRows.length === 0) { setState({ loading: false, shifts: [] }); return }

    const jobIds = jobRows.map((j) => j.id as string)

    // Fetch zones + cleaner names in one query via FK join
    const { data: zoneRows } = await supabase
      .from('job_zones')
      .select('job_id, status, cleaner_id, profiles(id, full_name)')
      .in('job_id', jobIds)

    type ZoneRow = { job_id: string; status: string; cleaner_id: string | null; profiles: { id: string; full_name: string }[] }

    const cleanerNameMap: Record<string, string> = {}
    for (const z of (zoneRows ?? [])) {
      const zr = z as unknown as ZoneRow
      if (zr.cleaner_id && zr.profiles?.[0]?.full_name) {
        cleanerNameMap[zr.cleaner_id] = zr.profiles[0].full_name
      }
    }

    const zoneCounts: Record<string, { total: number; done: number; cleaners: Set<string> }> = {}
    for (const id of jobIds) zoneCounts[id] = { total: 0, done: 0, cleaners: new Set() }

    for (const z of (zoneRows ?? [])) {
      const zr = z as unknown as ZoneRow
      const entry = zoneCounts[zr.job_id]
      if (!entry) continue
      entry.total += 1
      if (zr.status === 'completed') entry.done += 1
      if (zr.cleaner_id && cleanerNameMap[zr.cleaner_id]) {
        const name = cleanerNameMap[zr.cleaner_id]
        entry.cleaners.add(name.split(' ')[0] ?? name)
      }
    }

    const shifts: ShiftRecord[] = jobRows.map((j) => {
      const counts = zoneCounts[j.id as string] ?? { total: 0, done: 0, cleaners: new Set<string>() }
      return {
        id: j.id as string,
        facilityName: facilityMap[j.facility_id as string] ?? 'Site',
        scheduledDate: j.scheduled_date as string,
        status: j.status as string,
        totalZones: counts.total,
        completedZones: counts.done,
        cleanerNames: Array.from(counts.cleaners).slice(0, 3),
      }
    })

    setState({ loading: false, shifts })
  }, [user, filterMonth])

  useEffect(() => { if (user) void load() }, [load, user])
  return { ...state, reload: load }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShiftCard({ shift }: { shift: ShiftRecord }) {
  const navigate = useNavigate()
  const pct = shift.totalZones > 0 ? Math.round((shift.completedZones / shift.totalZones) * 100) : 0
  const complete = shift.status === 'completed'

  return (
    <button
      className="cl-hist-card w-full text-left bg-white border border-[#D0CFCA] rounded-[12px] px-5 py-4 flex items-center gap-4 hover:border-[#B8A77A] transition-colors"
      onClick={() => navigate(`/client/evidence?date=${shift.scheduledDate}`)}
    >
      {/* Date block */}
      <div className="w-12 shrink-0">
        <p className="w-full text-center font-['Poppins'] font-bold text-[20px] text-[#3D3B3A] leading-none">
          {new Date(shift.scheduledDate).getDate()}
        </p>
        <p className="w-full text-center font-['Lato'] text-[11px] text-[#434B4D] uppercase tracking-[0.5px] mt-0.5">
          {new Date(shift.scheduledDate).toLocaleDateString('en-GB', { month: 'short' })}
        </p>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-[#D0CFCA] shrink-0" />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-['Poppins'] font-semibold text-[14px] text-[#3D3B3A] truncate">{shift.facilityName}</p>
          <span className={`shrink-0 text-[10px] font-['Lato'] font-bold uppercase tracking-[0.8px] px-2 py-0.5 rounded-full ${complete ? 'bg-[#EEF6F1] text-[#2F4A3D]' : 'bg-gray-100 text-[#434B4D]'}`}>
            {complete ? 'Done' : 'Part'}
          </span>
        </div>
        <p className="font-['Lato'] text-[12px] text-[#434B4D]">
          {shift.completedZones} / {shift.totalZones} zones · {formatShiftDate(shift.scheduledDate)}
        </p>
        {shift.cleanerNames.length > 0 && (
          <p className="font-['Lato'] text-[11px] text-[#B8A77A] mt-0.5">
            {shift.cleanerNames.join(', ')}
            {shift.cleanerNames.length >= 3 ? '…' : ''}
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-[#F0EFEA] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${complete ? 'bg-[#2F4A3D]' : 'bg-[#B8A77A]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Chevron */}
      <div className="text-[#D0CFCA] shrink-0">
        <ChevronRightIcon />
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Client portal — cleaning visit history by month. Month/year input; header stays static on navigation. */
export function ClientHistory() {
  const isDesktop = useIsDesktop()
  const [filterMonth, setFilterMonth] = useState(currentMonthStr)
  const { loading, shifts } = useHistoryData(filterMonth)
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedRef    = useRef(false)
  const isFirstRender = useRef(true)
  const defaultMonth  = currentMonthStr()

  const monthLabel = filterMonth
    ? monthLabelFromStr(filterMonth)
    : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  // One-time entrance — header + filter fade in, no y movement
  useGSAP(() => {
    if (loading || mountedRef.current) return
    mountedRef.current = true
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.hist-heading', { opacity: 0, duration: 0.4 })
      .from('.hist-filter',  { opacity: 0, duration: 0.3 }, '<0.1')
      .from('.cl-hist-card', { opacity: 0, duration: 0.35, stagger: 0.06 }, '<0.1')
  }, { scope: containerRef, dependencies: [loading] })

  // Cards only on month change — fade in, no y, skip first render
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (loading || !containerRef.current) return
    gsap.from(containerRef.current.querySelectorAll('.cl-hist-card'), {
      opacity: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out',
    })
  }, [filterMonth, loading])

  const content = (
    <div ref={containerRef} className={isDesktop ? 'max-w-[900px] mx-auto px-8 py-8 pb-12' : 'w-full max-w-[480px] mx-auto px-6 py-8 pb-[100px]'}>

      {/* Static header */}
      <div className="hist-heading mb-6">
        <p className="font-['Lato'] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">
          Visit Records
        </p>
        <h1 className="font-['Poppins'] font-bold text-[30px] text-[#3D3B3A] leading-tight">History</h1>
        <p className="font-['Lato'] text-[13px] text-[#434B4D] mt-0.5">{monthLabel}</p>
      </div>

      {/* Static month/year input */}
      <div className="hist-filter flex items-center gap-3 mb-5">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="h-9 rounded-[8px] border border-[#D0CFCA] bg-white px-3 font-['Lato'] text-[13px] text-[#3D3B3A] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
        />
        {filterMonth !== defaultMonth && (
          <button
            onClick={() => setFilterMonth(defaultMonth)}
            className="h-9 px-3 rounded-[8px] border border-[#D0CFCA] bg-white font-['Lato'] text-[13px] text-[#434B4D] hover:text-[#3D3B3A] transition-colors"
          >
            This month
          </button>
        )}
      </div>

      {/* Animated area */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-[12px] bg-white border border-[#D0CFCA] animate-pulse" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <div className="cl-hist-card bg-white border border-[#D0CFCA] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins'] font-semibold text-[15px] text-[#3D3B3A]">No visits this month</p>
          <p className="font-['Lato'] text-[13px] text-[#434B4D] mt-1">
            No cleaning visits were recorded for {monthLabel}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-['Lato'] text-[12px] text-[#434B4D] mb-1">
            {shifts.length} visit{shifts.length > 1 ? 's' : ''} in {monthLabel}
          </p>
          {shifts.map((s) => <ShiftCard key={s.id} shift={s} />)}
        </div>
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <>
        <ClientSidebar active="history" />
        <main className="pl-60 min-h-screen bg-[#F5F4EF]">{content}</main>
      </>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-[#F5F4EF] overflow-y-auto">{content}</div>
      <ClientNav active="history" />
    </>
  )
}
