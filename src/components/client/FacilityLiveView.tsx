import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ZoneLiveRow {
  id: string
  zoneName: string
  status: 'not_started' | 'in_progress' | 'completed' | 'flagged_no_photo'
  completedAt: string | null
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useFacilityZones(facilityId: string) {
  const [zones, setZones] = useState<ZoneLiveRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void (async () => {
      const { data: jobRow } = await supabase
        .from('jobs')
        .select('id')
        .eq('facility_id', facilityId)
        .order('scheduled_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!jobRow) { setLoading(false); return }

      const { data: zoneRows } = await supabase
        .from('job_zones')
        .select('id, zone_name, status')
        .eq('job_id', (jobRow as { id: string }).id)
        .order('zone_name')

      const zoneIds = (zoneRows ?? []).map((z) => (z as { id: string }).id)
      const logMap: Record<string, string> = {}

      if (zoneIds.length > 0) {
        const { data: logs } = await supabase
          .from('cleaning_logs')
          .select('job_zone_id, submitted_at')
          .in('job_zone_id', zoneIds)

        for (const log of (logs ?? [])) {
          const l = log as { job_zone_id: string; submitted_at: string }
          if (!logMap[l.job_zone_id]) logMap[l.job_zone_id] = l.submitted_at
        }
      }

      setZones(
        (zoneRows ?? []).map((z) => {
          const zr = z as { id: string; zone_name: string; status: string }
          return {
            id: zr.id,
            zoneName: zr.zone_name,
            status: zr.status as ZoneLiveRow['status'],
            completedAt: logMap[zr.id] ?? null,
          }
        })
      )
      setLoading(false)
    })()
  }, [facilityId])

  return { zones, loading }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DocumentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Zone row ─────────────────────────────────────────────────────────────────

function ZoneRow({ zone }: { zone: ZoneLiveRow }) {
  const done = zone.status === 'completed'
  const live = zone.status === 'in_progress'

  return (
    <div className={`flex items-center gap-3 py-2.5 ${live ? 'bg-[#EEF6F1] -mx-5 px-5 rounded-[8px]' : ''}`}>
      {done ? (
        <div className="w-5 h-5 rounded-full bg-[#2F4A3D] flex items-center justify-center shrink-0">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : live ? (
        <div className="relative w-5 h-5 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#B8A77A] animate-ping opacity-40" />
          <div className="w-3 h-3 rounded-full bg-[#B8A77A] relative" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-[#D0CFCA] shrink-0" />
      )}

      <span className={`flex-1 font-['Lato',sans-serif] text-[13px] ${live ? 'font-bold text-[#2F4A3D]' : 'text-[#434B4D]'}`}>
        {zone.zoneName} — {done ? 'Cleaned' : live ? 'In Progress' : 'Pending'}
      </span>

      {zone.completedAt && (
        <span className="font-['Lato',sans-serif] text-[11px] text-[#9A9A94] shrink-0 tabular-nums">
          {new Date(zone.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Expandable live-status panel for a facility card — mirrors the marketing site dashboard preview. */
export function FacilityLiveView({ facilityId }: { facilityId: string }) {
  const navigate = useNavigate()
  const { zones, loading } = useFacilityZones(facilityId)
  const hasEvidence = zones.some((z) => z.status === 'completed')

  if (loading) {
    return (
      <div className="px-5 py-4 border-t border-[#D0CFCA] flex flex-col gap-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded-[6px] bg-[#F5F4EF] animate-pulse" />
        ))}
      </div>
    )
  }

  if (zones.length === 0) {
    return (
      <div className="px-5 py-5 border-t border-[#D0CFCA] text-center">
        <p className="font-['Lato',sans-serif] text-[13px] text-[#9A9A94]">No zone data for the most recent job.</p>
      </div>
    )
  }

  return (
    <div className="px-5 pt-3 pb-4 border-t border-[#D0CFCA]">
      <p className="font-['Lato',sans-serif] text-[10px] font-bold uppercase tracking-[1.2px] text-[#9A9A94] mb-2">
        Live Status
      </p>
      <div className="flex flex-col">
        {zones.map((zone) => <ZoneRow key={zone.id} zone={zone} />)}
      </div>
      {hasEvidence && (
        <div className="flex items-center gap-3 pt-3 mt-2 border-t border-[#F0EFEA]">
          <div className="w-5 h-5 flex items-center justify-center text-[#9A9A94] shrink-0">
            <DocumentIcon />
          </div>
          <span className="flex-1 font-['Lato',sans-serif] text-[13px] text-[#434B4D]">Weekly Report Ready</span>
          <button
            onClick={() => navigate('/client/evidence')}
            className="font-['Lato',sans-serif] text-[12px] font-bold text-[#B8A77A] hover:text-[#a8976a] transition-colors"
          >
            View →
          </button>
        </div>
      )}
    </div>
  )
}
