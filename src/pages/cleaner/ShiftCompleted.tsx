import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { MOCK_JOBS } from '../../lib/mockJobs'
import { gsap, useGSAP } from '../../lib/gsap'

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
  const { setUser, markJobComplete, completedZones } = useApp()
  const calledRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const mockJob = MOCK_JOBS.find((j) => j.id === jobId)
  const zonesTotal = mockJob?.zones.length ?? 0
  const zonesDone = mockJob?.zones.filter((z) => completedZones.has(z.id)).length ?? zonesTotal

  useEffect(() => {
    if (calledRef.current || !mockJob) return
    calledRef.current = true

    const now = new Date()
    markJobComplete({
      id: jobId ?? '',
      siteName: mockJob.siteName,
      clientName: mockJob.clientName,
      timeStart: mockJob.timeStart,
      timeEnd: mockJob.timeEnd,
      zonesTotal,
      zonesDone,
      dayLabel: now.toLocaleDateString('en-GB', { weekday: 'long' }),
      date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Celebration entrance sequence
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

    tl.from('.sc-ring-outer', { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.4)' })
      .from('.sc-ring-inner', { scale: 0, opacity: 0, duration: 0.35, ease: 'back.out(1.2)' }, '-=0.2')
      .from('.sc-check',      { scale: 0, opacity: 0, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.15')
      .from('.sc-heading',    { opacity: 0, y: 20, duration: 0.4 }, '-=0.05')
      .from('.sc-site',       { opacity: 0, y: 12, duration: 0.35 }, '-=0.25')
      .from('.sc-timestamp',  { opacity: 0, duration: 0.3 }, '-=0.15')
      .from('.sc-card',       { opacity: 0, y: 14, duration: 0.4 }, '-=0.1')
      .from('.sc-btn',        { opacity: 0, y: 12, duration: 0.35, stagger: 0.08 }, '-=0.1')
  }, { scope: containerRef })

  const siteName = mockJob?.siteName ?? 'Site'
  const timeStart = mockJob?.timeStart ?? '—'
  const timeEnd = mockJob?.timeEnd ?? '—'
  const completedAt = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="min-h-screen w-full bg-[#111E17] flex items-center justify-center p-6">
      <div ref={containerRef} className="w-full max-w-[480px] flex flex-col items-center gap-8">

        {/* Animated checkmark rings */}
        <div className="sc-ring-outer w-[130px] h-[130px] rounded-full bg-white/10 flex items-center justify-center">
          <div className="sc-ring-inner w-[96px] h-[96px] rounded-full bg-white/[0.12] flex items-center justify-center">
            <div className="sc-check">
              <BigCheckIcon />
            </div>
          </div>
        </div>

        {/* Heading + subtitle */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="sc-heading font-['Poppins',sans-serif] font-bold text-[48px] leading-[1.1] tracking-[-1px] text-white">
            Shift Completed!
          </h1>
          <p className="sc-site font-['Lato',sans-serif] text-xl text-[#D7C596]">
            {siteName}
          </p>
        </div>

        {/* Timestamp */}
        <div className="sc-timestamp flex items-center gap-2">
          <ClockIcon />
          <span className="font-['Lato',sans-serif] text-sm text-[#D7C596]">
            {timeStart} – {timeEnd} · {completedAt}
          </span>
        </div>

        {/* Confirmation card */}
        <div className="sc-card w-full bg-white/[0.07] border border-white/10 rounded-[12px] p-6 text-center">
          <p className="font-['Lato',sans-serif] text-base text-white/75 leading-[1.7]">
            All zones have been verified and submitted successfully. Your supervisor has been notified. Great work today!
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            onClick={() => navigate('/cleaner/history')}
            className="sc-btn w-full h-[56px] rounded-[12px] border-2 border-[#D7C596] font-['Poppins',sans-serif] font-semibold text-base text-[#D7C596] cursor-pointer hover:bg-[#D7C596]/10 transition-colors"
          >
            View Shift History
          </button>
          <button
            onClick={() => { setUser(null); navigate('/login') }}
            className="sc-btn w-full h-[56px] rounded-[12px] font-['Poppins',sans-serif] font-semibold text-base text-white/50 cursor-pointer hover:text-white/80 transition-colors"
          >
            Log Out
          </button>
        </div>

      </div>
    </div>
  )
}
