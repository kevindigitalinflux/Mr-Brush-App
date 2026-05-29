import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Types ────────────────────────────────────────────────────────────────────

type SlipStatus = 'draft' | 'finalised' | 'sent'

interface Payslip {
  id: string
  cleanerName: string
  cleanerId: string
  periodStart: string
  periodEnd: string
  totalShifts: number
  totalHours: number
  totalGrossPay: number
  status: SlipStatus
  createdAt: string
}

interface CleanerOption { id: string; name: string; displayId: string }

interface GenerateForm {
  cleanerId: string
  periodStart: string
  periodEnd: string
  saving: boolean
  error: string | null
  preview: { shifts: number; hours: number; gross: number } | null
  previewing: boolean
}

const BLANK_FORM: GenerateForm = {
  cleanerId: '', periodStart: '', periodEnd: '',
  saving: false, error: null, preview: null, previewing: false,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPeriod(start: string, end: string) {
  return `${fmtDate(start)} – ${fmtDate(end)}`
}

const STATUS_STYLE: Record<SlipStatus, string> = {
  draft:      'bg-[#E3E3DD] text-[#737874]',
  finalised:  'bg-[#D7E6DB] text-[#2F4A3D]',
  sent:       'bg-[#EDE4CE] text-[#7A6030]',
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function usePayslipsData() {
  const { user } = useApp()
  const [loading, setLoading] = useState(true)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [cleaners, setCleaners] = useState<CleanerOption[]>([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: cRows }, { data: psRows }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_id, full_name')
        .eq('company_id', user.company_id)
        .eq('role', 'cleaner')
        .eq('is_active', true)
        .order('full_name'),
      supabase
        .from('payslips')
        .select('id, cleaner_id, period_start, period_end, total_shifts, total_hours, total_gross_pay, status, created_at')
        .eq('company_id', user.company_id)
        .order('period_end', { ascending: false })
        .limit(100),
    ])

    const cleanerList = (cRows ?? []).map((c) => {
      const r = c as { id: string; display_id: string; full_name: string | null }
      return { id: r.id, displayId: r.display_id, name: r.full_name ?? r.display_id }
    })
    setCleaners(cleanerList)

    const nameMap: Record<string, string> = {}
    for (const c of cleanerList) nameMap[c.id] = c.name

    setPayslips((psRows ?? []).map((p) => {
      const r = p as { id: string; cleaner_id: string; period_start: string; period_end: string; total_shifts: number; total_hours: string; total_gross_pay: string; status: string; created_at: string }
      return {
        id: r.id,
        cleanerId: r.cleaner_id,
        cleanerName: nameMap[r.cleaner_id] ?? 'Unknown',
        periodStart: r.period_start,
        periodEnd: r.period_end,
        totalShifts: r.total_shifts,
        totalHours: Number(r.total_hours),
        totalGrossPay: Number(r.total_gross_pay),
        status: r.status as SlipStatus,
        createdAt: r.created_at,
      }
    }))
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])
  return { loading, payslips, cleaners, reload: load }
}

// ─── Generate Payslip Modal ───────────────────────────────────────────────────

interface GenerateModalProps {
  cleaners: CleanerOption[]
  companyId: string
  onClose: () => void
  onSaved: () => void
}

