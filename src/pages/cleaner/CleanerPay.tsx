import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { BottomNav } from '../../components/BottomNav'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

type PayStatus = 'draft' | 'approved' | 'paid'

interface ShiftRecord {
  id: string
  shiftDate: string
  facilityName: string
  hoursWorked: number
  hourlyRate: number
  grossPay: number
  status: PayStatus
  isReplacement: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PayStatus, string> = {
  draft:    'bg-[#E3E3DD] text-[#737874]',
  approved: 'bg-[#F1DEAD] text-[#6F613A]',
  paid:     'bg-[#D7E6DB] text-[#2F4A3D]',
}

const STATUS_LABELS: Record<PayStatus, string> = {
  draft: 'Pending', approved: 'Approved', paid: 'Paid',
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function usePayData(filterMonth: string) {
  const { user } = useApp()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<ShiftRecord[]>([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    let q = supabase
      .from('pay_records')
      .select('id, shift_date, facility_id, hours_worked, hourly_rate, gross_pay, status, is_replacement')
      .eq('cleaner_id', user.id)
      .order('shift_date', { ascending: false })
      .limit(200)

    if (filterMonth) {
      const [yr, mo] = filterMonth.split('-').map(Number)
      const start = `${yr}-${String(mo).padStart(2, '0')}-01`
      const end = new Date(yr, mo, 0).toISOString().slice(0, 10)
      q = q.gte('shift_date', start).lte('shift_date', end)
    }

    const { data: prRows } = await q
    const rows = (prRows ?? []) as {
      id: string; shift_date: string; facility_id: string
      hours_worked: string; hourly_rate: string; gross_pay: string
      status: string; is_replacement: boolean
    }[]

    if (rows.length === 0) { setRecords([]); setLoading(false); return }

    const facilityIds = [...new Set(rows.map((r) => r.facility_id))]
    const { data: fRows } = await supabase
      .from('facilities')
      .select('id, name')
      .in('id', facilityIds)

    const fMap: Record<string, string> = {}
    for (const f of (fRows ?? [])) {
      const r = f as { id: string; name: string }
      fMap[r.id] = r.name
    }

    const validStatuses: PayStatus[] = ['draft', 'approved', 'paid']
    setRecords(rows.map((r) => ({
      id: r.id,
      shiftDate: r.shift_date,
      facilityName: fMap[r.facility_id] ?? 'Unknown site',
      hoursWorked: Number(r.hours_worked),
      hourlyRate: Number(r.hourly_rate),
      grossPay: Number(r.gross_pay),
      status: validStatuses.includes(r.status as PayStatus) ? (r.status as PayStatus) : 'draft',
      isReplacement: r.is_replacement,
    })))

    setLoading(false)
  }, [user, filterMonth])

  useEffect(() => { void load() }, [load])

  const totalHours = records.reduce((s, r) => s + r.hoursWorked, 0)
  const totalGross = records.reduce((s, r) => s + r.grossPay, 0)

  return { loading, records, totalHours, totalGross }
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ records, totalHours, totalGross }: { records: ShiftRecord[]; totalHours: number; totalGross: number }) {
  if (records.length === 0) return null
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'Shifts', value: String(records.length) },
        { label: 'Hours', value: totalHours.toFixed(1) },
        { label: 'Expected Pay', value: `£${totalGross.toFixed(2)}` },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white border border-[#D0CFCA] rounded-[12px] px-3 py-4 text-center">
          <p className="font-['Lato',sans-serif] text-[10px] font-bold uppercase tracking-[1px] text-[#737874]">{label}</p>
          <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1A1C19] mt-1 leading-none">{value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Shift card ───────────────────────────────────────────────────────────────

function ShiftCard({ record }: { record: ShiftRecord }) {
  const dayNum = new Date(record.shiftDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric' })
  const monthStr = new Date(record.shiftDate + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })

  return (
    <div className="pay-card bg-white border border-[#D0CFCA] rounded-[12px] flex items-stretch overflow-hidden">
      {/* Date column */}
      <div className="w-[62px] flex flex-col items-center justify-center border-r border-[#E3E3DD] py-4 shrink-0 bg-[#F4F4EE]">
        <span className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-none">{dayNum}</span>
        <span className="font-['Lato',sans-serif] text-[10px] tracking-[1px] text-[#737874] uppercase mt-0.5">{monthStr}</span>
      </div>

      {/* Main info */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate flex-1">{record.facilityName}</p>
          {record.isReplacement && (
            <span className="shrink-0 font-['Lato',sans-serif] text-[10px] font-bold uppercase tracking-[0.5px] px-2 py-0.5 rounded-full bg-[#E3E3DD] text-[#737874]">Sub</span>
          )}
        </div>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#B8A77A]">
          {record.hoursWorked}h × £{record.hourlyRate.toFixed(2)}/hr
        </p>
        <span className={`inline-block mt-1.5 font-['Lato',sans-serif] text-[10px] font-bold uppercase tracking-[0.5px] px-2 py-0.5 rounded-full ${STATUS_STYLES[record.status]}`}>
          {STATUS_LABELS[record.status]}
        </span>
      </div>

      {/* Gross pay */}
      <div className="flex items-center pr-4 pl-2 shrink-0">
        <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19]">
          £{record.grossPay.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function PayContent() {
  const { user } = useApp()
  const [filterMonth, setFilterMonth] = useState('')
  const { loading, records, totalHours, totalGross } = usePayData(filterMonth)
  const containerRef = useRef<HTMLDivElement>(null)
  const headerAnimated = useRef(false)

  useGSAP(() => {
    if (loading) return
    if (!headerAnimated.current) {
      headerAnimated.current = true
      gsap.timeline({ defaults: { ease: 'power2.out' } })
        .from('.pay-header', { opacity: 0, y: 14, duration: 0.4 })
        .from('.pay-filter', { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
        .from('.pay-card',   { opacity: 0, y: 16, duration: 0.4, stagger: 0.06 }, '-=0.15')
    } else {
      gsap.from('.pay-card', { opacity: 0, y: 16, duration: 0.4, stagger: 0.06, ease: 'power2.out' })
    }
  }, { scope: containerRef, dependencies: [loading] })

  const currentMonth = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })
  const filterLabel = filterMonth
    ? new Date(filterMonth + '-01').toLocaleString('en-GB', { month: 'long', year: 'numeric' })
    : currentMonth

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto px-6 py-10 pb-[120px] md:pb-10">

      {/* Header */}
      <div className="pay-header mb-6">
        <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] md:text-[36px] text-[#1A1C19] leading-tight">Your Pay</h1>
        <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-1">
          {user?.name ? `${user.name} · ` : ''}{filterLabel}
        </p>
      </div>

      {/* Month filter */}
      <div className="pay-filter flex items-center gap-3 mb-6">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="h-9 rounded-[8px] border border-[#D0CFCA] bg-white px-3 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
        />
        {filterMonth && (
          <button
            onClick={() => setFilterMonth('')}
            className="h-9 px-3 rounded-[8px] border border-[#D0CFCA] bg-white font-['Lato',sans-serif] text-[13px] text-[#737874] hover:text-[#1A1C19] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-[76px] rounded-[12px] bg-white border border-[#D0CFCA] animate-pulse" />)}
          </div>
          {[1, 2, 3].map((i) => <div key={i} className="h-[80px] rounded-[12px] bg-white border border-[#D0CFCA] animate-pulse" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">No pay records yet</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">
            {filterMonth ? 'No records for this month. Try a different period.' : 'Your pay records will appear here once logged by your supervisor.'}
          </p>
        </div>
      ) : (
        <>
          <div className="pay-summary">
            <SummaryCards records={records} totalHours={totalHours} totalGross={totalGross} />
          </div>
          <div className="space-y-3">
            {records.map((r) => <ShiftCard key={r.id} record={r} />)}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Layouts ──────────────────────────────────────────────────────────────────

function MobileCleanerPay() {
  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <PayContent />
      <BottomNav active="pay" />
    </div>
  )
}

function DesktopCleanerPay() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="pay" />
      <main className="flex-1 overflow-y-auto ml-60">
        <PayContent />
      </main>
    </div>
  )
}

/** Cleaner pay screen — read-only view of personal shift pay records. */
export function CleanerPay() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopCleanerPay /> : <MobileCleanerPay />
}
