import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { BottomNav } from '../../components/BottomNav'

// ─── Mock data — replace with Supabase query once DB is ready ───────────────

type JobStatus = 'not_started' | 'in_progress' | 'completed'

interface MockJob {
  id: string
  siteName: string
  clientName: string
  status: JobStatus
  timeStart: string
  timeEnd: string
  zonesTotal: number
  zonesDone: number
}

const MOCK_JOBS: MockJob[] = [
  {
    id: 'job-001',
    siteName: 'TechCorp HQ - Floor 3',
    clientName: 'TechCorp Industries',
    status: 'in_progress',
    timeStart: '08:00 AM',
    timeEnd: '11:30 AM',
    zonesTotal: 6,
    zonesDone: 3,
  },
  {
    id: 'job-002',
    siteName: 'Midtown Financial - Lobby',
    clientName: 'Stirling & Co.',
    status: 'not_started',
    timeStart: '01:00 PM',
    timeEnd: '03:00 PM',
    zonesTotal: 6,
    zonesDone: 0,
  },
]

// ─── Icons (inline SVG — no expiring Figma URLs) ────────────────────────────

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#434844" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="#434844" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const STATUS_STYLES: Record<JobStatus, { bg: string; text: string; label: string }> = {
  in_progress: { bg: 'bg-[#F1DEAD]', text: 'text-[#6F613A]', label: 'IN PROGRESS' },
  not_started: { bg: 'bg-[#E3E3DD]', text: 'text-[#434844]', label: 'NOT STARTED' },
  completed:   { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]', label: 'COMPLETED' },
}

const STAT_RING: Record<string, string> = {
  black:  'border-black',
  yellow: 'border-[#F1DEAD]',
  gray:   'border-[#C3C8C2]',
}

function StatBubble({ value, label, ring }: { value: string; label: string; ring: keyof typeof STAT_RING }) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full border-2 ${STAT_RING[ring]} flex items-center justify-center mb-1`}>
        <span className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black leading-none">{value}</span>
      </div>
      <span className="font-['Lato',sans-serif] text-[10px] tracking-[0.5px] uppercase text-[#6B5D36]">{label}</span>
    </div>
  )
}

function JobCard({ job, onPress }: { job: MockJob; onPress: () => void }) {
  const s = STATUS_STYLES[job.status]
  return (
    <button
      onClick={onPress}
      className="w-full bg-white border border-[#C3C8C2] rounded-[12px] p-[21px] flex flex-col gap-4 text-left cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] leading-tight">
            {job.siteName}
          </h3>
          <span className="font-['Lato',sans-serif] text-base text-[#6B5D36]">{job.clientName}</span>
        </div>
        <span className={`shrink-0 ${s.bg} ${s.text} font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.35px] uppercase px-4 py-1 rounded-full`}>
          {s.label}
        </span>
      </div>

      {/* Bottom row */}
      <div className="border-t border-[#E3E3DD] pt-[9px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon />
          <span className="font-['Lato',sans-serif] text-sm text-[#434844]">
            {job.timeStart} – {job.timeEnd}
          </span>
        </div>
        <span className="font-['Lato',sans-serif] font-bold text-sm tracking-[0.7px] text-[#434844] bg-[#F4F4EE] border border-[#C3C8C2] rounded-full px-[13px] py-[7px]">
          {job.zonesDone}/{job.zonesTotal} Zones
        </span>
      </div>
    </button>
  )
}

function AllDoneState() {
  return (
    <div className="border-t border-dashed border-[#C3C8C2] pt-16 pb-8 px-8">
      <div className="bg-white border border-[#C3C8C2] rounded-[12px] flex flex-col items-center p-[33px]">
        <div className="w-32 h-32 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] shadow-sm flex items-center justify-center mb-4">
          <CheckCircleIcon />
        </div>
        <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] text-center mb-2">
          All Jobs Completed
        </h3>
        <p className="font-['Lato',sans-serif] text-base text-[#6B5D36] text-center leading-[1.6]">
          You've successfully finished all your scheduled tasks for today. Great work maintaining the standard!
        </p>
      </div>
    </div>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function Home() {
  const { user } = useApp()
  const navigate = useNavigate()

  const jobs = MOCK_JOBS
  const totalJobs = jobs.length
  const totalZones = jobs.reduce((s, j) => s + j.zonesTotal, 0)
  const doneZones = jobs.reduce((s, j) => s + j.zonesDone, 0)
  const allDone = jobs.every((j) => j.status === 'completed')

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const zonesRing = doneZones === totalZones ? 'black' : doneZones > 0 ? 'yellow' : 'gray'

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto pb-[100px]">

        {/* Top section */}
        <div className="flex flex-col gap-4 pt-8">

          {/* Welcome header */}
          <div className="w-full px-6 flex items-start justify-between">
            <div>
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.32px] text-[#1A1C19] leading-[38px]">
                {greeting},<br />{user?.name ?? 'Cleaner'}
              </h2>
              <span className="font-['Lato',sans-serif] text-base text-[#6B5D36]">{today}</span>
            </div>
            {/* Profile/settings button placeholder */}
            <button className="w-10 h-10 rounded-full bg-white border border-[#C3C8C2] shadow-sm flex items-center justify-center mt-1 cursor-pointer" aria-label="Profile">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#434844" strokeWidth="2" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#434844" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Stats bar */}
          <div className="w-full px-6">
            <div className="bg-white border border-[#C3C8C2] rounded-[12px] px-[17px] py-[17px] flex items-center justify-between">
              <StatBubble value={String(totalJobs)} label="Total Jobs" ring="black" />
              <div className="w-px h-8 bg-[#E3E3DD]" />
              <StatBubble value={`${doneZones}/${totalZones}`} label="Zones Done" ring={zonesRing} />
              <div className="w-px h-8 bg-[#E3E3DD]" />
              <StatBubble value={allDone ? '0h' : '4.5h'} label="Remaining" ring="gray" />
            </div>
          </div>

          {/* Jobs list heading */}
          <div className="w-full px-6 pt-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19]">
              Your Jobs Today
            </h3>
          </div>

          {/* Jobs or empty state */}
          {allDone ? (
            <div className="w-full px-6">
              <AllDoneState />
            </div>
          ) : (
            <div className="w-full px-6 flex flex-col gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => navigate(`/cleaner/job/${job.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="jobs" />
    </div>
  )
}
