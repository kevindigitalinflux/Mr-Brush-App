import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { ClientNav } from '../../components/client/ClientNav'
import { ClientSidebar } from '../../components/client/ClientSidebar'
import { ImageViewer } from '../../components/ImageViewer'
import { RateCleanModal } from '../../components/client/RateCleanModal'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvidenceLog {
  id: string
  jobZoneId: string
  jobId: string
  submittedAt: string
  note: string | null
  noteTranslated: string | null
  noteLanguage: string | null
  zoneName: string
  zoneStatus: string
  cleanerFirstName: string
  photoUrls: string[]
  isRated: boolean
}

type FilterMode = 'all' | 'today' | 'week' | 'zone'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(isoStr: string): string {
  const d = new Date(isoStr)
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  if (mins < 2880) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function firstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useEvidenceData() {
  const { user } = useApp()
  const [logs, setLogs] = useState<EvidenceLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return

    // Step 1 — facility IDs via org chain
    const { data: memberships } = await supabase
      .from('client_org_members')
      .select('client_organisations ( facilities ( id ) )')
      .eq('profile_id', user.id)

    const facilityIds: string[] = (memberships ?? []).flatMap((m) => {
      const orgs = (m as unknown as { client_organisations: { facilities: { id: string }[] } | null }).client_organisations
      return (orgs?.facilities ?? []).map((f) => f.id)
    })

    if (facilityIds.length === 0) { setLoading(false); return }

    // Step 2 — recent job IDs
    const { data: jobRows } = await supabase
      .from('jobs')
      .select('id')
      .in('facility_id', facilityIds)
      .order('scheduled_date', { ascending: false })
      .limit(30)

    const jobIds = (jobRows ?? []).map((j) => j.id)
    if (jobIds.length === 0) { setLoading(false); return }

    // Step 3 — cleaning logs with related data (parallel with ratings check)
    const [logsRes, ratingsRes] = await Promise.all([
      supabase
        .from('cleaning_logs')
        .select(`
          id, submitted_at, note, note_translated, note_language, job_id,
          job_zones ( id, zone_name, status ),
          evidence_files ( id, public_url ),
          profiles ( full_name )
        `)
        .in('job_id', jobIds)
        .order('submitted_at', { ascending: false })
        .limit(60),
      supabase
        .from('cleaner_ratings')
        .select('job_zone_id')
        .eq('rated_by', user.id)
        .eq('rated_by_role', 'client'),
    ])

    const ratedZoneIds = new Set((ratingsRes.data ?? []).map((r) => r.job_zone_id).filter(Boolean))

    type RawLog = {
      id: string; submitted_at: string; note: string | null
      note_translated: string | null; note_language: string | null; job_id: string
      job_zones: { id: string; zone_name: string; status: string } | null
      evidence_files: { id: string; public_url: string }[]
      profiles: { full_name: string } | null
    }

    const mapped: EvidenceLog[] = ((logsRes.data ?? []) as unknown as RawLog[]).map((r) => ({
      id: r.id,
      jobZoneId: r.job_zones?.id ?? '',
      jobId: r.job_id,
      submittedAt: r.submitted_at,
      note: r.note,
      noteTranslated: r.note_translated,
      noteLanguage: r.note_language,
      zoneName: r.job_zones?.zone_name ?? 'Zone',
      zoneStatus: r.job_zones?.status ?? 'completed',
      cleanerFirstName: firstName(r.profiles?.full_name ?? 'Cleaner'),
      photoUrls: (r.evidence_files ?? []).map((ef) => ef.public_url),
      isRated: ratedZoneIds.has(r.job_zones?.id ?? ''),
    }))

    setLogs(mapped)
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) void load() }, [load, user])
  return { logs, loading }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

