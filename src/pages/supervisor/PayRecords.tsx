import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PayRecord {
  id: string
  shiftDate: string
  cleanerName: string
  facilityName: string
  roleType: 'cleaner' | 'supervisor'
  hoursWorked: number
  hourlyRate: number
  grossPay: number
  isReplacement: boolean
}

interface CleanerOption { id: string; name: string; displayId: string }
interface JobOption { id: string; facilityId: string; facilityName: string; scheduledDate: string }

interface LogForm {
  cleanerId: string
  jobId: string
  roleType: 'cleaner' | 'supervisor'
  hoursWorked: string
  hourlyRate: string
  notes: string
  saving: boolean
  error: string | null
}

const BLANK_FORM: LogForm = {
  cleanerId: '', jobId: '', roleType: 'cleaner',
  hoursWorked: '', hourlyRate: '', notes: '',
  saving: false, error: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function lookupRate(facilityId: string, roleType: string): Promise<number | null> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('facility_rates')
    .select('hourly_rate')
    .eq('facility_id', facilityId)
    .eq('role_type', roleType)
    .lte('effective_from', today)
    .order('effective_from', { ascending: false })
    .limit(1)
  const row = (data ?? [])[0] as { hourly_rate: number } | undefined
  return row ? Number(row.hourly_rate) : null
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function usePayData(filterCleaner: string, filterMonth: string) {
  const { user } = useApp()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<PayRecord[]>([])
  const [cleaners, setCleaners] = useState<CleanerOption[]>([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: cRows } = await supabase
      .from('profiles')
      .select('id, display_id, full_name')
      .eq('company_id', user.company_id)
      .eq('role', 'cleaner')
      .eq('is_active', true)
      .order('full_name')

    setCleaners((cRows ?? []).map((c) => {
      const r = c as { id: string; display_id: string; full_name: string | null }
      return { id: r.id, displayId: r.display_id, name: r.full_name ?? r.display_id }
    }))

    type PRRow = { id: string; shift_date: string; cleaner_id: string; facility_id: string; role_type: string; hours_worked: string; hourly_rate: string; gross_pay: string; is_replacement: boolean }

    let q = supabase
      .from('pay_records')
      .select('id, shift_date, cleaner_id, facility_id, role_type, hours_worked, hourly_rate, gross_pay, is_replacement')
      .eq('company_id', user.company_id)
      .order('shift_date', { ascending: false })
      .limit(200)

    if (filterCleaner) q = q.eq('cleaner_id', filterCleaner)
    if (filterMonth) {
      const [yr, mo] = filterMonth.split('-').map(Number)
      const start = `${yr}-${String(mo).padStart(2, '0')}-01`
      const end = new Date(yr, mo, 0).toISOString().slice(0, 10)
      q = q.gte('shift_date', start).lte('shift_date', end)
    }

    const { data: prRows } = await q
    const rows = (prRows ?? []) as PRRow[]

    if (rows.length === 0) { setRecords([]); setLoading(false); return }

    const cleanerIds = [...new Set(rows.map((r) => r.cleaner_id))]
    const facilityIds = [...new Set(rows.map((r) => r.facility_id))]

    const [{ data: pRows }, { data: fRows }] = await Promise.all([
      supabase.from('profiles').select('id, display_id, full_name').in('id', cleanerIds),
      supabase.from('facilities').select('id, name').in('id', facilityIds),
    ])

    const pMap: Record<string, string> = {}
    for (const p of (pRows ?? [])) {
      const r = p as { id: string; display_id: string; full_name: string | null }
      pMap[r.id] = r.full_name ?? r.display_id
    }
    const fMap: Record<string, string> = {}
    for (const f of (fRows ?? [])) {
      const r = f as { id: string; name: string }
      fMap[r.id] = r.name
    }

    setRecords(rows.map((r) => ({
      id: r.id,
      shiftDate: r.shift_date,
      cleanerName: pMap[r.cleaner_id] ?? 'Unknown',
      facilityName: fMap[r.facility_id] ?? 'Unknown site',
      roleType: r.role_type as 'cleaner' | 'supervisor',
      hoursWorked: Number(r.hours_worked),
      hourlyRate: Number(r.hourly_rate),
      grossPay: Number(r.gross_pay),
      isReplacement: r.is_replacement,
    })))

    setLoading(false)
  }, [user, filterCleaner, filterMonth])

  useEffect(() => { void load() }, [load])
  return { loading, records, cleaners, reload: load }
}

