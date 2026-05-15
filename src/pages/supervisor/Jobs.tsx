import { useEffect, useRef, useState, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Facility { id: string; name: string }
interface Cleaner { id: string; full_name: string; display_id: string }

interface Zone {
  id: string
  zone_name: string
  status: string
  cleaner_id: string | null
  cleaner_name: string | null
}

interface JobData {
  id: string
  facility_name: string
  scheduled_date: string
  status: string
  zones: Zone[]
}

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  not_started:      { label: 'Not started',  cls: 'bg-[#E3E3DD] text-[#737874]'   },
  in_progress:      { label: 'In progress',  cls: 'bg-[#FFF3D1] text-[#6F613A]'   },
  completed:        { label: 'Completed',    cls: 'bg-[#D7E6DB] text-[#2F4A3D]'   },
  flagged_no_photo: { label: 'No photo',     cls: 'bg-[#FDECEA] text-[#BA1A1A]'   },
}

function StatusPill({ status }: { status: string }) {
  const { label, cls } = STATUS_MAP[status] ?? STATUS_MAP.not_started
  return (
    <span className={`shrink-0 font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.5px] px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

// ─── Zone row ─────────────────────────────────────────────────────────────────

function ZoneRow({ zone }: { zone: Zone }) {
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
    </div>
  )
}

// ─── Add Zone bottom sheet ────────────────────────────────────────────────────

function AddZoneSheet({ jobId, cleaners, onClose, onAdded }: {
  jobId: string
  cleaners: Cleaner[]
  onClose: () => void
  onAdded: () => void
}) {
  const t = useTranslation()
  const [zoneName, setZoneName] = useState('')
  const [cleanerId, setCleanerId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!zoneName.trim()) { setError(t('sv_zone_name_required')); return }
    setSaving(true)
    const { error: err } = await supabase.from('job_zones').insert({
      job_id: jobId,
      zone_name: zoneName.trim(),
      cleaner_id: cleanerId || null,
      status: 'not_started',
    })
    setSaving(false)
    if (err) { setError(t('sv_failed_add_zone')); return }
    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-[20px] px-6 pt-5 pb-10 flex flex-col gap-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-[#D0CFCA] rounded-full mx-auto" />
        <h2 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-[#1A1C19]">{t('sv_add_zone')}</h2>

        <div className="flex flex-col gap-2">
          <label className="font-['Lato',sans-serif] font-bold text-[13px] tracking-[0.6px] text-[#434844] uppercase">
            {t('sv_zone_name_label')}
          </label>
          <input
            type="text"
            value={zoneName}
            onChange={(e) => { setZoneName(e.target.value); setError('') }}
            placeholder={t('sv_zone_name_placeholder')}
            className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-['Lato',sans-serif] font-bold text-[13px] tracking-[0.6px] text-[#434844] uppercase">
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

        {error && (
          <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>
        )}

        <button
          onClick={handleAdd}
          disabled={saving}
          className="w-full h-[56px] bg-[#B8A77A] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-base text-white hover:bg-[#a8976a] transition-colors disabled:opacity-60"
        >
          {saving ? t('submitting') : t('sv_add_zone')}
        </button>
      </div>
    </div>
  )
}

// ─── Job section ──────────────────────────────────────────────────────────────

function JobSection({ job, cleaners, onZoneAdded }: { job: JobData; cleaners: Cleaner[]; onZoneAdded: () => void }) {
  const t = useTranslation()
  const [showSheet, setShowSheet] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-[#1A1C19]">{job.facility_name}</h2>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
            {job.zones.length} zone{job.zones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowSheet(true)}
          className="h-9 px-4 bg-[#1A1C19] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-[13px] text-white hover:bg-[#2e3130] transition-colors"
        >
          {t('sv_add_zone')}
        </button>
      </div>

      {job.zones.length === 0 ? (
        <div className="bg-white border border-dashed border-[#C3C8C2] rounded-[12px] p-6 flex flex-col items-center gap-1 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#737874]">{t('sv_no_zones_yet')}</p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#9E9E9E]">{t('sv_no_zones_body')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {job.zones.map((z) => <ZoneRow key={z.id} zone={z} />)}
        </div>
      )}

      {showSheet && (
        <AddZoneSheet
          jobId={job.id}
          cleaners={cleaners}
          onClose={() => setShowSheet(false)}
          onAdded={onZoneAdded}
        />
      )}
    </div>
  )
}

// ─── Create job view ──────────────────────────────────────────────────────────

function CreateJobView({ facilities, onCreated, userId, companyId }: {
  facilities: Facility[]
  onCreated: () => void
  userId: string
  companyId: string
}) {
  const t = useTranslation()
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!facilityId) return
    setCreating(true)
    const { error: err } = await supabase.from('jobs').insert({
      supervisor_id: userId,
      facility_id: facilityId,
      scheduled_date: new Date().toISOString().slice(0, 10),
      status: 'not_started',
      company_id: companyId,
    })
    setCreating(false)
    if (err) { setError(t('sv_could_not_create')); return }
    onCreated()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 flex flex-col items-center gap-3 text-center">
        <div className="w-14 h-14 rounded-full bg-[#F4F4EE] border border-[#D0CFCA] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" stroke="#B8A77A" strokeWidth="2" />
            <path d="M8 5V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="#B8A77A" strokeWidth="2" />
            <path d="M12 10v4M10 12h4" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_shift_yet')}</p>
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] max-w-[220px]">
          {t('sv_no_shift_body')}
        </p>
      </div>

      {facilities.length > 1 && (
        <div className="flex flex-col gap-2">
          <label className="font-['Lato',sans-serif] font-bold text-[13px] tracking-[0.6px] text-[#434844] uppercase">
            {t('sv_facility_label')}
          </label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="h-[52px] border border-[#C3C8C2] rounded-[8px] px-4 font-['Lato',sans-serif] text-[15px] text-[#1A1C19] outline-none focus:border-[#B8A77A] transition-colors bg-white"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={creating || !facilityId}
        className="w-full h-[56px] bg-[#B8A77A] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-base text-white hover:bg-[#a8976a] transition-colors disabled:opacity-60"
      >
        {creating ? t('submitting') : t('sv_start_todays_shift')}
      </button>
    </div>
  )
}

// ─── Jobs page ────────────────────────────────────────────────────────────────

/** Today's job management — create the shift, add zones, assign cleaners. */
export function Jobs() {
  const { user } = useApp()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [jobs, setJobs] = useState<JobData[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [cleaners, setCleaners] = useState<Cleaner[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)

    const [jobsRes, facilitiesRes, cleanersRes] = await Promise.all([
      supabase
        .from('jobs')
        .select(`id, status, scheduled_date, facilities ( name ), job_zones ( id, zone_name, status, cleaner_id )`)
        .eq('supervisor_id', user.id)
        .eq('scheduled_date', today),
      supabase
        .from('facilities')
        .select('id, name')
        .eq('company_id', user.company_id),
      supabase
        .from('profiles')
        .select('id, full_name, display_id')
        .eq('company_id', user.company_id)
        .eq('role', 'cleaner'),
    ])

    const cleanerMap = new Map<string, string>()
    for (const c of cleanersRes.data ?? []) {
      cleanerMap.set(c.id, c.full_name ?? c.display_id)
    }

    const mapped: JobData[] = ((jobsRes.data ?? []) as unknown as {
      id: string; status: string; scheduled_date: string
      facilities: { name: string } | null
      job_zones: { id: string; zone_name: string; status: string; cleaner_id: string | null }[]
    }[]).map((r) => ({
      id: r.id,
      facility_name: r.facilities?.name ?? 'Unknown Site',
      scheduled_date: r.scheduled_date,
      status: r.status,
      zones: (r.job_zones ?? []).map((z) => ({
        id: z.id,
        zone_name: z.zone_name,
        status: z.status,
        cleaner_id: z.cleaner_id,
        cleaner_name: z.cleaner_id ? (cleanerMap.get(z.cleaner_id) ?? null) : null,
      })),
    }))

    setJobs(mapped)
    setFacilities(facilitiesRes.data ?? [])
    setCleaners(cleanersRes.data?.map((c) => ({ id: c.id, full_name: c.full_name ?? c.display_id, display_id: c.display_id })) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  useGSAP(() => {
    if (loading) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.jobs-heading', { opacity: 0, y: 16, duration: 0.4 })
      .from('.zone-row', { opacity: 0, y: 10, duration: 0.3, stagger: 0.05 }, '-=0.2')
  }, { scope: containerRef, dependencies: [loading] })

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pt-10 pb-[100px]">

        <div className="jobs-heading mb-6">
          <h1 className="font-['Poppins',sans-serif] font-bold text-[32px] text-[#1A1C19] leading-[1.1] tracking-[-0.4px]">
            {t('sv_jobs_title')}
          </h1>
          <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-0.5">{today}</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <CreateJobView
            facilities={facilities}
            userId={user!.id}
            companyId={user!.company_id}
            onCreated={load}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {jobs.map((job) => (
              <JobSection key={job.id} job={job} cleaners={cleaners} onZoneAdded={load} />
            ))}
          </div>
        )}
      </div>
      <SupervisorNav active="jobs" />
    </div>
  )
}
