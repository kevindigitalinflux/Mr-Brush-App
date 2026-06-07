import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
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

function useStatusLabel(status: PayStatus): string {
  const t = useTranslation()
  const map: Record<PayStatus, string> = {
    draft: t('pay_status_pending'),
    approved: t('pay_status_approved'),
    paid: t('pay_status_paid'),
  }
  return map[status]
}

// ─── Mock data (preview only) ─────────────────────────────────────────────────

const MOCK_RECORDS: ShiftRecord[] = [
  { id: 'm1', shiftDate: '2026-06-01', facilityName: 'Riverfront Tower',  hoursWorked: 4.0, hourlyRate: 13.50, grossPay: 54.00,  status: 'paid',     isReplacement: false },
  { id: 'm2', shiftDate: '2026-05-29', facilityName: 'Skyline Plaza',     hoursWorked: 6.0, hourlyRate: 13.50, grossPay: 81.00,  status: 'approved', isReplacement: false },
  { id: 'm3', shiftDate: '2026-05-27', facilityName: 'Metro Hub',         hoursWorked: 5.0, hourlyRate: 13.50, grossPay: 67.50,  status: 'approved', isReplacement: true  },
  { id: 'm4', shiftDate: '2026-05-22', facilityName: 'Riverfront Tower',  hoursWorked: 4.5, hourlyRate: 13.50, grossPay: 60.75,  status: 'draft',    isReplacement: false },
  { id: 'm5', shiftDate: '2026-05-20', facilityName: 'Citygate Office',   hoursWorked: 8.0, hourlyRate: 13.50, grossPay: 108.00, status: 'draft',    isReplacement: false },
]

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
  const t = useTranslation()
  if (records.length === 0) return null
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: t('pay_shifts'), value: String(records.length) },
        { label: t('pay_hours'), value: totalHours.toFixed(1) },
        { label: t('pay_expected_pay'), value: `£${totalGross.toFixed(2)}` },
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
  const statusLabel = useStatusLabel(record.status)
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
          {statusLabel}
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
  const t = useTranslation()
  const defaultMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const [filterMonth, setFilterMonth] = useState(defaultMonth)
  const { records } = usePayData(filterMonth)
  const containerRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  // Client-side filter applied to mock records immediately — no loading gate
  const filteredMock = filterMonth
    ? MOCK_RECORDS.filter((r) => r.shiftDate.startsWith(filterMonth))
    : MOCK_RECORDS
  const displayRecords = records.length > 0 ? records : filteredMock
  const displayHours = displayRecords.reduce((s, r) => s + r.hoursWorked, 0)
  const displayGross = displayRecords.reduce((s, r) => s + r.grossPay, 0)

  // One-time page entrance — no deps means runs once on mount, reverts only on unmount
  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.pay-header',  { opacity: 0, y: 14, duration: 0.4 })
      .from('.pay-filter',  { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.pay-summary', { opacity: 0, y: 10, duration: 0.35 }, '-=0.15')
      .from('.pay-card',    { opacity: 0, y: 16, duration: 0.4, stagger: 0.06 }, '-=0.15')
  }, { scope: containerRef })

  // Cards only on filter change — plain gsap call outside any context, nothing can revert it
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!containerRef.current) return
    gsap.from(containerRef.current.querySelectorAll('.pay-card'), {
      opacity: 0, y: 16, duration: 0.4, stagger: 0.06, ease: 'power2.out',
    })
  }, [filterMonth])

  const filterLabel = filterMonth
    ? new Date(filterMonth + '-01').toLocaleString('en-GB', { month: 'long', year: 'numeric' })
    : new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto px-6 py-10 pb-[120px] md:pb-10">

      <div className="pay-header mb-6">
        <h1 className="font-['Poppins',sans-serif] font-bold text-[42px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">{t('pay_title')}</h1>
        <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-1">
          {user?.name ? `${user.name} · ` : ''}{filterLabel}
        </p>
      </div>

      <div className="pay-filter flex items-center gap-3 mb-6">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="h-9 rounded-[8px] border border-[#D0CFCA] bg-white px-3 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
        />
        {filterMonth !== defaultMonth && (
          <button
            onClick={() => setFilterMonth(defaultMonth)}
            className="h-9 px-3 rounded-[8px] border border-[#D0CFCA] bg-white font-['Lato',sans-serif] text-[13px] text-[#737874] hover:text-[#1A1C19] transition-colors"
          >
            {t('pay_clear')}
          </button>
        )}
      </div>

      {displayRecords.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">{t('pay_no_records')}</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">{t('pay_no_records_body')}</p>
        </div>
      ) : (
        <>
          <div className="pay-summary">
            <SummaryCards records={displayRecords} totalHours={displayHours} totalGross={displayGross} />
          </div>
          <div className="space-y-3">
            {displayRecords.map((r) => <ShiftCard key={r.id} record={r} />)}
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
    <div className="min-h-screen bg-[#F4F4EE]">
      <DesktopSidebar active="pay" />
      <main className="pl-60">
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
