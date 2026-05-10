import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const MOCK_JOBS: Record<string, { siteName: string; timeStart: string; timeEnd: string }> = {
  'job-001': { siteName: 'TechCorp HQ — Floor 3', timeStart: '08:00 AM', timeEnd: '11:30 AM' },
  'job-002': { siteName: 'Midtown Financial — Lobby', timeStart: '01:00 PM', timeEnd: '03:00 PM' },
}

function BigCheckIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#D7C596" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="#D7C596" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Shown when a cleaner marks an entire shift as complete. Dark green celebration screen. */
export function ShiftCompleted() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { setUser } = useApp()

  const job = MOCK_JOBS[jobId ?? ''] ?? { siteName: 'Site', timeStart: '—', timeEnd: '—' }

  const now = new Date()
  const completedAt = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  function handleViewHistory() {
    navigate('/cleaner/history')
  }

  function handleLogOut() {
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="min-h-screen w-full bg-[#111E17] flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] flex flex-col items-center gap-8">

        {/* Checkmark circle */}
        <div className="w-[130px] h-[130px] rounded-full bg-white/10 flex items-center justify-center">
          <div className="w-[96px] h-[96px] rounded-full bg-white/[0.12] flex items-center justify-center">
            <BigCheckIcon />
          </div>
        </div>

        {/* Heading + subtitle */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-['Poppins',sans-serif] font-bold text-[48px] leading-[1.1] tracking-[-1px] text-white">
            Shift Completed!
          </h1>
          <p className="font-['Lato',sans-serif] text-xl text-[#D7C596]">
            {job.siteName}
          </p>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2">
          <ClockIcon />
          <span className="font-['Lato',sans-serif] text-sm text-[#D7C596]">
            {job.timeStart} – {job.timeEnd} · {completedAt}
          </span>
        </div>

        {/* Confirmation card */}
        <div className="w-full bg-white/[0.07] border border-white/10 rounded-[12px] p-6 text-center">
          <p className="font-['Lato',sans-serif] text-base text-white/75 leading-[1.7]">
            All zones have been verified and submitted successfully. Your supervisor has been notified. Great work today!
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            onClick={handleViewHistory}
            className="w-full h-[56px] rounded-[12px] border-2 border-[#D7C596] font-['Poppins',sans-serif] font-semibold text-base text-[#D7C596] cursor-pointer hover:bg-[#D7C596]/10 transition-colors"
          >
            View Shift History
          </button>
          <button
            onClick={handleLogOut}
            className="w-full h-[56px] rounded-[12px] font-['Poppins',sans-serif] font-semibold text-base text-white/50 cursor-pointer hover:text-white/80 transition-colors"
          >
            Log Out
          </button>
        </div>

      </div>
    </div>
  )
}