// ─── Job options hook (used inside modal) ─────────────────────────────────────

function useJobOptions(open: boolean, companyId: string) {
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  useEffect(() => {
    if (!open || !companyId) return
    setLoadingJobs(true)
    async function load() {
      const { data: jRows } = await supabase
        .from('jobs')
        .select('id, facility_id, scheduled_date')
        .eq('company_id', companyId)
        .order('scheduled_date', { ascending: false })
        .limit(60)

      const rows = (jRows ?? []) as { id: string; facility_id: string; scheduled_date: string }[]
      if (rows.length === 0) { setJobs([]); setLoadingJobs(false); return }

      const fIds = [...new Set(rows.map((r) => r.facility_id))]
      const { data: fRows } = await supabase.from('facilities').select('id, name').in('id', fIds)
      const fMap: Record<string, string> = {}
      for (const f of (fRows ?? [])) {
        const r = f as { id: string; name: string }
        fMap[r.id] = r.name
      }

      setJobs(rows.map((r) => ({
        id: r.id,
        facilityId: r.facility_id,
        facilityName: fMap[r.facility_id] ?? 'Unknown',
        scheduledDate: r.scheduled_date,
      })))
      setLoadingJobs(false)
    }
    void load()
  }, [open, companyId])

  return { jobs, loadingJobs }
}

// ─── Log Pay Modal ────────────────────────────────────────────────────────────

interface LogPayModalProps {
  cleaners: CleanerOption[]
  companyId: string
  onClose: () => void
  onSaved: () => void
}

