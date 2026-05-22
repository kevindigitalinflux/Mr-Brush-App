import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Facility  { id: string; name: string }
interface Cleaner   { id: string; full_name: string; display_id: string }
interface LocalZone { tempId: string; zoneName: string; cleanerId: string; cleanerName: string | null }

interface Zone {
  id: string
  zone_name: string
  status: string
  cleaner_id: string | null
  cleaner_name: string | null
  notes: string | null
}

interface FacilityWithJob {
  facility: Facility
  job: { id: string; status: string; zones: Zone[] } | null
}

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  not_started:      { label: 'Not started',  cls: 'bg-[#E3E3DD] text-[#737874]' },
  in_progress:      { label: 'In progress',  cls: 'bg-[#FFF3D1] text-[#6F613A]' },
  completed:        { label: 'Completed',    cls: 'bg-[#D7E6DB] text-[#2F4A3D]' },
  flagged_no_photo: { label: 'No photo',     cls: 'bg-[#FDECEA] text-[#BA1A1A]' },
}

function StatusPill({ status }: { status: string }) {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.not_started
  return (
    <span className={`shrink-0 font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.5px] px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

// ─── Shared back-header ───────────────────────────────────────────────────────

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-10 pb-6">
      <button
        onClick={onBack}
        aria-label="Back"
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px] flex-1 min-w-0 truncate">
        {title}
      </h1>
    </div>
  )
}

// ─── Start shift screen (zone builder + atomic submit) ───────────────────────

function StartShiftScreen({ facilityId }: { facilityId: string }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const t = useTranslation()
  const stateRef = location.state as { facilityName?: string } | null

  const [facilityName, setFacilityName] = useState(stateRef?.facilityName ?? '')
  const [cleaners, setCleaners]         = useState<Cleaner[]>([])
  const [zones, setZones]               = useState<LocalZone[]>([])
  const [zoneName, setZoneName]         = useState('')
  const [cleanerId, setCleanerId]       = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [zoneError, setZoneError]       = useState('')
  const [submitError, setSubmitError]   = useState('')

  useEffect(() => {
    if (!user) return
    const fetches: Promise<unknown>[] = [
      supabase.from('profiles').select('id, full_name, display_id')
        .eq('company_id', user.company_id).in('role', ['cleaner'])
        .then(({ data }) => setCleaners((data ?? []) as unknown as Cleaner[])),
    ]
    if (!facilityName) {
      fetches.push(
        supabase.from('facilities').select('name').eq('id', facilityId).single()
          .then(({ data }) => setFacilityName((data as { name: string } | null)?.name ?? 'This Facility'))
      )
    }
    void Promise.all(fetches)
  }, [facilityId, user])

  function addZone() {
    if (!zoneName.trim()) { setZoneError(t('sv_zone_name_required')); return }
    const cleaner = cleaners.find((c) => c.id === cleanerId) ?? null
    setZones((prev) => [...prev, {
      tempId: crypto.randomUUID(),
      zoneName: zoneName.trim(),
      cleanerId,
      cleanerName: cleaner?.full_name ?? null,
    }])
    setZoneName('')
    setCleanerId('')
    setZoneError('')
  }

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    setSubmitError('')

    const { data: jobData, error: jobErr } = await supabase.from('jobs').insert({
      supervisor_id: user.id,
      facility_id: facilityId,
      scheduled_date: new Date().toISOString().slice(0, 10),
      status: 'scheduled',
      company_id: user.company_id,
    }).select('id').single()

    if (jobErr || !jobData) {
      setSubmitting(false)
      setSubmitError(t('sv_failed_start_shift'))
      return
    }

    const jobId = (jobData as { id: string }).id

    if (zones.length > 0) {
      await supabase.from('job_zones').insert(
        zones.map((z) => ({
          job_id: jobId,
          zone_name: z.zoneName,
          cleaner_id: z.cleanerId || null,
          status: 'not_started',
        }))
      )
    }

    navigate(`/supervisor/jobs?facility=${facilityId}`, { replace: true })
  }

  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] flex flex-col">

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="w-full max-w-[480px] mx-auto px-6 pb-6">

          {/* Back */}
          <div className="pt-10 pb-4">
            <button
              onClick={() => navigate(`/supervisor/jobs?facility=${facilityId}`)}
              aria-label="Back"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Header: icon + facility + date */}
          <div className="flex items-center gap-4 pb-6">
            <div className="w-14 h-14 rounded-full bg-[#F4F4EE] border border-[#D0CFCA] flex items-center justify-center shrink-0">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#B8A77A" strokeWidth="2" />
                <path d="M16 2v4M8 2v4M3 10h18" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 14h4M8 18h6" stroke="#B8A77A" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[1.2px] text-[#B8A77A] uppercase mb-0.5">
                {t('sv_start_todays_shift')}
              </p>
              <h1 className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px] truncate">
                {facilityName || '…'}
              </h1>
              <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">{dateLabel}</p>
            </div>
          </div>

          {/* Zone builder card */}
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-5 flex flex-col gap-4">
            <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase">
              {t('sv_build_zones_label')}
            </h2>

            <div className="flex flex-col gap-2">
              <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
                {t('sv_zone_name_label')}
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => { setZoneName(e.target.value); setZoneError('') }}
                placeholder={t('sv_zone_name_placeholder')}
                className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors bg-[#FAFAF8]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
                {t('sv_assign_cleaner_label')}
              </label>
              <CleanerPicker
                cleaners={cleaners}
                value={cleanerId}
                onChange={setCleanerId}
                unassignedLabel={t('sv_unassigned')}
              />
            </div>

            {zoneError && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{zoneError}</p>}

            <button
              onClick={addZone}
              className="w-full h-[52px] bg-[#1A1C19] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#2e3130] transition-colors"
            >
              {t('sv_add_zone_btn')} +
            </button>
          </div>

          {/* Added zones list */}
          {zones.length > 0 && (
            <div className="flex flex-col gap-2 mt-5">
              <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-1">
                {t('sv_zones_added')} ({zones.length})
              </h2>
              {zones.map((z) => (
                <div key={z.tempId} className="flex items-center gap-3 bg-white border border-[#D0CFCA] rounded-[10px] px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate">{z.zoneName}</p>
                    <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] truncate">
                      {z.cleanerName ?? t('sv_unassigned')}
                    </p>
                  </div>
                  <button
                    onClick={() => setZones((prev) => prev.filter((x) => x.tempId !== z.tempId))}
                    aria-label="Remove zone"
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#FDECEA] transition-colors shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {submitError && (
            <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A] mt-4 text-center">{submitError}</p>
          )}
        </div>
      </div>

      {/* Pinned Launch Shift CTA — pb-[72px] clears the fixed nav */}
      <div className="w-full bg-[#F4F4EE] border-t border-[#E3E3DD] pb-[72px]">
        <div className="max-w-[480px] mx-auto px-6 py-4 flex flex-col gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-[56px] bg-[#B8A77A] rounded-[12px] font-['Poppins',sans-serif] font-semibold text-base text-white hover:bg-[#a8976a] transition-colors disabled:opacity-60"
          >
            {submitting
              ? t('sv_confirm_shift_creating')
              : zones.length > 0
                ? `${t('sv_launch_shift_btn')} · ${zones.length} zone${zones.length !== 1 ? 's' : ''}`
                : t('sv_launch_shift_btn')}
          </button>
          <button
            onClick={() => navigate(`/supervisor/jobs?facility=${facilityId}`)}
            className="w-full h-10 font-['Lato',sans-serif] text-[13px] text-[#737874] hover:text-[#1A1C19] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <SupervisorNav active="jobs" />
    </div>
  )
}

// ─── Add zone screen ──────────────────────────────────────────────────────────

function AddZoneScreen({ facilityId }: { facilityId: string }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const t = useTranslation()
  const jobId = (location.state as { jobId?: string } | null)?.jobId ?? null

  const [zoneName, setZoneName]   = useState('')
  const [cleanerId, setCleanerId] = useState('')
  const [cleaners, setCleaners]   = useState<Cleaner[]>([])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function goBack() { navigate(`/supervisor/jobs?facility=${facilityId}`) }

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('id, full_name, display_id')
      .eq('company_id', user.company_id).in('role', ['cleaner'])
      .then(({ data }) => setCleaners((data ?? []) as unknown as Cleaner[]))
  }, [user])

  async function handleAdd() {
    if (!zoneName.trim()) { setError(t('sv_zone_name_required')); return }
    if (!jobId) return
    setSaving(true)
    const { error: err } = await supabase.from('job_zones').insert({
      job_id: jobId,
      zone_name: zoneName.trim(),
      cleaner_id: cleanerId || null,
      status: 'not_started',
    })
    setSaving(false)
    if (err) { setError(t('sv_failed_add_zone')); return }
    goBack()
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] flex flex-col">
      <div className="w-full max-w-[480px] mx-auto px-6 flex flex-col flex-1 overflow-y-auto pb-[100px]">
        <BackHeader title={`${t('sv_add_zone')} +`} onBack={goBack} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
              {t('sv_zone_name_label')}
            </label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => { setZoneName(e.target.value); setError('') }}
              placeholder={t('sv_zone_name_placeholder')}
              className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors bg-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
              {t('sv_assign_cleaner_label')}
            </label>
            <CleanerPicker
              cleaners={cleaners}
              value={cleanerId}
              onChange={setCleanerId}
              unassignedLabel={t('sv_unassigned')}
            />
          </div>

          {error && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full h-[56px] bg-[#B8A77A] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-base text-white hover:bg-[#a8976a] transition-colors disabled:opacity-60 mt-2"
          >
            {saving ? t('submitting') : `${t('sv_add_zone')} +`}
          </button>
        </div>
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}

// ─── Shift builder screen ────────────────────────────────────────────────────

function ShiftBuilderScreen({ facilityId }: { facilityId: string }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const t = useTranslation()
  const jobId = (location.state as { jobId?: string } | null)?.jobId ?? null

  const [zoneName, setZoneName]         = useState('')
  const [cleanerId, setCleanerId]       = useState('')
  const [cleaners, setCleaners]         = useState<Cleaner[]>([])
  const [zones, setZones]               = useState<Zone[]>([])
  const [facilityName, setFacilityName] = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('facilities').select('id, name').eq('id', facilityId).single(),
      supabase.from('profiles').select('id, full_name, display_id')
        .eq('company_id', user.company_id).in('role', ['cleaner']),
    ]).then(([facRes, cleanersRes]) => {
      setFacilityName((facRes.data as unknown as { name: string } | null)?.name ?? '')
      setCleaners((cleanersRes.data ?? []) as unknown as Cleaner[])
    })
  }, [user, facilityId])

  async function addZone() {
    if (!zoneName.trim()) { setError(t('sv_zone_name_required')); return }
    if (!jobId) return
    setSaving(true)
    const { data, error: err } = await supabase.from('job_zones').insert({
      job_id: jobId,
      zone_name: zoneName.trim(),
      cleaner_id: cleanerId || null,
      status: 'not_started',
    }).select('id').single()
    setSaving(false)
    if (err || !data) { setError(t('sv_failed_add_zone')); return }
    const cleaner = cleaners.find((c) => c.id === cleanerId) ?? null
    setZones((prev) => [...prev, {
      id: (data as { id: string }).id,
      zone_name: zoneName.trim(),
      status: 'not_started',
      cleaner_id: cleanerId || null,
      cleaner_name: cleaner?.full_name ?? null,
      notes: null,
    }])
    setZoneName('')
    setCleanerId('')
    setError('')
  }

  async function removeZone(id: string) {
    await supabase.from('job_zones').update({ status: 'deleted' }).eq('id', id)
    setZones((prev) => prev.filter((z) => z.id !== id))
  }

  function viewShift() { navigate(`/supervisor/jobs?facility=${facilityId}`) }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] flex flex-col">
      <div className="w-full max-w-[480px] mx-auto px-6 flex flex-col flex-1 overflow-y-auto pb-[100px]">
        <BackHeader title={t('sv_shift_builder_title')} onBack={viewShift} />

        {facilityName && (
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] -mt-3 mb-5">{facilityName}</p>
        )}

        {/* Zone input card */}
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
              {t('sv_zone_name_label')}
            </label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => { setZoneName(e.target.value); setError('') }}
              placeholder={t('sv_zone_name_placeholder')}
              className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors bg-[#FAFAF8]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
              {t('sv_assign_cleaner_label')}
            </label>
            <CleanerPicker
              cleaners={cleaners}
              value={cleanerId}
              onChange={setCleanerId}
              unassignedLabel={t('sv_unassigned')}
            />
          </div>

          {error && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>}

          <button
            onClick={addZone}
            disabled={saving}
            className="w-full h-[52px] bg-[#1A1C19] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#2e3130] transition-colors disabled:opacity-60"
          >
            {saving ? t('submitting') : `${t('sv_add_zone_btn')} +`}
          </button>
        </div>

        {/* Added zones list */}
        {zones.length > 0 && (
          <div className="flex flex-col gap-2 mt-6">
            <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-1">
              {t('sv_zones_added')} ({zones.length})
            </h2>
            {zones.map((z) => (
              <div key={z.id} className="flex items-center gap-3 bg-white border border-[#D0CFCA] rounded-[10px] px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate">{z.zone_name}</p>
                  <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] truncate">
                    {z.cleaner_name ?? t('sv_unassigned')}
                  </p>
                </div>
                <button
                  onClick={() => removeZone(z.id)}
                  aria-label="Remove zone"
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#FDECEA] transition-colors shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom CTAs */}
        <div className="flex flex-col gap-2 mt-6">
          {zones.length > 0 && (
            <button
              onClick={viewShift}
              className="w-full h-[56px] bg-[#B8A77A] rounded-[12px] font-['Poppins',sans-serif] font-semibold text-base text-white hover:bg-[#a8976a] transition-colors"
            >
              {t('sv_shift_builder_done')} · {zones.length} zone{zones.length !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={viewShift}
            className="w-full h-10 font-['Lato',sans-serif] text-[13px] text-[#737874] hover:text-[#1A1C19] transition-colors"
          >
            {t('sv_shift_builder_skip')}
          </button>
        </div>
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}

// ─── Zone edit screen ─────────────────────────────────────────────────────────

function ZoneEditScreen({ facilityId, zoneId }: { facilityId: string; zoneId: string }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const t = useTranslation()
  const state = location.state as { zone?: Zone; jobId?: string } | null
  const initialZone = state?.zone ?? null
  const stateJobId  = state?.jobId ?? null

  const [name, setName]               = useState(initialZone?.zone_name ?? '')
  const [cleanerId, setCleanerId]     = useState(initialZone?.cleaner_id ?? '')
  const [notes, setNotes]             = useState(initialZone?.notes ?? '')
  const [cleaners, setCleaners]       = useState<Cleaner[]>([])
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]             = useState('')

  function goBack() { navigate(`/supervisor/jobs?facility=${facilityId}`) }

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('id, full_name, display_id')
      .eq('company_id', user.company_id).in('role', ['cleaner'])
      .then(({ data }) => setCleaners((data ?? []) as unknown as Cleaner[]))
  }, [user])

  async function handleSave() {
    if (!name.trim()) { setError(t('sv_zone_name_required')); return }
    setSaving(true)
    const { error: err } = await supabase.from('job_zones').update({
      zone_name: name.trim(),
      cleaner_id: cleanerId || null,
      notes: notes.trim() || null,
    }).eq('id', zoneId)
    setSaving(false)
    if (err) { setError(t('sv_failed_save_zone')); return }
    goBack()
  }

  async function handleDuplicate() {
    setSaving(true)
    await supabase.from('job_zones').insert({
      job_id: stateJobId,
      zone_name: `${name.trim()} (Copy)`,
      cleaner_id: cleanerId || null,
      notes: notes.trim() || null,
      status: 'not_started',
    })
    setSaving(false)
    goBack()
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await supabase.from('job_zones').update({ status: 'deleted' }).eq('id', zoneId)
    goBack()
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] flex flex-col">
      <div className="w-full max-w-[480px] mx-auto px-6 flex flex-col flex-1 overflow-y-auto pb-[100px]">
        <BackHeader title={t('sv_edit_zone_title')} onBack={goBack} />

        <div className="flex flex-col gap-5">
          {/* Zone name */}
          <div className="flex flex-col gap-2">
            <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
              {t('sv_zone_name_label')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] outline-none focus:border-[#B8A77A] transition-colors bg-white"
            />
          </div>

          {/* Cleaner */}
          <div className="flex flex-col gap-2">
            <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
              {t('sv_assign_cleaner_label')}
            </label>
            <CleanerPicker
              cleaners={cleaners}
              value={cleanerId}
              onChange={setCleanerId}
              unassignedLabel={t('sv_unassigned')}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase">
              {t('sv_zone_notes_label')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('sv_zone_notes_placeholder')}
              rows={4}
              className="border border-[#C3C8C2] rounded-[8px] px-4 py-3 font-['Lato',sans-serif] text-[14px] text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors resize-none bg-white"
            />
          </div>

          {error && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>}

          {/* Secondary actions */}
          <div className="flex gap-2">
            <button
              onClick={handleDuplicate}
              disabled={saving}
              className="flex-1 h-11 border border-[#D0CFCA] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-[13px] text-[#434844] hover:bg-[#F4F4EE] transition-colors disabled:opacity-40 bg-white"
            >
              {t('sv_duplicate_zone')}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={[
                'flex-1 h-11 border-2 rounded-[8px] font-[\'Poppins\',sans-serif] font-semibold text-[13px] transition-colors disabled:opacity-40',
                confirmDelete
                  ? 'bg-[#BA1A1A] border-[#BA1A1A] text-white'
                  : 'border-[#BA1A1A] text-[#BA1A1A] hover:bg-[#FDECEA]',
              ].join(' ')}
            >
              {confirmDelete ? (deleting ? '…' : 'Confirm') : t('sv_delete_zone')}
            </button>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[56px] bg-[#B8A77A] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-base text-white hover:bg-[#a8976a] transition-colors disabled:opacity-60 mt-2"
          >
            {saving ? t('submitting') : t('sv_save_changes')}
          </button>
        </div>
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}

// ─── Searchable cleaner picker ────────────────────────────────────────────────

function CleanerPicker({ cleaners, value, onChange, unassignedLabel }: {
  cleaners: Cleaner[]
  value: string
  onChange: (id: string) => void
  unassignedLabel: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const selected = cleaners.find((c) => c.id === value)

  const filtered = search
    ? cleaners.filter((c) =>
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.display_id.toLowerCase().includes(search.toLowerCase())
      )
    : cleaners

  function pick(id: string) { onChange(id); setOpen(false); setSearch('') }

  return (
    <div className={`border rounded-[8px] overflow-hidden bg-white transition-colors ${open ? 'border-[#B8A77A]' : 'border-[#C3C8C2]'}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-[52px] px-4 flex items-center justify-between text-left"
      >
        <span className={`font-['Lato',sans-serif] text-[15px] ${selected ? 'text-[#1A1C19]' : 'text-[#9E9E9E]'}`}>
          {selected ? `${selected.full_name} (${selected.display_id})` : unassignedLabel}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="#737874" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-[#E3E3DD]">
          <div className="p-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              autoFocus
              className="w-full h-9 border border-[#C3C8C2] rounded-[6px] px-3 font-['Lato',sans-serif] text-[14px] outline-none focus:border-[#B8A77A] transition-colors"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto divide-y divide-[#F0F0EB]">
            <button
              type="button"
              onClick={() => pick('')}
              className={`w-full px-4 py-3 text-left font-['Lato',sans-serif] text-[14px] hover:bg-[#F4F4EE] transition-colors ${!value ? 'text-[#B8A77A] font-semibold' : 'text-[#737874]'}`}
            >
              {unassignedLabel}
            </button>
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c.id)}
                className={`w-full px-4 py-3 text-left font-['Lato',sans-serif] text-[14px] hover:bg-[#F4F4EE] transition-colors flex items-center justify-between ${c.id === value ? 'bg-[#F4F4EE]' : ''}`}
              >
                <span className={c.id === value ? 'text-[#1A1C19] font-semibold' : 'text-[#1A1C19]'}>
                  {c.full_name} <span className="text-[#737874] font-normal">({c.display_id})</span>
                </span>
                {c.id === value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" stroke="#B8A77A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 font-['Lato',sans-serif] text-[14px] text-[#9E9E9E]">No match</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Zone row ─────────────────────────────────────────────────────────────────

function ZoneRow({ zone, facilityId, jobId, hideCleanerName = false }: {
  zone: Zone; facilityId: string; jobId: string; hideCleanerName?: boolean
}) {
  const navigate = useNavigate()
  const t = useTranslation()

  return (
    <div className="zone-row flex items-center gap-3 bg-white border border-[#D0CFCA] rounded-[10px] px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate">
          {zone.zone_name}
        </p>
        {!hideCleanerName && (
          <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] truncate">
            {zone.cleaner_name ?? t('sv_unassigned')}
          </p>
        )}
      </div>
      <StatusPill status={zone.status} />
      <button
        onClick={() => navigate(
          `/supervisor/jobs?facility=${facilityId}&zone=${zone.id}&action=edit`,
          { state: { zone, jobId } },
        )}
        aria-label="Zone options"
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4F4EE] transition-colors shrink-0"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="5"  r="1.5" fill="#737874" />
          <circle cx="12" cy="12" r="1.5" fill="#737874" />
          <circle cx="12" cy="19" r="1.5" fill="#737874" />
        </svg>
      </button>
    </div>
  )
}

// ─── Cleaner group section ────────────────────────────────────────────────────

function CleanerGroupSection({ cleanerName, cleanerId, zones, jobId, facilityId, onMarkComplete, onMarkUndone, marking }: {
  cleanerName: string | null
  cleanerId: string | null
  zones: Zone[]
  jobId: string
  facilityId: string
  onMarkComplete: (id: string) => void
  onMarkUndone: (id: string) => void
  marking: boolean
}) {
  const t = useTranslation()
  const doneCount = zones.filter((z) => z.status === 'completed' || z.status === 'flagged_no_photo').length
  const allDone   = doneCount === zones.length && zones.length > 0

  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Cleaner header row */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#D0CFCA] flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="#737874" strokeWidth="2"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#737874" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-[#1A1C19] truncate">
            {cleanerName ?? t('sv_unassigned_zones')}
          </span>
          <span className="font-['Lato',sans-serif] text-[12px] text-[#9E9E9E] shrink-0">
            {doneCount}/{zones.length}
          </span>
        </div>

        {cleanerId && (
          allDone ? (
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="flex items-center gap-1 font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.5px] text-[#2F4A3D] bg-[#D7E6DB] px-2.5 py-1 rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="#2F4A3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('sv_cleaner_shift_done')}
              </span>
              <button
                onClick={() => onMarkUndone(cleanerId)}
                disabled={marking}
                className="h-7 px-2.5 border border-[#D0CFCA] rounded-[6px] font-['Poppins',sans-serif] font-semibold text-[11px] text-[#737874] hover:border-[#B8A77A] hover:text-[#1A1C19] transition-colors disabled:opacity-50"
              >
                {marking ? '…' : t('sv_undo_mark_complete')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => onMarkComplete(cleanerId)}
              disabled={marking}
              className="shrink-0 h-7 px-3 bg-[#2F4A3D] rounded-[6px] font-['Poppins',sans-serif] font-semibold text-[11px] text-white hover:bg-[#3d6152] transition-colors disabled:opacity-50"
            >
              {marking ? '…' : t('sv_mark_cleaner_complete')}
            </button>
          )
        )}
      </div>

      {/* Zone rows — cleaner name hidden since it's the group header */}
      {zones.map((z) => (
        <ZoneRow key={z.id} zone={z} facilityId={facilityId} jobId={jobId} hideCleanerName />
      ))}
    </div>
  )
}

// ─── Facility zone management view ────────────────────────────────────────────

function FacilityZonesView({ facilityId, panelMode = false, onBack }: {
  facilityId: string; panelMode?: boolean; onBack?: () => void
}) {
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [facilityName, setFacilityName] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [markingCleaners, setMarkingCleaners] = useState<Set<string>>(new Set())

  const load = useCallback(async (silent = false) => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    if (!silent) setLoading(true)

    const [facilityRes, jobsRes, cleanersRes] = await Promise.all([
      supabase.from('facilities').select('id, name').eq('id', facilityId).single(),
      supabase.from('jobs')
        .select('id, status, job_zones ( id, zone_name, status, cleaner_id, notes )')
        .eq('facility_id', facilityId)
        .eq('scheduled_date', today),
      supabase.from('profiles').select('id, full_name, display_id')
        .eq('company_id', user.company_id).in('role', ['cleaner']),
    ])

    const fac = facilityRes.data as unknown as { id: string; name: string } | null
    setFacilityName(fac?.name ?? '')

    const cleanerMap = new Map<string, string>()
    for (const c of (cleanersRes.data ?? []) as unknown as { id: string; full_name: string; display_id: string }[]) {
      cleanerMap.set(c.id, c.full_name ?? c.display_id)
    }

    const jobs = (jobsRes.data ?? []) as unknown as {
      id: string; status: string
      job_zones: { id: string; zone_name: string; status: string; cleaner_id: string | null; notes: string | null }[]
    }[]

    if (jobs.length > 0) {
      setJobId(jobs[0].id)
      setZones((jobs[0].job_zones ?? []).filter((z) => z.status !== 'deleted').map((z) => ({
        id: z.id,
        zone_name: z.zone_name,
        status: z.status,
        cleaner_id: z.cleaner_id,
        cleaner_name: z.cleaner_id ? (cleanerMap.get(z.cleaner_id) ?? null) : null,
        notes: z.notes,
      })))
    } else {
      setJobId(null)
      setZones([])
    }
    setLoading(false)
  }, [user, facilityId])

  useEffect(() => { if (user) load() }, [load, user])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`facility-zones-${facilityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_zones' }, () => load(true))
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [user, facilityId, load])

  useGSAP(() => {
    if (loading) return
    gsap.from('.zone-row', { opacity: 0, y: 10, duration: 0.3, stagger: 0.05, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading] })

  function goToStartConfirm() {
    navigate(
      `/supervisor/jobs?facility=${facilityId}&action=start`,
      { state: { facilityName } },
    )
  }

  async function handleMarkCleanerComplete(cleanerId: string) {
    if (!jobId) return
    setMarkingCleaners((prev) => new Set(prev).add(cleanerId))
    const zoneIds = zones.filter((z) => z.cleaner_id === cleanerId).map((z) => z.id)
    await supabase.from('job_zones').update({ status: 'completed' }).in('id', zoneIds)
    setMarkingCleaners((prev) => { const s = new Set(prev); s.delete(cleanerId); return s })
    void load(true)
  }

  async function handleMarkCleanerUndone(cleanerId: string) {
    if (!jobId) return
    setMarkingCleaners((prev) => new Set(prev).add(cleanerId))
    const zoneIds = zones
      .filter((z) => z.cleaner_id === cleanerId && z.status === 'completed')
      .map((z) => z.id)
    if (zoneIds.length > 0) {
      await supabase.from('job_zones').update({ status: 'not_started' }).in('id', zoneIds)
    }
    setMarkingCleaners((prev) => { const s = new Set(prev); s.delete(cleanerId); return s })
    void load(true)
  }

  // Group zones by cleaner — named cleaners first, unassigned last
  const groupedZones = zones.reduce<Map<string | null, Zone[]>>((map, z) => {
    const key = z.cleaner_id ?? null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(z)
    return map
  }, new Map())

  const sortedGroups = [...groupedZones.entries()].sort(([a], [b]) => {
    if (a === null) return 1
    if (b === null) return -1
    return 0
  })

  return (
    <div className={panelMode ? 'h-full overflow-y-auto bg-[#F4F4EE]' : 'fixed inset-0 bg-[#F4F4EE] overflow-y-auto'}>
      <div ref={containerRef} className={`w-full max-w-[480px] mx-auto px-6 ${panelMode ? 'pb-8' : 'pb-[100px]'}`}>

        {/* Header */}
        <div className="flex items-center gap-3 pt-10 pb-5">
          <button
            onClick={() => { if (onBack) onBack(); else navigate('/supervisor/jobs') }}
            aria-label="Back to facilities"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[22px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px] flex-1 min-w-0 truncate">
            {facilityName || '…'}
          </h1>
          {jobId && (
            <button
              onClick={() => navigate(
                `/supervisor/jobs?facility=${facilityId}&action=add`,
                { state: { jobId } },
              )}
              className="shrink-0 flex items-center gap-1.5 h-9 px-4 bg-[#1A1C19] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-[13px] text-white hover:bg-[#2e3130] transition-colors"
            >
              {t('sv_add_zone')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] bg-white border border-[#D0CFCA] rounded-[10px] animate-pulse" />
            ))}
          </div>
        ) : !jobId ? (
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F4F4EE] border border-[#D0CFCA] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="#B8A77A" strokeWidth="2" />
                <path d="M8 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="#B8A77A" strokeWidth="2" />
                <path d="M12 10v4M10 12h4" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_shift_yet')}</p>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] max-w-[220px]">{t('sv_no_shift_body')}</p>
            <button
              onClick={goToStartConfirm}
              className="mt-1 h-10 px-6 bg-[#B8A77A] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#a8976a] transition-colors"
            >
              {t('sv_start_todays_shift')}
            </button>
          </div>
        ) : zones.length === 0 ? (
          <div className="bg-white border border-dashed border-[#C3C8C2] rounded-[12px] p-6 flex flex-col items-center gap-1 text-center">
            <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#737874]">{t('sv_no_zones_yet')}</p>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#9E9E9E]">{t('sv_no_zones_body')}</p>
          </div>
        ) : (
          <div>
            {sortedGroups.map(([cleanerId, groupZones]) => (
              <CleanerGroupSection
                key={cleanerId ?? '__unassigned__'}
                cleanerId={cleanerId}
                cleanerName={groupZones[0]?.cleaner_name ?? null}
                zones={groupZones}
                jobId={jobId}
                facilityId={facilityId}
                onMarkComplete={handleMarkCleanerComplete}
                onMarkUndone={handleMarkCleanerUndone}
                marking={cleanerId !== null && markingCleaners.has(cleanerId)}
              />
            ))}
          </div>
        )}
      </div>
      {!panelMode && <SupervisorNav active="jobs" />}
    </div>
  )
}

// ─── Facility card ────────────────────────────────────────────────────────────

function FacilityCard({ item, onManage, selected }: { item: FacilityWithJob; onManage: () => void; selected?: boolean }) {
  const t = useTranslation()
  const { facility, job } = item
  const total    = job?.zones.length ?? 0
  const done     = job ? job.zones.filter((z) => z.status === 'completed' || z.status === 'flagged_no_photo').length : 0
  const cleaners = job ? new Set(job.zones.map((z) => z.cleaner_id).filter(Boolean)).size : 0
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0
  const isActive = !!job

  return (
    <div className={`facility-card bg-white border rounded-[12px] overflow-hidden transition-colors ${selected ? 'border-[#B8A77A]' : 'border-[#D0CFCA]'}`}>
      <div className="bg-[#1A1C19] px-5 py-3 flex items-center justify-between">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-base text-white truncate pr-3">
          {facility.name}
        </h3>
        <span className={`shrink-0 font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.8px] px-2.5 py-0.5 rounded-full uppercase ${
          isActive ? 'bg-[#B8A77A] text-[#1A1C19]' : 'bg-white/20 text-white'
        }`}>
          {isActive ? t('sv_active_pill') : t('sv_scheduled_pill')}
        </span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        {isActive ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-['Lato',sans-serif] text-[#737874]">
                {cleaners} cleaner{cleaners !== 1 ? 's' : ''} · {total} zone{total !== 1 ? 's' : ''}
              </span>
              <span className="font-['Lato',sans-serif] font-bold text-[#1A1C19]">{done}/{total}</span>
            </div>
            <div className="w-full h-2 bg-[#E3E3DD] rounded-full overflow-hidden">
              <div className="h-full bg-[#B8A77A] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : (
          <p className="font-['Lato',sans-serif] text-[13px] text-[#9E9E9E]">{t('sv_no_job_today')}</p>
        )}
        <button
          onClick={onManage}
          className="mt-1 w-full h-10 border border-[#B8A77A] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-[#B8A77A] hover:bg-[#B8A77A] hover:text-white transition-colors"
        >
          {t('sv_manage_facility')}
        </button>
      </div>
    </div>
  )
}

// ─── Facilities list view ─────────────────────────────────────────────────────

function FacilitiesListView() {
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<FacilityWithJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)

    async function load() {
      setLoading(true)
      const [facilsRes, jobsRes] = await Promise.all([
        supabase.from('facilities').select('id, name').eq('company_id', user!.company_id),
        supabase.from('jobs')
          .select('id, status, facility_id, job_zones ( id, zone_name, status, cleaner_id, notes )')
          .eq('supervisor_id', user!.id)
          .eq('scheduled_date', today),
      ])

      const facilities = (facilsRes.data ?? []) as unknown as Facility[]
      const jobs = (jobsRes.data ?? []) as unknown as {
        id: string; status: string; facility_id: string
        job_zones: { id: string; zone_name: string; status: string; cleaner_id: string | null; notes: string | null }[]
      }[]

      const jobMap = new Map(jobs.map((j) => [j.facility_id, j]))

      setItems(facilities.map((fac) => {
        const job = jobMap.get(fac.id) ?? null
        return {
          facility: fac,
          job: job ? {
            id: job.id,
            status: job.status,
            zones: (job.job_zones ?? []).filter((z) => z.status !== 'deleted').map((z) => ({
              id: z.id, zone_name: z.zone_name, status: z.status,
              cleaner_id: z.cleaner_id, cleaner_name: null, notes: z.notes,
            })),
          } : null,
        }
      }))
      setLoading(false)
    }

    load()
  }, [user])

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.jobs-heading', { opacity: 0, y: 16, duration: 0.4 })
      .from('.facility-card', { opacity: 0, y: 14, duration: 0.4, stagger: 0.08 }, '-=0.2')
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pt-10 pb-[100px]">
        <div className="jobs-heading mb-6">
          <h1 className="font-['Poppins',sans-serif] font-bold text-[32px] text-[#1A1C19] leading-[1.1] tracking-[-0.4px]">
            {t('sv_jobs_title')}
          </h1>
          <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-3">
          {t('sv_your_facilities')}
        </h2>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-[168px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 flex flex-col items-center gap-2 text-center">
            <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_facilities')}</p>
            <p className="font-['Lato',sans-serif] text-sm text-[#737874]">{t('sv_no_facilities_body')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <FacilityCard
                key={item.facility.id}
                item={item}
                onManage={() => navigate(`/supervisor/jobs?facility=${item.facility.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}

