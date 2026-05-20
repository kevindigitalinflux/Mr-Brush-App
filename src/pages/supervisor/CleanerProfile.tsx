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

interface Profile {
  id: string
  full_name: string
  display_id: string
  role: string
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

// ─── Absence sheet ────────────────────────────────────────────────────────────

interface AbsenceSheetProps {
  cleaner: CleanerDetail
  supervisorId: string
  companyId: string
  onClose: () => void
}

function AbsenceSheet({ cleaner, supervisorId, companyId, onClose }: AbsenceSheetProps) {
  const t = useTranslation()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, display_id, role')
      .eq('company_id', companyId)
      .in('role', ['cleaner', 'replacement_cleaner', 'supervisor'])
      .then(({ data }) => {
        const all = (data ?? []) as Profile[]
        const self = all.find((p) => p.id === supervisorId)
        const others = all.filter((p) => p.id !== supervisorId && p.id !== cleaner.id)
        setProfiles(self ? [self, ...others] : others)
      })
  }, [companyId, supervisorId, cleaner.id])

  const filtered = search
    ? profiles.filter((p) =>
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.display_id.toLowerCase().includes(search.toLowerCase())
      )
    : profiles

  async function handleConfirm() {
    if (!selected) return
    setSubmitting(true)

    const today = new Date().toISOString().slice(0, 10)

    const { error: err } = await supabase.from('absence_reports').insert({
      absent_cleaner_id: cleaner.id,
      replacement_id: selected,
      reported_by_id: supervisorId,
      company_id: companyId,
      shift_date: today,
    })
    if (err) { setSubmitting(false); setError(t('sv_absence_error')); return }

    // Reassign today's unstarted / in-progress zones to the replacement
    const { data: todayJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', companyId)
      .eq('scheduled_date', today)

    if (todayJobs && todayJobs.length > 0) {
      const jobIds = (todayJobs as { id: string }[]).map((j) => j.id)
      await supabase
        .from('job_zones')
        .update({ cleaner_id: selected })
        .in('job_id', jobIds)
        .eq('cleaner_id', cleaner.id)
        .in('status', ['not_started', 'in_progress'])
    }

    setSubmitting(false)
    setSuccess(true)
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet — relative container so absolute children anchor to it */}
      <div className="relative bg-white rounded-t-[20px] w-full max-w-[480px] mx-auto overflow-hidden" style={{ height: '88vh' }}>

        {/* Scrollable content — pb-[88px] reserves space for the pinned button */}
        <div className={`absolute inset-0 overflow-y-auto${success ? '' : ' pb-[88px]'}`}>

          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-[#D0CFCA] rounded-full" />
          </div>

          <div className="px-6 pb-3">
            <h2 className="font-['Poppins',sans-serif] font-bold text-[20px] text-[#1A1C19]">
              {t('sv_absence_sheet_title')}
            </h2>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874] mt-1">
              {t('sv_absence_sheet_body')}
            </p>
          </div>

          {success ? (
            <div className="px-6 pb-10 flex flex-col items-center gap-2 text-center">
              <div className="w-14 h-14 rounded-full bg-[#D7E6DB] flex items-center justify-center mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="#2F4A3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19]">{t('sv_absence_success')}</p>
              <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">{t('sv_absence_success_body')}</p>
              <button
                onClick={onClose}
                className="mt-4 h-10 px-6 bg-[#1A1C19] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#2e3130] transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="px-6 pb-3">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" stroke="#737874" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" stroke="#737874" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('sv_absence_search')}
                    className="w-full h-[44px] border border-[#C3C8C2] rounded-[8px] pl-10 pr-4 font-['Lato',sans-serif] text-[14px] outline-none focus:border-[#B8A77A] transition-colors"
                  />
                </div>
              </div>

              {/* Cleaner list */}
              <div className="px-6 pb-4 flex flex-col gap-1">
                {filtered.map((p) => {
                  const isSelf = p.id === supervisorId
                  const initials = p.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  const isSelected = selected === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={`flex items-center gap-3 p-3 rounded-[10px] text-left transition-colors w-full ${isSelected ? 'bg-[#F4F4EE] border border-[#B8A77A]' : 'hover:bg-[#F9F9F5] border border-transparent'}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#1A1C19] flex items-center justify-center shrink-0">
                        <span className="font-['Poppins',sans-serif] font-bold text-xs text-[#B8A77A]">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Lato',sans-serif] font-semibold text-[14px] text-[#1A1C19] truncate">
                          {p.full_name}{isSelf ? ' (me)' : ''}
                        </p>
                        <p className="font-['Lato',sans-serif] text-[12px] text-[#737874]">
                          {p.display_id} · {p.role.replace('_', ' ')}
                        </p>
                      </div>
                      {isSelected && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" fill="#B8A77A" />
                          <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  )
                })}
                {filtered.length === 0 && (
                  <p className="text-center font-['Lato',sans-serif] text-[14px] text-[#9E9E9E] py-6">{t('sv_absence_no_match')}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Confirm button — absolutely pinned to sheet bottom, always visible */}
        {!success && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t border-[#E3E3DD] px-6 py-4">
            {error && (
              <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A] mb-3">{error}</p>
            )}
            <button
              onClick={handleConfirm}
              disabled={!selected || submitting}
              className="w-full h-[52px] bg-[#1A1C19] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-base text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e3130] transition-colors"
            >
              {submitting ? t('submitting') : t('sv_absence_confirm_btn')}
            </button>
          </div>
        )}
      </div>
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
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const isLowRating = star > 0 && star <= 2

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    setFiles((prev) => [...prev, ...picked])
    setPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))])
  }

  async function handleSubmit() {
    if (!star) return setError(t('sv_rating_error_star'))
    if (!notes.trim()) return setError(t('sv_rating_error_notes'))
    if (files.length < 3) return setError(t('sv_rating_error_photo'))
    if (isLowRating && !confirmed) return setError(t('sv_rating_error_confirm'))
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

      <StarPicker value={star} onChange={(v) => { setStar(v); setConfirmed(false); setError(null) }} />

      {/* Low-rating guardrail */}
      {isLowRating && (
        <div className="bg-[#FFF3D1] border border-[#D4B54A] rounded-[8px] p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#D4B54A" />
              <path d="M12 9v4M12 17h.01" stroke="#6F613A" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#6F613A] leading-relaxed">
              {t('sv_low_rating_guardrail')}
            </p>
          </div>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => { setConfirmed(e.target.checked); setError(null) }}
              className="mt-0.5 shrink-0 accent-[#B8A77A]"
            />
            <span className="font-['Lato',sans-serif] text-[13px] text-[#6F613A]">
              {t('sv_low_rating_confirm')}
            </span>
          </label>
        </div>
      )}

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
              <div key={i} className="shrink-0 w-[80px] h-[60px] rounded-[8px] overflow-hidden bg-[#E3E3DD] relative">
                <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-10 px-4 border-2 border-[#C3C8C2] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-[#434844] hover:border-[#B8A77A] hover:text-[#B8A77A] transition-colors"
          >
            {t('sv_add_photos')}
          </button>
          <span className={`font-['Lato',sans-serif] text-[13px] ${files.length >= 3 ? 'text-[#2F4A3D]' : 'text-[#737874]'}`}>
            {files.length}/3 {files.length >= 3 ? '✓' : 'required'}
          </span>
        </div>
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

/** Shows a cleaner's profile, rating form with guardrail, and absence reporting. */
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
  const [showAbsenceSheet, setShowAbsenceSheet] = useState(false)

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

            {/* Absence report button */}
            <div className="profile-section">
              <button
                onClick={() => setShowAbsenceSheet(true)}
                className="w-full h-[52px] border-2 border-[#BA1A1A] rounded-[10px] font-['Poppins',sans-serif] font-semibold text-[14px] text-[#BA1A1A] hover:bg-[#FDECEA] transition-colors flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="#BA1A1A" strokeWidth="2" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#BA1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('sv_report_absence')}
              </button>
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

      {showAbsenceSheet && cleaner && user && (
        <AbsenceSheet
          cleaner={cleaner}
          supervisorId={user.id}
          companyId={user.company_id}
          onClose={() => setShowAbsenceSheet(false)}
        />
      )}

      <SupervisorNav active="workers" />
    </div>
  )
}
