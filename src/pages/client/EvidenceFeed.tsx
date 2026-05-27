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

    // Step 1 — org IDs for this user
    const { data: memberRows } = await supabase
      .from('client_org_members')
      .select('org_id')
      .eq('profile_id', user.id)

    const orgIds = (memberRows ?? []).map((m) => (m as { org_id: string }).org_id)
    if (orgIds.length === 0) { setLoading(false); return }

    // Step 2 — facility IDs for those orgs
    const { data: facilityRows } = await supabase
      .from('facilities')
      .select('id')
      .in('org_id', orgIds)

    const facilityIds = (facilityRows ?? []).map((f) => (f as { id: string }).id)
    if (facilityIds.length === 0) { setLoading(false); return }

    // Step 3 — recent job IDs at those facilities
    const { data: jobRows } = await supabase
      .from('jobs')
      .select('id')
      .in('facility_id', facilityIds)
      .order('scheduled_date', { ascending: false })
      .limit(30)

    const jobIds = (jobRows ?? []).map((j) => (j as { id: string }).id)
    if (jobIds.length === 0) { setLoading(false); return }

    // Step 4 — cleaning logs (flat columns only)
    const { data: logRows } = await supabase
      .from('cleaning_logs')
      .select('id, submitted_at, note, note_translated, note_language, job_id, job_zone_id, cleaner_id')
      .in('job_id', jobIds)
      .order('submitted_at', { ascending: false })
      .limit(60)

    if (!logRows || logRows.length === 0) { setLogs([]); setLoading(false); return }

    type LogRow = { id: string; submitted_at: string; note: string | null; note_translated: string | null; note_language: string | null; job_id: string; job_zone_id: string; cleaner_id: string }
    const rows = logRows as unknown as LogRow[]

    const logIds = rows.map((l) => l.id)
    const zoneIds = [...new Set(rows.map((l) => l.job_zone_id).filter(Boolean))]
    const cleanerIds = [...new Set(rows.map((l) => l.cleaner_id).filter(Boolean))]

    // Step 5 — parallel lookups
    const [zonesRes, profilesRes, evidenceRes, ratingsRes] = await Promise.all([
      supabase.from('job_zones').select('id, zone_name, status').in('id', zoneIds),
      supabase.from('profiles').select('id, full_name').in('id', cleanerIds),
      supabase.from('evidence_files').select('cleaning_log_id, public_url').in('cleaning_log_id', logIds),
      supabase.from('cleaner_ratings').select('job_zone_id').eq('rated_by', user.id).eq('rated_by_role', 'client'),
    ])

    type ZoneRow    = { id: string; zone_name: string; status: string }
    type ProfileRow = { id: string; full_name: string }
    type EvidRow    = { cleaning_log_id: string; public_url: string }
    type RatingRow  = { job_zone_id: string }

    const zoneMap    = Object.fromEntries(((zonesRes.data    ?? []) as unknown as ZoneRow[]).map((z) => [z.id, z]))
    const profileMap = Object.fromEntries(((profilesRes.data ?? []) as unknown as ProfileRow[]).map((p) => [p.id, p]))

    const evidenceMap: Record<string, string[]> = {}
    for (const ef of (evidenceRes.data ?? []) as unknown as EvidRow[]) {
      if (!evidenceMap[ef.cleaning_log_id]) evidenceMap[ef.cleaning_log_id] = []
      evidenceMap[ef.cleaning_log_id].push(ef.public_url)
    }

    const ratedZoneIds = new Set(((ratingsRes.data ?? []) as unknown as RatingRow[]).map((r) => r.job_zone_id).filter(Boolean))

    const mapped: EvidenceLog[] = rows.map((log) => {
      const zone    = zoneMap[log.job_zone_id]
      const profile = profileMap[log.cleaner_id]
      const fullName = profile?.full_name ?? 'Cleaner'
      return {
        id:                log.id,
        jobZoneId:         log.job_zone_id ?? '',
        jobId:             log.job_id,
        submittedAt:       log.submitted_at,
        note:              log.note,
        noteTranslated:    log.note_translated,
        noteLanguage:      log.note_language,
        zoneName:          zone?.zone_name ?? 'Zone',
        zoneStatus:        zone?.status ?? 'completed',
        cleanerFirstName:  firstName(fullName),
        photoUrls:         evidenceMap[log.id] ?? [],
        isRated:           ratedZoneIds.has(log.job_zone_id ?? ''),
      }
    })

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
