import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { gsap, useGSAP } from '../../lib/gsap'
import { DesktopSidebar } from '../../components/DesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="28" height="24" viewBox="0 0 24 20" fill="none" aria-hidden="true">
      <path d="M23 17a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#6B5D36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="3" stroke="#6B5D36" strokeWidth="1.5" />
    </svg>
  )
}

function ImagePlaceholderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#C3C8C2" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="#C3C8C2" strokeWidth="1.5" />
      <path d="m21 15-5-5L5 21" stroke="#C3C8C2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#F8F8F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#2F4A3D" strokeWidth="1.5" />
      <path d="M12 8v4M12 16h.01" stroke="#2F4A3D" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── Zone name lookup ─────────────────────────────────────────────────────────

const ZONE_NAMES: Record<string, string> = {
  z1: 'Main Lobby', z2: 'Executive Washrooms', z3: 'Conference Room A',
  z4: 'Open Plan Desks (N)', z5: 'Break Room / Kitchen', z6: 'Server Room',
  z7: 'Main Entrance', z8: 'Reception Area', z9: 'Lifts / Elevators',
  z10: 'Ground Floor WC', z11: 'Lobby Seating Area', z12: 'Security Desk Area',
}

const MAX_PHOTOS = 3

// ─── Shared state hook ────────────────────────────────────────────────────────

function useZoneSubmissionState() {
  const { jobId, zoneId } = useParams<{ jobId: string; zoneId: string }>()
  const navigate = useNavigate()
  const { markZoneComplete } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const zoneName = ZONE_NAMES[zoneId ?? ''] ?? 'Zone'
  const canSubmit = photos.length > 0

  function handleAddPhoto() { fileInputRef.current?.click() }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.slice(0, MAX_PHOTOS - photos.length).forEach((file) => {
      setPhotos((prev) => [...prev, URL.createObjectURL(file)])
    })
    e.target.value = ''
  }

  function handleRemovePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    markZoneComplete(zoneId!)
    navigate(`/cleaner/job/${jobId}/zone/${zoneId}/success`)
  }

  return { jobId, zoneId, navigate, photos, setPhotos, note, setNote, submitting, fileInputRef, zoneName, canSubmit, handleAddPhoto, handleFileChange, handleRemovePhoto, handleSubmit }
}

// ─── Photo slot ───────────────────────────────────────────────────────────────

interface PhotoSlotProps {
  index: number; preview: string | null; active: boolean
  onAdd: () => void; onRemove: () => void
}

function PhotoSlot({ index, preview, active, onAdd, onRemove }: PhotoSlotProps) {
  const t = useTranslation()
  if (preview) {
    return (
      <div data-slot={index} className="relative aspect-square rounded-[12px] overflow-hidden">
        <img src={preview} alt="Zone photo" className="w-full h-full object-cover" />
        <button onClick={onRemove} aria-label="Remove photo"
          className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center cursor-pointer">
          <XIcon />
        </button>
      </div>
    )
  }
  if (active) {
    return (
      <button data-slot={index} onClick={onAdd}
        className="aspect-square rounded-[12px] border-2 border-dashed border-[#6B5D36] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#F1DEAD]/20 transition-colors">
        <CameraIcon />
        <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#6B5D36]">{t('add_photo')}</span>
      </button>
    )
  }
  return (
    <div data-slot={index} className="aspect-square rounded-[12px] border-2 border-dashed border-[#C3C8C2] flex items-center justify-center opacity-50">
      <ImagePlaceholderIcon />
    </div>
  )
}

// ─── Desktop layout ───────────────────────────────────────────────────────────

