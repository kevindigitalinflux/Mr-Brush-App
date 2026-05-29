import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'

function compressToDataUri(file: File, maxPx = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const ratio = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = blobUrl
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  jobZoneId: string
  zoneName: string
  cleanerFirstName: string
  onClose: () => void
  onRated: (jobZoneId: string) => void
}

interface ModalForm {
  stars: number
  notes: string
  photos: File[]
  previews: string[]
  lowRatingConfirmed: boolean
  submitting: boolean
  error: string | null
  success: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
const STAR_COLORS = ['', '#DC2626', '#EA580C', '#D97706', '#2F4A3D', '#2F4A3D']

// ─── Stars selector ───────────────────────────────────────────────────────────

function StarSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="flex gap-2" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onClick={() => onChange(n)}
          className="focus:outline-none transition-transform active:scale-90"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={n <= active ? '#B8A77A' : 'none'}
              stroke={n <= active ? '#B8A77A' : '#D0CFCA'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

/** Client portal — modal for rating a completed zone clean. */
export function RateCleanModal({ jobZoneId, zoneName, cleanerFirstName, onClose, onRated }: Props) {
  const { user } = useApp()
  const [form, setForm] = useState<ModalForm>({
    stars: 0, notes: '', photos: [], previews: [],
    lowRatingConfirmed: false, submitting: false, error: null, success: false,
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const isNegativeRating = form.stars > 0 && form.stars <= 3
  const isVeryLowRating = form.stars > 0 && form.stars <= 2

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - form.photos.length)
    const previews = files.map((f) => URL.createObjectURL(f))
    setForm((s) => ({
      ...s,
      photos: [...s.photos, ...files].slice(0, 3),
      previews: [...s.previews, ...previews].slice(0, 3),
    }))
    e.target.value = ''
  }

  function removePhoto(i: number) {
    setForm((s) => ({
      ...s,
      photos: s.photos.filter((_, idx) => idx !== i),
      previews: s.previews.filter((_, idx) => idx !== i),
    }))
  }

  async function handleSubmit() {
    if (!form.stars) { setForm((s) => ({ ...s, error: 'Please select a star rating.' })); return }
    if (!form.notes.trim()) { setForm((s) => ({ ...s, error: 'Please add a written review.' })); return }
    if (isNegativeRating && form.photos.length === 0) {
      setForm((s) => ({ ...s, error: 'Please upload at least one photo to support a rating of 3 stars or below.' }))
      return
    }
    if (isVeryLowRating && !form.lowRatingConfirmed) {
      setForm((s) => ({ ...s, error: 'Please confirm this rating is fair before submitting.' }))
      return
    }
    if (!user) return

    setForm((s) => ({ ...s, submitting: true, error: null }))
    try {
      const uploadedUrls = await Promise.all(form.photos.map((f) => compressToDataUri(f)))

      const { error: insertErr } = await supabase.from('cleaner_ratings').insert({
        job_zone_id: jobZoneId,
        rated_by: user.id,
        rated_by_role: 'client',
        rating: form.stars,
        review_text: form.notes.trim(),
        evidence_urls: uploadedUrls,
        company_id: user.company_id,
      })
      if (insertErr) throw insertErr

      setForm((s) => ({ ...s, submitting: false, success: true }))
      setTimeout(() => { onRated(jobZoneId); onClose() }, 1600)
    } catch {
      setForm((s) => ({ ...s, submitting: false, error: 'Could not submit rating. Try again.' }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-8 bg-black/40">
      <div className="w-full max-w-[480px] bg-[#F5F4EF] rounded-t-[20px] md:rounded-[16px] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-4 px-6 pt-6 pb-5 shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#D0CFCA]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="#3D3B3A" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <p className="font-['Lato'] text-[11px] text-[#B8A77A] font-bold tracking-[1.5px] uppercase">
              Rate this clean
            </p>
            <h2 className="font-['Poppins'] font-bold text-[20px] text-[#3D3B3A] leading-tight">
              {zoneName}
            </h2>
            <p className="font-['Lato'] text-[13px] text-[#434B4D]">Cleaned by {cleanerFirstName}</p>
          </div>
        </div>

        {/* Success */}
        {form.success ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4 py-12">
            <div className="w-16 h-16 rounded-full bg-[#EEF6F1] flex items-center justify-center text-[#2F4A3D]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-['Poppins'] font-semibold text-[16px] text-[#3D3B3A]">Rating Submitted</p>
              <p className="font-['Lato'] text-[13px] text-[#434B4D] mt-1">Your rating has been recorded.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-5">

            {/* Stars */}
            <div>
              <label className="block font-['Lato'] text-[12px] font-bold text-[#434B4D] uppercase tracking-[0.8px] mb-3">
                Your Rating
              </label>
              <StarSelector
                value={form.stars}
                onChange={(n) => setForm((s) => ({ ...s, stars: n, lowRatingConfirmed: false, error: null }))}
              />
              {form.stars > 0 && (
                <p className="font-['Lato'] text-[13px] mt-2 font-semibold" style={{ color: STAR_COLORS[form.stars] }}>
                  {STAR_LABELS[form.stars]}
                </p>
              )}
            </div>

            {/* Written review — always required */}
            <div>
              <label className="block font-['Lato'] text-[12px] font-bold text-[#434B4D] uppercase tracking-[0.8px] mb-2">
                Written Review <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                rows={4}
                placeholder={`Describe the quality of the clean for ${zoneName}…`}
                className="w-full rounded-[12px] border border-[#D0CFCA] bg-white px-4 py-3 font-['Lato'] text-[14px] text-[#3D3B3A] placeholder:text-[#D0CFCA] focus:outline-none focus:ring-2 focus:ring-[#B8A77A] resize-none"
              />
            </div>

            {/* Photo evidence */}
            <div>
              <label className="block font-['Lato'] text-[12px] font-bold text-[#434B4D] uppercase tracking-[0.8px] mb-2">
                Photo Evidence{' '}
                {isNegativeRating ? (
                  <span className="normal-case tracking-normal font-normal text-[#DC2626]">
                    (required for ratings ≤ 3★)
                  </span>
                ) : (
                  <span className="normal-case tracking-normal font-normal text-[#B8A77A]">(optional)</span>
                )}
              </label>

              {isNegativeRating && form.photos.length === 0 && (
                <p className="font-['Lato'] text-[12px] text-[#DC2626] mb-2">
                  Upload at least one photo showing the issue before submitting.
                </p>
              )}

              <div className="flex gap-2 flex-wrap">
                {form.previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-[8px] border border-[#D0CFCA]" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#3D3B3A] flex items-center justify-center"
                    >
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M1 1l8 8M9 1L1 9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
                {form.photos.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`w-20 h-20 rounded-[8px] border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                      isNegativeRating && form.photos.length === 0
                        ? 'border-[#DC2626] text-[#DC2626] bg-[#FEF2F2]'
                        : 'border-[#D0CFCA] text-[#B8A77A] hover:border-[#B8A77A]'
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="font-['Lato'] text-[9px] font-bold uppercase tracking-[0.5px]">Photo</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickPhoto} />
              </div>
            </div>

            {/* Very low rating guardrail (≤2 stars) */}
            {isVeryLowRating && (
              <div className="bg-[#FDF6E3] border border-[#B8A77A]/40 rounded-[10px] p-4">
                <p className="font-['Lato'] text-[13px] text-[#3D3B3A] leading-relaxed mb-3">
                  Ratings of 2 stars or below are automatically flagged and reviewed by management to ensure fair treatment. Please confirm this rating accurately reflects the quality of work.
                </p>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.lowRatingConfirmed}
                    onChange={(e) => setForm((s) => ({ ...s, lowRatingConfirmed: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-[#B8A77A]"
                  />
                  <span className="font-['Lato'] text-[13px] text-[#3D3B3A]">
                    I confirm this rating is fair and reflects the standard of cleaning delivered.
                  </span>
                </label>
              </div>
            )}

            {/* Error */}
            {form.error && (
              <p className="font-['Lato'] text-[13px] text-[#DC2626]">{form.error}</p>
            )}
          </div>

          {/* Sticky submit footer */}
          <div className="shrink-0 px-6 pt-3 pb-6 border-t border-[#E8E7E2]">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={form.submitting}
              className="w-full h-[56px] rounded-[12px] bg-[#3D3B3A] text-white font-['Poppins'] font-semibold text-[15px] disabled:opacity-50 transition-opacity"
            >
              {form.submitting ? 'Submitting…' : 'Submit Rating'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
