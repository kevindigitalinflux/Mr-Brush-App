import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AbsenceReport {
  id: string
  shiftDate: string
  absentCleaner: string
  replacement: string
  createdAt: string
}

interface CleanerOption { id: string; name: string; displayId: string }
interface ZonePreview { id: string; jobId: string; zoneName: string; facilityName: string }

interface ReportForm {
  absentCleanerId: string
  shiftDate: string
  replacementId: string
  reassignZones: boolean
  zones: ZonePreview[]
  loadingZones: boolean
  saving: boolean
  error: string | null
}

const BLANK_FORM: ReportForm = {
  absentCleanerId: '', shiftDate: new Date().toISOString().slice(0, 10),
  replacementId: '', reassignZones: true,
  zones: [], loadingZones: false, saving: false, error: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useAbsenceData() {
  const { user } = useApp()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<AbsenceReport[]>([])
  const [cleaners, setCleaners] = useState<CleanerOption[]>([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: cRows }, { data: rRows }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_id, full_name')
        .eq('company_id', user.company_id)
        .in('role', ['cleaner', 'replacement_cleaner'])
        .eq('is_active', true)
        .order('full_name'),
      supabase
        .from('absence_reports')
        .select('id, shift_date, absent_cleaner_id, replacement_id, created_at')
        .eq('company_id', user.company_id)
        .order('shift_date', { ascending: false })
        .limit(60),
    ])

    const cleanerList = (cRows ?? []).map((c) => {
      const r = c as { id: string; display_id: string; full_name: string | null }
      return { id: r.id, displayId: r.display_id, name: r.full_name ?? r.display_id }
    })
    setCleaners(cleanerList)

    const nameMap: Record<string, string> = {}
    for (const c of cleanerList) nameMap[c.id] = c.name

    type RRow = { id: string; shift_date: string; absent_cleaner_id: string; replacement_id: string; created_at: string }
    setReports((rRows ?? []).map((r) => {
      const row = r as RRow
      return {
        id: row.id,
        shiftDate: row.shift_date,
        absentCleaner: nameMap[row.absent_cleaner_id] ?? 'Unknown',
        replacement: nameMap[row.replacement_id] ?? 'Unknown',
        createdAt: row.created_at,
      }
    }))
    setLoading(false)
  }, [user])

  useEffect(() => { void load() }, [load])
  return { loading, reports, cleaners, reload: load }
}

// ─── Report Absence Modal ─────────────────────────────────────────────────────

interface ReportModalProps {
  cleaners: CleanerOption[]
  companyId: string
  supervisorId: string
  onClose: () => void
  onSaved: () => void
}

