import { useNavigate, useParams } from 'react-router-dom'

// ─── Mock data — replace with Supabase query once DB is ready ───────────────

type ZoneStatus = 'not_started' | 'in_progress' | 'completed'

interface MockZone {
  id: string
  name: string
  description: string
  status: ZoneStatus
}

const MOCK_ZONES: Record<string, MockZone[]> = {
  'job-001': [
    { id: 'z1', name: 'Main Lobby',           description: 'High traffic area. Includes reception desk.',          status: 'completed' },
    { id: 'z2', name: 'Executive Washrooms',   description: 'Restock all supplies. Check mirrors.',                status: 'completed' },
    { id: 'z3', name: 'Conference Room A',     description: 'Wipe down large table, vacuum floors, empty bins.',   status: 'in_progress' },
    { id: 'z4', name: 'Open Plan Desks (N)',   description: 'Dust monitors, empty individual recycling.',          status: 'not_started' },
    { id: 'z5', name: 'Break Room / Kitchen',  description: 'Clean microwave interior, wipe counters, mop floor.', status: 'not_started' },
    { id: 'z6', name: 'Server Room',           description: 'Dust equipment surfaces, mop floor, empty bins.',     status: 'not_started' },
  ],
  'job-002': [
    { id: 'z7', name: 'Main Entrance',         description: 'Sweep and mop entrance floor.',                       status: 'not_started' },
    { id: 'z8', name: 'Reception Area',        description: 'Wipe desks, clean glass panels.',                     status: 'not_started' },
    { id: 'z9', name: 'Lifts / Elevators',     description: 'Clean all lift interiors and buttons.',               status: 'not_started' },
    { id: 'z10', name: 'Ground Floor WC',      description: 'Deep clean, restock supplies.',                       status: 'not_started' },
    { id: 'z11', name: 'Lobby Seating Area',   description: 'Vacuum sofas, wipe side tables.',                     status: 'not_started' },
    { id: 'z12', name: 'Security Desk Area',   description: 'Wipe surfaces, empty bins.',                          status: 'not_started' },
  ],
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const ZONE_STYLES: Record<ZoneStatus, {
  accent: string; badge: string; badgeText: string; border: string; opacity: string; label: string
}> = {
  completed:   { accent: 'bg-black',       badge: 'bg-black',       badgeText: 'text-white',       border: 'border border-[#C3C8C2]',       opacity: '',       label: 'Completed'   },
  in_progress: { accent: 'bg-[#F1DEAD]',   badge: 'bg-[#F1DEAD]',   badgeText: 'text-[#6F613A]',   border: 'border-2 border-[#2F312D]',     opacity: '',       label: 'In Progress' },
  not_started: { accent: 'bg-[#C3C8C2]',   badge: 'bg-[#E3E3DD]',   badgeText: 'text-[#434844]',   border: 'border border-[#C3C8C2]',       opacity: 'opacity-75', label: 'Not Started' },
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── ZoneCard ────────────────────────────────────────────────────────────────

function ZoneCard({ zone, jobId }: { zone: MockZone; jobId: string }) {
  const navigate = useNavigate()
  const s = ZONE_STYLES[zone.status]

  function handlePress() {
    if (zone.status !== 'completed') {
      navigate(`/cleaner/job/${jobId}/zone/${zone.id}`)
    }
  }

  return (
    <div
      onClick={handlePress}
      role={zone.status !== 'completed' ? 'button' : undefined}
      tabIndex={zone.status !== 'completed' ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && handlePress()}
      className={[
        'relative flex items-stretch overflow-hidden rounded-[12px] shadow-sm bg-white w-full',
        s.border,
        s.opacity,
        zone.status !== 'completed' ? 'cursor-pointer hover:shadow-md transition-shadow' : '',
      ].join(' ')}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${s.accent}`} />

      {/* Card content */}
      <div className="flex-1 flex flex-col gap-3 pl-8 pr-4 py-4">
        {/* Name + badge */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] leading-tight">
            {zone.name}
          </h4>
          {zone.status === 'in_progress' && (
            <span className={`shrink-0 ${s.badge} ${s.badgeText} font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] px-3 h-8 flex items-center rounded-full`}>
              In Progress
            </span>
          )}
        </div>

        {/* Description */}
        <p className="font-['Lato',sans-serif] text-base text-[#434844] leading-[1.6]">
          {zone.description}
        </p>

        {/* Status badge (completed / not started) */}
        {zone.status !== 'in_progress' && (
          <div>
            <span className={`${s.badge} ${s.badgeText} font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] px-3 h-8 inline-flex items-center rounded-full`}>
              {s.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function ZoneList() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()

  const zones = MOCK_ZONES[jobId ?? ''] ?? []
  const totalZones = zones.length
  const doneZones = zones.filter((z) => z.status === 'completed').length
  const allDone = doneZones === totalZones && totalZones > 0
  const progressPct = totalZones > 0 ? (doneZones / totalZones) * 100 : 0

  function handleMarkComplete() {
    if (allDone) navigate(`/cleaner/job/${jobId}/complete`)
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-24 p-8 flex flex-col gap-8">

        {/* Progress bar section */}
        <div className="flex flex-col gap-4 pb-4">
          {/* Back + heading */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cleaner/home')}
              aria-label="Go back"
              className="w-8 h-10 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer -ml-2"
            >
              <BackIcon />
            </button>
            <h2 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.32px] text-[#1A1C19]">
              Shift Progress
            </h2>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-2">
            <div className="w-full h-3 bg-[#C3C8C2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F1DEAD] rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] uppercase">
                Overall Progress
              </span>
              <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844]">
                {doneZones} of {totalZones} zones completed
              </span>
            </div>
          </div>
        </div>

        {/* Zone list */}
        <div className="flex flex-col gap-4 pt-4">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] pb-2">
            Your Zones
          </h3>
          <div className="flex flex-col gap-4">
            {zones.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} jobId={jobId ?? ''} />
            ))}
          </div>
        </div>

        {/* Mark Shift Complete button */}
        <div className="flex flex-col gap-2 pt-8">
          <button
            onClick={handleMarkComplete}
            disabled={!allDone}
            className={[
              'w-full h-[56px] rounded-[8px] font-["Poppins",sans-serif] font-semibold text-base text-center shadow-sm transition-colors',
              allDone
                ? 'bg-[#B8A77A] text-[#F8F8F2] cursor-pointer hover:bg-[#a8976a]'
                : 'bg-[#E3E3DD] text-[#737874] opacity-50 cursor-not-allowed',
            ].join(' ')}
          >
            Mark Shift Complete
          </button>
          <p className="font-['Lato',sans-serif] text-base text-[#434844] text-center">
            {allDone
              ? 'All zones finished. Ready to complete shift.'
              : 'Finish all zones to complete shift.'}
          </p>
        </div>

      </div>
    </div>
  )
}
