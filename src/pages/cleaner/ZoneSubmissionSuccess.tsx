import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const ZONE_NAMES: Record<string, string> = {
  z1: 'Main Lobby', z2: 'Executive Washrooms', z3: 'Conference Room A',
  z4: 'Open Plan Desks (N)', z5: 'Break Room / Kitchen', z6: 'Server Room',
  z7: 'Main Entrance', z8: 'Reception Area', z9: 'Lifts / Elevators',
  z10: 'Ground Floor WC', z11: 'Lobby Seating Area', z12: 'Security Desk Area',
}

const AUTO_REDIRECT_MS = 3000

function CheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#2F4A3D" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="#2F4A3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VerifiedIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ZoneSubmissionSuccess() {
  const { jobId, zoneId } = useParams<{ jobId: string; zoneId: string }>()
  const navigate = useNavigate()
  const zoneName = ZONE_NAMES[zoneId ?? ''] ?? 'Zone'

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / AUTO_REDIRECT_MS) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(interval)
        navigate(`/cleaner/job/${jobId}`)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [jobId, navigate])

  function handleContinueNow() {
    navigate(`/cleaner/job/${jobId}`)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-5 z-50">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-[#1B1C19]/20 backdrop-blur-sm" />

      {/* Success modal */}
      <div className="relative z-10 bg-white border-2 border-[#30312E] rounded-[12px] w-full max-w-[448px] shadow-2xl overflow-hidden flex flex-col items-center pt-8 pb-8 px-8 gap-6">

        {/* Check icon */}
        <div className="w-24 h-24 rounded-full bg-[#CBEAD8] flex items-center justify-center">
          <CheckIcon />
        </div>

        {/* Zone name + status */}
        <div className="flex flex-col items-center gap-1">
          <h2 className="font-['Poppins',sans-serif] font-bold text-[32px] tracking-[-0.8px] text-[#496456] text-center leading-10">
            {zoneName}<br />Completed
          </h2>
          <p className="font-['Lato',sans-serif] text-lg text-[#605E5D] text-center">
            Submitted successfully
          </p>
        </div>

        {/* Photo preview placeholder */}
        <div className="w-full border border-[#CDC6B7] rounded-[8px] h-48 overflow-hidden relative bg-[#F4F4EE] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-2 left-2 z-10">
            <div className="bg-[#2F4A3D] flex items-center gap-1 px-2 py-1 rounded-full">
              <VerifiedIcon />
              <span className="font-['Lato',sans-serif] font-bold text-xs text-white">
                Verified Clean
              </span>
            </div>
          </div>
          {/* Placeholder — replace with actual submitted photo when wiring real data */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="opacity-20">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="#3D3B3A" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" stroke="#3D3B3A" strokeWidth="1.5" />
            <path d="m21 15-5-5L5 21" stroke="#3D3B3A" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Auto-redirect progress bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full h-1 bg-[#E3E3DE] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B8A77A] rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-['Lato',sans-serif] font-bold text-[12px] text-[#7C766A] text-center">
            Redirecting to next task…
          </p>
        </div>

        {/* Continue Now button */}
        <button
          onClick={handleContinueNow}
          className="w-full h-14 bg-[#B8A77A] rounded-[4px] font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#F8F8F2] text-center cursor-pointer hover:bg-[#a8976a] transition-colors"
        >
          Continue Now
        </button>

      </div>
    </div>
  )
}
