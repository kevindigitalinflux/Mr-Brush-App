import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { ClientNav } from '../../components/client/ClientNav'
import { ClientSidebar } from '../../components/client/ClientSidebar'
import { gsap, useGSAP } from '../../lib/gsap'

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
  month: Date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function monthEnd(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function formatShiftDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useHistoryData(month: Date): HistoryState & { reload: () => void } {
  const { user } = useApp()
  const [state, setState] = useState<HistoryState>({ loading: true, shifts: [], month })

  const load = useCallback(async () => {
    if (!user) return
    setState((s) => ({ ...s, loading: true }))

    const { data: memberRows } = await supabase
      .from('client_org_members')
      .select('org_id')
      .eq('profile_id', user.id)

    const orgIds = (memberRows ?? []).map((m) => (m as { org_id: string }).org_id)
    if (orgIds.length === 0) { setState({ loading: false, shifts: [], month }); return }

    const { data: facilityRows } = await supabase
      .from('facilities')
      .select('id, name')
      .in('org_id', orgIds)

    const facilities: { id: string; name: string }[] = (facilityRows ?? []).map((f) => (f as { id: string; name: string }))
    const facilityIds = facilities.map((f) => f.id)
    if (facilityIds.length === 0) { setState({ loading: false, shifts: [], month }); return }

    const facilityMap = Object.fromEntries(facilities.map((f) => [f.id, f.name]))

    const from = isoDate(monthStart(month))
    const to = isoDate(monthEnd(month))

    const { data: jobRows } = await supabase
      .from('jobs')
      .select('id, facility_id, scheduled_date, status')
      .in('facility_id', facilityIds)
      .gte('scheduled_date', from)
      .lte('scheduled_date', to)
      .order('scheduled_date', { ascending: false })

    if (!jobRows || jobRows.length === 0) { setState({ loading: false, shifts: [], month }); return }

    const jobIds = jobRows.map((j) => j.id as string)

    // Zone counts and cleaner names per job
    const { data: zoneRows } = await supabase
      .from('job_zones')
      .select('job_id, status, profiles ( name )')
      .in('job_id', jobIds)

    const zoneCounts: Record<string, { total: number; done: number; cleaners: Set<string> }> = {}
    for (const id of jobIds) zoneCounts[id] = { total: 0, done: 0, cleaners: new Set() }

    for (const z of (zoneRows ?? [])) {
      const zr = z as unknown as { job_id: string; status: string; profiles: { name: string } | null }
      const entry = zoneCounts[zr.job_id]
      if (!entry) continue
      entry.total += 1
      if (zr.status === 'completed') entry.done += 1
      if (zr.profiles?.name) entry.cleaners.add(zr.profiles.name.split(' ')[0] ?? zr.profiles.name)
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

    setState({ loading: false, shifts, month })
  }, [user, month])

  useEffect(() => { if (user) void load() }, [load, user])
  return { ...state, reload: load }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {dir === 'left'
        ? <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MonthPicker({ month, onChange }: { month: Date; onChange: (d: Date) => void }) {
  const now = new Date()
  const isCurrentMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()

  function prev() {
    onChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }
  function next() {
    if (!isCurrentMonth) onChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-[#D0CFCA] rounded-[10px] px-3 py-2 w-fit">
      <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4EF] text-[#434B4D]">
        <ChevronIcon dir="left" />
      </button>
      <span className="font-['Poppins'] font-semibold text-[13px] text-[#3D3B3A] min-w-[120px] text-center">
        {formatMonthLabel(month)}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F5F4EF] text-[#434B4D] disabled:opacity-30"
      >
        <ChevronIcon dir="right" />
      </button>
    </div>
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
        <ChevronIcon dir="right" />
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Client portal — cleaning visit history by month. */
export function ClientHistory() {
  const [month, setMonth] = useState(() => new Date())
  const { loading, shifts } = useHistoryData(month)
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current || loading || shifts.length === 0) return
    gsap.from('.cl-hist-card', { opacity: 0, y: 14, duration: 0.35, stagger: 0.06, ease: 'power2.out', clearProps: 'all' })
  }, { scope: containerRef, dependencies: [loading, month] })

  const content = (
    <div ref={containerRef} className="max-w-[900px] mx-auto px-6 py-8 pb-[88px] md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <p className="font-['Lato'] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">
          Visit Records
        </p>
        <h1 className="font-['Poppins'] font-bold text-[26px] text-[#3D3B3A] leading-tight">History</h1>
      </div>

      {/* Month picker */}
      <div className="mb-5">
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-[12px] bg-white border border-[#D0CFCA] animate-pulse" />
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins'] font-semibold text-[15px] text-[#3D3B3A]">No visits this month</p>
          <p className="font-['Lato'] text-[13px] text-[#434B4D] mt-1">
            No cleaning visits were recorded for {formatMonthLabel(month)}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-['Lato'] text-[12px] text-[#434B4D] mb-1">
            {shifts.length} visit{shifts.length > 1 ? 's' : ''} in {formatMonthLabel(month)}
          </p>
          {shifts.map((s) => <ShiftCard key={s.id} shift={s} />)}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="hidden md:block">
        <ClientSidebar active="history" />
      </div>

      <div className="md:pl-60 min-h-screen bg-[#F5F4EF]">
        {content}
      </div>

      <div className="md:hidden">
        <ClientNav active="history" />
      </div>
    </>
  )
}