// ─── Desktop facilities panel ─────────────────────────────────────────────────

function DesktopFacilitiesPanel({ selectedId = null, onSelect }: {
  selectedId?: string | null; onSelect: (id: string) => void
}) {
  const { user } = useApp()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<FacilityWithJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)

    async function load() {
      setLoading(true)
      const [facilsRes, jobsRes] = await Promise.all([
        supabase.from('facilities').select('id, name').eq('company_id', user!.company_id),
        supabase.from('jobs')
          .select('id, status, facility_id, job_zones ( id, zone_name, status, cleaner_id, notes )')
          .eq('supervisor_id', user!.id)
          .eq('scheduled_date', today),
      ])

      const facilities = (facilsRes.data ?? []) as unknown as Facility[]
      const jobs = (jobsRes.data ?? []) as unknown as {
        id: string; status: string; facility_id: string
        job_zones: { id: string; zone_name: string; status: string; cleaner_id: string | null; notes: string | null }[]
      }[]

      const jobMap = new Map(jobs.map((j) => [j.facility_id, j]))

      setItems(facilities.map((fac) => {
        const job = jobMap.get(fac.id) ?? null
        return {
          facility: fac,
          job: job ? {
            id: job.id,
            status: job.status,
            zones: (job.job_zones ?? []).filter((z) => z.status !== 'deleted').map((z) => ({
              id: z.id, zone_name: z.zone_name, status: z.status,
              cleaner_id: z.cleaner_id, cleaner_name: null, notes: z.notes,
            })),
          } : null,
        }
      }))
      setLoading(false)
    }

    load()
  }, [user])

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.djobs-heading', { opacity: 0, y: 14, duration: 0.4 })
      .from('.facility-card', { opacity: 0, y: 10, duration: 0.3, stagger: 0.06 }, '-=0.2')
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto px-10 py-10">
      <div className="djobs-heading mb-8">
        <h1 className="font-['Poppins',sans-serif] font-bold text-[32px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
          {t('sv_jobs_title')}
        </h1>
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-4">
        {t('sv_your_facilities')}
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[148px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 flex flex-col items-center gap-2 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_facilities')}</p>
          <p className="font-['Lato',sans-serif] text-sm text-[#737874]">{t('sv_no_facilities_body')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {items.map((item) => (
            <FacilityCard
              key={item.facility.id}
              item={item}
              selected={selectedId === item.facility.id}
              onManage={() => onSelect(item.facility.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Desktop Jobs ─────────────────────────────────────────────────────────────

function DesktopJobs() {
  const navigate = useNavigate()
  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="jobs" />
      <main className="flex-1 overflow-y-auto ml-60 bg-[#F4F4EE]">
        <DesktopFacilitiesPanel
          onSelect={(id) => navigate(`/supervisor/jobs?facility=${id}`)}
        />
      </main>
    </div>
  )
}

// ─── Desktop facility detail ──────────────────────────────────────────────────

function DesktopFacilityZonesView({ facilityId }: { facilityId: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <SupervisorDesktopSidebar active="jobs" />
      <main className="flex-1 overflow-y-auto ml-60 bg-[#F4F4EE]">
        <div className="max-w-2xl mx-auto">
          <FacilityZonesView
            facilityId={facilityId}
            onBack={() => navigate('/supervisor/jobs')}
            panelMode
          />
        </div>
      </main>
    </div>
  )
}

// ─── Jobs page entry ──────────────────────────────────────────────────────────

/** Facilities list and zone management for the supervisor. */
export function Jobs() {
  const [searchParams] = useSearchParams()
  const facilityId = searchParams.get('facility')
  const action     = searchParams.get('action')
  const zoneId     = searchParams.get('zone')
  const isDesktop  = useIsDesktop()

  // Action screens are always full-screen (fixed inset-0) on both mobile and desktop
  if (facilityId && action === 'start') return <StartShiftScreen facilityId={facilityId} />
  if (facilityId && action === 'build') return <ShiftBuilderScreen facilityId={facilityId} />
  if (facilityId && action === 'add') return <AddZoneScreen facilityId={facilityId} />
  if (facilityId && action === 'edit' && zoneId) return <ZoneEditScreen facilityId={facilityId} zoneId={zoneId} />

  if (isDesktop) {
    if (facilityId) return <DesktopFacilityZonesView facilityId={facilityId} />
    return <DesktopJobs />
  }
  if (facilityId) return <FacilityZonesView facilityId={facilityId} />
  return <FacilitiesListView />
}