function LogPayModal({ cleaners, companyId, onClose, onSaved }: LogPayModalProps) {
  const { user } = useApp()
  const [form, setForm] = useState<LogForm>(BLANK_FORM)
  const { jobs, loadingJobs } = useJobOptions(true, companyId)

  function set<K extends keyof LogForm>(key: K, val: LogForm[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  // Auto-fill hourly rate when job or role type changes
  useEffect(() => {
    if (!form.jobId) return
    const job = jobs.find((j) => j.id === form.jobId)
    if (!job) return
    void lookupRate(job.facilityId, form.roleType).then((rate) => {
      if (rate !== null) setForm((f) => ({ ...f, hourlyRate: rate.toFixed(2) }))
    })
  }, [form.jobId, form.roleType, jobs])

  async function handleSave() {
    if (!user) return
    const hours = parseFloat(form.hoursWorked)
    const rate = parseFloat(form.hourlyRate)
    if (!form.cleanerId) { set('error', 'Select a cleaner.'); return }
    if (!form.jobId) { set('error', 'Select a job / shift.'); return }
    if (isNaN(hours) || hours <= 0) { set('error', 'Enter hours worked (greater than 0).'); return }
    if (isNaN(rate) || rate <= 0) { set('error', 'Enter an hourly rate (greater than £0.00).'); return }

    set('saving', true); set('error', null)
    const job = jobs.find((j) => j.id === form.jobId)

    const { error } = await supabase.from('pay_records').insert({
      cleaner_id: form.cleanerId,
      job_id: form.jobId,
      facility_id: job?.facilityId ?? '',
      shift_date: job?.scheduledDate ?? new Date().toISOString().slice(0, 10),
      role_type: form.roleType,
      hours_worked: hours,
      hourly_rate: rate,
      notes: form.notes.trim() || null,
      company_id: companyId,
    })

    if (error) { setForm((f) => ({ ...f, saving: false, error: 'Could not save. Try again.' })); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-[16px] w-full max-w-md flex flex-col max-h-[92vh] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E3E3DD] shrink-0">
          <h2 className="font-['Poppins',sans-serif] font-semibold text-[17px] text-[#1A1C19]">Log Pay Record</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4F4EE] text-[#737874]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          {/* Cleaner */}
          <div>
            <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Cleaner</label>
            <select
              value={form.cleanerId}
              onChange={(e) => set('cleanerId', e.target.value)}
              className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
            >
              <option value="">Select cleaner…</option>
              {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.displayId})</option>)}
            </select>
          </div>

          {/* Job / Shift */}
          <div>
            <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Job / Shift</label>
            {loadingJobs ? (
              <div className="h-10 rounded-[8px] bg-[#F4F4EE] animate-pulse" />
            ) : (
              <select
                value={form.jobId}
                onChange={(e) => set('jobId', e.target.value)}
                className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
              >
                <option value="">Select shift…</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{fmtDate(j.scheduledDate)} · {j.facilityName}</option>
                ))}
              </select>
            )}
          </div>

          {/* Role type */}
          <div>
            <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Role</label>
            <div className="flex bg-[#E3E3DD] rounded-[8px] p-1 gap-1">
              {(['cleaner', 'supervisor'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('roleType', r)}
                  className={[
                    "flex-1 h-8 rounded-[6px] font-['Poppins',sans-serif] font-semibold text-[12px] transition-all",
                    form.roleType === r ? 'bg-white text-[#1A1C19] shadow-sm' : 'text-[#737874]',
                  ].join(' ')}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Hours + Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Hours Worked</label>
              <input
                type="number" step="0.25" min="0.25"
                value={form.hoursWorked}
                onChange={(e) => set('hoursWorked', e.target.value)}
                placeholder="e.g. 4"
                className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
              />
            </div>
            <div>
              <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Hourly Rate (£)</label>
              <input
                type="number" step="0.01" min="0.01"
                value={form.hourlyRate}
                onChange={(e) => set('hourlyRate', e.target.value)}
                placeholder="auto-filled"
                className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
              />
            </div>
          </div>

          {/* Gross preview */}
          {form.hoursWorked && form.hourlyRate && !isNaN(parseFloat(form.hoursWorked)) && !isNaN(parseFloat(form.hourlyRate)) && (
            <div className="flex items-center justify-between bg-[#F4F4EE] rounded-[8px] px-4 py-3">
              <span className="font-['Lato',sans-serif] text-[13px] text-[#737874]">Gross pay</span>
              <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19]">
                £{(parseFloat(form.hoursWorked) * parseFloat(form.hourlyRate)).toFixed(2)}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="e.g. replacement shift, adjusted hours…"
              className="w-full rounded-[8px] border border-[#D5D5CF] bg-white px-3 py-2.5 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A] resize-none"
            />
          </div>

          {form.error && <p className="font-['Lato',sans-serif] text-[12px] text-[#BA1A1A]">{form.error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-[#E3E3DD] shrink-0">
          <button
            onClick={handleSave}
            disabled={form.saving}
            className="w-full h-11 rounded-[10px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[14px] font-semibold disabled:opacity-50"
          >
            {form.saving ? 'Saving…' : 'Save Pay Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pay record card ──────────────────────────────────────────────────────────

function PayRecordCard({ record }: { record: PayRecord }) {
  return (
    <div className="bg-white border border-[#D5D5CF] rounded-[12px] flex items-stretch overflow-hidden">
      {/* Date column */}
      <div className="w-[64px] flex flex-col items-center justify-center border-r border-[#E3E3DD] py-4 shrink-0 bg-[#F4F4EE]">
        <span className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-none">
          {new Date(record.shiftDate).toLocaleDateString('en-GB', { day: 'numeric' })}
        </span>
        <span className="font-['Lato',sans-serif] text-[10px] tracking-[1px] text-[#737874] uppercase mt-0.5">
          {new Date(record.shiftDate).toLocaleDateString('en-GB', { month: 'short' })}
        </span>
      </div>

      {/* Main info */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate">{record.cleanerName}</p>
          {record.isReplacement && (
            <span className="font-['Lato',sans-serif] text-[10px] font-bold uppercase tracking-[0.5px] px-2 py-0.5 rounded-full bg-[#E3E3DD] text-[#737874]">Replacement</span>
          )}
        </div>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] truncate">{record.facilityName}</p>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#B8A77A] mt-0.5">
          {record.hoursWorked}h × £{Number(record.hourlyRate).toFixed(2)}/{record.roleType === 'supervisor' ? 'hr (sup)' : 'hr'}
        </p>
      </div>

      {/* Gross pay */}
      <div className="flex items-center pr-4 pl-2 shrink-0">
        <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19]">
          £{Number(record.grossPay).toFixed(2)}
        </span>
      </div>
    </div>
  )
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar({ records }: { records: PayRecord[] }) {
  if (records.length === 0) return null
  const totalHours = records.reduce((s, r) => s + r.hoursWorked, 0)
  const totalGross = records.reduce((s, r) => s + r.grossPay, 0)
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'Shifts', value: String(records.length) },
        { label: 'Hours', value: totalHours.toFixed(1) },
        { label: 'Gross Pay', value: `£${totalGross.toFixed(2)}` },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white border border-[#D5D5CF] rounded-[10px] px-4 py-3 text-center">
          <p className="font-['Lato',sans-serif] text-[10px] font-bold uppercase tracking-[1px] text-[#737874]">{label}</p>
          <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#1A1C19] mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function PayRecordsContent() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [filterCleaner, setFilterCleaner] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { loading, records, cleaners, reload } = usePayData(filterCleaner, filterMonth)

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-10 pb-[100px] md:pb-10">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/supervisor/rates')} className="flex items-center gap-1.5 font-['Lato',sans-serif] text-[12px] text-[#B8A77A] font-bold uppercase tracking-[1px] mb-3 hover:text-[#8B7A5A] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Pay Management
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] md:text-[36px] text-[#1A1C19] leading-tight">Pay Records</h1>
            <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-1">Per-shift earnings log for your cleaners.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 mt-1 flex items-center gap-1.5 px-4 h-9 rounded-[8px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[13px] font-semibold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Log Pay
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterCleaner}
          onChange={(e) => setFilterCleaner(e.target.value)}
          className="h-9 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
        >
          <option value="">All cleaners</option>
          {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="h-9 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
        />
        {(filterCleaner || filterMonth) && (
          <button
            onClick={() => { setFilterCleaner(''); setFilterMonth('') }}
            className="h-9 px-3 rounded-[8px] border border-[#D5D5CF] bg-white font-['Lato',sans-serif] text-[13px] text-[#737874] hover:text-[#1A1C19] transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-[12px] bg-white border border-[#D5D5CF] animate-pulse" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-[#D5D5CF] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">No pay records found</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">
            {filterCleaner || filterMonth ? 'Try adjusting your filters.' : 'Log a pay record to get started.'}
          </p>
        </div>
      ) : (
        <>
          <SummaryBar records={records} />
          <div className="space-y-3">
            {records.map((r) => <PayRecordCard key={r.id} record={r} />)}
          </div>
        </>
      )}

      {showModal && user && (
        <LogPayModal
          cleaners={cleaners}
          companyId={user.company_id}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); void reload() }}
        />
      )}
    </div>
  )
}

// ─── Layouts ──────────────────────────────────────────────────────────────────

function MobilePayRecords() {
  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <PayRecordsContent />
      <SupervisorNav active="rates" />
    </div>
  )
}

function DesktopPayRecords() {
  return (
    <div className="min-h-screen bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="rates" />
      <main className="pl-60">
        <PayRecordsContent />
      </main>
    </div>
  )
}

/** Supervisor portal — per-shift pay records log. */
export function PayRecords() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopPayRecords /> : <MobilePayRecords />
}