function DesktopZoneSubmission() {
  const state = useZoneSubmissionState()
  const { jobId, zoneId, navigate, photos, setPhotos, note, setNote, submitting, fileInputRef, zoneName, canSubmit, handleAddPhoto, handleFileChange, handleRemovePhoto, handleSubmit } = state
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const prevPhotoCount = useRef(0)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.dzs-header', { opacity: 0, y: 12, duration: 0.4 })
      .from('.dzs-info',   { opacity: 0, y: 14, duration: 0.4 }, '-=0.2')
      .from('.dzs-grid',   { opacity: 0, y: 12, duration: 0.35 }, '-=0.2')
      .from('.dzs-note',   { opacity: 0, y: 10, duration: 0.35 }, '-=0.15')
      .from('.dzs-footer', { opacity: 0, y: 16, duration: 0.4 }, '-=0.1')
  }, { scope: containerRef })

  useEffect(() => {
    const newCount = photos.length
    if (newCount > prevPhotoCount.current) {
      const newSlot = containerRef.current?.querySelector(`[data-slot="${newCount - 1}"]`)
      if (newSlot) gsap.fromTo(newSlot, { scale: 0.75, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' })
    }
    prevPhotoCount.current = newCount
  }, [photos])

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF4]">
      <DesktopSidebar active="jobs" />
      <main className="flex-1 overflow-y-auto ml-60">
        <div ref={containerRef} className="max-w-2xl mx-auto px-8 py-8 pb-24 flex flex-col gap-8">

          {/* Header */}
          <div className="dzs-header flex items-center gap-4">
            <button onClick={() => navigate(-1)} aria-label="Go back"
              className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer shrink-0">
              <BackIcon />
            </button>
            <h1 className="font-['Poppins',sans-serif] font-semibold text-[32px] tracking-[-0.3px] text-[#1A1C19]">
              {zoneName}
            </h1>
          </div>

          {/* Instruction card */}
          <div className="dzs-info bg-white border border-[#C3C8C2] rounded-[12px] shadow-sm p-[25px] flex gap-4 items-start">
            <div className="w-9 h-9 rounded-full bg-[#D0E8D7] flex items-center justify-center shrink-0">
              <InfoIcon />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-['Lato',sans-serif] font-bold text-base text-[#1A1C19] leading-[1.5]">
                {t('take_photo_instruction')}
              </p>
              <p className="font-['Lato',sans-serif] text-base text-[#434844] leading-[1.5]">
                {t('photo_requirements')}
              </p>
            </div>
          </div>

          {/* Photo grid */}
          <div className="dzs-grid grid grid-cols-3 gap-5">
            {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
              <PhotoSlot key={i} index={i}
                preview={photos[i] ?? null}
                active={i === photos.length && photos.length < MAX_PHOTOS}
                onAdd={handleAddPhoto}
                onRemove={() => handleRemovePhoto(i)}
              />
            ))}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
            multiple className="hidden" onChange={handleFileChange} />

          {/* Note */}
          <div className="dzs-note flex flex-col gap-2">
            <label htmlFor="dZoneNote" className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] ml-1">
              {t('add_note')}
            </label>
            <textarea id="dZoneNote" value={note} onChange={(e) => setNote(e.target.value)}
              rows={3} placeholder={t('note_placeholder')}
              className="w-full border border-[#C3C8C2] rounded-[6px] px-4 py-3 font-['Lato',sans-serif] text-base text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] resize-none transition-colors"
            />
          </div>

          {/* Footer actions */}
          <div className="dzs-footer flex items-center justify-between gap-4">
            <button onClick={() => navigate(`/cleaner/job/${jobId}/zone/${zoneId}/note`)}
              className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] underline decoration-[#C3C8C2] cursor-pointer">
              {t('cant_submit_photo')}
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit || submitting}
              className={[
                'h-[56px] px-8 rounded-[12px] font-["Poppins",sans-serif] font-semibold text-base text-[#F8F8F2] flex items-center gap-2 shadow-lg transition-colors',
                canSubmit && !submitting ? 'bg-[#B8A77A] cursor-pointer hover:bg-[#a8976a]' : 'bg-[#B8A77A] opacity-50 cursor-not-allowed',
              ].join(' ')}>
              {submitting ? t('submitting') : t('submit_zone')}
              {!submitting && <SendIcon />}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

// ─── Mobile layout ────────────────────────────────────────────────────────────

