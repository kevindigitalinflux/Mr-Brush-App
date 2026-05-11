import { useNavigate } from 'react-router-dom'
import { BottomNav } from '../../components/BottomNav'

// ─── Mock data — replace with Supabase query once DB is ready ───────────────

type ShiftStatus = 'completed' | 'incomplete'

interface MockShift {
  id: string
  date: string
  dayLabel: string
  siteName: string
  clientName: string
  status: ShiftStatus
  zonesTotal: number
  zonesDone: number
  timeStart: string
  timeEnd: string
}

const MOCK_SHIFTS: MockShift[] = [
  {
    id: 'shift-001', date: '12 May', dayLabel: 'Monday',
    siteName: 'Acme Corp HQ', clientName: 'Acme Corp',
    status: 'completed', zonesTotal: 6, zonesDone: 6,
    timeStart: '08:00 AM', timeEnd: '11:30 AM',
  },
  {
    id: 'shift-002', date: '08 May', dayLabel: 'Thursday',
    siteName: 'Starlight Offices', clientName: 'Starlight Ltd',
    status: 'completed', zonesTotal: 4, zonesDone: 4,
    timeStart: '02:00 PM', timeEnd: '04:30 PM',
  },
  {
    id: 'shift-003', date: '05 May', dayLabel: 'Monday',
    siteName: 'Riverside Complex', clientName: 'Riverside Properties',
    status: 'incomplete', zonesTotal: 8, zonesDone: 5,
    timeStart: '09:00 AM', timeEnd: '01:00 PM',
  },
  {
    id: 'shift-004', date: '01 May', dayLabel: 'Thursday',
    siteName: 'Downtown Centre', clientName: 'Downtown Co.',
    status: 'completed', zonesTotal: 5, zonesDone: 5,
    timeStart: '07:30 AM', timeEnd: '10:00 AM',
  },
]

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#737874" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="#737874" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ─── ShiftCard ───────────────────────────────────────────────────────────────

function ShiftCard({ shift, onPress }: { shift: MockShift; onPress: () => void }) {
  const isComplete = shift.status === 'completed'

  return (
    <button
      onClick={onPress}
      className={[
        'w-full bg-white rounded-[12px] p-5 flex flex-col gap-3 text-left cursor-pointer hover:shadow-md transition-shadow',
        isComplete
          ? 'border border-[#C3C8C2]'
          : 'border-2 border-dashed border-[#C3C8C2] opacity-80',
      ].join(' ')}>

      {/* Top row: date + badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-['Lato',sans-serif] font-bold text-[13px] tracking-[0.65px] text-[#737874] uppercase">
            {shift.dayLabel} · {shift.date}
          </span>
          <h4 className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19] leading-tight">
            {shift.siteName}
          </h4>
          <span className="font-['Lato',sans-serif] text-sm text-[#6B5D36]">{shift.clientName}</span>
        </div>

        <span className={[
          'shrink-0 font-["Lato",sans-serif] font-bold text-[13px] tracking-[0.65px] px-3 h-7 flex items-center rounded-full',
          isComplete
            ? 'bg-[#D7E6DB] text-[#2F4A3D]'
            : 'bg-[#E3E3DD] text-[#737874]',
        ].join(' ')}>
          {isComplete ? 'Completed' : 'Incomplete'}
        </span>
      </div>

      {/* Bottom row: time + zones */}
      <div className="border-t border-[#E3E3DD] pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ClockIcon />
          <span className="font-['Lato',sans-serif] text-sm text-[#737874]">
            {shift.timeStart} – {shift.timeEnd}
          </span>
        </div>
        <span className="font-['Lato',sans-serif] font-bold text-sm text-[#434844] bg-[#F4F4EE] border border-[#C3C8C2] rounded-full px-3 py-1">
          {shift.zonesDone}/{shift.zonesTotal} Zones
        </span>
      </div>
    </button>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

/** Displays the cleaner's past shift history grouped by month. */
export function ShiftHistory() {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-[100px]">

        {/* Sticky header */}
        <div className="sticky top-0 bg-[#F4F4EE] z-10 flex items-center h-16 px-6 gap-4 border-b border-[#E3E3DD]">
          <button
            onClick={() => navigate('/cleaner/home')}
            aria-label="Go back"
            className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer shrink-0"
          >
            <BackIcon />
          </button>
          <h1 className="font-['Poppins',sans-serif] font-semibold text-2xl tracking-[-0.6px] text-[#1A1C19]">
            Shift History
          </h1>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 px-6 py-6">

          {/* Month group heading */}
          <div className="flex items-center justify-between">
            <h2 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.8px] text-[#1A1C19]">
              May 2025
            </h2>
            {/* Initials avatar */}
            <div className="w-10 h-10 rounded-full bg-[#B8A77A] flex items-center justify-center">
              <span className="font-['Poppins',sans-serif] font-bold text-sm text-white">CL</span>
            </div>
          </div>

          {/* Shift cards */}
          <div className="flex flex-col gap-4">
            {MOCK_SHIFTS.length === 0 ? (
              <div className="bg-white border border-[#C3C8C2] rounded-[12px] p-8 flex flex-col items-center gap-2">
                <p className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19]">No shifts yet</p>
                <p className="font-['Lato',sans-serif] text-base text-[#737874] text-center">
                  Completed shifts will appear here.
                </p>
              </div>
            ) : (
              MOCK_SHIFTS.map((shift) => (
                <ShiftCard key={shift.id} shift={shift} onPress={() => navigate(`/cleaner/history/${shift.id}`)} />
              ))
            )}
          </div>

        </div>
      </div>

      <BottomNav active="history" />
    </div>
  )
}