function ReportModal({ cleaners, companyId, supervisorId, onClose, onSaved }: ReportModalProps) {
  const [form, setForm] = useState<ReportForm>(BLANK_FORM)

  function setField<K extends keyof ReportForm>(key: K, val: ReportForm[K]) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  // Load zones whenever absent cleaner + shift date change
  useEffect(() => {
    const { absentCleanerId, shiftDate } = form
    if (!absentCleanerId || !shiftDate) { setField('zones', []); return }

    setField('loadingZones', true)
    async function fetchZones() {
      // Find jobs on that date for this company
      const { data: jobRows } = await supabase
        .from('jobs')
        .select('id, facility_id')
        .eq('company_id', companyId)
        .eq('scheduled_date', shiftDate)

      type JobRow = { id: string; facility_id: string }
      const jobs = (jobRows ?? []) as JobRow[]
      if (jobs.length === 0) { setForm((f) => ({ ...f, zones: [], loadingZones: false })); return }

      const jobIds = jobs.map((j) => j.id)
      const facilityIds = [...new Set(jobs.map((j) => j.facility_id))]

      const [{ data: zoneRows }, { data: facRows }] = await Promise.all([
        supabase
          .from('job_zones')
          .select('id, job_id, zone_name')
          .in('job_id', jobIds)
          .eq('cleaner_id', absentCleanerId),
        supabase
          .from('facilities')
          .select('id, name')
          .in('id', facilityIds),
      ])

      const fMap: Record<string, string> = {}
      for (const f of (facRows ?? [])) {
        const r = f as { id: string; name: string }
        fMap[r.id] = r.name
      }

      const jobFacMap: Record<string, string> = {}
      for (const j of jobs) jobFacMap[j.id] = fMap[j.facility_id] ?? 'Unknown site'

      type ZRow = { id: string; job_id: string; zone_name: string }
      setForm((f) => ({
        ...f,
        loadingZones: false,
        zones: (zoneRows ?? []).map((z) => {
          const row = z as ZRow
          return { id: row.id, jobId: row.job_id, zoneName: row.zone_name, facilityName: jobFacMap[row.job_id] ?? '' }
        }),
      }))
    }
    void fetchZones()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.absentCleanerId, form.shiftDate, companyId])

  async function handleSave() {
    const { absentCleanerId, replacementId, shiftDate, reassignZones, zones } = form
    if (!absentCleanerId) { setField('error', 'Select the absent cleaner.'); return }
    if (!replacementId) { setField('error', 'Select a replacement cleaner.'); return }
    if (absentCleanerId === replacementId) { setField('error', 'Absent and replacement must be different.'); return }
    if (!shiftDate) { setField('error', 'Select the shift date.'); return }

    setField('saving', true); setField('error', null)

    const { error: absErr } = await supabase.from('absence_reports').insert({
      absent_cleaner_id: absentCleanerId,
      replacement_id: replacementId,
      reported_by_id: supervisorId,
      shift_date: shiftDate,
      company_id: companyId,
    })

    if (absErr) { setForm((f) => ({ ...f, saving: false, error: 'Could not save. Try again.' })); return }

    if (reassignZones && zones.length > 0) {
      const zoneIds = zones.map((z) => z.id)
      await supabase
        .from('job_zones')
        .update({ cleaner_id: replacementId })
        .in('id', zoneIds)
    }

    onSaved()
  }

  const availableReplacements = cleaners.filter((c) => c.id !== form.absentCleanerId)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-[16px] w-full max-w-md flex flex-col max-h-[92vh] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E3E3DD] shrink-0">
          <h2 className="font-['Poppins',sans-serif] font-semibold text-[17px] text-[#1A1C19]">Report Absence</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4F4EE] text-[#737874]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          {/* Absent cleaner */}
          <div>
            <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Absent Cleaner</label>
            <select
              value={form.absentCleanerId}
              onChange={(e) => setForm((f) => ({ ...f, absentCleanerId: e.target.value, zones: [], error: null }))}
              className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
            >
              <option value="">Select cleaner…</option>
              {cleaners.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.displayId})</option>)}
            </select>
          </div>

          {/* Shift date */}
          <div>
            <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Shift Date</label>
            <input
              type="date"
              value={form.shiftDate}
              onChange={(e) => setForm((f) => ({ ...f, shiftDate: e.target.value, zones: [], error: null }))}
              className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[13px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
            />
          </div>

          {/* Zones preview */}
          {form.absentCleanerId && form.shiftDate && (
            <div>
              <p className="font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-2">Assigned Zones That Day</p>
              {form.loadingZones ? (
                <div className="h-12 rounded-[8px] bg-[#F4F4EE] animate-pulse" />
              ) : form.zones.length === 0 ? (
                <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] italic">No zones assigned on this date.</p>
              ) : (
                <div className="space-y-1.5">
                  {form.zones.map((z) => (
                    <div key={z.id} className="flex items-center gap-2 bg-[#F4F4EE] rounded-[8px] px-3 py-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" stroke="#B8A77A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="font-['Lato',sans-serif] text-[13px] text-[#1A1C19]">{z.zoneName}</span>
                      <span className="font-['Lato',sans-serif] text-[11px] text-[#737874]">· {z.facilityName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Replacement */}
          <div>
            <label className="block font-['Lato',sans-serif] text-[11px] font-bold uppercase tracking-[1px] text-[#737874] mb-1.5">Replacement Cleaner</label>
            <select
              value={form.replacementId}
              onChange={(e) => setField('replacementId', e.target.value)}
              className="w-full h-10 rounded-[8px] border border-[#D5D5CF] bg-white px-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] focus:outline-none focus:ring-2 focus:ring-[#B8A77A]"
            >
              <option value="">Select replacement…</option>
              {availableReplacements.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.displayId})</option>)}
            </select>
          </div>

          {/* Reassign zones toggle */}
          {form.zones.length > 0 && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                role="checkbox"
                aria-checked={form.reassignZones}
                onClick={() => setField('reassignZones', !form.reassignZones)}
                className={[
                  'w-5 h-5 rounded-[4px] border-2 flex items-center justify-center transition-colors shrink-0',
                  form.reassignZones ? 'bg-[#1A1C19] border-[#1A1C19]' : 'bg-white border-[#D5D5CF]',
                ].join(' ')}
              >
                {form.reassignZones && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </div>
              <span className="font-['Lato',sans-serif] text-[13px] text-[#1A1C19]">
                Reassign {form.zones.length} zone{form.zones.length !== 1 ? 's' : ''} to replacement
              </span>
            </label>
          )}

          {form.error && <p className="font-['Lato',sans-serif] text-[12px] text-[#BA1A1A]">{form.error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-[#E3E3DD] shrink-0">
          <button
            onClick={handleSave}
            disabled={form.saving}
            className="w-full h-11 rounded-[10px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[14px] font-semibold disabled:opacity-50"
          >
            {form.saving ? 'Saving…' : 'Report Absence'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Absence report card ──────────────────────────────────────────────────────

function AbsenceCard({ report }: { report: AbsenceReport }) {
  return (
    <div className="bg-white border border-[#D5D5CF] rounded-[12px] flex items-stretch overflow-hidden">
      <div className="w-[64px] flex flex-col items-center justify-center border-r border-[#E3E3DD] py-4 shrink-0 bg-[#F4F4EE]">
        <span className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-none">
          {new Date(report.shiftDate).toLocaleDateString('en-GB', { day: 'numeric' })}
        </span>
        <span className="font-['Lato',sans-serif] text-[10px] tracking-[1px] text-[#737874] uppercase mt-0.5">
          {new Date(report.shiftDate).toLocaleDateString('en-GB', { month: 'short' })}
        </span>
      </div>
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-['Lato',sans-serif] text-[10px] font-bold uppercase tracking-[0.8px] px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#BA1A1A]">Absent</span>
          <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate">{report.absentCleaner}</p>
        </div>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874]">
          Replaced by <span className="font-semibold text-[#1A1C19]">{report.replacement}</span>
        </p>
      </div>
    </div>
  )
}

// ─── Page content ─────────────────────────────────────────────────────────────

function AbsenceContent() {
  const { user } = useApp()
  const navigate = useNavigate()
  const { loading, reports, cleaners, reload } = useAbsenceData()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-10 pb-[100px] md:pb-10">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/supervisor/workers')} className="flex items-center gap-1.5 font-['Lato',sans-serif] text-[12px] text-[#B8A77A] font-bold uppercase tracking-[1px] mb-3 hover:text-[#8B7A5A] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Workers
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[28px] md:text-[36px] text-[#1A1C19] leading-tight">Absence Reports</h1>
            <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-1">Log absences and reassign zones to replacements.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 mt-1 flex items-center gap-1.5 px-4 h-9 rounded-[8px] bg-[#1A1C19] text-white font-['Lato',sans-serif] text-[13px] font-semibold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-[12px] bg-white border border-[#D5D5CF] animate-pulse" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-[#D5D5CF] rounded-[12px] p-10 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19]">No absence reports</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">Reports appear here when a cleaner is logged as absent.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => <AbsenceCard key={r.id} report={r} />)}
        </div>
      )}

      {showModal && user && (
        <ReportModal
          cleaners={cleaners}
          companyId={user.company_id}
          supervisorId={user.id}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); void reload() }}
        />
      )}
    </div>
  )
}

// ─── Layouts ──────────────────────────────────────────────────────────────────

function MobileAbsence() {
  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <AbsenceContent />
      <SupervisorNav active="workers" />
    </div>
  )
}

function DesktopAbsence() {
  return (
    <div className="min-h-screen bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="workers" />
      <main className="pl-60">
        <AbsenceContent />
      </main>
    </div>
  )
}

/** Supervisor portal — absence reporting and zone reassignment. */
export function Absence() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopAbsence /> : <MobileAbsence />
}
