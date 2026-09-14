import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { postShiftComplete } from '../../lib/webhooks'
import { SupervisorNav } from '../../components/supervisor/SupervisorNav'
import { SupervisorDesktopSidebar } from '../../components/supervisor/SupervisorDesktopSidebar'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { ImageViewer } from '../../components/ImageViewer'
import { gsap, useGSAP } from '../../lib/gsap'

const PAGE_SIZE = 5

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvidenceLog {
  id: string
  job_id: string
  company_id: string
  created_at: string
  note: string | null
  note_translated: string | null
  status: string
  cleaner_name: string
  cleaner_display_id: string
  zone_name: string
  media: { url: string; type: 'image' | 'video' }[]
  existing_feedback: { status: string; comment: string } | null
}

interface CleanerCompletion {
  cleaner_id: string
  cleaner_name: string
  done: number
  total: number
  zone_ids: string[]
}

// ─── Shift completion card ─────────────────────────────────────────────────────

function ShiftCompletionCard({ entry, jobId, supervisorId, marked, onMarked }: {
  entry: CleanerCompletion
  jobId: string
  supervisorId: string
  marked: boolean
  onMarked: (cleanerId: string) => void
}) {
  const t = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setSubmitting(true)
    setError('')
    try {
      if (entry.zone_ids.length > 0) {
        const { error: updErr } = await supabase
          .from('job_zones')
          .update({ status: 'completed' })
          .in('id', entry.zone_ids)
        if (updErr) throw updErr
      }
      void postShiftComplete({ job_id: jobId, cleaner_id: entry.cleaner_id, supervisor_id: supervisorId })
      onMarked(entry.cleaner_id)
    } catch (err) {
      console.error('Failed to mark shift complete', err)
      setError(t('sv_failed_mark_complete'))
      setSubmitting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="shift-complete-card bg-[#FBF6EC] border border-[#B8A77A] rounded-[12px] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-['Poppins',sans-serif] font-semibold text-[15px] text-[#1A1C19] truncate">
            {entry.cleaner_name}
          </p>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
            {entry.done}/{entry.total} {t('zones')}
          </p>
        </div>
        {marked && (
          <span className="flex items-center gap-1 font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.5px] text-[#2F4A3D] bg-[#D7E6DB] px-2.5 py-1 rounded-full shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="#2F4A3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('sv_pay_logged')}
          </span>
        )}
      </div>

      {!marked && (
        <>
          <div className="flex items-center gap-2">
            <span className="font-['Lato',sans-serif] font-bold text-[10px] tracking-[0.8px] text-[#B8A77A] uppercase">
              {t('sv_shift_not_logged_title')}
            </span>
          </div>
          <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
            {t('sv_shift_not_logged_body')}
          </p>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="h-10 px-4 bg-[#2F4A3D] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#3d6152] transition-colors self-start"
            >
              {t('mark_shift_complete')}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-['Lato',sans-serif] text-[13px] text-[#1A1C19]">
                {t('sv_shift_complete_confirm_body')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 h-10 bg-[#2F4A3D] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#3d6152] transition-colors disabled:opacity-50"
                >
                  {submitting ? '…' : t('sv_shift_complete_confirm_yes')}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                  className="flex-1 h-10 border border-[#C3C8C2] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-[#434844] hover:border-[#B8A77A] transition-colors disabled:opacity-50"
                >
                  {t('sv_shift_complete_confirm_cancel')}
                </button>
              </div>
            </div>
          )}
          {error && <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{error}</p>}
        </>
      )}
    </div>
  )
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
  const [submitting, setSubmitting]   = useState(false)
  const [submitted, setSubmitted]     = useState(!!log.existing_feedback)
  const [submitErr, setSubmitErr]     = useState('')
  const [lightbox, setLightbox]       = useState<{ url: string; type: 'image' | 'video' } | null>(null)

  async function handleSubmit() {
    if (!decision) return
    setSubmitting(true)
    setSubmitErr('')

    // feedback_comments uses 'not_accepted'; cleaning_logs uses 'reclean_requested'
    const fbStatus  = decision === 'rejected' ? 'not_accepted'      : decision
    const logStatus = decision === 'rejected' ? 'reclean_requested' : decision

    const { error: fbErr } = await supabase.from('feedback_comments').insert({
      cleaning_log_id: log.id,
      supervisor_id: supervisorId,
      comment: comment.trim() || null,
      status: fbStatus,
      company_id: log.company_id,
    })
    if (fbErr) { setSubmitErr('Could not save feedback. Try again.'); setSubmitting(false); return }

    const { error: logErr } = await supabase.from('cleaning_logs').update({ status: logStatus }).eq('id', log.id)
    if (logErr) { setSubmitErr('Feedback saved but zone status update failed.'); setSubmitting(false); return }

    setSubmitted(true)
    setSubmitting(false)
  }

  const timeStr = new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <div className="evidence-ticket bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-px">
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

      {/* Photos + video */}
      {log.media.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto px-5 py-4">
          {log.media.map((m, i) => (
            <button
              key={i}
              onClick={() => setLightbox(m)}
              className="relative shrink-0 w-[120px] h-[90px] rounded-[8px] overflow-hidden bg-[#E3E3DD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8A77A]"
            >
              {m.type === 'video' ? (
                <>
                  <video src={m.url} muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </>
              ) : (
                <img src={m.url} alt={`Zone evidence ${i + 1}`} className="w-full h-full object-cover" />
              )}
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
          {submitErr && (
            <p className="font-['Lato',sans-serif] text-[13px] text-[#BA1A1A]">{submitErr}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!decision || submitting}
            className="w-full h-[52px] bg-[#1A1C19] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e3130] transition-colors"
          >
            {submitting ? t('submitting') : t('sv_submit_feedback')}
          </button>
        </div>
      )}

      {lightbox && <ImageViewer src={lightbox.url} type={lightbox.type} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ─── Pager ───────────────────────────────────────────────────────────────────

function Pager({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE)
  if (pages <= 1) return null
  const from = page * PAGE_SIZE + 1
  const to   = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <div className="flex items-center justify-between pt-5 mt-2 border-t border-[#E3E3DD]">
      <span className="font-['Lato',sans-serif] text-[12px] text-[#737874]">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#D5D5CF] bg-white disabled:opacity-30 hover:border-[#B8A77A] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            onClick={() => onPage(i)}
            className={[
              "w-8 h-8 rounded-[6px] font-['Lato',sans-serif] font-bold text-[13px] border transition-colors",
              i === page
                ? 'bg-[#1A1C19] border-[#1A1C19] text-white'
                : 'bg-white border-[#D5D5CF] text-[#1A1C19] hover:border-[#B8A77A]',
            ].join(' ')}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pages - 1}
          aria-label="Next page"
          className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#D5D5CF] bg-white disabled:opacity-30 hover:border-[#B8A77A] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
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
  const pageRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [logs, setLogs] = useState<EvidenceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [completion, setCompletion] = useState<CleanerCompletion[]>([])
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set())

  useEffect(() => { setPage(0) }, [logs.length])

  const loadCompletion = useCallback(async () => {
    if (!user || !jobId) { setCompletion([]); return }

    const [zonesRes, payRes, cleanersRes] = await Promise.all([
      supabase.from('job_zones').select('id, status, cleaner_id').eq('job_id', jobId),
      supabase.from('pay_records').select('cleaner_id').eq('job_id', jobId),
      supabase.from('profiles').select('id, full_name, display_id').eq('company_id', user.company_id).eq('role', 'cleaner'),
    ])

    const zones = (zonesRes.data ?? []) as unknown as { id: string; status: string; cleaner_id: string | null }[]
    const paidCleanerIds = new Set(
      (payRes.data ?? []).map((r) => (r as { cleaner_id: string }).cleaner_id)
    )
    const cleanerMap = new Map<string, string>()
    for (const c of (cleanersRes.data ?? []) as unknown as { id: string; full_name: string; display_id: string }[]) {
      cleanerMap.set(c.id, c.full_name ?? c.display_id)
    }

    const byCleaner = new Map<string, { done: number; total: number; zone_ids: string[] }>()
    for (const z of zones) {
      if (!z.cleaner_id || z.status === 'deleted') continue
      const entry = byCleaner.get(z.cleaner_id) ?? { done: 0, total: 0, zone_ids: [] }
      entry.total += 1
      entry.zone_ids.push(z.id)
      if (z.status === 'completed' || z.status === 'flagged_no_photo') entry.done += 1
      byCleaner.set(z.cleaner_id, entry)
    }

    const unpaid: CleanerCompletion[] = []
    for (const [cleanerId, v] of byCleaner) {
      if (paidCleanerIds.has(cleanerId)) continue
      unpaid.push({
        cleaner_id: cleanerId,
        cleaner_name: cleanerMap.get(cleanerId) ?? 'Unknown',
        done: v.done,
        total: v.total,
        zone_ids: v.zone_ids,
      })
    }
    setCompletion(unpaid)
  }, [user, jobId])

  useEffect(() => { if (user) loadCompletion() }, [user, loadCompletion])

  const load = useCallback(async (silent = false) => {
    if (!user) return
    if (!silent) setLoading(true)

    let query = supabase
      .from('cleaning_logs')
      .select(`
        id, job_id, created_at, note, note_translated, status,
        jobs!cleaning_logs_job_id_fkey ( company_id ),
        profiles!cleaning_logs_cleaner_id_fkey ( full_name, display_id ),
        job_zones ( zone_name ),
        evidence_files ( public_url, file_type ),
        feedback_comments ( status, comment )
      `)
      .order('created_at', { ascending: false })

    if (jobId) {
      query = query.eq('job_id', jobId)
    } else {
      query = query.eq('status', 'pending')
    }

    const { data } = await query

    if (data) {
      const mapped: EvidenceLog[] = (data as unknown as {
        id: string
        job_id: string
        created_at: string
        note: string | null
        note_translated: string | null
        status: string
        jobs: { company_id: string } | null
        profiles: { full_name: string; display_id: string } | null
        job_zones: { zone_name: string } | null
        evidence_files: { public_url: string; file_type: string | null }[]
        feedback_comments: { status: string; comment: string }[]
      }[]).map((r) => ({
        id: r.id,
        job_id: r.job_id,
        company_id: r.jobs?.company_id ?? '',
        created_at: r.created_at,
        note: r.note,
        note_translated: r.note_translated,
        status: r.status,
        cleaner_name: r.profiles?.full_name ?? 'Unknown',
        cleaner_display_id: r.profiles?.display_id ?? '',
        zone_name: r.job_zones?.zone_name ?? 'Unknown Zone',
        media: (r.evidence_files ?? []).map((f) => ({
          url: f.public_url,
          type: (f.file_type ?? '').startsWith('video/') ? 'video' as const : 'image' as const,
        })),
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
    if (!pageRef.current) return
    gsap.from(pageRef.current, { opacity: 0, y: 18, duration: 0.45, ease: 'power2.out' })
  }, { dependencies: [] })

  useGSAP(() => {
    if (loading) return
    gsap.from('.evidence-ticket', { y: 10, duration: 0.25, stagger: 0.04, ease: 'power3.out' })
  }, { scope: containerRef, dependencies: [loading, page] })

  const content = (
    <div ref={containerRef}>
      {completion.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {completion.map((entry) => (
            <ShiftCompletionCard
              key={entry.cleaner_id}
              entry={entry}
              jobId={jobId!}
              supervisorId={user!.id}
              marked={markedIds.has(entry.cleaner_id)}
              onMarked={(cleanerId) => setMarkedIds((prev) => new Set(prev).add(cleanerId))}
            />
          ))}
        </div>
      )}
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
        <>
          <div className="flex flex-col gap-5">
            {logs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((log) => (
              <EvidenceTicket key={log.id} log={log} supervisorId={user!.id} />
            ))}
          </div>
          <Pager total={logs.length} page={page} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
        </>
      )}
    </div>
  )

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-[#F4F4EE]">
        <SupervisorDesktopSidebar active="history" />
        <main ref={pageRef} className="pl-60">
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
                <p className="font-['Lato',sans-serif] text-[14px] text-[#737874] mt-1">
                  {jobId ? t('sv_job_evidence_subtitle') : t('sv_pending_approvals_subtitle')}
                </p>
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
      <div ref={pageRef} className="w-full max-w-[480px] mx-auto px-6 pb-[100px]">
        <div className="flex items-center gap-3 pt-10 pb-5">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[24px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px]">
              {jobId ? t('sv_job_evidence') : t('sv_pending_approvals_title')}
            </h1>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
              {jobId ? t('sv_job_evidence_subtitle') : t('sv_pending_approvals_subtitle')}
            </p>
          </div>
        </div>
        {content}
      </div>
      <SupervisorNav active="history" />
    </div>
  )
}