function FilterChips({ mode, onMode, zoneNames, activeZone, onZone }: {
  mode: FilterMode; onMode: (m: FilterMode) => void
  zoneNames: string[]; activeZone: string | null; onZone: (z: string | null) => void
}) {
  const chips: { id: FilterMode; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'zone', label: 'By Zone' },
  ]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {chips.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { onMode(id); if (id !== 'zone') onZone(null) }}
            className={[
              "shrink-0 px-4 py-1.5 rounded-full font-['Poppins',sans-serif] font-semibold text-[13px] border transition-colors",
              mode === id
                ? 'bg-[#B8A77A] text-white border-[#B8A77A]'
                : 'bg-white text-[#434B4D] border-[#D0CFCA] hover:border-[#B8A77A]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'zone' && zoneNames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {zoneNames.map((z) => (
            <button
              key={z}
              onClick={() => onZone(activeZone === z ? null : z)}
              className={[
                "shrink-0 px-3 py-1 rounded-full font-['Lato',sans-serif] font-bold text-[12px] border transition-colors",
                activeZone === z
                  ? 'bg-[#3D3B3A] text-white border-[#3D3B3A]'
                  : 'bg-[#F5F4EF] text-[#434B4D] border-[#D0CFCA] hover:border-[#3D3B3A]',
              ].join(' ')}
            >
              {z}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Evidence card ────────────────────────────────────────────────────────────

function EvidenceCard({ log, onPhotoTap, onRateTap, isRatedOverride }: {
  log: EvidenceLog
  onPhotoTap: (url: string) => void
  onRateTap: (log: EvidenceLog) => void
  isRatedOverride?: boolean
}) {
  const isRated = log.isRated || (isRatedOverride ?? false)
  const hasPhotos = log.photoUrls.length > 0
  const extraCount = log.photoUrls.length - 1
  const displayNote = log.noteLanguage && log.noteLanguage !== 'en' && log.noteTranslated
    ? { text: log.noteTranslated, translated: true }
    : log.note
      ? { text: log.note, translated: false }
      : null

  return (
    <div className="ev-card bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden">

      {/* Photo */}
      {hasPhotos ? (
        <div className="relative">
          <button
            onClick={() => onPhotoTap(log.photoUrls[0])}
            className="block w-full"
            aria-label={`View photo of ${log.zoneName}`}
          >
            <img
              src={log.photoUrls[0]}
              alt={log.zoneName}
              className="w-full h-[220px] object-cover"
              loading="lazy"
            />
          </button>
          {extraCount > 0 && (
            <button
              onClick={() => onPhotoTap(log.photoUrls[0])}
              className="absolute bottom-2.5 right-2.5 bg-black/60 text-white font-['Lato',sans-serif] font-bold text-[12px] px-2.5 py-1 rounded-full"
            >
              +{extraCount} more
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-[100px] bg-[#F0EFE9] flex items-center justify-center">
          <p className="font-['Lato',sans-serif] text-[13px] text-[#9A9A94]">No photo submitted</p>
        </div>
      )}

      {/* Info row */}
      <div className="px-4 pt-3.5 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`${log.zoneStatus === 'completed' ? 'text-[#2F4A3D]' : 'text-[#B8A77A]'}`}>
                <CheckIcon />
              </span>
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#3D3B3A] truncate">
                {log.zoneName}
              </h3>
            </div>
            <p className="font-['Lato',sans-serif] text-[12px] text-[#737874]">
              {log.cleanerFirstName} · {formatTime(log.submittedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Cleaner note */}
      {displayNote && (
        <div className="px-4 py-2.5 mx-4 mb-2 bg-[#F9F8F4] border border-[#E3E3DD] rounded-[8px]">
          {displayNote.translated && (
            <p className="font-['Lato',sans-serif] text-[11px] text-[#B8A77A] font-bold tracking-[0.5px] mb-1">
              🌐 AUTO-TRANSLATED
            </p>
          )}
          <p className="font-['Lato',sans-serif] text-[13px] text-[#434B4D] leading-relaxed">
            "{displayNote.text}"
          </p>
        </div>
      )}

      {/* Rate entry point */}
      {!isRated && hasPhotos && (
        <div className="px-4 pb-3.5 pt-1 border-t border-[#F0EFE9] mt-1">
          <button
            onClick={() => onRateTap(log)}
            className="flex items-center gap-1 font-['Poppins',sans-serif] font-semibold text-[13px] text-[#B8A77A] hover:text-[#a8976a] transition-colors"
          >
            Rate this clean <ChevronRightIcon />
          </button>
        </div>
      )}

      {isRated && (
        <div className="px-4 pb-3.5 pt-1 border-t border-[#F0EFE9] mt-1">
          <span className="font-['Lato',sans-serif] text-[12px] text-[#2F4A3D] font-bold">✓ Rated</span>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden animate-pulse">
          <div className="h-[220px] bg-[#E3E3DD]" />
          <div className="px-4 py-3 flex flex-col gap-2">
            <div className="h-4 bg-[#E3E3DD] rounded w-1/2" />
            <div className="h-3 bg-[#E3E3DD] rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

function applyFilter(logs: EvidenceLog[], mode: FilterMode, activeZone: string | null): EvidenceLog[] {
  const now = Date.now()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now - 7 * 86_400_000)

  return logs.filter((log) => {
    const t = new Date(log.submittedAt).getTime()
    if (mode === 'today' && t < todayStart.getTime()) return false
    if (mode === 'week' && t < weekStart.getTime()) return false
    if (mode === 'zone' && activeZone && log.zoneName !== activeZone) return false
    return true
  })
}

// ─── Mobile view ──────────────────────────────────────────────────────────────

function MobileEvidenceFeed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { logs, loading } = useEvidenceData()
  const [mode, setMode] = useState<FilterMode>('all')
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [ratingLog, setRatingLog] = useState<EvidenceLog | null>(null)
  const [localRatedIds, setLocalRatedIds] = useState<Set<string>>(new Set())

  const zoneNames = [...new Set(logs.map((l) => l.zoneName))].sort()
  const filtered = applyFilter(logs, mode, activeZone)

  useGSAP(() => {
    if (loading) return
    gsap.set('.ev-card', { clearProps: 'all' })
    gsap.from('.ev-card', { opacity: 0, y: 16, duration: 0.35, stagger: 0.07, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading, mode, activeZone] })

  function handleRated(jobZoneId: string) {
    setLocalRatedIds((s) => new Set([...s, jobZoneId]))
  }

  return (
    <div className="fixed inset-0 bg-[#F5F4EF] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pt-8 pb-[100px]">

        {/* Header */}
        <div className="mb-5">
          <p className="font-['Lato',sans-serif] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">
            Proof of Cleaning
          </p>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[26px] text-[#3D3B3A] leading-tight">
            Evidence
          </h1>
        </div>

        {/* Filters */}
        <div className="mb-5">
          <FilterChips
            mode={mode} onMode={setMode}
            zoneNames={zoneNames} activeZone={activeZone} onZone={setActiveZone}
          />
        </div>

        {/* Content */}
        {loading ? <Skeleton /> : filtered.length === 0 ? (
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-8 text-center">
            <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#3D3B3A]">No submissions yet</p>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">
              Evidence from your cleaning team will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((log) => (
              <EvidenceCard
                key={log.id} log={log}
                onPhotoTap={setLightbox}
                onRateTap={setRatingLog}
                isRatedOverride={localRatedIds.has(log.jobZoneId)}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && <ImageViewer src={lightbox} onClose={() => setLightbox(null)} />}
      {ratingLog && (
        <RateCleanModal
          jobZoneId={ratingLog.jobZoneId}
          zoneName={ratingLog.zoneName}
          cleanerFirstName={ratingLog.cleanerFirstName}
          onClose={() => setRatingLog(null)}
          onRated={handleRated}
        />
      )}
      <ClientNav active="evidence" />
    </div>
  )
}

// ─── Desktop view ─────────────────────────────────────────────────────────────

function DesktopEvidenceFeed() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { logs, loading } = useEvidenceData()
  const [mode, setMode] = useState<FilterMode>('all')
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [ratingLog, setRatingLog] = useState<EvidenceLog | null>(null)
  const [localRatedIds, setLocalRatedIds] = useState<Set<string>>(new Set())

  const zoneNames = [...new Set(logs.map((l) => l.zoneName))].sort()
  const filtered = applyFilter(logs, mode, activeZone)

  function handleRated(jobZoneId: string) {
    setLocalRatedIds((s) => new Set([...s, jobZoneId]))
  }

  useGSAP(() => {
    if (loading) return
    gsap.set('.ev-card', { clearProps: 'all' })
    gsap.from('.ev-card', { opacity: 0, y: 14, duration: 0.32, stagger: 0.06, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading, mode, activeZone] })

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F4EF]">
      <ClientSidebar active="evidence" />
      <main className="flex-1 overflow-y-auto ml-60">
        <div ref={containerRef} className="max-w-4xl mx-auto px-10 py-10">

          {/* Header */}
          <div className="mb-7">
            <p className="font-['Lato',sans-serif] text-[13px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase mb-1">
              Proof of Cleaning
            </p>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[36px] text-[#3D3B3A] leading-tight tracking-[-0.5px]">
              Evidence
            </h1>
          </div>

          {/* Filters */}
          <div className="mb-7">
            <FilterChips
              mode={mode} onMode={setMode}
              zoneNames={zoneNames} activeZone={activeZone} onZone={setActiveZone}
            />
          </div>

          {/* Content */}
          {loading ? <Skeleton /> : filtered.length === 0 ? (
            <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 text-center">
              <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#3D3B3A]">No submissions yet</p>
              <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">
                Evidence from your cleaning team will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {filtered.map((log) => (
                <EvidenceCard
                  key={log.id} log={log}
                  onPhotoTap={setLightbox}
                  onRateTap={setRatingLog}
                  isRatedOverride={localRatedIds.has(log.jobZoneId)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {lightbox && <ImageViewer src={lightbox} onClose={() => setLightbox(null)} />}
      {ratingLog && (
        <RateCleanModal
          jobZoneId={ratingLog.jobZoneId}
          zoneName={ratingLog.zoneName}
          cleanerFirstName={ratingLog.cleanerFirstName}
          onClose={() => setRatingLog(null)}
          onRated={handleRated}
        />
      )}
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Client portal — read-only evidence feed with filter chips and photo lightbox. */
export function EvidenceFeed() {
  return (
    <>
      <div className="md:hidden"><MobileEvidenceFeed /></div>
      <div className="hidden md:block"><DesktopEvidenceFeed /></div>
    </>
  )
}
