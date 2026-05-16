import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { StarDisplay } from '../../components/supervisor/StarDisplay'
import { ImageViewer } from '../../components/ImageViewer'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CleanerDetail {
  id: string
  display_id: string
  full_name: string
  avg_rating: number | null
  total_ratings: number
}

interface CleanerRating {
  id: string
  cleaner_id: string
  rated_by_id: string
  rated_by_name: string
  rated_by_role: 'supervisor' | 'client'
  rating: number
  notes: string
  evidence_urls: string[]
  created_at: string
}

// ─── Star picker ──────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8A77A] rounded"
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <svg width={36} height={36} viewBox="0 0 24 24" aria-hidden="true">
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={star <= (hovered || value) ? '#B8A77A' : 'none'}
              stroke="#B8A77A"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}

// ─── Rating card ──────────────────────────────────────────────────────────────

function RatingCard({ rating }: { rating: CleanerRating }) {
  const t = useTranslation()
  const [lightbox, setLightbox] = useState<string | null>(null)
  const dateStr = new Date(rating.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const roleBadge = rating.rated_by_role === 'supervisor' ? t('sv_by_supervisor_badge') : t('sv_by_client_badge')
  const badgeClass = rating.rated_by_role === 'supervisor' ? 'bg-[#E3E3DD] text-[#434844]' : 'bg-[#FFF3D1] text-[#6F613A]'

  return (
    <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#1A1C19]">{rating.rated_by_name}</p>
          <p className="font-['Lato',sans-serif] text-[12px] text-[#737874]">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.5px] px-2 py-0.5 rounded-full ${badgeClass}`}>
            {roleBadge}
          </span>
          <StarDisplay value={rating.rating} size="sm" />
        </div>
      </div>
      {rating.notes && (
        <p className="font-['Lato',sans-serif] text-[13px] text-[#434844] leading-relaxed">{rating.notes}</p>
      )}
      {rating.evidence_urls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {rating.evidence_urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightbox(url)}
              className="shrink-0 w-[80px] h-[60px] rounded-[8px] overflow-hidden bg-[#E3E3DD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8A77A]"
            >
              <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {lightbox && <ImageViewer src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ─── Rating form ──────────────────────────────────────────────────────────────

interface RatingFormProps {
  cleanerId: string
  supervisorId: string
  supervisorName: string
  onSubmitted: () => void
}

function RatingForm({ cleanerId, supervisorId, supervisorName, onSubmitted }: RatingFormProps) {
  const t = useTranslation()
  const [star, setStar] = useState(0)
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...picked])
    setPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))])
  }

  async function handleSubmit() {
    if (!star) return setError(t('sv_rating_error_star'))
    if (!notes.trim()) return setError(t('sv_rating_error_notes'))
    if (files.length === 0) return setError(t('sv_rating_error_photo'))
    setError(null)
    setSubmitting(true)

    const uploadedUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const path = `ratings/${cleanerId}/${Date.now()}_${i}`
      await supabase.storage.from('evidence').upload(path, files[i])
      const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(path)
      uploadedUrls.push(urlData.publicUrl || previews[i])
    }

    await supabase.from('cleaner_ratings').insert({
      cleaner_id:    cleanerId,
      rated_by_id:   supervisorId,
      rated_by_name: supervisorName,
      rated_by_role: 'supervisor',
      rating:        star,
      notes:         notes.trim(),
      evidence_urls: uploadedUrls,
      created_at:    new Date().toISOString(),
    })

    setSubmitting(false)
    onSubmitted()
  }

  return (
    <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-5 flex flex-col gap-4">
      <h2 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19]">
        {t('sv_rate_this_cleaner')}
      </h2>
      <StarPicker value={star} onChange={setStar} />
      <div>
        <p className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase mb-1">
          {t('sv_rating_notes_label')}
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('sv_rating_notes_placeholder')}
          rows={3}
          className="w-full border border-[#C3C8C2] rounded-[8px] px-4 py-3 font-['Lato',sans-serif] text-sm text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors resize-none"
        />
      </div>
      <div>
        <p className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase mb-1">
          {t('sv_evidence_photos_label')}
        </p>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874] mb-2">{t('sv_evidence_hint')}</p>
        {previews.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mb-2">
            {previews.map((url, i) => (
              <div key={i} className="shrink-0 w-[80px] h-[60px] rounded-[8px] overflow-hidden bg-[#E3E3DD]">
                <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="h-10 px-4 border-2 border-[#C3C8C2] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-[#434844] hover:border-[#B8A77A] hover:text-[#B8A77A] transition-colors"
        >
          {t('sv_add_photos')}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>
      {error && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-[52px] bg-[#1A1C19] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e3130] transition-colors"
      >
        {submitting ? t('submitting') : t('sv_submit_rating')}
      </button>
    </div>
  )
}

// ─── Cleaner profile page ─────────────────────────────────────────────────────

/** Shows a cleaner's profile, their average rating, and a form to submit a new rating. */
export function CleanerProfile() {
  const { cleanerId } = useParams<{ cleanerId: string }>()
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [cleaner, setCleaner] = useState<CleanerDetail | null>(null)
  const [ratings, setRatings] = useState<CleanerRating[]>([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const load = useCallback(async () => {
    if (!user || !cleanerId) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_id, full_name, role')
      .eq('id', cleanerId)
      .single()

    const { data: ratingRows } = await supabase
      .from('cleaner_ratings')
      .select('*')
      .order('created_at', { ascending: false })

    const cleanerRatings = ((ratingRows as CleanerRating[]) ?? []).filter(
      (r) => r.cleaner_id === cleanerId
    )

    if (profile) {
      const avg = cleanerRatings.length > 0
        ? cleanerRatings.reduce((sum, r) => sum + r.rating, 0) / cleanerRatings.length
        : null
      setCleaner({
        id:            profile.id,
        display_id:    profile.display_id,
        full_name:     profile.full_name ?? profile.display_id,
        avg_rating:    avg,
        total_ratings: cleanerRatings.length,
      })
    }
    setRatings(cleanerRatings)
    setLoading(false)
  }, [user, cleanerId])

  useEffect(() => { if (user) load() }, [load, user])

  useGSAP(() => {
    if (loading) return
    gsap.from('.profile-section', { opacity: 0, y: 16, duration: 0.4, stagger: 0.08, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading] })

  function handleSubmitted() {
    setSubmitted(true)
    void load()
  }

  const initials = cleaner
    ? cleaner.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pb-[100px]">

        <div className="flex items-center gap-3 pt-10 pb-5">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[24px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px]">
            {t('sv_cleaner_profile')}
          </h1>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => <div key={i} className="h-[160px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />)}
          </div>
        ) : cleaner ? (
          <div className="flex flex-col gap-5">

            {/* Profile header */}
            <div className="profile-section bg-white border border-[#D0CFCA] rounded-[12px] p-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#1A1C19] flex items-center justify-center shrink-0">
                <span className="font-['Poppins',sans-serif] font-bold text-xl text-[#B8A77A]">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Poppins',sans-serif] font-bold text-[18px] text-[#1A1C19] truncate">{cleaner.full_name}</p>
                <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mb-2">{cleaner.display_id}</p>
                {cleaner.avg_rating !== null ? (
                  <div className="flex items-center gap-2">
                    <StarDisplay value={cleaner.avg_rating} size="sm" />
                    <span className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
                      {cleaner.avg_rating.toFixed(1)} · {cleaner.total_ratings} {t('sv_ratings_count')}
                    </span>
                  </div>
                ) : (
                  <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] italic">{t('sv_no_ratings_yet')}</p>
                )}
              </div>
            </div>

            {/* Rating form or success */}
            {submitted ? (
              <div className="profile-section bg-[#D7E6DB] border border-[#2F4A3D] rounded-[12px] p-5 text-center flex flex-col gap-1">
                <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#2F4A3D]">{t('sv_rating_submitted')}</p>
                <p className="font-['Lato',sans-serif] text-[13px] text-[#2F4A3D]">{t('sv_rating_submitted_body')}</p>
              </div>
            ) : (
              <div className="profile-section">
                <RatingForm
                  cleanerId={cleaner.id}
                  supervisorId={user!.id}
                  supervisorName={user!.name}
                  onSubmitted={handleSubmitted}
                />
              </div>
            )}

            {/* Rating history */}
            {ratings.length > 0 && (
              <div className="profile-section">
                <h2 className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[1.2px] text-[#737874] uppercase mb-2">
                  {t('sv_rating_history')}
                </h2>
                <div className="flex flex-col gap-3">
                  {ratings.map((r) => <RatingCard key={r.id} rating={r} />)}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 text-center">
            <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">Worker not found</p>
          </div>
        )}

      </div>
      <SupervisorNav active="workers" />
    </div>
  )
}
