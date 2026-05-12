import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gsap, useGSAP } from '../../lib/gsap'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Types ───────────────────────────────────────────────────────────────────

type ZoneStatus = 'completed' | 'incomplete' | 'skipped'
type ShiftStatus = 'completed' | 'incomplete'

interface MockZone {
  id: string; name: string; description: string; time: string; status: ZoneStatus; note?: string
}

interface MockShiftDetail {
  id: string; siteName: string; date: string; status: ShiftStatus
  timeStart: string; timeEnd: string; duration: string; leadSpecialist: string; zones: MockZone[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_DETAILS: Record<string, MockShiftDetail> = {
  'shift-001': {
    id: 'shift-001', siteName: 'Acme Corp HQ', date: '12 May 2025',
    status: 'completed', timeStart: '18:00', timeEnd: '22:15', duration: '4h 15m', leadSpecialist: 'Sarah Jenkins',
    zones: [
      { id: 'z1', name: 'Main Lobby',         description: 'Hard floor polishing, glass partition cleaning, and waste removal.',  time: '18:45', status: 'completed' },
      { id: 'z2', name: 'Executive Washrooms', description: 'Deep sanitization, mirror detailing, and consumable replenishment.', time: '19:30', status: 'completed' },
      { id: 'z3', name: 'Conference Room A',   description: 'Carpet vacuuming, surface wiping, and whiteboard clearing.',         time: '20:15', status: 'completed' },
      { id: 'z4', name: 'Staff Kitchenette',   description: 'Countertop sanitization, sink deep clean, and floor mopping.',      time: '21:50', status: 'completed' },
    ],
  },
  'shift-002': {
    id: 'shift-002', siteName: 'Starlight Offices', date: '08 May 2025',
    status: 'completed', timeStart: '14:00', timeEnd: '17:00', duration: '3h 00m', leadSpecialist: 'Sarah Jenkins',
    zones: [
      { id: 'z1', name: 'Reception',   description: 'Desk wipe, glass panels, floor sweep.',          time: '14:20', status: 'completed' },
      { id: 'z2', name: 'Open Plan',   description: 'Dust monitors, vacuum carpet, empty recycling.', time: '15:05', status: 'completed' },
      { id: 'z3', name: 'Break Room',  description: 'Clean microwave interior, wipe counters.',       time: '16:00', status: 'completed' },
      { id: 'z4', name: 'WC Block',    description: 'Deep clean, restock consumables.',               time: '16:40', status: 'completed' },
    ],
  },
  'shift-003': {
    id: 'shift-003', siteName: 'Riverside Complex', date: '05 May 2025',
    status: 'incomplete', timeStart: '18:00', timeEnd: '22:15', duration: '4h 15m', leadSpecialist: 'Sarah Jenkins',
    zones: [
      { id: 'z1', name: 'Reception Area',      description: 'Hard floor polishing, glass partition cleaning, and waste removal.',  time: '18:45', status: 'completed' },
      { id: 'z2', name: 'Executive Boardroom', description: 'Deep sanitization, mirror detailing, and consumable replenishment.', time: '19:30', status: 'completed' },
      { id: 'z3', name: 'Open Plan Desks',     description: 'Carpet vacuuming, surface wiping, and whiteboard clearing.',         time: '20:15', status: 'incomplete' },
      { id: 'z4', name: 'Server Room',         description: 'Countertop sanitization, sink deep clean, and floor mopping.',      time: '21:50', status: 'skipped', note: 'Access Denied by Client' },
    ],
  },
  'shift-004': {
    id: 'shift-004', siteName: 'Downtown Centre', date: '01 May 2025',
    status: 'completed', timeStart: '07:30', timeEnd: '10:00', duration: '2h 30m', leadSpecialist: 'Sarah Jenkins',
    zones: [
      { id: 'z1', name: 'Main Entrance', description: 'Sweep and mop entrance floor.',  time: '07:50', status: 'completed' },
      { id: 'z2', name: 'Lifts',         description: 'Clean all lift interiors.',      time: '08:30', status: 'completed' },
      { id: 'z3', name: 'Lobby WC',      description: 'Deep clean, restock supplies.',  time: '09:05', status: 'completed' },
      { id: 'z4', name: 'Security Desk', description: 'Wipe surfaces, empty bins.',     time: '09:45', status: 'completed' },
      { id: 'z5', name: 'Stairwell',     description: 'Sweep all stairs, mop landings.',time: '09:55', status: 'completed' },
    ],
  },
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#434844" strokeWidth="1.5" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="#434844" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#2F4A3D" strokeWidth="1.5" />
      <path d="M12 6v6l4 2" stroke="#2F4A3D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="#2F4A3D" strokeWidth="1.5" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ZoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="#434844" strokeWidth="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="#434844" strokeWidth="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="#434844" strokeWidth="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="#434844" strokeWidth="1.5" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#2F4A3D" />
      <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XCircleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#BA1A1A" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#737874" />
      <path d="M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CompletedBadgeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#2F4A3D" />
      <path d="M8 12l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IncompleteBadgeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#BA1A1A" />
      <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function IdentityCard({ shift }: { shift: MockShiftDetail }) {
  const isComplete = shift.status === 'completed'
  return (
    <div className="sd-identity relative bg-white border border-[#E3E3DD] rounded-[12px] shadow-[0px_8px_30px_0px_rgba(17,30,23,0.04)] overflow-hidden p-[25px] flex flex-col gap-2">
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#D7C596] to-[#6B5D36] opacity-80" />
      <div className="flex items-center justify-between">
        <span className="font-['Lato',sans-serif] font-bold text-[13px] tracking-[1.4px] uppercase text-[#434844]">Commercial<br />Cleaning</span>
        <div className={[
          'flex items-center gap-1.5 px-3 py-1 rounded-full border text-[13px] font-bold tracking-[0.7px]',
          isComplete
            ? "bg-[rgba(208,232,215,0.3)] border-[#B5CCBC] text-[#374B3F] font-['Lato',sans-serif]"
            : "bg-[#FFDAD6] border-[rgba(186,26,26,0.2)] text-[#93000A] font-['Lato',sans-serif]",
        ].join(' ')}>
          {isComplete ? <CompletedBadgeIcon /> : <IncompleteBadgeIcon />}
          {isComplete ? 'Completed' : 'Incomplete'}
        </div>
      </div>
      <h2 className="font-['Poppins',sans-serif] font-bold text-[48px] leading-[1.1] tracking-[-0.96px] text-[#1A1C19]">
        {shift.siteName}
      </h2>
      <div className="flex items-center gap-2">
        <CalendarIcon />
        <span className="font-['Lato',sans-serif] text-[18px] text-[#434844]">{shift.date}</span>
      </div>
    </div>
  )
}

function BentoCards({ shift }: { shift: MockShiftDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="sd-bento bg-white border border-[#E3E3DD] rounded-[12px] shadow-[0px_4px_10px_rgba(17,30,23,0.02)] p-[17px] flex items-center gap-4">
        <div className="w-11 h-11 rounded-full bg-[#D0E8D7] flex items-center justify-center shrink-0"><ClockIcon /></div>
        <div className="flex flex-col">
          <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844]">Duration</span>
          <span className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19]">{shift.duration}</span>
          <span className="font-['Lato',sans-serif] text-[14px] text-[#737874]">{shift.timeStart} – {shift.timeEnd}</span>
        </div>
      </div>
      <div className="sd-bento bg-white border border-[#E3E3DD] rounded-[12px] shadow-[0px_4px_10px_rgba(17,30,23,0.02)] p-[17px] flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#D0E8D7] flex items-center justify-center shrink-0"><PersonIcon /></div>
        <div className="flex flex-col">
          <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844]">Lead Specialist</span>
          <span className="font-['Lato',sans-serif] font-bold text-[18px] text-[#1A1C19]">{shift.leadSpecialist}</span>
        </div>
      </div>
    </div>
  )
}