function MobileZoneSubmission() {
  const { jobId, zoneId, navigate, photos, setPhotos, note, setNote, submitting, fileInputRef, zoneName, canSubmit, handleAddPhoto, handleFileChange, handleRemovePhoto, handleSubmit } = useZoneSubmissionState()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const prevPhotoCount = useRef(0)

  useGSAP(() => {
    gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from('.zs-header',  { opacity: 0, y: 12, duration: 0.4 })
      .from('.zs-info',    { opacity: 0, y: 14, duration: 0.4 }, '-=0.2')
      .from('.zs-grid',    { opacity: 0, y: 12, duration: 0.35 }, '-=0.2')
      .from('.zs-note',    { opacity: 0, y: 10, duration: 0.35 }, '-=0.15')
      .from('.zs-nophoto', { opacity: 0, duration: 0.3 }, '-=0.1')
      .from('.zs-submit',  { opacity: 0, y: 20, duration: 0.4 }, '-=0.1')
  }, { scope: containerRef })

  useEffect(() => {
    const newCount = photos.length
    if (newCount > prevPhotoCount.current) {
      const newSlot = containerRef.current?.querySelector(`[data-slot="${newCount - 1}"]`)
      if (newSlot) gsap.fromTo(newSlot, { scale: 0.75, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.5)' })
    }
    prevPhotoCount.current = newCount
  }, [photos])

  return (
    <div className="fixed inset-0 bg-[#FAFAF4] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[576px] mx-auto pt-8 px-4 pb-36 flex flex-col gap-8">

        <div className="zs-header flex items-center relative">
          <button onClick={() => navigate(-1)} aria-label="Go back"
            className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer shrink-0">
            <BackIcon />
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] whitespace-nowrap">
            {zoneName}
          </h2>
        </div>

        <div className="zs-info bg-white border border-[#C3C8C2] rounded-[12px] shadow-sm p-[25px] flex gap-4 items-start">
          <div className="w-9 h-9 rounded-full bg-[#D0E8D7] flex items-center justify-center shrink-0">
            <InfoIcon />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-['Lato',sans-serif] font-bold text-base text-[#1A1C19] leading-[1.5]">
              {t('take_photo_instruction')}
            </p>
            <p className="font-['Lato',sans-serif] text-base text-[#434844] leading-[1.5]">
              {t('photo_requirements')}
            </p>
          </div>
        </div>

        <div className="zs-grid grid grid-cols-3 gap-4">
          {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
            <PhotoSlot key={i} index={i}
              preview={photos[i] ?? null}
              active={i === photos.length && photos.length < MAX_PHOTOS}
              onAdd={handleAddPhoto}
              onRemove={() => handleRemovePhoto(i)}
            />
          ))}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
          multiple className="hidden" onChange={handleFileChange} />

        <div className="zs-note flex flex-col gap-2">
          <label htmlFor="zoneNote" className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] ml-1">
            {t('add_note')}
          </label>
          <textarea id="zoneNote" value={note} onChange={(e) => setNote(e.target.value)}
            rows={3} placeholder={t('note_placeholder')}
            className="w-full border border-[#C3C8C2] rounded-[6px] px-4 py-3 font-['Lato',sans-serif] text-base text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] resize-none transition-colors"
          />
        </div>

        <div className="zs-nophoto flex justify-center">
          <button onClick={() => navigate(`/cleaner/job/${jobId}/zone/${zoneId}/note`)}
            className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] underline decoration-[#C3C8C2] cursor-pointer">
            {t('cant_submit_photo')}
          </button>
        </div>

      </div>

      <div className="zs-submit fixed bottom-0 left-0 right-0 max-w-[576px] mx-auto bg-gradient-to-t from-[#FAFAF4] via-[#FAFAF4] to-transparent pt-4 pb-8 px-4 z-50">
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className={[
            'w-full py-4 rounded-[12px] font-["Poppins",sans-serif] font-semibold text-base text-[#F8F8F2] flex items-center justify-center gap-2 shadow-lg transition-colors',
            canSubmit && !submitting ? 'bg-[#B8A77A] cursor-pointer hover:bg-[#a8976a]' : 'bg-[#B8A77A] opacity-50 cursor-not-allowed',
          ].join(' ')}>
          {submitting ? t('submitting') : t('submit_zone')}
          {!submitting && <SendIcon />}
        </button>
      </div>
    </div>
  )
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/** Photo upload and submission screen for a single zone. */
export function ZoneSubmission() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopZoneSubmission /> : <MobileZoneSubmission />
}
