import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { BottomNav } from '../../components/BottomNav'
import { useTranslation } from '../../lib/useTranslation'
import { gsap, useGSAP } from '../../lib/gsap'

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
        'shift-card w-full bg-white rounded-[12px] p-5 flex flex-col gap-3 text-left cursor-pointer hover:shadow-md transition-shadow',
        isComplete
          ? 'border border-[#C3C8C2]'
          : 'border-2 border-dashed border-[#C3C8C2] opacity-80',
      ].join(' ')}
    >
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
          isComplete ? 'bg-[#D7E6DB] text-[#2F4A3D]' : 'bg-[#E3E3DD] text-[#737874]',
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

/** Displays the cleaner's past shift history. */
export function ShiftHistory() {
  const navigate = useNavigate()
  const { user, completedJobs } = useApp()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.history-heading', { opacity: 0, y: 20, duration: 0.45 })
      .from('.history-subtitle', { opacity: 0, y: 10, duration: 0.35 }, '-=0.2')
      .from('.history-month', { opacity: 0, y: 10, duration: 0.35 }, '-=0.15')
      .from('.shift-card', { opacity: 0, y: 20, duration: 0.4, stagger: 0.07 }, '-=0.15')
  }, { scope: containerRef })

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'CL'

  const monthLabel = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const contextShifts: MockShift[] = completedJobs.map((j) => ({
    id: j.id,
    date: j.date,
    dayLabel: j.dayLabel,
    siteName: j.siteName,
    clientName: j.clientName,
    status: 'completed',
    zonesTotal: j.zonesTotal,
    zonesDone: j.zonesDone,
    timeStart: j.timeStart,
    timeEnd: j.timeEnd,
  }))

  const allShifts: MockShift[] = [...contextShifts, ...MOCK_SHIFTS]

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto pb-[100px]">

        <div className="px-6 pt-10 pb-5">
          <h1 className="history-heading font-['Poppins',sans-serif] font-bold text-[42px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
            {t('shift_history')}
          </h1>
          <p className="history-subtitle font-['Lato',sans-serif] text-[15px] text-[#434844] mt-2 leading-[1.65]">
            {t('shift_history_subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-6 px-6">

          <div className="history-month flex items-center justify-between">
            <h2 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.8px] text-[#1A1C19]">
              {monthLabel}
            </h2>
            <div className="w-10 h-10 rounded-full bg-[#B8A77A] flex items-center justify-center">
              <span className="font-['Poppins',sans-serif] font-bold text-sm text-white">{initials}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {allShifts.length === 0 ? (
              <div className="shift-card bg-white border border-[#C3C8C2] rounded-[12px] p-8 flex flex-col items-center gap-2">
                <p className="font-['Poppins',sans-serif] font-semibold text-xl text-[#1A1C19]">No shifts yet</p>
                <p className="font-['Lato',sans-serif] text-base text-[#737874] text-center">
                  Completed shifts will appear here.
                </p>
              </div>
            ) : (
              allShifts.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  onPress={() => navigate(`/cleaner/history/${shift.id}`)}
                />
              ))
            )}
          </div>

        </div>
      </div>

      <BottomNav active="history" />
    </div>
  )
}
