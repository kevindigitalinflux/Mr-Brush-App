import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { ImageViewer } from '../../components/ImageViewer'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvidenceLog {
  id: string
  job_id: string
  created_at: string
  note: string | null
  note_translated: string | null
  no_photo_reason: boolean
  status: string
  cleaner_name: string
  cleaner_display_id: string
  zone_name: string
  photo_urls: string[]
  existing_feedback: { status: string; comment: string } | null
}

// ─── Evidence ticket ──────────────────────────────────────────────────────────

type Decision = 'approved' | 'rejected' | null

function EvidenceTicket({ log, supervisorId }: { log: EvidenceLog; supervisorId: string }) {
  const t = useTranslation()
  const [decision, setDecision] = useState<Decision>(
    log.existing_feedback?.status === 'approved' ? 'approved'
    : log.existing_feedback?.status === 'rejected' ? 'rejected'
    : null
  )
  const [comment, setComment] = useState(log.existing_feedback?.comment ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!log.existing_feedback)
  const [lightbox, setLightbox] = useState<string | null>(null)

  async function handleSubmit() {
    if (!decision) return
    setSubmitting(true)
    await supabase.from('feedback_comments').insert({
      log_id: log.id,
      supervisor_id: supervisorId,
      comment: comment.trim() || null,
      status: decision,
    })
    await supabase.from('cleaning_logs').update({ status: decision }).eq('id', log.id)
    setSubmitted(true)
    setSubmitting(false)
  }

  const timeStr = new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <div className="evidence-ticket bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden">
      {/* Ticket header */}
      <div className="px-5 py-4 border-b border-[#E3E3DD]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19]">
            {log.zone_name}
          </h3>
          {submitted && (
            <span className={[
              "font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.5px] px-2.5 py-1 rounded-full",
              decision === 'approved' ? 'bg-[#D7E6DB] text-[#2F4A3D]' : 'bg-[#FDECEA] text-[#BA1A1A]',
            ].join(' ')}>
              {decision === 'approved' ? t('sv_approved_pill') : t('sv_not_accepted')}
            </span>
          )}
        </div>
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
          {log.cleaner_name} · {dateStr} at {timeStr}
        </p>
      </div>

      {/* Photos or no-photo note */}
      {log.no_photo_reason ? (
        <div className="px-5 py-4 bg-[#FFF8EC]">
          <p className="font-['Lato',sans-serif] text-[13px] text-[#6F613A] italic">
            {t('sv_no_photo_msg')}
          </p>
        </div>
      ) : log.photo_urls.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto px-5 py-4">
          {log.photo_urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightbox(url)}
              className="shrink-0 w-[120px] h-[90px] rounded-[8px] overflow-hidden bg-[#E3E3DD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8A77A]"
            >
              <img
                src={url}
                alt={`Zone photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="px-5 py-4">
          <div className="h-[90px] bg-[#E3E3DD] rounded-[8px] flex items-center justify-center">
            <span className="font-['Lato',sans-serif] text-[13px] text-[#737874]">No photos</span>
          </div>
        </div>
      )}

      {/* Cleaner note */}
      {(log.note_translated || log.note) && (
        <div className="px-5 pb-4">
          <p className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase mb-1">
            {t('sv_cleaner_note_label')}
          </p>
          <p className="font-['Lato',sans-serif] text-[14px] text-[#434844] leading-relaxed">
            {log.note_translated ?? log.note}
          </p>
        </div>
      )}

      {/* Feedback area */}
      {!submitted && (
        <div className="px-5 pb-5 flex flex-col gap-3 border-t border-[#E3E3DD] pt-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('sv_feedback_placeholder')}
            rows={3}
            className="w-full border border-[#C3C8C2] rounded-[8px] px-4 py-3 font-['Lato',sans-serif] text-sm text-[#1A1C19] placeholder:text-[#9E9E9E] outline-none focus:border-[#B8A77A] transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setDecision('approved')}
              className={[
                "flex-1 h-10 rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm border-2 transition-colors",
                decision === 'approved'
                  ? 'bg-[#2F4A3D] border-[#2F4A3D] text-white'
                  : 'border-[#C3C8C2] text-[#434844] hover:border-[#2F4A3D] hover:text-[#2F4A3D]',
              ].join(' ')}
            >
              {t('sv_approve')}
            </button>
            <button
              onClick={() => setDecision('rejected')}
              className={[
                "flex-1 h-10 rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm border-2 transition-colors",
                decision === 'rejected'
                  ? 'bg-[#BA1A1A] border-[#BA1A1A] text-white'
                  : 'border-[#C3C8C2] text-[#434844] hover:border-[#BA1A1A] hover:text-[#BA1A1A]',
              ].join(' ')}
            >
              {t('sv_not_accepted')}
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!decision || submitting}
            className="w-full h-[52px] bg-[#1A1C19] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e3130] transition-colors"
          >
            {submitting ? t('submitting') : t('sv_submit_feedback')}
          </button>
        </div>
      )}

      {lightbox && <ImageViewer src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ─── Evidence page ────────────────────────────────────────────────────────────

/** Evidence review page — shows cleaning log tickets for a job or all pending. */
export function Evidence() {
  const { jobId } = useParams<{ jobId?: string }>()
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const isDesktop = useIsDesktop()
  const containerRef = useRef<HTMLDivElement>(null)
  const [logs, setLogs] = useState<EvidenceLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (silent = false) => {
    if (!user) return
    if (!silent) setLoading(true)

    let query = supabase
      .from('cleaning_logs')
      .select(`
        id, job_id, created_at, note, note_translated, no_photo_reason, status,
        profiles!cleaning_logs_cleaner_id_fkey ( full_name, display_id ),
        job_zones ( zone_name ),
        evidence_files ( public_url ),
        feedback_comments ( status, comment )
      `)
      .order('created_at', { ascending: false })

    if (jobId) {
      query = query.eq('job_id', jobId)
    } else {
      query = query.eq('status', 'pending_review')
    }

    const { data } = await query

    if (data) {
      const mapped: EvidenceLog[] = (data as unknown as {
        id: string
        job_id: string
        created_at: string
        note: string | null
        note_translated: string | null
        no_photo_reason: boolean
        status: string
        profiles: { full_name: string; display_id: string } | null
        job_zones: { zone_name: string } | null
        evidence_files: { public_url: string }[]
        feedback_comments: { status: string; comment: string }[]
      }[]).map((r) => ({
        id: r.id,
        job_id: r.job_id,
        created_at: r.created_at,
        note: r.note,
        note_translated: r.note_translated,
        no_photo_reason: r.no_photo_reason,
        status: r.status,
        cleaner_name: r.profiles?.full_name ?? 'Unknown',
        cleaner_display_id: r.profiles?.display_id ?? '',
        zone_name: r.job_zones?.zone_name ?? 'Unknown Zone',
        photo_urls: (r.evidence_files ?? []).map((f) => f.public_url),
        existing_feedback: r.feedback_comments?.[0] ?? null,
      }))
      setLogs(mapped)
    }
    setLoading(false)
  }, [user, jobId])

  useEffect(() => { if (user) load() }, [load, user])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('supervisor-evidence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_logs' }, () => load(true))
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [user, load])

  useGSAP(() => {
    if (loading) return
    gsap.from('.evidence-ticket', { opacity: 0, y: 16, duration: 0.4, stagger: 0.08, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading] })

  const content = (
    <div ref={containerRef}>
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-[320px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 flex flex-col items-center gap-2 text-center">
          <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_submissions')}</p>
          <p className="font-['Lato',sans-serif] text-sm text-[#737874]">{t('sv_no_submissions_body')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {logs.map((log) => (
            <EvidenceTicket key={log.id} log={log} supervisorId={user!.id} />
          ))}
        </div>
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <div className="flex h-screen overflow-hidden bg-[#F4F4EE]">
        <SupervisorDesktopSidebar active="dashboard" />
        <main className="flex-1 overflow-y-scroll ml-60">
          <div className="max-w-4xl mx-auto px-10 py-10">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => navigate(-1)} aria-label="Go back"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div>
                <p className="font-['Lato',sans-serif] font-bold text-[11px] tracking-[1.2px] text-[#B8A77A] uppercase mb-0.5">
                  {t('sv_jobs_title')}
                </p>
                <h1 className="font-['Poppins',sans-serif] font-bold text-[32px] text-[#1A1C19] leading-[1.1] tracking-[-0.5px]">
                  {jobId ? t('sv_job_evidence') : t('sv_pending_approvals_title')}
                </h1>
              </div>
            </div>
            {content}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div className="w-full max-w-[480px] mx-auto px-6 pb-[100px]">
        <div className="flex items-center gap-3 pt-10 pb-5">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="font-['Poppins',sans-serif] font-bold text-[24px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px]">
            {jobId ? t('sv_job_evidence') : t('sv_pending_approvals_title')}
          </h1>
        </div>
        {content}
      </div>
      <SupervisorNav active="dashboard" />
    </div>
  )
}