function ZoneItem({ zone }: { zone: MockZone }) {
  const statusIcon = zone.status === 'completed' ? <CheckCircleIcon /> : zone.status === 'incomplete' ? <XCircleIcon /> : <SkipIcon />
  const statusLabel = zone.status === 'completed' ? 'Completed' : zone.status === 'incomplete' ? 'Incomplete' : 'Skipped'

  return (
    <div className="sd-zone bg-white border border-[#E3E3DD] rounded-[12px] p-[17px] flex gap-4 items-start">
      <div className="w-11 h-11 rounded-[10px] bg-[#F4F4EE] border border-[#E3E3DD] flex items-center justify-center shrink-0 mt-0.5">
        <ZoneIcon />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] leading-tight">{zone.name}</h4>
          <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] shrink-0 mt-1">{zone.time}</span>
        </div>
        <p className="font-['Lato',sans-serif] text-base text-[#434844] leading-[1.6]">{zone.description}</p>
        {zone.note && <p className="font-['Lato',sans-serif] italic text-[14px] text-[#BA1A1A] leading-[1.5]">Note: {zone.note}</p>}
        <div className="flex items-center gap-2 pt-1">
          {statusIcon}
          <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#1A1C19]">{statusLabel}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Not found state ──────────────────────────────────────────────────────────

