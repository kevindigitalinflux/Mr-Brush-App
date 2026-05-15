import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useTranslation } from '../../lib/useTranslation'
import { supabase } from '../../lib/supabase'
import { ImageViewer } from '../../components/ImageViewer'
import { gsap, useGSAP } from '../../lib/gsap'

// ─── Types ────────────────────────────────────────────────────────────────────

type IssueStatus = 'open' | 'acknowledged' | 'resolved'

interface ClientIssue {
  id: string
  created_at: string
  client_name: string
  facility_name: string
  title: string
  note: string | null
  status: IssueStatus
  photo_urls: string[]
}

// ─── Status pill ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<IssueStatus, string> = {
  open:         'bg-[#FDECEA] text-[#BA1A1A]',
  acknowledged: 'bg-[#FFF3D1] text-[#6F613A]',
  resolved:     'bg-[#D7E6DB] text-[#2F4A3D]',
}

function StatusPill({ status, label }: { status: IssueStatus; label: string }) {
  return (
    <span className={`font-['Lato',sans-serif] font-bold text-[11px] tracking-[0.5px] px-2.5 py-1 rounded-full ${STATUS_STYLES[status]}`}>
      {label}
    </span>
  )
}

// ─── Issue ticket ─────────────────────────────────────────────────────────────

function IssueTicket({ issue }: { issue: ClientIssue }) {
  const t = useTranslation()
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [localStatus, setLocalStatus] = useState<IssueStatus>(issue.status)
  const [submitting, setSubmitting] = useState(false)

  const timeStr = new Date(issue.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = new Date(issue.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  const statusLabel: Record<IssueStatus, string> = {
    open:         t('sv_status_open'),
    acknowledged: t('sv_status_acknowledged'),
    resolved:     t('sv_status_resolved'),
  }

  async function handleAction(next: IssueStatus) {
    setSubmitting(true)
    await supabase.from('issues').update({ status: next }).eq('id', issue.id)
    setLocalStatus(next)
    setSubmitting(false)
  }

  return (
    <div className="issue-ticket bg-white border border-[#D0CFCA] rounded-[12px] overflow-hidden">
      {/* Ticket header */}
      <div className="px-5 py-4 border-b border-[#E3E3DD]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#1A1C19] flex-1 min-w-0 pr-3 truncate">
            {issue.title}
          </h3>
          <StatusPill status={localStatus} label={statusLabel[localStatus]} />
        </div>
        <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
          {t('sv_reported_by')} {issue.client_name} · {dateStr} at {timeStr}
        </p>
        <p className="font-['Lato',sans-serif] text-[12px] text-[#9E9E9E] mt-0.5">{issue.facility_name}</p>
      </div>

      {/* Photos */}
      {issue.photo_urls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-5 py-4">
          {issue.photo_urls.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightbox(url)}
              className="shrink-0 w-[120px] h-[90px] rounded-[8px] overflow-hidden bg-[#E3E3DD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8A77A]"
            >
              <img
                src={url}
                alt={`Issue photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Client note */}
      {issue.note && (
        <div className="px-5 pb-4">
          <p className="font-['Lato',sans-serif] font-bold text-[12px] tracking-[0.8px] text-[#737874] uppercase mb-1">
            {t('sv_client_note_label')}
          </p>
          <p className="font-['Lato',sans-serif] text-[14px] text-[#434844] leading-relaxed">
            {issue.note}
          </p>
        </div>
      )}

      {/* Action buttons — only show if not yet resolved */}
      {localStatus !== 'resolved' && (
        <div className="px-5 pb-5 pt-4 border-t border-[#E3E3DD] flex gap-2">
          {localStatus === 'open' && (
            <button
              onClick={() => handleAction('acknowledged')}
              disabled={submitting}
              className="flex-1 h-10 border-2 border-[#B8A77A] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-[#B8A77A] hover:bg-[#B8A77A] hover:text-white transition-colors disabled:opacity-40"
            >
              {t('sv_acknowledge')}
            </button>
          )}
          <button
            onClick={() => handleAction('resolved')}
            disabled={submitting}
            className="flex-1 h-10 bg-[#2F4A3D] border-2 border-[#2F4A3D] rounded-[8px] font-['Poppins',sans-serif] font-semibold text-sm text-white hover:bg-[#253d31] transition-colors disabled:opacity-40"
          >
            {t('sv_mark_resolved')}
          </button>
        </div>
      )}

      {lightbox && <ImageViewer src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ─── Issues page ──────────────────────────────────────────────────────────────

/** Client-reported issue tickets — acknowledge and resolve complaints. */
export function Issues() {
  const { user } = useApp()
  const navigate = useNavigate()
  const t = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [issues, setIssues] = useState<ClientIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('issues')
        .select('*')
        .eq('supervisor_id', user!.id)
        .order('created_at', { ascending: false })

      setIssues((data as unknown as ClientIssue[]) ?? [])
      setLoading(false)
    }

    load()
  }, [user])

  useGSAP(() => {
    if (loading) return
    gsap.from('.issue-ticket', { opacity: 0, y: 16, duration: 0.4, stagger: 0.08, ease: 'power2.out' })
  }, { scope: containerRef, dependencies: [loading] })

  return (
    <div className="fixed inset-0 bg-[#F4F4EE] overflow-y-auto">
      <div ref={containerRef} className="w-full max-w-[480px] mx-auto px-6 pb-10">

        {/* Header */}
        <div className="flex items-center gap-3 pt-10 pb-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#E3E3DD] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="#1A1C19" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="font-['Poppins',sans-serif] font-bold text-[24px] text-[#1A1C19] leading-[1.1] tracking-[-0.3px]">
              {t('sv_issues_title')}
            </h1>
            <p className="font-['Lato',sans-serif] text-[13px] text-[#737874]">
              {t('sv_issues_subtitle')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-[280px] bg-white border border-[#D0CFCA] rounded-[12px] animate-pulse" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white border border-[#D0CFCA] rounded-[12px] p-10 flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F4F4EE] border border-[#D0CFCA] flex items-center justify-center mb-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="#B8A77A" strokeWidth="2" strokeLinejoin="round" />
                <path d="M12 9v4M12 17h.01" stroke="#B8A77A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-base text-[#1A1C19]">{t('sv_no_issues')}</p>
            <p className="font-['Lato',sans-serif] text-sm text-[#737874]">{t('sv_no_issues_body')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {issues.map((issue) => <IssueTicket key={issue.id} issue={issue} />)}
          </div>
        )}
      </div>
    </div>
  )
}
