import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Facility { id: string; name: string }
interface Cleaner  { id: string; full_name: string; display_id: string }

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
            <select
              value={cleanerId}
              onChange={(e) => setCleanerId(e.target.value)}
              className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] outline-none focus:border-[#B8A77A] transition-colors bg-white appearance-none cursor-pointer"
            >
              <option value="">{t('sv_unassigned')}</option>
              {cleaners.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.display_id})</option>
              ))}
            </select>
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
            <select
              value={cleanerId}
              onChange={(e) => setCleanerId(e.target.value)}
              className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] outline-none focus:border-[#B8A77A] transition-colors bg-white appearance-none cursor-pointer"
            >
              <option value="">{t('sv_unassigned')}</option>
              {cleaners.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.display_id})</option>
              ))}
            </select>
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

// ─── Zone row ─────────────────────────────────────────────────────────────────

function ZoneRow({ zone, facilityId, jobId }: { zone: Zone; facilityId: string; jobId: string }) {
  const navigate = useNavigate()
  const t = useTranslation()

  return (
    <div className="zone-row flex items-center gap-3 bg-white border border-[#D0CFCA] rounded-[10px] px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate">
          {zone.zone_name}
        </p>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] truncate">
          {zone.cleaner_name ?? t('sv_unassigned')}
        </p>
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

// ─── Facility zone management view ────────────────────────────────────────────

function FacilityZonesView({ facilityId }: { facilityId: string }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [facilityName, setFacilityName] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)

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
      setZones((jobs[0].job_zones ?? []).map((z) => ({
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

  async function createJob() {
    if (!user) return
    const { error } = await supabase.from('jobs').insert({
      supervisor_id: user.id,
      facility_id: facilityId,
      scheduled_date: new Date().toISOString().slice(0, 10),
      status: 'not_started',
      company_id: user.company_id,
    })
    if (!error) load()
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pb-[100px]">

        {/* Header */}
        <div className="flex items-center gap-3 pt-10 pb-5">
          <button
            onClick={() => navigate('/supervisor/jobs')}
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
              onClick={createJob}
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
          <div className="flex flex-col gap-2">
            {zones.map((z) => (
              <ZoneRow key={z.id} zone={z} facilityId={facilityId} jobId={jobId} />
            ))}
          </div>
        )}
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}

// ─── Facility card ────────────────────────────────────────────────────────────

function FacilityCard({ item, onManage }: { item: FacilityWithJob; onManage: () => void }) {
  const t = useTranslation()
  const { facility, job } = item
  const total    = job?.zones.length ?? 0
  const done     = job ? job.zones.filter((z) => z.status === 'completed' || z.status === 'flagged_no_photo').length : 0
  const cleaners = job ? new Set(job.zones.map((z) => z.cleaner_id).filter(Boolean)).size : 0
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0
  const isActive = !!job

  return (
    <div className="facility-card bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden">
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
            zones: (job.job_zones ?? []).map((z) => ({
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

// ─── Jobs page entry ──────────────────────────────────────────────────────────

/** Facilities list and zone management for the supervisor. */
export function Jobs() {
  const [searchParams] = useSearchParams()
  const facilityId = searchParams.get('facility')
  const action     = searchParams.get('action')
  const zoneId     = searchParams.get('zone')

  if (facilityId && action === 'add') return <AddZoneScreen facilityId={facilityId} />
  if (facilityId && action === 'edit' && zoneId) return <ZoneEditScreen facilityId={facilityId} zoneId={zoneId} />
  if (facilityId) return <FacilityZonesView facilityId={facilityId} />
  return <FacilitiesListView />
}