function ShiftNotFound({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="min-h-screen w-full bg-[#F4F4EE] flex items-center justify-center p-8">
      <div className="bg-white border border-[#C3C8C2] rounded-[12px] p-8 text-center max-w-sm w-full">
        <p className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19] mb-2">Shift not found</p>
        <button onClick={() => navigate('/cleaner/history')}
          className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#B8A77A] underline cursor-pointer">
          Back to history
        </button>
      </div>
    </div>
  )
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopShiftDetail() {
  const { shiftId } = useParams<{ shiftId: string }>()
  const navigate = useNavigate()
  const shift = MOCK_DETAILS[shiftId ?? '']
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!shift) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.sd-identity', { opacity: 0, y: 16, scale: 0.97, duration: 0.45 })
      .from('.sd-bento',    { opacity: 0, y: 12, duration: 0.35, stagger: 0.08 }, '-=0.2')
      .from('.sd-section',  { opacity: 0, y: 10, duration: 0.3 }, '-=0.15')
      .from('.sd-zone',     { opacity: 0, y: 14, duration: 0.35, stagger: 0.07 }, '-=0.1')
  }, { scope: containerRef })

  if (!shift) return <ShiftNotFound navigate={navigate} />

  const doneZones = shift.zones.filter((z) => z.status === 'completed').length

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
      <DesktopSidebar active="history" />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[rgba(244,244,238,0.95)] backdrop-blur-[6px] border-b border-[#E8E8E3] flex items-center h-16 px-8 gap-4">
          <button onClick={() => navigate('/cleaner/history')} aria-label="Go back"
            className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer shrink-0">
            <BackIcon />
          </button>
          <h1 className="font-['Poppins',sans-serif] font-semibold text-2xl tracking-[-0.6px] text-[#1A1C19]">Shift Details</h1>
        </div>

        <div ref={containerRef} className="max-w-5xl mx-auto px-8 py-8 pb-12">
          <div className="grid grid-cols-[1fr_320px] gap-6 mb-8">
            <IdentityCard shift={shift} />
            <BentoCards shift={shift} />
          </div>

          <div className="flex flex-col gap-5">
            <div className="sd-section flex items-center justify-between border-b border-[#E8E8E3] pb-3">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[28px] tracking-[-0.3px] text-[#1A1C19]">
                Cleaned Zones
              </h3>
              <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#D7C596]">
                {doneZones} / {shift.zones.length} Zones
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {shift.zones.map((zone) => <ZoneItem key={zone.id} zone={zone} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileShiftDetail() {
  const { shiftId } = useParams<{ shiftId: string }>()
  const navigate = useNavigate()
  const shift = MOCK_DETAILS[shiftId ?? '']
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!shift) return
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.sd-identity', { opacity: 0, y: 16, scale: 0.97, duration: 0.45 })
      .from('.sd-bento',    { opacity: 0, y: 12, duration: 0.35, stagger: 0.08 }, '-=0.2')
      .from('.sd-section',  { opacity: 0, y: 10, duration: 0.3 }, '-=0.15')
      .from('.sd-zone',     { opacity: 0, y: 14, duration: 0.35, stagger: 0.07 }, '-=0.1')
  }, { scope: containerRef })

  if (!shift) return <ShiftNotFound navigate={navigate} />

  const doneZones = shift.zones.filter((z) => z.status === 'completed').length

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[rgba(250,250,244,0.9)] backdrop-blur-[6px] border-b border-[#E8E8E3] flex items-center h-16 px-6 gap-4">
        <button onClick={() => navigate('/cleaner/history')} aria-label="Go back"
          className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer shrink-0">
          <BackIcon />
        </button>
        <h1 className="font-['Poppins',sans-serif] font-semibold text-2xl tracking-[-0.6px] text-[#1A1C19]">Shift Details</h1>
      </div>

      <div ref={containerRef} className="w-full max-w-[480px] mx-auto pb-12">
        <div className="flex flex-col gap-6 p-6">
          <IdentityCard shift={shift} />
          <BentoCards shift={shift} />
          <div className="flex flex-col gap-5">
            <div className="sd-section flex items-center justify-between border-b border-[#E8E8E3] pb-3">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.32px] text-[#1A1C19]">Cleaned Zones</h3>
              <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#D7C596]">{doneZones} / {shift.zones.length} Zones</span>
            </div>
            <div className="flex flex-col gap-4">
              {shift.zones.map((zone) => <ZoneItem key={zone.id} zone={zone} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Detail view for a single past shift, showing zone-by-zone breakdown. */
export function ShiftDetail() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopShiftDetail /> : <MobileShiftDetail />
}
