import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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

// ─── Mock zone lookup ─────────────────────────────────────────────────────────

const ZONE_NAMES: Record<string, string> = {
  z1: 'Main Lobby', z2: 'Executive Washrooms', z3: 'Conference Room A',
  z4: 'Open Plan Desks (N)', z5: 'Break Room / Kitchen', z6: 'Server Room',
  z7: 'Main Entrance', z8: 'Reception Area', z9: 'Lifts / Elevators',
  z10: 'Ground Floor WC', z11: 'Lobby Seating Area', z12: 'Security Desk Area',
}

// ─── Photo slot ───────────────────────────────────────────────────────────────

interface PhotoSlotProps {
  preview: string | null
  active: boolean
  onAdd: () => void
  onRemove: () => void
}

function PhotoSlot({ preview, active, onAdd, onRemove }: PhotoSlotProps) {
  if (preview) {
    return (
      <div className="relative aspect-square rounded-[12px] overflow-hidden">
        <img src={preview} alt="Zone photo" className="w-full h-full object-cover" />
        <button
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center cursor-pointer"
        >
          <XIcon />
        </button>
      </div>
    )
  }

  if (active) {
    return (
      <button
        onClick={onAdd}
        className="aspect-square rounded-[12px] border-2 border-dashed border-[#6B5D36] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-[#F1DEAD]/20 transition-colors"
      >
        <CameraIcon />
        <span className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#6B5D36]">
          Add photo
        </span>
      </button>
    )
  }

  return (
    <div className="aspect-square rounded-[12px] border-2 border-dashed border-[#C3C8C2] flex items-center justify-center opacity-50">
      <ImagePlaceholderIcon />
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const MAX_PHOTOS = 3

export function ZoneSubmission() {
  const { jobId, zoneId } = useParams<{ jobId: string; zoneId: string }>()
  const navigate = useNavigate()

  const [photos, setPhotos] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const zoneName = ZONE_NAMES[zoneId ?? ''] ?? 'Zone'
  const canSubmit = photos.length > 0

  function handleAddPhoto() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = MAX_PHOTOS - photos.length
    const toAdd = files.slice(0, remaining)
    toAdd.forEach((file) => {
      const url = URL.createObjectURL(file)
      setPhotos((prev) => [...prev, url])
    })
    e.target.value = ''
  }

  function handleRemovePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    // Simulate webhook POST — replace with real call once n8n webhook is ready
    await new Promise((r) => setTimeout(r, 900))
    navigate(`/cleaner/job/${jobId}/zone/${zoneId}/success`)
  }

  return (
    <div className="fixed inset-0 bg-[#FAFAF4] overflow-y-auto">
      <div className="w-full max-w-[576px] mx-auto pt-8 px-4 pb-36 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center relative">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="p-2 rounded-full hover:bg-[#E3E3DD] transition-colors cursor-pointer shrink-0"
          >
            <BackIcon />
          </button>
          <h2 className="absolute left-1/2 -translate-x-1/2 font-['Poppins',sans-serif] font-semibold text-2xl text-[#1A1C19] whitespace-nowrap">
            {zoneName}
          </h2>
        </div>

        {/* Instruction card */}
        <div className="bg-white border border-[#C3C8C2] rounded-[12px] shadow-sm p-[25px] flex gap-4 items-start">
          <div className="w-9 h-9 rounded-full bg-[#D0E8D7] flex items-center justify-center shrink-0">
            <InfoIcon />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-['Lato',sans-serif] font-bold text-base text-[#1A1C19] leading-[1.5]">
              Take a photo after cleaning this zone.
            </p>
            <p className="font-['Lato',sans-serif] text-base text-[#434844] leading-[1.5]">
              Minimum 1 photo required. Ensure the entire area is visible and well-lit.
            </p>
          </div>
        </div>

        {/* Photo upload grid */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
            <PhotoSlot
              key={i}
              preview={photos[i] ?? null}
              active={i === photos.length && photos.length < MAX_PHOTOS}
              onAdd={handleAddPhoto}
              onRemove={() => handleRemovePhoto(i)}
            />
          ))}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Optional note */}
        <div className="flex flex-col gap-2">
          <label htmlFor="zoneNote" className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] ml-1">
            Add a note (optional)
          </label>
          <textarea
            id="zoneNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Any notes about this zone..."
            className="w-full border border-[#C3C8C2] rounded-[6px] px-4 py-3 font-['Lato',sans-serif] text-base text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] resize-none transition-colors"
          />
        </div>

        {/* Can't submit photo link */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(`/cleaner/job/${jobId}/zone/${zoneId}/note`)}
            className="font-['Lato',sans-serif] font-bold text-[14px] tracking-[0.7px] text-[#434844] underline decoration-[#C3C8C2] cursor-pointer"
          >
            I can't submit a photo
          </button>
        </div>

      </div>

      {/* Fixed bottom submit bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[576px] mx-auto bg-gradient-to-t from-[#FAFAF4] via-[#FAFAF4] to-transparent pt-4 pb-8 px-4 z-50">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={[
            'w-full py-4 rounded-[12px] font-["Poppins",sans-serif] font-semibold text-base text-[#F8F8F2] flex items-center justify-center gap-2 shadow-lg transition-colors',
            canSubmit && !submitting
              ? 'bg-[#B8A77A] cursor-pointer hover:bg-[#a8976a]'
              : 'bg-[#B8A77A] opacity-50 cursor-not-allowed',
          ].join(' ')}
        >
          {submitting ? 'Submitting…' : 'Submit Zone'}
          {!submitting && <SendIcon />}
        </button>
      </div>
    </div>
  )
}