function GenerateModal({ cleaners, companyId, onClose, onSaved }: GenerateModalProps) {
  const { user } = useApp()
  const [form, setForm] = useState<GenerateForm>(BLANK_FORM)

  function set<K extends keyof GenerateForm>(key: K, val: GenerateForm[K]) {
    setForm((f) => ({ ...f, [key]: val, preview: null }))
  }

  async function handlePreview() {
    if (!form.cleanerId || !form.periodStart || !form.periodEnd) {
      setForm((f) => ({ ...f, error: 'Select a cleaner and both period dates.' })); return
    }
    if (form.periodStart > form.periodEnd) {
      setForm((f) => ({ ...f, error: 'Period start must be before period end.' })); return
    }
    setForm((f) => ({ ...f, previewing: true, error: null }))

    const { data } = await supabase
      .from('pay_records')
      .select('hours_worked, gross_pay')
      .eq('cleaner_id', form.cleanerId)
      .eq('company_id', companyId)
      .gte('shift_date', form.periodStart)
      .lte('shift_date', form.periodEnd)

    const rows = (data ?? []) as { hours_worked: string; gross_pay: string }[]
    setForm((f) => ({
      ...f,
      previewing: false,
      preview: {
        shifts: rows.length,
        hours: rows.reduce((s, r) => s + Number(r.hours_worked), 0),
        gross: rows.reduce((s, r) => s + Number(r.gross_pay), 0),
      },
    }))
  }

  async function handleSave() {
    if (!user || !form.preview) return
    setForm((f) => ({ ...f, saving: true, error: null }))
    const { error } = await supabase.from('payslips').insert({
      cleaner_id: form.cleanerId,
      period_start: form.periodStart,
      period_end: form.periodEnd,
      total_shifts: form.preview.shifts,
      total_hours: form.preview.hours,
      total_gross_pay: form.preview.gross,
      status: 'draft',
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
          <h2 className="font-['Poppins',sans-serif] font-semibold text-[17px] text-[#1A1C19]">Generate Payslip</h2>
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

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Period Start</label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) => set('periodStart', e.target.value)}
                className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
              />
            </div>
            <div>
              <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Period End</label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => set('periodEnd', e.target.value)}
                className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
              />
            </div>
          </div>

          {/* Preview */}
          {!form.preview ? (
            <button
              onClick={handlePreview}
              disabled={form.previewing}
              className="w-full h-10 rounded-[8px] border border-[#B8A77A] text-[#B8A77A] font-['Lato',sans-serif] text-[13px] font-semibold disabled:opacity-50 hover:bg-[#F4F4EE] transition-colors"
            >
              {form.previewing ? 'Calculating…' : 'Preview totals'}
            </button>
          ) : (
            <div className="bg-[#F4F4EE] rounded-[10px] px-4 py-4 space-y-2">
              <p className="font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-3">Preview</p>
              {[
                { label: 'Shifts', value: String(form.preview.shifts) },
                { label: 'Total Hours', value: form.preview.hours.toFixed(1) },
                { label: 'Gross Pay', value: `£${form.preview.gross.toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-['Lato',sans-serif] text-[13px] text-[#737874]">{label}</span>
                  <span className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19]">{value}</span>
                </div>
              ))}
              {form.preview.shifts === 0 && (
                <p className="font-['Lato',sans-serif] text-[12px] text-[#B8A77A] pt-1">No pay records found for this period.</p>
              )}
            </div>
          )}

          {form.error && <p className="font-['Lato',sans-serif] text-[12px] text-[#BA1A1A]">{form.error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-[#E3E3DD] shrink-0">
          <button
            onClick={handleSave}
            disabled={form.saving || !form.preview || form.preview.shifts === 0}
            className="w-full h-11 rounded-[10px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[14px] font-semibold disabled:opacity-50"
          >
            {form.saving ? 'Saving…' : 'Save Payslip (Draft)'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Payslip card ─────────────────────────────────────────────────────────────

interface PayslipCardProps {
  payslip: Payslip
  onStatusChange: (id: string, status: SlipStatus) => void
  updating: boolean
}

function PayslipCard({ payslip, onStatusChange, updating }: PayslipCardProps) {
  const nextStatus: Record<SlipStatus, { label: string; next: SlipStatus } | null> = {
    draft:     { label: 'Mark Finalised', next: 'finalised' },
    finalised: { label: 'Mark Sent', next: 'sent' },
    sent:      null,
  }
  const action = nextStatus[payslip.status]

  return (
    <div className="bg-white border border-[#D5D5CF] rounded-[12px] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">{payslip.cleanerName}</p>
          <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] mt-0.5">{fmtPeriod(payslip.periodStart, payslip.periodEnd)}</p>
        </div>
        <span className={['font-[\'Lato\',sans-serif] font-bold text-[11px] uppercase tracking-[0.5px] px-2.5 py-1 rounded-full', STATUS_STYLE[payslip.status]].join(' ')}>
          {payslip.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Shifts', value: String(payslip.totalShifts) },
          { label: 'Hours', value: payslip.totalHours.toFixed(1) },
          { label: 'Gross', value: `£${payslip.totalGrossPay.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#F4F4EE] rounded-[8px] px-3 py-2 text-center">
            <p className="font-['Lato',sans-serif] text-[10px] font-bold uppercase tracking-[0.8px] text-[#737874]">{label}</p>
            <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19] mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {action && (
        <button
          onClick={() => onStatusChange(payslip.id, action.next)}
          disabled={updating}
          className="w-full h-9 rounded-[8px] border border-[#D5D5CF] bg-white font-['Lato',sans-serif] text-[13px] font-semibold text-[#1A1C19] hover:bg-[#F4F4EE] transition-colors disabled:opacity-50"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function PayslipsContent() {
  const { user } = useApp()
  const navigate = useNavigate()
  const { loading, payslips, cleaners, reload } = usePayslipsData()
  const [showModal, setShowModal] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function handleStatusChange(id: string, status: SlipStatus) {
    setUpdatingId(id)
    await supabase.from('payslips').update({ status }).eq('id', id)
    setUpdatingId(null)
    void reload()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-10 pb-[100px] md:pb-10">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/supervisor/pay-records')} className="flex items-center gap-1.5 font-['Lato',sans-serif] text-[12px] text-[#B8A77A] font-bold uppercase tracking-[1px] mb-3 hover:text-[#8B7A5A] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Pay Records
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] md:text-[36px] text-[#1A1C19] leading-tight">Payslips</h1>
            <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-1">Period summaries generated from pay records.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 mt-1 flex items-center gap-1.5 px-4 h-9 rounded-[8px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[13px] font-semibold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Generate
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-48 rounded-[12px] bg-white border border-[#D5D5CF] animate-pulse" />)}
        </div>
      ) : payslips.length === 0 ? (
        <div className="bg-white border border-[#D5D5CF] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">No payslips yet</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">Generate a payslip from logged pay records.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payslips.map((p) => (
            <PayslipCard
              key={p.id}
              payslip={p}
              onStatusChange={handleStatusChange}
              updating={updatingId === p.id}
            />
          ))}
        </div>
      )}

      {showModal && user && (
        <GenerateModal
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

function MobilePayslips() {
  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <PayslipsContent />
      <SupervisorNav active="rates" />
    </div>
  )
}

function DesktopPayslips() {
  return (
    <div className="min-h-screen bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="rates" />
      <main className="pl-60">
        <PayslipsContent />
      </main>
    </div>
  )
}

/** Supervisor portal — payslip period summaries per cleaner. */
export function Payslips() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopPayslips /> : <MobilePayslips />
}
