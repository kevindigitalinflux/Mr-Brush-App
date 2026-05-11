import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { gsap, useGSAP } from '../../lib/gsap'

const ZONE_NAMES: Record<string, string> = {
  z1: 'Main Lobby', z2: 'Executive Washrooms', z3: 'Conference Room A',
  z4: 'Open Plan Desks (N)', z5: 'Break Room / Kitchen', z6: 'Server Room',
  z7: 'Main Entrance', z8: 'Reception Area', z9: 'Lifts / Elevators',
  z10: 'Ground Floor WC', z11: 'Lobby Seating Area', z12: 'Security Desk Area',
}

const MIN_CHARS = 20

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#6F613A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4M12 17h.01" stroke="#6F613A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function InfoHintIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#434844" strokeWidth="1.5" />
      <path d="M12 8v4M12 16h.01" stroke="#434844" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#F8F8F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function NoPhotoNote() {
  const { jobId, zoneId } = useParams<{ jobId: string; zoneId: string }>()
  const navigate = useNavigate()
  const { markZoneComplete } = useApp()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.npn-header',  { opacity: 0, y: -8, duration: 0.35 })
      .from('.npn-warning', { opacity: 0, y: 14, duration: 0.4 }, '-=0.15')
      .from('.npn-image',   { opacity: 0, y: 12, duration: 0.35 }, '-=0.2')
      .from('.npn-form',    { opacity: 0, y: 12, duration: 0.35 }, '-=0.2')
      .from('.npn-submit',  { opacity: 0, y: 16, duration: 0.4 }, '-=0.15')
  }, { scope: containerRef })

  const zoneName = ZONE_NAMES[zoneId ?? ''] ?? 'Zone'
  const charCount = reason.trim().length
  const isValid = charCount >= MIN_CHARS

  async function handleSubmit() {
    if (!isValid) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    markZoneComplete(zoneId!)
    navigate(`/cleaner/job/${jobId}/zone/${zoneId}/success`)
  }

  return (
    <div className="fixed inset-0 bg-[#FAFAF4] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[672px] mx-auto flex flex-col">

        {/* Header */}
        <div className="npn-header sticky top-0 bg-[#FAFAF4] z-10 flex items-center h-16 px-8">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer mr-4 shrink-0"
          >
            <BackIcon />
          </button>
          <h1 className="font-['Poppins',sans-serif] font-semibold text-2xl tracking-[-0.6px] text-[#1A1C19] whitespace-nowrap">
            {zoneName} — No Photo
          </h1>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 px-8 py-4">

          {/* Warning banner */}
          <div className="npn-warning bg-[#F1DEAD] border border-[#D7C596]/30 rounded-[8px] shadow-sm p-[17px] flex items-start gap-2">
            <div className="shrink-0 mt-0.5">
              <WarningIcon />
            </div>
            <p className="font-['Lato',sans-serif] text-base text-[#6F613A] leading-[1.6]">
              Missing photos can affect quality assurance records. Please provide a detailed reason below to proceed with the report.
            </p>
          </div>

          {/* Zone image placeholder */}
          <div className="npn-image bg-[#F4F4EE] border border-[#C3C8C2] rounded-[12px] overflow-hidden shadow-sm relative h-[181px] flex items-end">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="relative z-10 flex items-center gap-2 p-4">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" stroke="white" strokeWidth="1.5" />
                <path d="m21 15-5-5L5 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-white">
                Visual documentation required
              </span>
            </div>
          </div>

          {/* Reason textarea */}
          <div className="npn-form flex flex-col gap-2 pt-4">
            <label
              htmlFor="noPhotoReason"
              className="font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19]"
            >
              Reason for no photo
            </label>
            <textarea
              id="noPhotoReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              placeholder="Explain why you were unable to submit a photo..."
              className="w-full border border-[#737874] rounded-[6px] px-4 py-4 font-['Lato',sans-serif] text-base text-[#434844] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] shadow-sm resize-none transition-colors"
            />
            <div className="flex items-center justify-between pl-1 pt-1">
              <div className="flex items-center gap-1 opacity-80">
                <InfoHintIcon />
                <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844]">
                  Minimum {MIN_CHARS} characters
                </span>
              </div>
              <span className={[
                'font-["Lato",sans-serif] text-[14px] font-bold',
                isValid ? 'text-[#2F4A3D]' : 'text-[#9E9E9E]',
              ].join(' ')}>
                {charCount}/{MIN_CHARS}
              </span>
            </div>
          </div>

          {/* Submit button */}
          <div className="npn-submit pb-12 pt-4">
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className={[
                'w-full py-4 rounded-[12px] font-["Poppins",sans-serif] font-semibold text-base text-[#F8F8F2] flex items-center justify-center gap-2 shadow-sm transition-colors',
                isValid && !submitting
                  ? 'bg-[#B8A77A] cursor-pointer hover:bg-[#a8976a]'
                  : 'bg-[#B8A77A] opacity-50 cursor-not-allowed',
              ].join(' ')}
            >
              {submitting ? 'Submitting…' : 'Submit Without Photo'}
              {!submitting && <SendIcon />}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
